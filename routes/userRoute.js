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
    res.render('home')
});

user_route.get('/login',userController.loadLogin)

user_route.get('/register',userController.loadRegister)
user_route.post('/register',userController.insertUser);

user_route.get('/verifyOTP',userController.loadOtp);
user_route.post('/verifyOTP',userController.getOtp)









// user_route.get('/register',auth.isLogout,userController.loadRegister);

// user_route.post('/register',userController.insertUser);

// user_route.get('/',auth.isLogout,userController.loginLoad);
// user_route.get('/login',auth.isLogout,userController.loginLoad);

// user_route.post('/login',userController.verifyLogin);

// user_route.get('/home',auth.isLogin,userController.loadHome);

// user_route.get('/logout',auth.isLogin,userController.userLogout)

// user_route.get('/edit',auth.isLogin,userController.editLoad);

// user_route.post('/edit',userController.updateProfile)

module.exports = user_route;