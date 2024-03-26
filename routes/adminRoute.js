const express = require('express');
const admin_route = express();
const session = require("express-session");
const config = require('../config/config');
const multer = require("multer");
const path = require("path");
const fs = require('fs');




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/productAssets");
  },
  filename: (req, file, cb) => {
    cb(
      null, file.originalname 
    );
  },
});

const upload = multer({ storage: storage });

admin_route.use(session({ secret: config.sessionSecret }))

const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

const adminController = require("../controllers/adminController");
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
// const productController = require("../controllers/productController");

// const auth = require('../middleware/adminAuth')

admin_route.get('/', adminController.loadLogin);
admin_route.get('/adminLogin', adminController.adminLogout)
admin_route.post('/', adminController.verifyAdmin);

admin_route.get('/home', adminController.loadDashboard);

admin_route.get('/users', adminController.loadUsers)
admin_route.get("/users/edit", adminController.editUser);
admin_route.post("/users/edit", adminController.edit_User);
admin_route.get("/users/delete", adminController.delete_User);

admin_route.get('/products', adminController.loadProducts)

admin_route.get("/products/add-product", adminController.addProduct);
admin_route.post("/add-product", upload.array("ProductImage", 4), adminController.add_Product);

admin_route.get('/products/edit-product', adminController.editProduct);
admin_route.post("/products/edit-product",upload.array("ProductImage", 4),adminController.edit_product);
admin_route.post("/products/editproductImagePOST", upload.single("ProductImage"), adminController.editproductImagePOST);
admin_route.get("/delete-product/:productId", adminController.deleteProduct);


admin_route.get('/order', orderController.loadOrder);
admin_route.get('/orderDetails', orderController.loadOrderDetail);
admin_route.post("/orderSave", orderController.saveOrder)


admin_route.get('/category', adminController.loadCategory);
admin_route.post('/category', adminController.createCategory);
admin_route.get('/category/edit/:id', adminController.editCategory);
admin_route.post('/category/edit/:id', adminController.edit_Category);
admin_route.get("/category/delete", adminController.deleteCategory);


admin_route.get("/coupon",couponController.loadCouponPage);
admin_route.get("/addCoupon",couponController.loadAddCoupon);
admin_route.post("/addCoupon",couponController.addCoupon);
admin_route.post("/coupon-block",couponController.blockCoupon);
admin_route.get("/coupon-edit",couponController.loadEditCoupon);
admin_route.post("/editCoupon",couponController.editCoupon);


admin_route.get("/sales",adminController.loadSales)
admin_route.get("/salesDate",adminController.dateFilter)
admin_route.get("/date",adminController.sortDate)





admin_route.get('*', function (req, res) {
  res.redirect('/admin')
})


module.exports = admin_route;