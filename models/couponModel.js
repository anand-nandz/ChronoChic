const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
    },
    startDate: {
      type: String,
      require: true,
    },
    endDate: {
      type: String,
      require: true,
    },
    minimumAmount: {
      type: Number,
      require: true,
    },
    maximumAmount: {
      type: Number,
      require: true,
    },
    discount: {
      type: Number,
      require: true,
    },
    couponCode: {
      type: String,
      require: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    users:{
      type:Array,
    }
    
  },
  { versionKey: false }
);

module.exports = mongoose.model("Coupon", couponSchema);
