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
  // offprice: {
  //   type: Number,
  //   required: true,
  // },

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
  }
});

module.exports = mongoose.model("Product", productSchema);
