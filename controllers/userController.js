const User = require("../models/userModel");
const bcrypt = require('bcrypt');

const { use } = require("../routes/userRoute");
const { sendForgotPasswordOTP } = require('../utils/forgotOtp');
const { sendInsertOtp } = require('../utils/insertOtp');
const { generateOtp } = require('../utils/otphandle');
const flash = require('connect-flash');
const generateDate = require("../utils/dateGenrator");
const {generateOrder} = require("../utils/otphandle")
const referralCode = require("../utils/referalCode")

const Address = require("../models/addressModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel");
const Wallet = require("../models/walletModel");
const Order =require("../models/orderModel")
// const referalCode = require("../utils/referalCode");
const Coupon = require('../models/couponModel');






//---------------------*****Load Login Page*****---------------------//

const loadLogin = async (req, res) => {
    try {

        res.render('login');

    }
    catch {
        console.log(error.message);
    }
}


//---------------------*****Load Register Page*****---------------------//

const loadRegister = async (req, res) => {
    try {
        res.render('register', { error:null });

    }
    catch (error){
        console.log(error.message);
    }
}


//---------------------*****Insert User*****---------------------//


const insertUser = async (req, res) => {
    try {
        const { name, email, mobileno, userpassword, confirmpassword, gender ,  referral} = req.body;
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.redirect('/register?error=Email already exists. Please use a different email.');
        }

        
        if (userpassword === confirmpassword) {
            
            const otp = generateOtp();
            const otpTimestamp = Date.now();
            console.log(otp,"genearted otp");

            if(referral != ""){
                const searchReffer = await User.findOne({referralCode: referral})
                if(searchReffer){
                    
                    req.session.Data = { name, email, mobileno, userpassword, confirmpassword, otp, gender, otpTimestamp,referral };
                    req.session.save();
                    // return res.redirect('/verifyOTP');
                }
               
    
    
            } else{
                 req.session.Data = { name, email, mobileno, userpassword, confirmpassword, otp, gender, otpTimestamp };
                 req.session.save();

             }



            // req.session.Data = { name, email, mobileno, userpassword, confirmpassword, otp, gender, otpTimestamp,referral };
            // req.session.save();

            const sentEmailUser = await sendInsertOtp(email, otp);
            if (sentEmailUser) {
                return res.redirect('/verifyOTP');
            }
        } else {
            return res.render('register', { error: 'Passwords do not match.' });
        }



    } catch (error) {
        console.log(error.message);
        return res.render('register', { error: 'An error occurred. Please try again later.' });
    }
}




const checkEmailExists= async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = await User.findOne({ email: email  });
        if (existingUser) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (error) {
        console.error("Error checking email existence:", error);
        return res.status(500).json({ error: "An error occurred while checking email existence." });
    }
};





//---------------------*****To load in to OTP page*****---------------------//


const loadOtp = async (req, res) => {
    try {
        res.render('verifyOTP', { message: null });
    }
    catch (error) {
        console.log(error.message);

    }
}


//---------------------*****Get OTP*****---------------------//


const getOtp = async (req, res) => {
    try {
       console.log(req.session.Data.otp);
       console.log( req.session.Data.otpTimestamp);
        const date = generateDate();
        const Tid= generateOrder()
      
        const otpInBody = req.body.otp;
        const otp = req.session.Data.otp;
        const otpTimestamp = req.session.Data.otpTimestamp;
        const currentTime = Date.now();
        console.log("stored otp", otp)
        console.log(otpInBody, 'this is otp', req.session, 'req session ');
        
        if (otpInBody === otp && (currentTime - otpTimestamp) <= 60000) {
            const refferal=referralCode(8);
           
            console.log(refferal,"new referal code")

            const { name, email, mobileno, userpassword, gender ,referral} = req.session.Data


            const passwordHash = await bcrypt.hash(userpassword, 10);
            const existingUser = await User.findOne({ email: email })
            if (!existingUser) {
                const user = new User({
                    name: name,
                    email: email,
                    gender: gender,
                    mobile: mobileno,
                    password: passwordHash,
                    is_admin: 0,
                    is_verified: 1,
                    is_blocked: false,
                    referralCode:refferal
                });
                await user.save()

            }
            if(req.session.Data.referral){
                const findUser = await User.findOne({ referralCode: req.session.Data.referral });
                
                if (findUser) {
                    const userWallet = await Wallet.findOne({ userId: findUser._id });
                    if (userWallet) {
                        const updateWallet = await Wallet.findOneAndUpdate(
                            { userId: findUser._id },
                            {
                                $inc: { balance: 100 },
                                $push: {
                                    transactions: {
                                        id: Tid,
                                        date: date,
                                        amount: 100,
                                        orderType: 'Referral Bonus',
                                        type: 'Credit'
                                    }
                                }
                            }
                        );
                    } else {
                        const createWallet = new Wallet({
                            userId: findUser._id,
                            balance: 100,
                            transactions: [{
                                id: Tid,
                                date: date,
                                amount: 100,
                                orderType: 'Referral Bonus',
                                type: 'Credit'
                            }]
                        });
                        await createWallet.save();
                    }
    
                    // Create wallet for the new user
                    const newUser = await User.findOne({ email: req.session.Data.email });
                    const newWallet = new Wallet({
                        userId: newUser._id,
                        balance: 100,
                        transactions: [{
                            id: Tid,
                            date: date,
                            amount: 100,
                            orderType: 'Referral Bonus',
                            type: 'Credit'
                        }]
                    });
                    await newWallet.save();
                }
    
    
            }
           
            console.log("registered successfully")
            res.redirect('/login?registration=complete');
        } else {
            if ((currentTime - otpTimestamp) > 60000) {
                req.session.Data.otp = null;
                return res.render('verifyOTP', { message: 'OTP has expired. Please request a new one.' });
            } else {
                return res.render('verifyOTP', { message: 'Invalid OTP. Please try again.' });
            }
        }
       

    } catch (error) {
        console.log('Error in OTP verification:', error);
        return res.render('verifyOTP', { message: 'An error occurred during OTP verification. Please try again later.' });
    }
}



// const getOtp = async (req, res) => {
//     try {
//         const date = generateDate();
//         const Tid = generateOrder();

//         const otpInBody = req.body.otp;
//         const { otp, otpTimestamp, reffer } = req.session.Data;
//         const currentTime = Date.now();

//         if (otpInBody === otp && (currentTime - otpTimestamp) <= 60000) {
//             let refferal;
//             if (reffer) {
//                 const findUser = await User.findOne({ referralCode: reffer });
//                 if (findUser) {
//                     // Update wallet for referred user
//                     const userWallet = await Wallet.findOneAndUpdate(
//                         { userId: findUser._id },
//                         {
//                             $inc: { balance: 100 },
//                             $push: {
//                                 transactions: {
//                                     id: Tid,
//                                     date: date,
//                                     amount: 100,
//                                     orderType: 'Razorpay',
//                                     type: 'credit'
//                                 }
//                             }
//                         },
//                         { upsert: true, new: true }
//                     );

//                     // Create wallet for the new user
//                     const newUser = await User.findOne({ email: req.session.Data.email });
//                     const newWallet = new Wallet({
//                         userId: newUser._id,
//                         balance: 100,
//                         transactions: [{
//                             id: Tid,
//                             date: date,
//                             amount: 100
//                         }]
//                     });
//                     await newWallet.save();
//                 }
//             }

//             // Register user if not already registered
//             const existingUser = await User.findOne({ email: req.session.Data.email });
//             if (!existingUser) {
//                 const { name, email, mobileno, userpassword, gender } = req.session.Data;
//                 const passwordHash = await bcrypt.hash(userpassword, 10);
//                 const user = new User({
//                     name: name,
//                     email: email,
//                     gender: gender,
//                     mobile: mobileno,
//                     password: passwordHash,
//                     is_admin: 0,
//                     is_verified: 1,
//                     is_blocked: false,
//                     referralCode: refferal
//                 });
//                 await user.save();
//             }

//             return res.redirect('/login?registration=complete');
//         } else {
//             // Handle invalid or expired OTP
//             if ((currentTime - otpTimestamp) > 60000) {
//                 req.session.Data.otp = null;
//                 return res.render('verifyOTP', { message: 'OTP has expired. Please request a new one.' });
//             } else {
//                 return res.render('verifyOTP', { message: 'Invalid OTP. Please try again.' });
//             }
//         }
//     } catch (error) {
//         console.error('Error in getOtp controller:', error);
//         return res.render('verifyOTP', { message: 'An error occurred during OTP verification. Please try again later.' });
//     }
// }






const  resendOTP = async (req, res) => {
    try {
        const newOTP = generateOtp(); 
        const otpTimestamp = Date.now();
      req.session.Data.otpTimestamp=otpTimestamp;

        req.session.Data.otp = newOTP;
        
        console.log(newOTP,"newotp ......");
        console.log(req.session.Data.otp,"otp saved in sessionnnnnnnnnnn");
        res.status(200).json({ message: "OTP resent successfully", newOTP });
    } catch (error) {
        console.log('Error in resending OTP:', error);
        res.status(500).json({ error: "An error occurred while resending OTP" });
    }
};





//---------------------*****VerifyLogin*****---------------------//



const verifyLogin = async (req, res) => {
    try {
        const { email, userpassword } = req.body;

        if (!email || !userpassword) {
            req.flash('error', 'Email and password are required');
            return res.redirect('/login');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.flash('error', 'Please enter a valid email address');
            return res.redirect('/login');
        }


        const userData = await User.findOne({ email });


        if (!userData) {
            req.flash('error', 'User not found');
            return res.redirect('/login');
        }

        if (userData.is_blocked) {
            req.flash('error', 'Your account has been blocked. Please contact the admin.');
            return res.redirect('/login');
        }

        const hashedPassword = await bcrypt.compare(userpassword, userData.password);

        if (!hashedPassword) {
            req.flash('error', 'Invalid password');
            return res.redirect('/login');
        }


        if (hashedPassword) {
            if (userData.is_blocked) {
                return res.render('login', { message: "User has been blocked" });
            }
            req.session.user = userData;
            res.redirect('/home');
        }
        else {
            res.render('login', { message: 'Invalid Password' })
        }
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });

    }
}


//---------------------*****Load Home*****---------------------//


const loadHome = async (req, res) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user._id);
            if (user && user.is_blocked) {
                req.session.destroy();
                
                req.flash('error', 'Your account has been blocked by the admin.');
                return res.redirect('/login');
            }
            res.render('home');
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};




//---------------------*****Logout*****---------------------//



const logout = async (req, res) => {
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


const loadForgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword')
    }
    catch (error) {
        console.log(error.message);
    }
}



const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.render('forgotPassword', { message: "Email not found", email: email });

        }

        const otp = generateOtp();

        req.session.forgotPassword = {
            email: req.body.email,
            otp: otp
        }
        //    req.session.save();

        const sentEmail = await sendForgotPasswordOTP(req.body.email, otp);
        if (sentEmail) {
            res.redirect('/resetPassword')
        }

    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Internal server error" })
    }
}


const loadPasswordReset = async (req, res) => {
    try {
        res.render('resetPassword')

    }
    catch (error) {
        console.log(error.message)
    }

}


const passwordReset = async (req, res) => {
    try {
        // console.log("otp not get",req.session.forgotPassword.otp);
        // console.log(otpEntered);
        const otpEntered = req.body.otp;
        const otpStored = req.session.forgotPassword.otp;
        console.log(otpEntered,"otp");

        const newPassword = req.body.newPassword;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const confirmNewPassword = req.body.confirmNewPassword

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: "Passwords not match" })
        }
        if (otpEntered === otpStored) {
            const user = await User.findOneAndUpdate(
                { email: req.session.forgotPassword.email },
                { password: hashedPassword },
                { new: true }
            )

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }


            res.redirect('/login');
        }
        else {
            return res.status(500).json({ message: "Invalid otp" })
        }

    }
    catch (error) {
        console.error('Error sending password reset email:', error);
        res.status(500).send({ error: 'An error occurred while processing your request' });
    }
}



const userProfile = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user._id);
        const address = await Address.findOne({ userId: req.session.user._id });
        const orders = await Order.find({ userId: req.session.user._id }).sort({_id:-1});
        const findUser = await User.findOne(req.session.user);
  
      
  
      const CouponDataArray = await Coupon.find({
        users: { $nin: [findUser._id] },
        isActive: true
      });
  
      const redeemCoupon = await Coupon.find({
        users: { $in: [findUser._id] },
      });
  
        res.render('userProfile', { userData, address ,orders,redeemCoupon,CouponDataArray});
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}
const orders = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user._id);
        const address = await Address.findOne({ userId: req.session.user._id });

        const perPage = 5; 
        let page = parseInt(req.query.page) || 1;

        const totalOrders = await Order.countDocuments({ userId: req.session.user._id });
        const totalPage = Math.ceil(totalOrders / perPage);
        
        page = Math.max(1, Math.min(page, totalPage));

        const orders = await Order.find({ userId: req.session.user._id })
            .sort({ _id: -1 })
            .skip(perPage * (page - 1))
            .limit(perPage);

        const pdtDataArray = await Promise.all(orders.map(async (order) => {
            const pdtId = order.items.map(item => item.productId);
            const pdtData = await Product.find({ _id: { $in: pdtId } });
            return pdtData;
        }));

        res.render('orders', { userData, address, orders, pdtDataArray, page, totalPage,perPage  });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const addAddress = async (req, res) => {
    try {
        const { addressType, name, city, homeAddress, landMark, state, pincode, phone, altPhone } = req.body;
        const existingAddresses = await Address.findOne({ userId: req.session.user._id });

        // if (existingAddresses && existingAddresses.address.length >= 3) {
        //     req.flash('error', 'You can only have up to 3 addresses.');
        //     return res.redirect('/userProfile');
        // }

        if (phone === altPhone) {
            req.flash('error', 'Phone and Alternate Phone must be different.');
            return res.redirect('/userProfile');
        }

        const pincodeRegex = /^[1-9][0-9]{5}(?:\s[0-9]{3})?$/;
        if (!pincodeRegex.test(pincode)) {
            req.flash('error', 'Pincode must be a 6-digit number.');
            return res.redirect('/userProfile');
        }

        const newAddress = {
            addressType,
            name,
            city,
            homeAddress,
            landMark,
            state,
            pincode,
            phone,
            altPhone
        };

        if (existingAddresses) {
            existingAddresses.address.push(newAddress);
            await existingAddresses.save();
        } else {
            const address = new Address({
                userId: req.session.user._id,
                address: [newAddress]
            });
            await address.save();
        }

        res.redirect('/userProfile#manageaddress');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const renderEditAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;
        const user = req.session.user;

        const address = await Address.findOne({ userId: user._id, 'address._id': addressId });
      
        if (!address) {
            return res.status(404).send('Address not found');
        }

        const addressData = address.address.find(addr => addr._id.toString() === addressId);
        
        res.render('editAddress', { address: addressData, addressId: addressId });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const editAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const { name, addressType, city, homeAddress, landMark, state, pincode, phone, altPhone } = req.body;

        const updatedAddress = {
            name,
            addressType,
            city,
            homeAddress,
            landMark,
            state,
            pincode,
            phone,
            altPhone
        };
        
        const pincodeRegex = /^[1-9][0-9]{5}(?:\s[0-9]{3})?$/;
        if (!pincodeRegex.test(pincode)) {
            req.flash('error', 'Pincode must be a 6-digit number.');
            return res.redirect('/edit-address?addressId=' + addressId);
        }

        const result = await Address.findOneAndUpdate(
            { 'address._id': addressId }, 
            { $set: { 'address.$': updatedAddress } }, 
            { new: true } 
        );

        if (!result) {
            return res.status(404).send('Address not found');
        }

        res.redirect('/userProfile#manageaddress');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;

        
        const address = await Address.findOne({ userId: req.session.user._id });

        
        if (!address) {
            return res.status(404).send('Address not found');
        }

        
        address.address = address.address.filter(addr => addr._id.toString() !== addressId);

        
        await address.save();

      
        res.redirect('/userProfile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




const loadInvoice=async(req,res)=>{
    try {
      const id=req.query.id
      const findOrder=await Order.findById({_id:id})
  
  
      const proId = [];
  
      for (let i = 0; i < findOrder.items.length; i++) {
        proId.push(findOrder.items[i].productId);
      }
  
      const proData = [];
  
      for (let i = 0; i < proId.length; i++) {
        proData.push(await Product.findById({ _id: proId[i] }));
      }
  
      
      
  
  
  
      res.render("invoice",{proData, findOrder})
      
    } catch (error) {
      console.log(error.message)
    }
  }
  





module.exports = {
    loadLogin,
    loadRegister,
    insertUser,
    loadOtp,
    getOtp,
    resendOTP,
    verifyLogin,
    loadHome,
    logout,
    loadForgotPassword,
    passwordReset,
    forgotPassword,
    loadPasswordReset,
    orders,
    userProfile,
    addAddress,
    renderEditAddress,
    editAddress,
    deleteAddress,
    checkEmailExists,
    loadInvoice
  

}