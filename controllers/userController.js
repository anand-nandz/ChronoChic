const User = require("../models/userModel");
const bcrypt = require('bcrypt');
// const otp =require('../controllers/otpGenerate');
const otpGenerator =require('otp-generator')
// Import Nodemailer
const nodemailer = require('nodemailer');



// Create a transporter object using SMTP transport
let transporter = nodemailer.createTransport({
     host:"smtp.gmail.com",  //  email service provider
     port:587,
     secure:false,
     requireTLS:true,
    auth: {
        user: 'chronochic1@gmail.com',
        pass: 'zdrh vybm xjfi ckrt' 
    }
});



//---------------------*****Hash Password*****---------------------//

// const securePassword = async(password)=>{

//     try{

//         const passwordHash = await bcrypt.hash(password, 10);
//         return passwordHash;
//     //     const password = req.session.Data.password;
//     // const saltRounds = 10; // You can adjust the number of rounds as needed for your application
//     // const passwordHash = await bcrypt.hash(password, saltRounds);

        

//     }
//     catch(error){
//         console.log(error.message);
//     }

// }

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
            const otp = otpGenerator.generate(6, { upperCase: false, specialChar: false, alphabets: false});
            // const OTP = otp()
            // console.log(OTP)
            const {name,email,mobileno,userpassword,confirmpassword} = req.body;
            // const data={
            //     name:name,
            //     email:email,
            //     mobileno:mobileno,
            //     userpassword:userpassword,
            //     confirmpassword:confirmpassword,
            //     otp:otp
            // }

              req.session.Data = {name,email,mobileno,userpassword,confirmpassword,otp}
            req.session.save();
            console.log(req.session,'this is sesion');

            console.log(otp);
            console.log(req.session.Data.otp,'wWWWWWW');
           
            
            // Setup email data with unicode symbols
            const mailOptions = await {
                from: '"ChronoChic" <chronochic1@gmail.com>', // Sender address
                to: `${req.body.email}`, // List of receivers
                subject: 'Your One Time Password, ChronoChic Registration', // Subject line
                text: `Hi,
                    Your Email OTP is ${otp}`
            };
            if(mailOptions){
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.error('Error occurred while sending email:', error);
                    }
                    console.log('Email sent successfull',info.response);
                });
                // res.redirect('/verifyOTP')
            }           

            // res.render('verifyOTP')



            // if(req.body.userpassword===req.body.confirmpassword){
            //     const spassword = await securePassword(req.body.userpassword)
            //     const user = new User({
            //     name:req.body.name,
            //     email:req.body.email,
            //     mobile:req.body.mobileno,
            //     password:spassword,
            //     is_admin :0
            // });
    
            // const userData = await user.save();
    
            // if(userData){
            //     res.render('register',{message:'Your registration is successful'});
            // }
            // else{
            //     res.render('register',{message:'Your registration has been failed'});
    
            // }
            // }
            
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
        // const { mobile, password } = req.session.Data; // Destructure mobile and password from session Data
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
                is_verified: 1
                });
                await user.save()

            }
            console.log("registered successfully")
            res.redirect('/login')
    
        }else{
            res.status(400).json({error:"otp invalid"})
        }
    } catch (error) {
        console.log('Error in OTP verification:', error);
        return res.render('verifyOTP', { message: 'An error occurred during OTP verification. Please try again later.' });
    }
};



// const verifyLogin = async(req,res)=>{

//     try{
        
//         const email = req.body.email;
//         const password = req.body.password;

//         const userData = await User.findOne({email:email})

//         if(userData){

//             const passwordMatch = await bcrypt.compare(password,userData.password);

//             if(passwordMatch){

//                 if(userData.is_verified === 0 ){
//                     res.render('login',{message:'Admin not yet approved'})
//                 }
//                 else{
//                     req.session.user_id = userData._id;
//                     res.redirect('/home')
//                 }

//             }
//             else{
//                 res.render('login',{message:"Email and password is incorrect"});
   
//             }

//         }

//         else{
//             res.render('login',{message:"Email and password is incorrect"});
//         }


//     }
//     catch(error){
//         console.log(error.message);
//     }
// };











































// //login user methods started

// const loginLoad = async(req,res)=>{

//     try{

//         res.render("login");

//     }
//     catch(error){
//         console.log(error.message);
//     }

// }




// const loadHome = async(req,res)=>{
//     try{

//         const userData = await User.findById({_id:req.session.user_id});
//         res.render('home',{user:userData});
//     }
//     catch(error){
//         console.log(error.message);
//     }
// }



// const userLogout = async (req,res)=>{
//     try{
//         req.session.destroy();
//         res.redirect('/');
//     }
//     catch(error){
//         console.log(error.message);
//     }
// }


// //user profile and update

// const editLoad = async(req,res)=>{
//     try{

//         const id = req.query.id;

//         const userData = await User.findById({_id:id})

//         if(userData){
//             res.render('edit',{user:userData})
//         }
//         else{
//             res.redirect('/home');
//         }
//     }
//     catch(error){
//         console.log(error.message);
//     }
// }

// const updateProfile = async(req,res)=>{
//     try{
//         const userData =  await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email,mobile:req.body.mobileno}})

//         res.redirect('/home');
//     }
//     catch(error){
//         console.log(error.message);
//     }
// }










  

module.exports = {
    loadLogin,
    loadRegister,
    insertUser,
    loadOtp,
    getOtp
    // loginLoad,
    // verifyLogin,
    // loadHome,
    // userLogout,
    // editLoad,
    // updateProfile
    
}