const express = require("express");
const user_route = express();
// const session = require('express-session');
const config = require('../config/config')

// user_route.use(session({secret:config.sessionSecret}))

const auth =  require ('../middleware/auth');


user_route.set('view engine','ejs');

user_route.set('views','./views/users')

const userController = require('../controllers/userController');

user_route.get('/',(req,res)=>{
    req.session.hi="hello"
    req.session.save()



    console.log(req.session);
    res.render('landingpage')
});
user_route.get('/login', (req, res) => {
    res.render('login', { messages: req.flash('error') }); // Pass flash messages to the view
});

user_route.get('/login',userController.loadLogin);
user_route.post('/login',userController.verifyLogin);

user_route.get('/register',userController.loadRegister);
user_route.post('/register',userController.insertUser);

user_route.get('/verifyOTP',userController.loadOtp);
user_route.post('/verifyOTP',userController.getOtp);

user_route.get('/',userController.loadHome);
user_route.get('/landingpage',userController.logout)

user_route.get('/forgotPassword',userController.loadForgotPassword);
user_route.post('/forgotPassword',userController.forgotPassword);
// user_route.get('/verifyOTP',userController.loadForgotOTP);
user_route.get('/resetPassword',userController.loadPasswordReset)
user_route.post('/resetPassword',userController.passwordReset)

user_route.get('/home',userController.loadProduct);
user_route.get('/productDetails',userController.loadIndividualProduct);


module.exports = user_route;