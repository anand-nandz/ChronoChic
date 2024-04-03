const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
        offer: {
            discount:{
                type:Number
            },
            startDate:{
                type:String,
            },
            endDate:{
                type:String
            },
        },
    is_blocked:{
        type:Boolean,
        default:false
    }
});

module.exports = mongoose.model("Category", categorySchema);
