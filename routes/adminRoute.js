const express = require('express');
const admin_route =express();

const session = require("express-session");
const config = require('../config/config');

admin_route.use(session({secret:config.sessionSecret}))

const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine' , 'ejs');
admin_route.set('views', './views/admin');

const adminController = require("../controllers/adminController");

// const auth = require('../middleware/adminAuth')

admin_route.get('/',adminController.loadLogin);
admin_route.get('/adminLogin',adminController.adminLogout)

admin_route.post('/',adminController.verifyAdmin);

admin_route.get('/home',adminController.loadDashboard);

admin_route.get('/users',adminController.loadUsers)

admin_route.get("/users/edit", adminController.editUser);
admin_route.post("/users/edit", adminController.edit_User);

// admin_route.get("/users/delete", adminController.delete_User);

admin_route.get('/products',adminController.loadProducts)



admin_route.get('*',function(req,res){
    res.redirect('/admin')
} )


module.exports = admin_route;