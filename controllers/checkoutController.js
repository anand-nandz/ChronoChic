const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const generateDate = require("../utils/dateGenrator");
const generateOrder = require("../utils/otphandle");
// const generateTransaction=require("../utils/otphandle")

const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");

require("dotenv").config();

const Razorpay =require('razorpay');


const keyId = process.env.RAZORPAYID
const keySecret = process.env.RAZORPAYSECRET


var instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const crypto = require("crypto");



  const loadCheckOut = async (req, res) => {
    // console.log("enter to checkout");
    try {
        const userData = await User.findOne(req.session.user);
        // console.log(userData,"userData.................");
        const cartData = await Cart.findOne({ userId: userData._id });
        //   console.log(cartData,"cartData...............");
        const quantity = [];

        for (let i = 0; i < cartData.items.length; i++) {
            quantity.push(cartData.items[i].quantity);
        }
        //   console.log(quantity);
        const proId = [];
        for (let i = 0; i < cartData.items.length; i++) {
            proId.push(cartData.items[i].productId);
        }
        //   console.log(proId,"proId");
        const proData = [];

        for (let i = 0; i < proId.length; i++) {
            proData.push(await Product.findById({ _id: proId[i] }));
        }
        //   console.log(proData,"proData");
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
    // console.log("anand ........");
    try {
        const userData = await User.findOne(req.session.user);
        // console.log("userData",userData);
        const cartData = await Cart.findOne({ userId: userData._id });

        const proId = [];

        for (let i = 0; i < cartData.items.length; i++) {
            proId.push(cartData.items[i].productId);
        }

        const pdtData = [];

        for (let i = 0; i < proId.length; i++) {
            pdtData.push(await Product.findById({ _id: proId[i] }));
        }

        //   console.log(pdtData,"pdtdata...........................");

        const cartItems = cartData.items;
        //   console.log(cartItems,"itemss...................");
        const address = await Address.find({ userId: userData._id });
        //   console.log(address,"...addrerss");
        res.render("checkout", { pdtData, cartItems, cartData, address });
    } catch (error) {
        console.log(error.message);


    }
};






const rezopayment = async (req, res) => {
    try {
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", req.body.order);
      console.log(
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        req.body.payment
      );
  
      const { payment, order, addressId, order_num ,index} = req.body;
  
      let hmac = crypto.createHmac("sha256", keySecret);
  
      hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
      hmac = hmac.digest("hex");
  
      if (hmac == payment.razorpay_signature) {
      console.log("enterredddddddddddddddddddddddddddddd");
      const userData = await User.findOne(req.session.user);
      const cartData = await Cart.findOne({ userId: userData._id });

      const pdtData = [];

      for (let i = 0; i < cartData.items.length; i++) {
          pdtData.push(cartData.items[i]);
      }

      const orderNum = generateOrder.generateOrder();

      const addressData = await Address.findOne({ "address._id": addressId });

      let address = addressData.address[index]

      const date = generateDate()
      //   console.log(date,"dateeee");

      const orderData = new Order({
          userId: userData._id,
          orderNumber: orderNum,
          userEmail: userData.email,
          items: pdtData,
          totalAmount: cartData.total,
          orderType: "Razorpay",
          orderDate: date,
          status: "Processing",
          shippingAddress: address,
      });

      //   console.log(s,"shippingg................");

      console.log(orderData, "orderrrrrrrrrrrrrrr");

      await orderData.save();

      for (const item of cartData.items) {
          const product = await Product.findById(item.productId);
          product.countInStock -= item.quantity; // Reduce countInStock by the ordered quantity
          await product.save();
          // console.log(product,"saved");
      }



      res.json({ status: true, order: orderData });
      await Cart.findByIdAndDelete({ _id: cartData._id });

      }
    } catch (error) {
      console.log(error.message);
    }
  };



  const loadWallet = async(req,res)=>{
    try{
        const userData = await User.findOne(req.session.user);
        console.log(userData,"userZdataaa");
        const userWallet = await Wallet.findOne({userId:userData._id});
        console.log(userWallet,"wallet");
        res.render("wallet",{userWallet})
    }
    catch (error) {
        console.log(error.message);
      }
  }





  
const addWalletCash = async (req, res) => {
    try {
      const amount = req.body.Amount;
      console.log(amount,"amount");
      const orderId = generateOrder.generateOrder();
      console.log(orderId);
  
      var options = {
        amount: amount * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
  
      instance.orders.create(options, async (err, razopayWallet) => {
        if (!err) {
          console.log("lllllllllllllllllllllll ", razopayWallet);
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
        console.log("anand enter");
      const { wallet, id, amount } = req.body;
      console.log(id,"iddd");

      console.log(wallet,"wallet");
      console.log(amount,"amount");
  
      let hmac = crypto.createHmac("sha256", keySecret);
  
      hmac.update(wallet.razorpay_order_id + "|" + wallet.razorpay_payment_id);
      hmac = hmac.digest("hex");
      if (hmac == wallet.razorpay_signature) {
        const id= generateOrder.generateOrder()
        console.log("id",id);
        const date = generateDate();
        const userData = await User.findOne(req.session.user);
        console.log(userData,"data inside");
        const userInWallet = await Wallet.findOne({ userId: userData._id });
        console.log(userInWallet,"inwallet");
        if (userInWallet) {
          console.log("hoooooooooooooo");
          const updateWallet = await Wallet.findByIdAndUpdate(
            { _id: userInWallet._id },
            {
              $inc: {
                balance:amount,
              },
              $push:{
                transactions:{
                  id:id,
                  date:date,
                  amount:amount
                },
              }
            }
          );
        }else{
          console.log("else enter");
          const newWallet=new Wallet({
            userId:userData._id,
            balance:amount,
            transactions:[
              {
                id:id,
                amount:amount,
                date:date
              }
            ]
          })
          console.log(newWallet,"newwww");
         await newWallet.save()
        }
      }
  
      res.json({status:true})
    } catch (error) {
      console.log(error.message);
    }
  };






  module.exports = {
    
    loadCheckOut,
    loadCheckOutPage,
    rezopayment,
    addWalletCash,
    addCash,
    loadWallet


}