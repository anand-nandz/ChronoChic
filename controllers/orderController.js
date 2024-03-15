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
    res.render("orderView", { pdtData, findOrder })
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
                amount: findOrder.totalAmount
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
    console.log(findOrder, 'findorder..........');
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
    } else if (status == "Canceled") {

      const findOrder = await Order.findById({ _id: id })

      if (findOrder.orderType == "Cash on Delivery") {
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
      else if(findOrder.orderType == "Razorpay"){
        const findOrder = await Order.findById({ _id: id })
        const date = generateDate();
        const Tid = generateOrder.generateOrder();

        const updateOrder = await Order.findByIdAndUpdate(
          {_id:id},
          {
            $set:{
              status:"Canceled",
            },
          },
        );

        const pdtId = [];

        for(let i=0;i<findOrder.items.length;i++){
          pdtId.push(findOrder.items[i].productId);
        }
        
        for(let i=0;i<pdtId.length;i++){
          await Product.findByIdAndUpdate(
            {_id:pdtId[i]},
            {
              $inc:{
                countInStock:findOrder.items[i].quantity
              },
            },
          );
        }

        // const userInWallet = await Wallet.findOne({userId:findOrder.userId})
        const userInWallet = await Wallet.findOne({ userId: findUser._id })
        console.log(userInWallet,'in wallet user');

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
                  amount: findOrder.totalAmount
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
            }]
          })
  
          await createWallet.save()
        }


      }
      
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