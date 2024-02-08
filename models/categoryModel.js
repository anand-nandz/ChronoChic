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
    is_blocked:{
        type:Boolean,
        default:false
    }
});

module.exports = mongoose.model("Category", categorySchema);
