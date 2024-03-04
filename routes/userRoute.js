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

// user_route.get('/',(req,res)=>{
//     req.session.hi="hello"
//     req.session.save()
//     // console.log(req.session);
//     res.render('landingpage')
// });

user_route.get('/', auth.isBlocked, (req, res) => {
    // req.session.hi = "hello";
    // req.session.save();
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
user_route.get('/edit-address', auth.checkAuth, userController.renderEditAddress);
user_route.post('/edit-address/:addressId', auth.checkAuth, userController.editAddress);
user_route.post('/delete-address/:addressId', userController.deleteAddress);


user_route.get('/home', auth.checkAuth, auth.isBlocked, productController.loadProduct);
user_route.get('/productDetails', auth.checkAuth, auth.isBlocked, productController.loadIndividualProduct);
user_route.get('/showproduct', productController.loadProduct);
user_route.get('/shop', auth.checkAuth, auth.isBlocked,productController.loadShop);


user_route.get("/cart", auth.checkAuth, auth.isBlocked,cartController.loadCartpage);
user_route.post("/addCartLoad",auth.checkAuth, auth.isBlocked, cartController.loadCart)
user_route.post('/cartadd', auth.checkAuth, auth.isBlocked, cartController.increment);
user_route.post('/decrement', auth.checkAuth, auth.isBlocked, cartController.decrement);
user_route.post('/pro-del', auth.checkAuth, auth.isBlocked, cartController.removeCart);

user_route.get('/checkout', auth.checkAuth, auth.isBlocked, cartController.loadCheckOut);
user_route.get('/checkOutPage', auth.checkAuth, auth.isBlocked, cartController.loadCheckOutPage);
user_route.post('/checkOutData', auth.checkAuth, auth.isBlocked, cartController.addOrder);
user_route.get('/orderPlaced',auth.checkAuth,auth.isBlocked,cartController.loadorderPlaced)

user_route.get('/orderView',auth.checkAuth,auth.isBlocked,orderController.loadViewOrder);
user_route.post("/cancelOrder",auth.checkAuth,auth.isBlocked,orderController.cancelOrder)


module.exports = user_route;