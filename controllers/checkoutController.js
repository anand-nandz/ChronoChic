const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const generateDate = require("../utils/dateGenrator");
const generateOrder = require("../utils/otphandle");

const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");
const Coupon = require("../models/couponModel");
var easyinvoice = require('easyinvoice');

require("dotenv").config();

const Razorpay = require('razorpay');


const keyId = process.env.RAZORPAYID
const keySecret = process.env.RAZORPAYSECRET


var instance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

const crypto = require("crypto");



const loadCheckOut = async (req, res) => {
  try {
    const userData = await User.findOne(req.session.user);
    const cartData = await Cart.findOne({ userId: userData._id });
    const quantity = [];

    for (let i = 0; i < cartData.items.length; i++) {
      quantity.push(cartData.items[i].quantity);
    }
    const proId = [];
    for (let i = 0; i < cartData.items.length; i++) {
      proId.push(cartData.items[i].productId);
    }
    const proData = [];

    for (let i = 0; i < proId.length; i++) {
      proData.push(await Product.findById({ _id: proId[i] }));
    }
    for (let i = 0; i < proData.length; i++) {
      for (let j = 0; j < quantity.length; j++) {
        if (proData[i].countInStock < quantity[i]) {
          res.json({ status: "checked" });
        }
      }
    }

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
  }
};



const loadCheckOutPage = async (req, res) => {
  try {
    const userData = await User.findOne(req.session.user);
 
    const cartData = await Cart.findOne({ userId: userData._id });

    const proId = [];

    for (let i = 0; i < cartData.items.length; i++) {
      proId.push(cartData.items[i].productId);
    }

    const pdtData = [];

    for (let i = 0; i < proId.length; i++) {
      pdtData.push(await Product.findById({ _id: proId[i] }));
    }


    const cartItems = cartData.items;
      console.log(cartItems,"itemss...................");
    const address = await Address.find({ userId: userData._id });

    res.render("checkout", { pdtData, cartItems, cartData, address });
  } catch (error) {
    console.log(error.message);


  }
};




const successPayment=async(req,res)=>{
  try {
    const {response,order}=req.body
    console.log(response,order,"res,order inpayment success")

   
    let hmac = crypto.createHmac("sha256", keySecret);

    hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id);
    hmac = hmac.digest("hex");

    if(hmac == response.razorpay_signature){
      // const userData = await User.findOne(req.session.user);
      // const cartData = await Cart.findOne({ userId: userData._id });
      const updateOrder=await Order.findByIdAndUpdate({_id:order},{
        $set:{
          status:"Processing"
        }
        
      })
      await updateOrder.save();

      const orderup  = await Order.findById({_id:order}) 
      res.json({status:true,order: orderup})

    }

  } catch (error) {
    console.log(error.message)
  }
}




const rezopayment = async (req, res) => {
  try {


    const { payment, order, addressId, order_num, amount, couponCode, index } = req.body;
    const findCoupon = await Coupon.findOne({ couponCode: couponCode })


    let hmac = crypto.createHmac("sha256", keySecret);

    hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
    hmac = hmac.digest("hex");

    if (hmac == payment.razorpay_signature) {
      const userData = await User.findOne(req.session.user);
      const cartData = await Cart.findOne({ userId: userData._id });

      const pdtData = [];

      for (let i = 0; i < cartData.items.length; i++) {
        pdtData.push(cartData.items[i]);
      }


      for (const item of cartData.items) {
        const product = await Product.findById(item.productId);
        product.countInStock -= item.quantity; // Reduce countInStock by the ordered quantity
        await product.save();
      }

      const orderNum = generateOrder.generateOrder();

      const addressData = await Address.findOne({ "address._id": addressId });

      let address = addressData.address[index]

      const date = generateDate()
      //   console.log(date,"dateeee");


      if (findCoupon) {
        const orderData = new Order({
          userId: userData._id,
          orderNumber: orderNum,
          userEmail: userData.email,
          items: pdtData,
          totalAmount: amount,
          orderType: "Razorpay",
          orderDate: date,
          status: "Processing",
          shippingAddress: address,
          coupon: findCoupon.couponCode,
          discount: findCoupon.discount
        });

        //   console.log(s,"shippingg................");


        const orderdatasave = await orderData.save();

        const updateCoupon = await Coupon.findByIdAndUpdate({ _id: findCoupon._id },
          {
            $push: {
              users: userData._id
            }
          })

        res.json({ status: true, order: orderData });
        await Cart.findByIdAndDelete({ _id: cartData._id });

      }
      else {
        const orderData = new Order({
          userId: userData._id,
          orderNumber: orderNum,
          userEmail: userData.email,
          items: pdtData,
          totalAmount: amount,
          orderType: "Razorpay",
          orderDate: date,
          status: "Processing",
          shippingAddress: address,

        });


        const orderdatawithout = await orderData.save();

        res.json({ status: true, order: orderData });
        await Cart.findByIdAndDelete({ _id: cartData._id });
      }

    }
  } catch (error) {
    console.log(error.message);
  }
};



const paymentFailed =  async(req,res)=>{
  try{
    const {amount,address,couponCode,index}=req.body;
    const userData = await User.findOne(req.session.user);
    const cartData = await Cart.findOne({ userId: userData._id });
    const date = generateDate();
    const orderNum = generateOrder.generateOrder();

  
      const addressData = await Address.findOne({ "address._id": address });
      let addressin = addressData.address[index]

      const pdtData = [];

      for (let i = 0; i < cartData.items.length; i++) {
        pdtData.push(cartData.items[i]);
      }
      const orderData = new Order({
        userId: userData._id,
        orderNumber: orderNum,
        userEmail: userData.email,
        items: pdtData,
        totalAmount: amount,
        orderType: "Razorpay",
        orderDate: date,
        status: "Payment Failed",
        shippingAddress: addressin,
        
      });
      const pay = await orderData.save();
      res.json({status:"paymentfail"})
  }catch(error){
    console.log(error.message);
  }
}




const continuePayment = async (req,res)=>{
  try{
  
    const id=req.body.id
    
    const findOrder=await Order.findById({_id:id})
  
    const userData = await User.findOne(req.session.user);
      const cartData = await Cart.findOne({ userId: userData._id });
    const pdtData = [];

      for (let i = 0; i < findOrder.items.length; i++) {
        pdtData.push(findOrder.items[i]);
      }

    
      for (const item of findOrder.items) {
        const product = await Product.findById(item.productId);
        product.countInStock != item.quantity; 
      }
   

    const stringOrder_id=findOrder.orderNumber.toString()

    var options={
      amount:findOrder.totalAmount*100,
      currency:"INR",
      receipt:stringOrder_id
    }

    instance.orders.create(options,async(error,razorpayOrder)=>{
 
      if(!error){
    
        res.json({status:true,order:razorpayOrder,orderId:findOrder._id})
        await Cart.findByIdAndDelete({ _id: cartData._id });
      }else{
        console.error(error);
      }
    })
  }
  catch(error){
    console.log(error.message);
  }
}



const loadWallet = async (req, res) => {
  try {
    const userData = await User.findOne(req.session.user);
    const userWallet = await Wallet.findOne({ userId: userData._id });
    if (userWallet && userWallet.transactions) {
      userWallet.transactions.sort((a, b) => {
        // Assuming date format is 'DD-MM-YYYY', you may need to adjust the parsing logic if it's different
        const dateA = new Date(a.date.split('-').reverse().join('-'));
        const dateB = new Date(b.date.split('-').reverse().join('-'));
        return dateB - dateA;
      });
    }
    res.render("wallet", { userWallet })
  }
  catch (error) {
    console.log(error.message);
  }
}





const addWalletCash = async (req, res) => {
  try {
    const amount = req.body.Amount;
    const orderId = generateOrder.generateOrder();

    var options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "" + orderId,
    };

    instance.orders.create(options, async (err, razopayWallet) => {
      if (!err) {
        res.json({ status: true, wallet: razopayWallet, Amount: amount });
      } else {
        console.log(err.message);
      }
    });

    // console.log(amount)
  } catch (error) {
    console.log(error.message);
  }
};



const addCash = async (req, res) => {
  try {
    const { wallet, id, amount } = req.body;
   
    let hmac = crypto.createHmac("sha256", keySecret);

    hmac.update(wallet.razorpay_order_id + "|" + wallet.razorpay_payment_id);
    hmac = hmac.digest("hex");
    if (hmac == wallet.razorpay_signature) {
      const id = generateOrder.generateOrder()
      const date = generateDate();
      const userData = await User.findOne(req.session.user);
      const userInWallet = await Wallet.findOne({ userId: userData._id });
      if (userInWallet) {
        const updateWallet = await Wallet.findByIdAndUpdate(
          { _id: userInWallet._id },
          {
            $inc: {
              balance: amount,
            },
            $push: {
              transactions: {
                id: id,
                date: date,
                amount: amount,
                orderType: 'Razorpay',
                type: 'Credit'
              },
            }
          }
        );
      } else {
        console.log("else enter");
        const newWallet = new Wallet({
          userId: userData._id,
          balance: amount,
          transactions: [
            {
              id: id,
              amount: amount,
              date: date,
              orderType: 'Razorpay',
              type: 'Credit'
            }
          ]
        })
        console.log(newWallet, "newwww");
        await newWallet.save()
      }
    }

    res.json({ status: true })
  } catch (error) {
    console.log(error.message);
  }
};

const invoice = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id, "invoice id");
    const findOrder = await Order.findById({ _id: id }).populate({ path: 'items.productId', model: 'Product' });
    console.log(findOrder, "order invoice");

    if (!findOrder) {
      return res.status(404).send('Order not found');
    }

    let pdttotal = 0;
    for (let i = 0; i < findOrder.items.length; i++) {
      pdttotal += findOrder.items[i].subTotal;
    }
    const discountAmount = (pdttotal * (findOrder.discount / 100)).toFixed(2);
    console.log(pdttotal, "pdttotal");
    console.log(discountAmount, "disamount");

    const discount = findOrder.discount;
    console.log("Discount:", discount);

    const vatRate = (discount / 100); 
    console.log("VAT Rate:", vatRate);

    const vatAmount = pdttotal * vatRate;
    const totalWithVAT = pdttotal - vatAmount;

    console.log("VAT Amount:", vatAmount);
    console.log("Total with VAT:", totalWithVAT);

    // Add discount information to data
    const data = {
      "documentTitle": "INVOICE", 
      "currency": "INR",
      "taxNotation": "gst", 
      "marginTop": 25,
      "marginRight": 25,
      "marginLeft": 25,
      "marginBottom": 25,
      "logo": "/public/assets/images/logo/cc.png", 
      "background": "/public/assets/images/logo/cc.png", 
      "sender": {
          "company": "ChronoChic",
          "address": "Kongad, Palakkad, Kerala",
          "zip": "678632",
          "city": "Kongad",
          "country": "India" 
      },
      "client": {
          "company": findOrder.shippingAddress[0].name.trim(),
          "address": findOrder.shippingAddress[0].homeAddress,
          "zip": findOrder.shippingAddress[0].pincode,
          "city": findOrder.shippingAddress[0].city,
          "country": findOrder.shippingAddress[0].state 
      },
      "products": findOrder.items.map(item => ({
          "quantity": item.quantity.toString(),
          "description": item.productId.pname,
          "price": item.subTotal / item.quantity,
      })),
    };

   
console.log(data,"data");
    const result = await easyinvoice.createInvoice(data);
  
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=myInvoice.pdf');
    res.send(Buffer.from(result.pdf, 'base64'));
  } catch (error) {
    console.error('Error generating invoice:', error.message);
    res.status(500).send('Error generating invoice');
  }
};





module.exports = {

  loadCheckOut,
  loadCheckOutPage,
  rezopayment,
  addWalletCash,
  addCash,
  loadWallet,
  invoice,
  paymentFailed,
  continuePayment,
  successPayment


}