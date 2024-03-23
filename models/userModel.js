const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    dob: {
        type: String // Change the type to String
    },
    
    gender: {
        type: String,
        enum: ["male", "female", "other"]
    },
    is_admin:{
        type:Number,
        required:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    is_blocked:{
        type:Boolean,
        default:false
    },
    referralCode:{
        type:String,
        require:true
    }


});


module.exports = mongoose.model('User',userSchema)