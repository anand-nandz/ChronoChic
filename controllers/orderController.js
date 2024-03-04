const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel")
const Order = require("../models/orderModel");
const Address = require("../models/addressModel");



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

        const findOrder = await Order.findById({ _id: id })

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

        res.json({ status: true })


    } catch (error) {
        console.log(error.message)
    }
}



const loadOrder=async(req,res)=>{
    try {
        const orderData=await Order.find({}).sort({_id:-1})

        res.render("adminorder",{orderData})
    } catch (error) {
        console.log(error.message)
    }
 }


 const loadOrderDetail=async(req,res)=>{
    try {
        const id=req.query.id
        const findOrder=await Order.findById({_id:id})
        console.log(findOrder,'findorder..........');
        let pdtId=[];
        for(let i=0;i<findOrder.items.length;i++){
            pdtId.push(findOrder.items[i].productId)
        }
        console.log(pdtId,'iddddddddddd');
        let pdtData=[]

        for(let i=0;i<pdtId.length;i++){
            pdtData.push(await Product.findById({_id:pdtId[i]}))
        }
        console.log(pdtData,'dataaaaaaaaaaaaaaaaaaa');

        res.render("orderDetails",{findOrder,pdtData})
    } catch (error) {
        console.log(error.message)
    }
 }


 const saveOrder=async(req,res)=>{
    try {
     
        const {status,id}=req.body

        console.log(id,status)

       const checking=await Order.findById({_id:id})

       if(checking.status==status){
        res.json({status:"notChanged"})
       }else{

        const updateStatus=await Order.findByIdAndUpdate({_id:id},{
            $set:{
                status:status
            }
        })

       }
       res.json({status:true})


    } catch (error) {
        console.log(error.message)
    }
 }


module.exports = {
    loadViewOrder,
    cancelOrder,
    loadOrder,
    loadOrderDetail,
    saveOrder
}