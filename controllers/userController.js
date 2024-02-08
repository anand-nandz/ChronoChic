const User = require("../models/userModel");
const bcrypt = require('bcrypt');
// const otpGenerator =require('otp-generator');
// const nodemailer = require('nodemailer');
// const randomString = require("randomstring");
// const config = require("../config/config");
const { use } = require("../routes/userRoute");
const { sendForgotPasswordOTP } = require('../utils/forgotOtp');
const { sendInsertOtp } = require('../utils/insertOtp');
const { generateOtp } = require('../utils/otphandle');
const flash = require('connect-flash');

const Product = require("../models/productModel");
const Category = require("../models/categoryModel")



// // Create a transporter object using SMTP transport
// let transporter = nodemailer.createTransport({
//      host:"smtp.gmail.com",  //  email service provider
//      port:587,
//      secure:false,
//      requireTLS:true,
//     auth: {
//         user: config.emailUser,
//         pass: config.emailPassword 
//     }
// });



//---------------------*****Load Login Page*****---------------------//

const loadLogin = async(req,res)=>{
    try{
           
        res.render('login');

    }
    catch{
        console.log(error.message); 
    }
}


//---------------------*****Load Register Page*****---------------------//

const loadRegister = async(req,res)=>{
    try{

        res.render('register');

    }
    catch{
        console.log(error.message);
    }
}


//---------------------*****Insert User*****---------------------//

const insertUser = async(req,res)=>{
        try{
            if(req.body.userpassword===req.body.confirmpassword){
                res.redirect('/verifyOTP')
            }
            const otp = generateOtp();
            
            const {name,email,mobileno,userpassword,confirmpassword} = req.body;
          
              req.session.Data = {name,email,mobileno,userpassword,confirmpassword,otp}
            req.session.save();
            console.log(req.session,'this is sesion');

            console.log(otp);
            console.log(req.session.Data.otp,'wWWWWWW');
           


            const sentEmailUser = await sendInsertOtp(req.body.email,otp);
            if(sentEmailUser){
                // console.log('sentemail');
                res.redirect('/verifyOTP')
            }
            
          
        }
        catch(error){
            console.log(error.message)
        }
    
}


//---------------------*****To load in to OTP page*****---------------------//


const loadOtp=async(req,res)=>{
    try{
        res.render('verifyOTP',{message:null});
    }
    catch(error){
        console.log(error.message);

    }
}


//---------------------*****Get OTP*****---------------------//


const getOtp = async (req, res) => {
    console.log("calling");
    try {
        const otpInBody = req.body.otp;
        const otp = req.session.Data.otp
        console.log("stored otp",otp)
        console.log(otpInBody, 'this is otp', req.session, 'LLLLLLLL');
        
        if(otpInBody === otp){
            console.log(req.session.Data,"hello")
            const {name,email,mobileno,userpassword} = req.session.Data

            console.log("username:",name);
            console.log("email:",email);
            console.log("mobileno:",mobileno)
            console.log("userpassword:",userpassword)

            const passwordHash = await bcrypt.hash(userpassword,10);
            console.log("Hashedpassword ==>" , passwordHash);
            const existingUser = await User.findOne({email:email}) 
            if(!existingUser){
                 const user = new User({
                name: name,
                email: email,
                mobile: mobileno,
                password: passwordHash,
                is_admin: 0,
                is_verified: 1,
                is_blocked:false
                });
                await user.save()

            }
            console.log("registered successfully")
            // res.redirect('/login')
            res.redirect('/login?registration=complete');
        }
        else{
            res.status(400).json({error:"otp invalid"})
        }

    } catch (error) {
        console.log('Error in OTP verification:', error);
        return res.render('verifyOTP', { message: 'An error occurred during OTP verification. Please try again later.' });
    }
};


//---------------------*****VerifyLogin*****---------------------//



const verifyLogin = async(req,res)=>{
    try{
        const {email,userpassword}=req.body;

        // Check if email and password are provided
        if (!email || !userpassword) {
            req.flash('error', 'Email and password are required');
            return res.redirect('/login');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.flash('error', 'Please enter a valid email address');
            return res.redirect('/login');
        }


        const userData= await User.findOne({email});

        console.log(userData);

        if(!userData){
            req.flash('error', 'User not found');
            return res.redirect('/login');
        }

        if (userData.is_blocked) {
            req.flash('error', 'Your account has been blocked. Please contact the admin.');
            return res.redirect('/login');
        }

        const hashedPassword = await bcrypt.compare(userpassword,userData.password);

        if (!hashedPassword) {
            req.flash('error', 'Invalid password');
            return res.redirect('/login');
        }

        console.log(hashedPassword,'password');
        console.log(userData.password,'hlooooooooooooo');

        if(hashedPassword){
            if(userData.is_blocked){
                return res.render('login', { message: "User has been blocked" });
            }
            req.session.user = userData;
            console.log(req.session.user);
            res.redirect('/home');
        }
        else{
            console.log("home rendering");
            res.render('login',{message:'Invalid Password'})
        }
    }
    catch(error){
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" }); // Send a generic error response

    }
}


//---------------------*****Load Home*****---------------------//



const loadHome = async(req,res)=>{
    try{

        // const userData = await User.findById({_id:req.session.user_id});
        // res.render('home',{user:userData});
        res.render('home');

    }
    catch(error){
        console.log(error.message);
    }
}



//---------------------*****Logout*****---------------------//



const logout = async(req, res) => {
    try {
      req.session.destroy();
      res.redirect('/');
    } 
    catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error logging out" });
    }
   };



//---------------------***** Verify email while reseting and Forgot Password*****---------------------//


   const loadForgotPassword= async(req,res)=>{
    try{
        res.render('forgotPassword')
    }
    catch(error){
        console.log(error.message);
    }
   }



   const forgotPassword = async(req,res)=>{
    try{
        const email= req.body.email;
       const user= await User.findOne({email:email});
       if(!user){
        return res.status(404).json({message:"Email not found"})
       }

       const otp = generateOtp();

       req.session.forgotPassword = {
        email:req.body.email,
        otp:otp
       }
    //    req.session.save();

       const sentEmail = await sendForgotPasswordOTP(req.body.email,otp);
       if(sentEmail){
        // console.log('sentemail');
        res.redirect('/resetPassword')
       }

    }
    catch(error){
        console.log(error.message);
        return res.status(500).json({message:"Internal server error"})
    }
   }


   const loadPasswordReset = async(req,res)=>{
    try{
        res.render('resetPassword')        
        
    }
    catch(error){
        console.log(error.message)
    }

}


   const passwordReset = async(req,res)=>
   {
    try{
        // console.log("otp not get",req.session.forgotPassword.otp);
        // console.log(otpEntered);
        const otpEntered = req.body.otp;
        const otpStored = req.session.forgotPassword.otp;
        console.log("otp not get",req.session.forgotPassword.otp);
        console.log(otpEntered);
    
        const newPassword = req.body.newPassword;

        const hashedPassword = await bcrypt.hash(newPassword,10);
        const confirmNewPassword = req.body.confirmNewPassword

        if(newPassword !== confirmNewPassword){
            return res.status(400).json({message:"Passwords not match"})
        }
        console.log('pass',hashedPassword);
        if(otpEntered===otpStored)
        {
            const user = await User.findOneAndUpdate(
                {email:req.session.forgotPassword.email},
                {password:hashedPassword},
                {new:true}
            )

            if(!user){
                return res.status(404).json({message:"User not found"});
            }
    
            console.log('email to update',req.session.forgotPassword.email);
            console.log('hashed password',hashedPassword);
    
            res.redirect('/login'); 
        }
        else{
            return res.status(500).json({message:"Invalid otp"})
        }
        
    }
    catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).send({ error: 'An error occurred while processing your request' });
      }
   }









   const loadProduct = async (req, res) => {
    try {
      const userData = await User.findById(req.session.user_id);
      const productData = await Product.find({}).limit(8)
      const categoryData = await Category.find({});
        console.log(productData,'pdtdata........................');
        console.log(userData,'userdata........................');
      res.render('home',{user:userData,product:productData , category:categoryData})
  
      
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };


  const loadIndividualProduct =async(req,res)=>{
    try{
        
        const id =req.query.id;
        const userData = await User.findById(req.session.user_id);
        const productData = await Product.findById({_id:id});
        const categoryData = await Category.find({});
        console.log(productData,'id.........................');
        if(productData){
            res.render('productDetails',{product:productData,
            user:userData , 
            category:categoryData})
        }
        else{
            res.redirect('/home')
        }
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
      }
  }










  

module.exports = {
    loadLogin,
    loadRegister,
    insertUser,
    loadOtp,
    getOtp,
    verifyLogin,
    loadHome,
    logout,
    loadForgotPassword,
    passwordReset,
    forgotPassword,
    loadPasswordReset,
    loadProduct,
    loadIndividualProduct


    
}