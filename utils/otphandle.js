const otpGenerator =require('otp-generator');
const randomString = require("randomstring");

function generateOtp() {
    return otpGenerator.generate(6, { digits: true });
}

const generateOrder = (length = 4) => {
    const digits = '0123456789';
    let otp = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      otp += digits.charAt(randomIndex);
    }
  
    return otp;
  };


module.exports = { 
    generateOtp,
    generateOrder
};

