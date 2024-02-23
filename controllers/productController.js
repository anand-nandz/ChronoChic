const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Address = require("../models/addressModel");
const { use } = require("../routes/userRoute");

  
  
const loadProduct = async (req, res) => {
  try {
      const userData = await User.findById(req.session.user_id);
      const productData = await Product.find({is_listed:true}).limit(12)
      const categoryData = await Category.find({});
      // console.log(productData,'pdtdata........................');
      // console.log(userData,'userdata........................');
      
        res.render('home', { user: userData, product: productData, category: categoryData })
      
      


  } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
  }
};


const loadIndividualProduct = async (req, res) => {
  try {

      const id = req.query.id;
      const userData = await User.findById(req.session.user_id);
      const productData = await Product.findById({ _id: id, is_listed:true });
      const categoryData = await Category.find({});

      const category = categoryData.find(cat => cat._id.toString() === productData.category.toString());

      console.log(categoryData, 'id.........................');
      if (productData) {
          res.render('productDetails', {
              product: productData,
              user: userData,
              category: category.name
          })
      }
      else {
          res.redirect('/home')
      }
  }
  catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
  }
}



const loadShop = async (req, res) => {
  try {
      const userData = await User.findById(req.session.user_id);
      const productData = await Product.find({}).limit(12)
      const categoryData = await Category.find({});
      // console.log(productData,'pdtdata........................');
      // console.log(userData,'userdata........................');
      res.render('shop', { user: userData, product: productData, category: categoryData })


  } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
  }
};



  
  
  module.exports = {
    loadProduct,
    loadIndividualProduct,
    loadShop
  
  }