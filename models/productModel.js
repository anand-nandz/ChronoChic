const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  pname: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },
  offprice: {
    type: Number,
    required: true,
  },
  discountPercentage: {
    type: Number,
    default: 0, 
  },

  description: {
    type: String,
    required: true,
  },

  images: [
    {
      type: String,
    },
  ],
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  brand: {
    type: String,
    required: true,
  },

  color: {
    type: String,
    required: true,
  },

  material: {
    type: String,
    required: true,
  },

  caseSize: {
    type: String,
    required: true,
  },

  is_listed: {
    type: Boolean,
    default: true,
  },

  countInStock: {
    type: Number,
    required: true,
    min: 0,
    max: 300 // Example maximum stock limit, adjust as needed
  }

});

module.exports = mongoose.model("Product", productSchema);
