const nodemailer = require('nodemailer');
const config = require("../config/config");
// const otpGenerator =require('otp-generator');

// Create a transporter object using SMTP transport
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

// Function to send OTP email for forgot password
async function sendForgotPasswordOTP(email,otp) {
   

    // Setup email data with unicode symbols
    const mailOptions = {
        from: '"ChronoChic" <chronochic1@gmail.com>', 
        to: email, // Receiver's email
        subject: 'Your One Time Password, ChronoChic Forgot Password', 
        text: `Hi, Your One Time Password for resetting your password is: ${otp}`
    };

    try {
        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        console.log(otp);
        return otp; // Return OTP for further processing if needed
    } catch (error) {
        console.error('Error occurred while sending email:', error);
        throw new Error('Failed to send OTP email');
    }
}

module.exports = { sendForgotPasswordOTP };