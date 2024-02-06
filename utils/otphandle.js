const otpGenerator =require('otp-generator');
const randomString = require("randomstring");

function generateOtp() {
    return otpGenerator.generate(6, { digits: true });
}
module.exports = { generateOtp };

