const express = require('express');
const product_route =express();

const session = require("express-session");
const config = require('../config/config');
const multer = require("multer");
const path = require("path");

admin_route.use(session({secret:config.sessionSecret}))

const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine' , 'ejs');
admin_route.set('views', './views/admin');

const productController = require("../controllers/productController");



product_route.get('/products',productController.loadProducts)

product_route.get("/products/add-product", productController.addProduct);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/productAssets"); 
    },
    filename: (req, file, cb) => {
        // cb(null,file.originalname);


      cb(
        null,
        file.fieldname + "_" + Date.now() + path.extname(file.originalname)
      ); // Specify the filename
    },
  });
  
  const upload = multer({ storage: storage });
  
  product_route.post(
    "/add-product",
    upload.array("ProductImage", 5),
    productController.add_Product
  );
  

  product_route.get('*',function(req,res){
    res.redirect('/admin')
} )


module.exports = product_route;
