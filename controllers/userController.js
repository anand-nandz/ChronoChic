const User = require("../models/userModel");
const bcrypt = require('bcrypt');

const { use } = require("../routes/userRoute");
const { sendForgotPasswordOTP } = require('../utils/forgotOtp');
const { sendInsertOtp } = require('../utils/insertOtp');
const { generateOtp } = require('../utils/otphandle');
const flash = require('connect-flash');

const Address = require("../models/addressModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel");
const Order =require("../models/orderModel")








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
        console.log('hlo......................');
        res.render('register', { error:null });

    }
    catch (error){
        console.log(error.message);
    }
}


//---------------------*****Insert User*****---------------------//

// const insertUser = async (req, res) => {
//     try {
//         const { name, email, mobileno, userpassword, confirmpassword, gender } = req.body;

//         const existingUser = await User.findOne({email:email});
//         if(existingUser){
//             res.redirect('/register',{error:"Email already exists. Please use a different email."})
//         }

//         if (req.body.userpassword === req.body.confirmpassword) {
//             res.redirect('/verifyOTP')
//         }
//         const otp = generateOtp();
//         const otpTimestamp = Date.now();
//         console.log(otpTimestamp,"otptimestampppppppppp");
//         // const { name, email, mobileno, userpassword, confirmpassword, gender } = req.body;

//         req.session.Data = { name, email, mobileno, userpassword, confirmpassword, otp, gender,otpTimestamp }
//         req.session.save();
//         console.log(req.session, 'this is sesion');

//         console.log(otp);
//         console.log(req.session.Data.otp, 'wWWWWWW');



//         const sentEmailUser = await sendInsertOtp(req.body.email, otp);
//         if (sentEmailUser) {
//             // console.log('sentemail');
//             res.redirect('/verifyOTP')
//         }


//     }
//     catch (error) {
//         console.log(error.message)
//     }

// }




const insertUser = async (req, res) => {
    try {
        const { name, email, mobileno, userpassword, confirmpassword, gender } = req.body;

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            // If the email already exists, render the register page with an error message
            // return res.render('register', { error: 'Email already exists. Please use a different email.' });
            return res.redirect('/register?error=Email already exists. Please use a different email.');
        }

        // If passwords match, proceed with user registration
        if (userpassword === confirmpassword) {
            // Generate OTP and timestamp
            const otp = generateOtp();
            const otpTimestamp = Date.now();

            // Store user data and OTP in session
            req.session.Data = { name, email, mobileno, userpassword, confirmpassword, otp, gender, otpTimestamp };
            req.session.save();

            // Send OTP to user's email
            const sentEmailUser = await sendInsertOtp(email, otp);
            if (sentEmailUser) {
                // Redirect to OTP verification page
                return res.redirect('/verifyOTP');
            }
        } else {
            // If passwords don't match, render the register page with an error message
            return res.render('register', { error: 'Passwords do not match.' });
        }
    } catch (error) {
        console.log(error.message);
        // Handle any errors that occur during registration
        return res.render('register', { error: 'An error occurred. Please try again later.' });
    }
}





const checkEmailExists= async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email: email  });
        if (existingUser) {
            // If the email already exists, respond with exists:true
            return res.json({ exists: true });
        } else {
            // If the email doesn't exist, respond with exists:false
            return res.json({ exists: false });
        }
    } catch (error) {
        console.error("Error checking email existence:", error);
        // If there was an error, respond with an error status
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
    console.log("calling");
    try {
        const otpInBody = req.body.otp;
        const otp = req.session.Data.otp;
        const otpTimestamp = req.session.Data.otpTimestamp;
        const currentTime = Date.now();
        console.log("stored otp", otp)
        console.log(otpInBody, 'this is otp', req.session, 'req session ');
        console.log(currentTime,"currenttimeeeeeeeeeeee");
        console.log(otpTimestamp,'timestampppppppppppp');
        if (otpInBody === otp && (currentTime - otpTimestamp) <= 60000) {
            console.log(req.session.Data, "session data ......................................")
            const { name, email, mobileno, userpassword, gender } = req.session.Data

            // console.log("username:", name);
            // console.log("email:", email);
            // console.log("mobileno:", mobileno)
            // console.log("userpassword:", userpassword)

            const passwordHash = await bcrypt.hash(userpassword, 10);
            // console.log("Hashedpassword ==>", passwordHash);
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
                    is_blocked: false
                });
                await user.save()

            }
            console.log("registered successfully")
            // res.redirect('/login')
            res.redirect('/login?registration=complete');
        }
        else {
            if ((currentTime - otpTimestamp) > 60000) {
                 // Check if OTP has expired
                 req.session.Data.otp=null;
                return res.render('verifyOTP', { message: 'OTP has expired. Please request a new one.' });
            } else {
                return res.render('verifyOTP', { message: 'Invalid OTP. Please try again.' });
            }
        }

    } catch (error) {
        console.log('Error in OTP verification:', error);
        return res.render('verifyOTP', { message: 'An error occurred during OTP verification. Please try again later.' });
    }
};



const resendOTP = async (req, res) => {
    try {
        // Generate a new OTP
        const newOTP = generateOtp(); // Implement your OTP generation logic here
        const otpTimestamp = Date.now();
      req.session.Data.otpTimestamp=otpTimestamp;

        // Update the session with the new OTP
        req.session.Data.otp = newOTP;
        
        // const saved = req.session.save();

        // Send the new OTP to the user (e.g., via email or SMS)
        console.log(newOTP,"newotp ......");
        console.log(req.session.Data.otp,"otp saved in sessionnnnnnnnnnn");
        // console.log(saved , "saved session ....");
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

        console.log(userData);

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

        console.log(hashedPassword, 'password');
        console.log(userData.password, 'hlooooooooooooo');

        if (hashedPassword) {
            if (userData.is_blocked) {
                return res.render('login', { message: "User has been blocked" });
            }
            req.session.user = userData;
            console.log(req.session.user);
            res.redirect('/home');
        }
        else {
            console.log("home rendering");
            res.render('login', { message: 'Invalid Password' })
        }
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });

    }
}


//---------------------*****Load Home*****---------------------//



// const loadHome = async(req,res)=>{
//     try{

//         // const userData = await User.findById({_id:req.session.user_id});
//         // res.render('home',{user:userData});
//         res.render('home');

//     }
//     catch(error){
//         console.log(error.message);
//     }
// }


const loadHome = async (req, res) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user._id);
            if (user && user.is_blocked) {
                req.session.destroy();
                console.log(user, 'this is the user');
                console.log(user.is_blocked, 'blocked');
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
            return res.status(404).json({ message: "Email not found" })
        }

        const otp = generateOtp();

        req.session.forgotPassword = {
            email: req.body.email,
            otp: otp
        }
        //    req.session.save();

        const sentEmail = await sendForgotPasswordOTP(req.body.email, otp);
        if (sentEmail) {
            // console.log('sentemail');
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
        console.log("otp not get", req.session.forgotPassword.otp);
        console.log(otpEntered);

        const newPassword = req.body.newPassword;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const confirmNewPassword = req.body.confirmNewPassword

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: "Passwords not match" })
        }
        console.log('pass', hashedPassword);
        if (otpEntered === otpStored) {
            const user = await User.findOneAndUpdate(
                { email: req.session.forgotPassword.email },
                { password: hashedPassword },
                { new: true }
            )

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            console.log('email to update', req.session.forgotPassword.email);
            console.log('hashed password', hashedPassword);

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
        res.render('userProfile', { userData, address ,orders});
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}


const addAddress = async (req, res) => {
    try {
        console.log("hello");
       
        console.log(req.body, '...................');
        console.log(req.body.name, 'name...................');
        const { addressType, name, city, homeAddress, landMark, state, pincode, phone, altPhone } = req.body;

        
        const existingAddresses = await Address.findOne({ userId: req.session.user._id });

        
        if (existingAddresses && existingAddresses.address.length >= 3) {
            // return res.status(400).send('You can only have up to 3 addresses.');
            req.flash('error', 'You can only have up to 3 addresses.');
            return res.redirect('/userProfile');
        }


        if (phone === altPhone) {
            req.flash('error', 'Phone and Alternate Phone must be different.');
            return res.redirect('/userProfile');
        }

        
        const pincodeRegex = /^\d{6}$/;
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
        console.log(newAddress, '....nw');
       
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

        res.redirect('/userProfile');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}



// const addAddress = async (req, res) => {
//     try {
//         console.log(req.body.name,'name');

//         // Extract address data from the request body
//         const { addressType, name, city, homeAddress, landMark, state, pincode, phone, altPhone } = req.body;
//         console.log(req.body,'name.................');
//         // Check if the user already has 3 addresses
//         const existingAddresses = await Address.findOne({ userId: req.session.user._id });
//         if (existingAddresses && existingAddresses.address.length >= 3) {
//             req.flash('error', 'You can only have up to 3 addresses.');
//             return res.redirect('/userProfile'); 
//         }

//         // Validate phone and alternate phone
//         if (phone === altPhone) {
//             req.flash('error', 'Phone and Alternate Phone must be different.');
//             return res.redirect('/userProfile'); 
//         }

//         // Validate pincode format (only numbers allowed)
//         const pincodeRegex = /^\d{6}$/;
//         if (!pincodeRegex.test(pincode)) {
//             req.flash('error', 'Pincode must be a 6-digit number.');
//             return res.redirect('/userProfile'); 
//         }

//         // Create a new address object
//         const newAddress = {
//             addressType,
//             name,
//             city,
//             homeAddress,
//             landMark,
//             state,
//             pincode,
//             phone,
//             altPhone
//         };

//         // Update or create the user's addresses
//         if (existingAddresses) {
//             existingAddresses.address.push(newAddress);
//             await existingAddresses.save();
//         } else {
//             const address = new Address({
//                 userId: req.session.user._id,
//                 address: [newAddress]
//             });
//             await address.save();
//         }

//         // Redirect to the user profile page
//         res.redirect('/userProfile');
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send('Internal Server Error');
//     }
// }




const renderEditAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;
        const user = req.session.user;

       
        const address = await Address.findOne({ userId: user._id, 'address._id': addressId });
        console.log(address, '...address');
      
        if (!address) {
            console.log('Address not found');
            return res.status(404).send('Address not found');
        }

        const addressData = address.address.find(addr => addr._id.toString() === addressId);
        console.log(addressData, '.........data');
        
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
        console.log(updatedAddress, 'upadd.....');
        
        const result = await Address.findOneAndUpdate(
            { 'address._id': addressId }, 
            { $set: { 'address.$': updatedAddress } }, 
            { new: true } 
        );

        if (!result) {
            
            console.log('Address not found');
            return res.status(404).send('Address not found');
        }

       
        res.redirect('/userProfile');
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
            console.log('Address not found');
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









// const loadProduct = async (req, res) => {
//     try {
//         const userData = await User.findById(req.session.user_id);
//         const productData = await Product.find({}).limit(12)
//         const categoryData = await Category.find({});
//         // console.log(productData,'pdtdata........................');
//         // console.log(userData,'userdata........................');
//         res.render('home', { user: userData, product: productData, category: categoryData })


//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };


// const loadIndividualProduct = async (req, res) => {
//     try {

//         const id = req.query.id;
//         const userData = await User.findById(req.session.user_id);
//         const productData = await Product.findById({ _id: id, is_listed:true });
//         const categoryData = await Category.find({});
//         console.log(productData, 'id.........................');
//         if (productData) {
//             res.render('productDetails', {
//                 product: productData,
//                 user: userData,
//                 category: categoryData
//             })
//         }
//         else {
//             res.redirect('/home')
//         }
//     }
//     catch (error) {
//         console.log(error.message);
//         res.status(500).send("Internal Server Error");
//     }
// }



// const loadShop = async (req, res) => {
//     try {
//         const userData = await User.findById(req.session.user_id);
//         const productData = await Product.find({}).limit(12)
//         const categoryData = await Category.find({});
//         // console.log(productData,'pdtdata........................');
//         // console.log(userData,'userdata........................');
//         res.render('shop', { user: userData, product: productData, category: categoryData })


//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };










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
   
    userProfile,
    addAddress,
    renderEditAddress,
    editAddress,
    deleteAddress,
    checkEmailExists
  




}