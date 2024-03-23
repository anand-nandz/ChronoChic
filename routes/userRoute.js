const express = require("express");
const user_route = express();
// const session = require('express-session');
const config = require('../config/config')

// user_route.use(session({secret:config.sessionSecret}))

const auth = require('../middleware/auth');


user_route.set('view engine', 'ejs');

user_route.set('views', './views/users')

const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const checkoutController = require("../controllers/checkoutController")
const couponController = require('../controllers/couponController');

user_route.get('/', auth.isBlocked, (req, res) => {
    res.render('landingpage');
});

user_route.get('/login', (req, res) => {
    res.render('login', { messages: req.flash('error') });
});

user_route.get('/login', auth.checkAuth, userController.loadLogin);
user_route.post('/login', userController.verifyLogin);

user_route.get('/register', userController.loadRegister);
user_route.post('/register', userController.insertUser);

user_route.get('/verifyOTP', userController.loadOtp);
user_route.post('/verifyOTP', userController.getOtp);
user_route.post('/resendOTP', userController.resendOTP);


user_route.get('/', auth.checkAuth, auth.isBlocked, userController.loadHome);
user_route.get('/landingpage', auth.checkAuth, userController.logout)

user_route.get('/forgotPassword', userController.loadForgotPassword);
user_route.post('/forgotPassword', userController.forgotPassword);

user_route.post('/checkEmailExists',userController.checkEmailExists);

user_route.get('/resetPassword', userController.loadPasswordReset)
user_route.post('/resetPassword', userController.passwordReset)


user_route.get('/userProfile', auth.checkAuth, userController.userProfile)
user_route.post('/userProfile', auth.checkAuth, userController.addAddress);
user_route.get('/orders',auth.checkAuth,userController.orders);
user_route.get('/edit-address', auth.checkAuth, userController.renderEditAddress);
user_route.post('/edit-address/:addressId', auth.checkAuth, userController.editAddress);
user_route.post('/delete-address/:addressId', userController.deleteAddress);


user_route.get('/home', auth.checkAuth, auth.isBlocked, productController.loadProduct);
user_route.get('/productDetails', auth.checkAuth, auth.isBlocked, productController.loadIndividualProduct);
user_route.get('/showproduct', productController.loadProduct);
user_route.get('/shop', auth.checkAuth, auth.isBlocked,productController.loadShop);
user_route.post('/search',productController.searchProducts)


user_route.get("/cart", auth.checkAuth, auth.isBlocked,cartController.loadCartpage);
user_route.post("/addCartLoad",auth.checkAuth, auth.isBlocked, cartController.loadCart)
user_route.post('/cartadd', auth.checkAuth, auth.isBlocked, cartController.increment);
user_route.post('/decrement', auth.checkAuth, auth.isBlocked, cartController.decrement);
user_route.post('/pro-del', auth.checkAuth, auth.isBlocked, cartController.removeCart);

user_route.get('/checkout', auth.checkAuth, auth.isBlocked, checkoutController.loadCheckOut);
user_route.get('/checkOutPage', auth.checkAuth, auth.isBlocked, checkoutController.loadCheckOutPage);
user_route.post('/checkOutData', auth.checkAuth, auth.isBlocked, cartController.addOrder);
user_route.get('/orderPlaced',auth.checkAuth,auth.isBlocked,cartController.loadorderPlaced);
user_route.post("/verify-payment",auth.checkAuth,auth.isBlocked,checkoutController.rezopayment)

user_route.get('/orderView',auth.checkAuth,auth.isBlocked,orderController.loadViewOrder);
user_route.post("/cancelOrder",auth.checkAuth,auth.isBlocked,orderController.cancelOrder);
user_route.post("/cancelReturn",auth.checkAuth,auth.isBlocked,orderController.cancelReturn);
user_route.post("/return",auth.checkAuth,auth.isBlocked,orderController.returnRequest);


user_route.get('/wishlist',auth.checkAuth,auth.isBlocked,productController.loadWishList);
user_route.post('/addToWishlist',auth.checkAuth,auth.isBlocked,productController.addToWishlist);
user_route.post('/removefromWishlist',auth.checkAuth,auth.isBlocked,productController.removeWish)
user_route.post("/removeWish",auth.checkAuth,auth.isBlocked,productController.removeFromWishlist);


user_route.get("/wallet",auth.checkAuth,auth.isBlocked,checkoutController.loadWallet)

user_route.post("/addCash",auth.checkAuth,auth.isBlocked,checkoutController.addWalletCash)

user_route.post("/addAmount",auth.checkAuth,auth.isBlocked,checkoutController.addCash)

user_route.get("/coupon", auth.checkAuth,auth.isBlocked, couponController.loadCoupon);
user_route.post("/applyCoupon",  auth.checkAuth,auth.isBlocked, couponController.applyCoupon);


user_route.get('/pdf',checkoutController.invoice)


module.exports = user_route;