const nodemailer = require('nodemailer');
const config = require("../config/config");
// const otpGenerator =require('otp-generator');


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: config.emailUser,
        pass: config.emailPassword 
    }
});



async function sendInsertOtp(email,otp) {

    
    const mailOptions = await {
        from: '"ChronoChic" <chronochic1@gmail.com>', 
        to: email,
        subject: 'Your One Time Password, ChronoChic Registration', 
        text: `Hi,
            Your Email OTP is ${otp}`
    };
    try {
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        console.log(otp);
        return otp; 
    } catch (error) {
        console.error('Error occurred while sending email:', error);
        throw new Error('Failed to send OTP email');
    }
}

module.exports = { sendInsertOtp };
