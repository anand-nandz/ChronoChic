const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel")
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Category = require("../models/categoryModel");
const generateDate = require("../utils/dateGenrator");
const generateOrder = require("../utils/otphandle")
require("dotenv").config();
const Coupon = require ("../models/couponModel");

const Razorpay =require('razorpay');


const keyId = process.env.RAZORPAYID
const keySecret = process.env.RAZORPAYSECRET


var instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const crypto = require("crypto");
const couponModel = require("../models/couponModel");


const loadCart = async (req, res) => {
    try {

        const id = req.body.id;
        const price = req.body.pdtOffPrice

        const splitPrice = price.split("");
        const slice = splitPrice.shift();
        const priceOff = splitPrice.join("");

        const userData = await User.findOne(req.session.user);
        const pdtData = await Product.findOne({ _id: id })
        
        const userCart = await Cart.findOne({ userId: userData._id })
       
        if (userCart) {
            const pdtCart = await Cart.findOne({ 'items.productId': id });

            if (pdtCart) {
                res.json({ status: "viewCart" });
            }
            else {
                const updateCart = await Cart.findOneAndUpdate(
                    { userId: userData._id },
                    {
                        $push: {
                            items: {
                                productId: pdtData._id,
                                
                                subTotal: priceOff,
                                quantity: 1,
                            },
                        },
                        $inc: {
                            total: priceOff,
                        },
                    }
                )
            }

        } else {
            const cartData = new Cart({
                userId: userData._id,
                items: [
                    {
                        productId: pdtData._id,
                        subTotal: priceOff,
                        quantity: 1,
                    }
                ],
                total: priceOff,
            });

            cartData.save();
            res.json({ status: true });
        }





    }
    catch (error) {
        console.log(error.message);
        // res.status(500).send("Internal Server Error");
    }
}

// const loadCartpage = async (req, res) => {
//     try {
//         const userData = await User.findOne(req.session.user);
//         const cartData = await Cart.findOne({ userId: userData._id });
//         const categoryData = await Category.find({});


//         if (!cartData || !cartData.items || cartData.items.length === 0) {
//             // If cart is empty or not found, render the cart page with a message
//             res.render('cart', { pdtData: [], cartData: null });
//             return;
//         }

//         const array = [];
//         for (let i = 0; i < cartData.items.length; i++) {
//             array.push(cartData.items[i].productId.toString())
//         }
        
//         const pdtData = [];

//         for (let i = 0; i < array.length; i++) {
//             const product = await Product.findById(array[i]);
//             const category = categoryData.find(cat => cat._id.toString() === product.category.toString());

//             let offerPrice = product.offprice; // Initialize offer price with original price
//             let discountPercentage = product.discountPercentage; // Initialize discount percentage with original value
            
//             if (category && category.offer && new Date(category.offer.startDate) <= new Date() && new Date(category.offer.endDate) >= new Date()) {
//                 const productPrice = product.price;
//                 const productDiscountPercentage = product.discountPercentage;
//                 const categoryDiscount = category.offer.discount;
//                 const maxDiscount = Math.max(productDiscountPercentage, categoryDiscount);
//                 offerPrice = productPrice - (productPrice * maxDiscount / 100);
//                 discountPercentage = maxDiscount;
//             }

//             pdtData.push({
//                 ...product.toObject(),
//                 offprice: offerPrice,
//                 discountPercentage: discountPercentage
//             });
//         }
//         console.log(pdtData,"pdtdata in cart");

//         const roundedTotalSubtotal = totalSubtotal.toFixed(2); // Round the total subtotal to 2 decimal places

//         // Update cartData with the rounded totalSubtotal
//         cartData.total = roundedTotalSubtotal;

//         console.log(roundedTotalSubtotal,"rounded ");
//         res.render('cart', { pdtData, cartData });
//     } catch (error) {
//         console.log(error.message);
//     }
// }



const loadCartpage = async (req, res) => {
    try {
        const userData = await User.findOne(req.session.user);
        const cartData = await Cart.findOne({ userId: userData._id });
        const categoryData = await Category.find({});

        if (!cartData || !cartData.items || cartData.items.length === 0) {
            res.render('cart', { pdtData: [], cartData: null });
            return;
        }

        const array = [];
        for (let i = 0; i < cartData.items.length; i++) {
            array.push(cartData.items[i].productId.toString())
        }
        
        const pdtData = [];
        let totalSubtotal = 0; 

        for (let i = 0; i < array.length; i++) {
            const product = await Product.findById(array[i]);
            const category = categoryData.find(cat => cat._id.toString() === product.category.toString());

            let offerPrice = product.offprice; 
            let discountPercentage = product.discountPercentage; 
            
            if (category && category.offer && new Date(category.offer.startDate) <= new Date() && new Date(category.offer.endDate) >= new Date()) {
                const productPrice = product.price;
                const productDiscountPercentage = product.discountPercentage;
                const categoryDiscount = category.offer.discount;
                const maxDiscount = Math.max(productDiscountPercentage, categoryDiscount);
                offerPrice = productPrice - (productPrice * maxDiscount / 100);
                discountPercentage = maxDiscount;
            }

            pdtData.push({
                ...product.toObject(),
                offprice: offerPrice,
                discountPercentage: discountPercentage
            });

            const subtotal = offerPrice * cartData.items[i].quantity; 
            totalSubtotal += subtotal; 
        }

        const roundedTotalSubtotal = totalSubtotal.toFixed(2); 
        cartData.total = roundedTotalSubtotal;

        res.render('cart', { pdtData, cartData ,roundedTotalSubtotal});
    } catch (error) {
        console.log(error.message);
    }
}





const increment = async (req, res) => {
    try {

        const { price, pdtId, index, subTotal, qty } = req.body;
        const prices = parseInt(price)

        const quantity = parseInt(qty);
        const pdtIdString = pdtId.toString();
        const pdtData = await Product.findById({ _id: pdtIdString });
        const stock = pdtData.countInStock;
        if (stock > quantity) {
            if (quantity < 5) {

                const filter = { userId: req.session.user._id, 'items.productId': pdtData._id };
                const update = { $inc: { "items.$.quantity": 1, "items.$.subTotal": prices, "total": prices } };
                
                const addPrice = await Cart.findOneAndUpdate(filter, update, { new: true });

                const findCart = await Cart.findOne({ userId: req.session.user._id })
              
                res.json({ status: true, total: findCart.total })

            }
            else {
                res.json({ status: "minimum" })
            }
        }
        else {
            res.json({ status: "stock" });
        }
    }
    catch (error) {
        console.log(error.message);
    }

}







const decrement = async (req, res) => {
    try {
        const { price, pdtId, index, subTotal, qty } = req.body
        const pdtIdString = pdtId.toString();
        const quantity = parseInt(qty)
        const prices = parseInt(price)


        if (quantity > 1) {

            const addPrice = await Cart.findOneAndUpdate({ userId: req.session.user._id, "items.productId": pdtIdString },
                {
                    $inc: { "items.$.quantity": -1, "items.$.subTotal": -prices, "total": -prices }
                })

            const findCart = await Cart.findOne({ userId: req.session.user._id })

            res.json({ status: true, total: findCart.total })
        } else {
            res.json({ status: "minimum" })
        }


    } catch (error) {
        console.log(error.message)
    }
}


const removeCart = async (req, res) => {
    try {
        const id = req.body.id
        const sbt = req.body.sbt
    
        const delePro = await Cart.findOneAndUpdate({ userId: req.session.user._id }, {
            $pull: { items: { productId: id } },
            $inc: { "total": -sbt }
        })
        const findPro = await Cart.findOne({ userId: req.session.user._id })

        res.json({ status: true, total: findPro.total })
        // console.log(id)
    } catch (error) {
        console.log(error.message)
    }
}



const addOrder = async (req, res) => {
    try {
        const { addressId, cartid, checkedOption,paymentOption,totalDis,code, index } = req.body;


        const findCoupon = await Coupon.findOne({couponCode:code})

        if(!addressId || !paymentOption){
            res.json({status:"fill the options"})
        }
        else if(paymentOption == "Cash On Delivery"){
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


            for (const item of cartData.items) {
                const product = await Product.findById(item.productId);
                product.countInStock -= item.quantity; 
                await product.save();
            }

              if(findCoupon){
                const orderData = new Order({
                    userId: userData._id,
                    orderNumber: orderNum,
                    userEmail: userData.email,
                    items: pdtData,
                    totalAmount:totalDis,
                    orderType: paymentOption,
                    orderDate: date,
                    status: "Processing",
                    shippingAddress: address,
                    coupon : findCoupon.couponCode,
                    discount : findCoupon.discount
                });
        
                await orderData.save();


                const updateCoupon = await Coupon.findByIdAndUpdate({_id:findCoupon._id},
                    {
                        $push:{
                            users : userData._id
                        }
                    })
        
                    res.json({ status: true, order: orderData });
                    await Cart.findByIdAndDelete({ _id: cartData._id });
        
              }else{
                const orderData = new Order({
                    userId: userData._id,
                    orderNumber: orderNum,
                    userEmail: userData.email,
                    items: pdtData,
                    totalAmount:totalDis,
                    orderType: paymentOption,
                    orderDate: date,
                    status: "Processing",
                    shippingAddress: address,
                    
                });
        
                await orderData.save();

                res.json({ status: true, order: orderData });
            await Cart.findByIdAndDelete({ _id: cartData._id });
              }
    
            
    
    
            
    
        }
        else if(paymentOption == "Razorpay"){
            const userData = await User.findOne(req.session.user);
            const cartData = await Cart.findOne({ userId: userData._id });
            
            const pdtData = [];
    
            for (let i = 0; i < cartData.items.length; i++) {
                pdtData.push(cartData.items[i]);
            }
    
            const orderNum = generateOrder.generateOrder();
            const stringOrder_id=orderNum.toString()
            const addressData = await Address.findOne({ "address._id": addressId });
            let address = addressData.address[index]
            const date = generateDate()
        
            // for (const item of cartData.items) {
            //     const product = await Product.findById(item.productId);
            //     product.countInStock -= item.quantity; // Reduce countInStock by the ordered quantity
            //     await product.save();
            //     // console.log(product,"saved");
            // }

            var options = {
                amount: totalDis * 100,
                currency: "INR",
                receipt: stringOrder_id
              };

              let amount = Number(totalDis)
           
              instance.orders.create(options, function(err, razpayOrder) {
                if(!err){
                    console.log(razpayOrder ,"order razooo");
                    res.json({status:"razorpay",order:razpayOrder,orderNumber:orderNum,total:amount,code:code,address:addressId})
                }
                else{                   
                     console.log("error else ");

                    console.error(err);
                }
              });
        }
        



    } catch (error) {
        console.log(error);
    }
};






const loadorderPlaced = async (req, res) => {
    try {
        const id = req.query.id;
      
        const orders = await Order.findOne({ orderNumber: id });
        const pdt = [];

        for (let i = 0; i < orders.items.length; i++) {
            pdt.push(orders.items[i].productId)
        }

        const pdtData = [];
        for (let i = 0; i < pdt.length; i++) {
            pdtData.push(await Product.findById({ _id: pdt[i] }))
        }
        res.render('orderPlaced', { orders, pdtData })

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};







module.exports = {
    loadCart,
    loadCartpage,
    increment,
    decrement,
    removeCart,
    addOrder,
    loadorderPlaced
    


}