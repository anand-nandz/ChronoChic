const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel")
const Order = require("../models/orderModel");
const Address = require("../models/addressModel");
const generateOrder = require("../utils/otphandle");
const generateDate = require("../utils/dateGenrator");
const Wallet = require("../models/walletModel");




const loadViewOrder = async (req, res) => {
  try {
    const id = req.query.id;
    const findOrder = await Order.findById({ _id: id })
    console.log(findOrder, 'findorder');

    const pdtId = [];

    for (let i = 0; i < findOrder.items.length; i++) {
      pdtId.push(findOrder.items[i].productId)
    }
    console.log(pdtId, "iddddddddddddd");
    const pdtData = [];

    for (let i = 0; i < pdtId.length; i++) {
      pdtData.push(await Product.findById({ _id: pdtId[i] }))
    }
    console.log(pdtData, "dataaaaaa");

    const orderDateParts = findOrder.orderDate.split('-');
    const orderDay = parseInt(orderDateParts[0], 10);
    const orderMonth = parseInt(orderDateParts[1], 10) - 1; // Months are zero-based in JavaScript
    const orderYear = parseInt(orderDateParts[2], 10);
    const orderDate = new Date(orderYear, orderMonth, orderDay);

    // Calculate expected delivery date
    const expectedDeliveryDate = new Date(orderDate);
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);
    
    // Format expected delivery date to "dd-mm-yyyy" format
    const formattedDeliveryDate = `${expectedDeliveryDate.getDate()}-${expectedDeliveryDate.getMonth() + 1}-${expectedDeliveryDate.getFullYear()}`;

    res.render("orderView", { pdtData, findOrder ,expectedDeliveryDate: formattedDeliveryDate})
  }
  catch (error) {
    console.log(error.message);
  }
}


const cancelOrder = async (req, res) => {
  try {

    const id = req.body.id

    const findOrder = await Order.findById({ _id: id });

    if (findOrder.orderType == "Cash on Delivery") {
      const updateOrder = await Order.findByIdAndUpdate({ _id: id }, {
        $set: {
          status: "Canceled"
        }
      })

      const pdtId = []

      for (let i = 0; i < findOrder.items.length; i++) {
        pdtId.push(findOrder.items[i].productId)
      }

      for (let i = 0; i < pdtId.length; i++) {

        await Product.findByIdAndUpdate({ _id: pdtId[i] },
          {
            $inc: {
              countInStock: findOrder.items[i].quantity
            }
          })

      }
    }
    else if (findOrder.orderType == "Razorpay") {
      const findUser = await User.findOne(req.session.user);
      const findOrder = await Order.findById({ _id: id });
      const date = generateDate();
      const Tid = generateOrder.generateOrder()

      const updateOrder = await Order.findByIdAndUpdate({ _id: id }, {
        $set: {
          status: "Canceled"
        }
      })

      const pdtId = []

      for (let i = 0; i < findOrder.items.length; i++) {
        pdtId.push(findOrder.items[i].productId)
      }

      for (let i = 0; i < pdtId.length; i++) {

        await Product.findByIdAndUpdate({ _id: pdtId[i] },
          {
            $inc: {
              countInStock: findOrder.items[i].quantity
            }
          })

      }

      const userInWallet = await Wallet.findOne({ userId: findUser._id })

      console.log(userInWallet)

      if (userInWallet) {
        console.log("inside userWallet")
        const updateWallet = await Wallet.findOneAndUpdate({ userId: findUser._id },
          {
            $inc: {
              balance: findOrder.totalAmount
            },
            $push: {
              transactions: {
                id: Tid,
                date: date,
                amount: findOrder.totalAmount,
                orderType: 'Razorpay',
                type: 'Credit'
               

              }
            }
          })
      } else {
        console.log("else worked");
        const createWallet = new Wallet({
          userId: findUser._id,
          balance: findOrder.totalAmount,
          transactions: [{
            id: Tid,
            date: date,
            amount: findOrder.totalAmount,
            orderType: 'Razorpay',
            type: 'Credit'
            

          }]
        })

        await createWallet.save()
      }
    }



    res.json({ status: true })


  } catch (error) {
    console.log(error.message)
  }
}



const loadOrder = async (req, res) => {
  try {
    const perPage = 6;
    let page = parseInt(req.query.page) || 1;

    const totalOrders = await Order.countDocuments({});
    const totalPage = Math.ceil(totalOrders / perPage);

    if (page < 1) {
      page = 1;
    } else if (page > totalPage) {
      page = totalPage;
    }

    const startSerialNumber = (page - 1) * perPage + 1;

    const orders = await Order.find({})
      .sort({ _id: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    res.render('adminorder', { orderData: orders, page, totalPage, startSerialNumber });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}



const loadOrderDetail = async (req, res) => {
  try {
    const id = req.query.id
    const findOrder = await Order.findById({ _id: id })
    console.log(findOrder, 'findorder.......');
    let pdtId = [];
    for (let i = 0; i < findOrder.items.length; i++) {
      pdtId.push(findOrder.items[i].productId)
    }
    // console.log(pdtId, 'iddddddddddd');
    let pdtData = []

    for (let i = 0; i < pdtId.length; i++) {
      pdtData.push(await Product.findById({ _id: pdtId[i] }))
    }
    // console.log(pdtData, 'dataaaaaaaaaaaaaaaaaaa');

    res.render("orderDetails", { findOrder, pdtData })
  } catch (error) {
    console.log(error.message)
  }
}


const saveOrder = async (req, res) => {
  try {

    const { status, id } = req.body

    console.log(id, status)

    const checking = await Order.findById({ _id: id })
    console.log(checking, "checking sts in orderr");
    if (checking.status == status) {
      res.json({ status: "notChanged" })
    } else {
      const updateStatus = await Order.findByIdAndUpdate({ _id: id }, {
        $set: {
          status: status
        }
      })

    }
    if (status == "Returned") {
      console.log("entered sts== returned");

      const findOrder = await Order.findById({ _id: id })
      console.log(findOrder, "orderfinded in return ullilll");
      const demo=findOrder.orderType
      console.log(demo)
      if (findOrder.orderType == "Cash On Delivery") {
        console.log("entered cod for return");
        const date = generateDate();
        const Tid = generateOrder.generateOrder();

        const pdtId = [];

        for (let i = 0; i < checking.items.length; i++) {
          pdtId.push(checking.items[i].productId);
        }

        for (let i = 0; i < pdtId.length; i++) {
          await Product.findByIdAndUpdate(
            { _id: pdtId[i] },
            {
              $inc: {
                countInStock: checking.items[i].quantity,
              },
            }
          );
        }
        const userInWallet = await Wallet.findOne({ userId: findOrder.userId })
        console.log(userInWallet, 'wallet of user in cod return');

        if (userInWallet) {
          // console.log("inside userWallet")
          const updateWallet = await Wallet.findOneAndUpdate({ userId: findOrder.userId },
            {
              $inc: {
                balance: findOrder.totalAmount
              },
              $push: {
                transactions: {
                  id: Tid,
                  date: date,
                  amount: findOrder.totalAmount,
                  orderType: 'Cash On Delivery',
                  type: 'Credit'
                  
                }
              }
            })
          console.log(updateWallet, "wallet updated in cod return");
        } else {
          // console.log("else worked");
          const createWallet = new Wallet({
            userId: findUser._id,
            balance: findOrder.totalAmount,
            transactions: [{
              id: Tid,
              date: date,
              amount: findOrder.totalAmount,
              orderType: 'Cash On Delivery',
              type: 'Credit'
             
            }]
          })
          console.log("walllet created in cod for new user wallet");
          const newWall = await createWallet.save();
          console.log(newWall, "newwWallet created cod in return");
        }
      }
      else if (findOrder.orderType == "Razorpay") {
        console.log('entered inside razopay');
        const findOrder = await Order.findById({ _id: id })
        console.log(findOrder, "order inside razordpay in elsif");
        const date = generateDate();
        const Tid = generateOrder.generateOrder();

        const pdtId = [];

        for (let i = 0; i < findOrder.items.length; i++) {
          pdtId.push(findOrder.items[i].productId);
        }

        for (let i = 0; i < pdtId.length; i++) {
          await Product.findByIdAndUpdate(
            { _id: pdtId[i] },
            {
              $inc: {
                countInStock: findOrder.items[i].quantity
              },
            },
          );
        }
        const userInWallet = await Wallet.findOne({ userId: findOrder.userId })
        console.log(userInWallet, 'user wallet in return for razorpay');

        if (userInWallet) {
          const updateWallet = await Wallet.findOneAndUpdate({ userId: findOrder.userId },
            {
              $inc: {
                balance: findOrder.totalAmount
              },
              $push: {
                transactions: {
                  id: Tid,
                  date: date,
                  amount: findOrder.totalAmount,
                  orderType: 'Razorpay',
                  type: 'Credit'
                 
                }
              }
            })
          console.log(updateWallet, "wallet updated in return for razorpay .......");
        } else {
          const createWallet = new Wallet({
            userId: findUser._id,
            balance: findOrder.totalAmount,
            transactions: [{
              id: Tid,
              date: date,
              amount: findOrder.totalAmount,
              orderType: 'Razorpay',
              type: 'Credit'
              
            }]
          })

          await createWallet.save()
        }


      }

    } else if (status == "Canceled") {

      const findOrder = await Order.findById({ _id: id })

      if (findOrder.orderType == "Cash On Delivery") {
        const updateOrder = await Order.findByIdAndUpdate(
          { _id: id },
          {
            $set: {
              status: "Canceled",
            },
          }
        );

        const pdtId = [];

        for (let i = 0; i < checking.items.length; i++) {
          pdtId.push(checking.items[i].productId);
        }

        for (let i = 0; i < pdtId.length; i++) {
          await Product.findByIdAndUpdate(
            { _id: pdtId[i] },
            {
              $inc: {
                countInStock: checking.items[i].quantity,
              },
            }
          );
        }
      }
      else if (findOrder.orderType == "Razorpay") {
        const findOrder = await Order.findById({ _id: id })
        const date = generateDate();
        const Tid = generateOrder.generateOrder();

        const updateOrder = await Order.findByIdAndUpdate(
          { _id: id },
          {
            $set: {
              status: "Canceled",
            },
          },
        );

        const pdtId = [];

        for (let i = 0; i < findOrder.items.length; i++) {
          pdtId.push(findOrder.items[i].productId);
        }

        for (let i = 0; i < pdtId.length; i++) {
          await Product.findByIdAndUpdate(
            { _id: pdtId[i] },
            {
              $inc: {
                countInStock: findOrder.items[i].quantity
              },
            },
          );
        }

        // const userInWallet = await Wallet.findOne({userId:findOrder.userId})
        const userInWallet = await Wallet.findOne({ userId: findUser._id })
        // console.log(userInWallet,'in wallet user');

        if (userInWallet) {
          // console.log("inside userWallet")
          const updateWallet = await Wallet.findOneAndUpdate({ userId: findUser._id },
            {
              $inc: {
                balance: findOrder.totalAmount
              },
              $push: {
                transactions: {
                  id: Tid,
                  date: date,
                  amount: findOrder.totalAmount,
                  type: 'Credit'
                
                }
              }
            })
        } else {
          // console.log("else worked");
          const createWallet = new Wallet({
            userId: findUser._id,
            balance: findOrder.totalAmount,
            transactions: [{
              id: Tid,
              date: date,
              amount: findOrder.totalAmount,
              type: 'Credit'
             
            }]
          })

          await createWallet.save()
        }


      }

    }
    else{

    }


    res.json({ status: true })


  } catch (error) {
    console.log(error.message)
  }
}


const returnRequest = async (req, res) => {
  try {
    const { id, reason } = req.body;

    const findOrder = await Order.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          status: "Return process",
        },
      }
    );
    res.json({ status: true });
  }
  catch (error) {
    console.log(error.message);
  }
}


const cancelReturn = async (req, res) => {
  try {
    const id = req.body.id;

    const findOrder = await Order.findById({ _id: id });

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          status: "Delivered"
        }
      }
    )
    res.json({ status: true });
  }
  catch (error) {
    console.log(error.message);
  }
}


module.exports = {
  loadViewOrder,
  cancelOrder,
  loadOrder,
  loadOrderDetail,
  saveOrder,
  returnRequest,
  cancelReturn
}