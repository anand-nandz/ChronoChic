const mongoose=require("mongoose")

const walletSchma=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true,
    },
    balance:{
        type:Number,
        
    },
    transactions:[
        {   id:{
            type:Number
            
            },
            date:{
                type:String,
                
            },
             amount:{
                type:Number,
             
             },
             orderType:{
                type:String,
                
             }
        },
    ],
    

},{versionKey:false})

module.exports=mongoose.model("wallet",walletSchma)