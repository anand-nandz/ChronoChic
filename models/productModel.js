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
    type: String,
    required: true,
  },

  brand: {
    type: String,
    required: true,
  },

  sizes: [
    {
      size: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],

  is_listed: {
    type: String,
    default: 1,
  },
});

module.exports = mongoose.model("Product", productSchema);
