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
        {   
            id:{
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
                
             },
             type: { // New field to track transaction type (credit/debit)
                type: String,
                enum: ['Credit', 'Debit'] // Enumerate possible transaction types
            }
        },
    ],
    

},{versionKey:false})

module.exports=mongoose.model("wallet",walletSchma)