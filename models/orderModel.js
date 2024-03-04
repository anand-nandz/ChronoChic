const mongoose=require("mongoose")

const orderSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        require:true,
    },
    userEmail:{
        type:String,
        require:true,
    },
    orderNumber:{
        type:String,
        require:true,
        unique:true
    },
    email:{
        type:String,
        require:true,
    },
    items:[ 
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                require:true,
            },
            subTotal:{
                type:Number,
                require:true
            },
            quantity:{  
                type:Number,
                require:true
            },
        },
    ],

    totalAmount:{
        type:Number,
        require:true
    },
    orderType:{
        type:String,
        require:true
    },
    orderDate:{
        type:String,
        require:true
      
    },
    status:{
        type:String,
        require:true
    },
    shippingAddress:[{
        addressType: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        homeAddress:{
            type: String,
            required: true
        },
        landMark: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        altPhone: {
            type: String,
            required: true
        }
    }]

},{versionKey:false},{strictPopulate:false});

module.exports = mongoose.model("Order", orderSchema);

