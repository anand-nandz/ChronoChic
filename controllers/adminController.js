const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");
const Chart = require("chart.js")

const { body, validationResult } = require('express-validator');
// const flash = require('connect-flash');
const flash = require('express-flash');

const fs = require('fs');
const path = require('path');


const bcrypt = require("bcrypt");
// const config = require('../config/config');

const securePassword = async (password) => {

  try {

    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;

  }
  catch (error) {
    console.log(error.message);
  }

}


const loadLogin = async (req, res) => {
  try {
    // Pass flash messages to the admin login page
    const messages = req.flash('error');
    res.render("adminlogin", { messages });
  } catch (error) {
    console.log(error.message);
  }
}

const verifyAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash('error', 'Email and password are required');
      return res.redirect('/admin');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash('error', 'Please enter a valid email address');
      return res.redirect('/admin');
    }

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin === 0) {
          req.flash('error', 'You are not an admin');
          return res.redirect('/admin');
        } else {
          req.session.user_id = userData._id;
          return res.redirect('/admin/home');
        }
      } else {
        req.flash('error', 'Email and password are incorrect.');
        return res.redirect('/admin');
      }
    } else {
      req.flash('error', 'Email and password are incorrect.');
      return res.redirect('/admin');
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id })
    const yValues = [0, 0, 0, 0, 0, 0, 0]
    const order = await Order.find({
      status: { $nin: ["Order Confirmed", "Processing", "Product Dispatched", "Canceled", "Shipped", "Returned", "Return Process", "Payment Failed"] },
    });
    // console.log(order,"order in dashboard");


    // to find the total products ordered

    const totalProductCount = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalCount: { $sum: "$items.quantity" }
        }
      },
      {
        $group: {
          _id: null,
          totalProductCount: { $sum: "$totalCount" }
        }
      }
    ]);

    const totalCount = totalProductCount.length > 0 ? totalProductCount[0].totalProductCount : 0;


    //////////////////************************** Top Selling Products  ***************************//////////////////



    const topSellingProducts = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: "$productDetails._id",
          pname: "$productDetails.pname",
          totalQuantity: 1,
          images: "$productDetails.images",
          brand: "$productDetails.brand"
        },
      },
    ]);


    //////////////////************************** Top Selling Categories  ***************************//////////////////


    const topSellingCategories = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalSales: { $sum: "$items.quantity" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          name: "$category.name",
          totalSales: 1,
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);



    //////////////////************************** Top Selling Brands  ***************************//////////////////


    const topSellingBrands = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.brand",
          totalSales: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);





    for (let i = 0; i < order.length; i++) {
      const date = order[i].createdAt
      console.log(date, "date");
      const value = date.getDay()
      console.log(value, "value get");
      yValues[value] += order[i].totalAmount
    }

    const allData = await Category.find({})

    const sales = []

    for (let i = 0; i < allData.length; i++) {
      sales.push(0)
    }


    const allName = allData.map((x) => x.name)
    const allId = allData.map((x) => x._id)



    let productId = []
    let quantity = []

    for (let i = 0; i < order.length; i++) {
      for (let j = 0; j < order[i].items.length; j++) {
        productId.push(order[i].items[j].productId)
        quantity.push(order[i].items[j].quantity)
      }
    }
  

    const productData = []
    for (let i = 0; i < productId.length; i++) {
      productData.push(await Product.findById({ _id: productId[i] }))
    }


    for (let i = 0; i < productData.length; i++) {

      for (let j = 0; j < allId.length; j++) {
        
        if (allId[j] == productData[i].category.toString()) {

          sales[j] += quantity[i]
        }
      }

    }
   

    let productSales = [];

    for (let i = 0; i < productId.length; i++) {
      productSales.push({ salesCount: 1 });
    }

    for (let i = 0; i < productId.length; i++) {
      for (let j = i + 1; j < productId.length; j++) {
        if (productId[i].toString() == productId[j].toString()) {
          productSales[i].salesCount += 1;
        }
      }
    }


    const month = await Order.aggregate([
      {
        $project: {
          _id: { $dateToString: { format: "%m-%Y", date: "$createdAt" } },
          totalAmount: 1
        }
      },
      {
        $group: {
          _id: "$_id",
          totalEarnings: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);


    let months = ["01-2024", "02-2024", "03-2024", "04-2024", "05-2024", "06-2024", "07-2024", "08-2024", "09-2024", "10-2024", "11-2024", "12-2024"];
    let array = new Array(months.length).fill(0); // Initialize array with zeros

    for (let i = 0; i < months.length; i++) {
      for (let j = 0; j < month.length; j++) {
        if (month[j]._id == months[i]) {
          array[i] += month[j].totalEarnings;
        }
      }
    }



    const orderData = await Order.find({ status: "Delivered" });
    let sum = 0;
    for (let i = 0; i < orderData.length; i++) {
      sum = sum + orderData[i].totalAmount;
    }
    const product = await Product.find({});
    const category = await Category.find({});
    
    if (order.length > 0) {
      const month = await Order.aggregate([
        { $match: { status: "Delivered" } },
        {
          $addFields: {
            orderDate: {
              $dateFromString: { dateString: "$orderDate", format: "%d-%m-%Y" },
            },
          },
        },
        {
          $addFields: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
          },
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            totalEarnings: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);


      const dailyEarnings = await Order.aggregate([
        { $match: { status: "Delivered" } },
        {
          $addFields: {
            orderDate: {
              $dateFromString: { dateString: "$orderDate", format: "%d-%m-%Y" },
            },
          },
        },
        {
          $addFields: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" },
            day: { $dayOfMonth: "$orderDate" },
          },
        },
        {
          $group: {
            _id: { year: "$year", month: "$month", day: "$day" },
            totalEarnings: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);




      const proLength = product.length;
      const catLength = category.length;
      const orderLength = order.length;
      res.render("adminhome", {
        sum,
        proLength,
        topSellingProducts,
        sales,
        catLength,
        orderLength,
        month,
        yValues,
        dailyEarnings,
        topSellingCategories,
        totalCount,
        topSellingBrands,
        allName,
        array

      });
    } else {
      const proLength = product.length;
      const catLength = category.length;
      const orderLength = order.length;
      const month = null;
      const dailyEarnings = null;
      res.render("adminhome", {
        sum,
        proLength,
        topSellingProducts,
        catLength,
        orderLength,
        month,
        sales,
        yValues,
        dailyEarnings,
        topSellingCategories,
        totalCount,
        topSellingBrands,
        allName,
        array
      });
    }

  }
  catch (error) {
    console.log(error.message);
  }
}


const loadUsers = async (req, res) => {
  try {
    // const userData = await User.find({})
    const perPage = 6;
    let page = parseInt(req.query.page) || 1;

    const totalUsers = await User.countDocuments({});
    const totalPage = Math.ceil(totalUsers / perPage);

    if (page < 1) {
      page = 1;
    } else if (page > totalPage) {
      page = totalPage;
    }

    const startSerialNumber = (page - 1) * perPage + 1;

    const userData = await User.find({})
      .sort({ _id: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    res.render('users', { userData, page, totalPage, startSerialNumber, perPage })
  } catch (error) {
    console.log(error.message)
  }
}


const editUser = async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).send("User ID is missing in the request.");
    }

    const userDetails = await User.findById(id);

    if (!userDetails) {
      return res.status(404).send("User not found.");
    }
    res.render("editUser", { userDetails, errorMessage: null });
  }
  catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};






const edit_User = async (req, res) => {
  try {
    const id = req.query.id;
    const { name, email, mobile, password, verified, status, dob, gender } = req.body;
    //   console.log('hello');
    const updatedUser = await User.findByIdAndUpdate(id, {
      name,
      email,
      mobile,
      password,
      dob,
      gender,
      is_verified: verified === '1' ? true : false,
      is_blocked: status === '1' ? false : true,
    });
    
    req.session.save();
  

    if (!updatedUser) {
      return res.status(404).send("User not found.");
    }

    res.redirect('/admin/users');
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const adminLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/admin');
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging out" });
  }
};



const delete_User = async (req, res) => {
  try {
    const id = req.query.id;


    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).send("User not found");
    }

    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




const loadProducts = async (req, res) => {
  try {
    const perPage = 5;
    let page = parseInt(req.query.page) || 1;

    const totalProducts = await Product.countDocuments({});
    const totalPage = Math.ceil(totalProducts / perPage);

    if (page < 1) {
      page = 1;
    } else if (page > totalPage) {
      page = totalPage;
    }

    const startSerialNumber = (page - 1) * perPage + 1;

    const allProducts = await Product.find({})
      .sort({ _id: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);



    const categories = await Category.find({ is_blocked: false });

    res.render('products', { allProducts, categories, totalPage, page, startSerialNumber });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}







const addProduct = async (req, res) => {
  try {
    const categories = await Category.find({ is_blocked: false });
    res.render('addProduct', { categories });
  }
  catch (error) {
    console.log(error.message);
  }
}

const add_Product = async (req, res) => {
  try {
    const images = req.files.map((file) => file.filename);
    const newProduct = new Product({
      pname: req.body.ProductName,
      price: parseFloat(req.body.ProductPrice),
      offprice: parseFloat(req.body.ProductOffPrice),
      discountPercentage: parseInt(req.body.DiscountPercentage),
      description: req.body.ProductDetails,
      images: images,
      category: req.body.ProductCategory,
      brand: req.body.ProductBrand,
      color: req.body.ProductColor,
      countInStock: parseInt(req.body.ProductStock),
      material: req.body.ProductMaterial,
      caseSize: req.body.ProductCaseSize,
      is_listed: req.body.listed === 'true',
    });

    await newProduct.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findById(id);
    const categories = await Category.find({ is_blocked: false });
    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("editProduct", { product, categories });
  }

  catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const edit_product = async (req, res) => {
  try {

    const productId = req.query.id;
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).send("Product not found.");
    } else {
      const updatedCategory = req.body.ProductCategory;

      const updatedProduct = {
        pname: req.body.ProductName,
        price: parseFloat(req.body.ProductPrice),
        offprice: parseFloat(req.body.ProductOffPrice),
        discountPercentage: parseInt(req.body.DiscountPercentage),
        description: req.body.ProductDetails,
        category: updatedCategory,
        brand: req.body.ProductBrand,
        color: req.body.ProductColor,
        material: req.body.ProductMaterial,
        countInStock: parseInt(req.body.ProductStock),
        caseSize: req.body.ProductCaseSize,
        is_listed: req.body.listed === 'true'
      };

      const data = await Product.findByIdAndUpdate(productId, updatedProduct);
      res.redirect("/admin/products");
    }

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error ...........");
  }
};


const editproductImagePOST = async (req, res) => {
  try {

    const image = req.body.imagename;
    const index = parseInt(req.body.index);
    const productID = req.body.productID;

    if (image) {
      const productDetails = await Product.findOne({ _id: productID });

      productDetails.images.splice(index, 1, image);

      await productDetails.save();

      res.json({ status: "okay" })
    } else {
      res.json({ status: "oops" })
    }
  } catch (error) {
    console.log(error);
  }
}


const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const result = await Product.deleteOne({ _id: productId });

    if (result) {
      res.redirect("/admin/products");
    } else {
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const loadCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    const messages = req.flash('error');
    const successMessages = req.flash('success');

    res.render("category", { categories, messages, successMessages });

  } catch (error) {
    console.log(error.message);
  }
};




const createCategory = async (req, res) => {
  try {

    const { name, description } = req.body;

    var nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    if (!nameRegex.test(name)) {
      req.flash("error", "Category Name must contain only characters with spaces between names.");
      return res.redirect('/admin/category');
    }


    if (!name || !name.trim()) {

      req.flash('error', 'Category name cannot be empty or contain only spaces.');
      return res.redirect('/admin/category');
    }

    const existingCategory = await Category.findOne({ name: name.trim() });

    if (existingCategory) {
      req.flash('error', 'Category name already exists.');
      return res.redirect('/admin/category');
    }
    else {
      const newCategory = new Category({
        name: name.trim().toLowerCase(),
        description: description.trim()
      });


      await newCategory.save();
      req.flash('success', 'Category created successfully.');
      return res.redirect('/admin/category');
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create category. Please try again later." });
  }
}



const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    const messages = req.flash('error');
    const successMessages = req.flash('success');
    res.render('editCategory', { category, messages, successMessages });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load category for editing.');

    res.status(500).send('Internal Server Error');
  }
};


const edit_Category = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, status } = req.body;
    var nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    if (!nameRegex.test(name)) {
      req.flash("error", "Category Name must contain only characters with spaces between names.");
      return res.redirect('/admin/category/edit/' + categoryId);
    }
    if (!name || !name.trim()) {
      req.flash('error', 'Category name cannot be empty.');
      return res.redirect('/admin/category/edit/' + categoryId);
    }
    if (!description || !description.trim()) {
      req.flash('error', 'Category description cannot be empty.');
      return res.redirect('/admin/category/edit/' + categoryId);
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name, description, is_blocked: status === 'Unlist' });

    if (!updatedCategory) {
      req.flash('error', 'Category not found.');
      return res.redirect('/admin/category');
    } else {
      req.flash('success', 'Category updated successfully.');
      res.redirect('/admin/category');
    }


  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update category.');
    res.redirect('/admin/category');
  }
}


const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).send("Category not found");
    }


    if (!category.is_blocked) {
      return res.status(403).send("Cannot delete an listed category");
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).send("Category not found");
    }

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




const loadCategoryOffer = async (req, res) => {
  try {
    const findCat = await Category.find({ is_blocked: false });

    for (let i = 0; i < findCat.length; i++) {
      if (findCat[i].offer && new Date(findCat[i].offer.endDate) < new Date()) {
        findCat[i].offer = undefined;
        await findCat[i].save();
      }
    }

    res.render("offerCategory", { findCat });
  } catch (error) {
    console.log(error.message);
  }
};


const addOfferLoad=async(req,res)=>{
  try {
      const catData = await Category.find({
          is_blocked: false,
          $or: [
              { offer: { $exists: false } }, 
              { offer: false }    
          ]
      });
      res.render("addOffer",{catData})
  } catch (error) {
     console.log(error.message) 
  }
}


const addOffer = async (req, res) => {
  try {
    const { discount, startDate, endDate, catname } = req.body;

    const findCat = await Category.findOne({ name: catname });

    if (findCat.offer) {
      const currentDateTime = new Date();
      const offerEndDate = new Date(findCat.offer.endDate);

      if (currentDateTime > offerEndDate) {
        findCat.offer = undefined;
        await findCat.save();
      }
    }

    const updateCat = await Category.findByIdAndUpdate(
      { _id: findCat._id },
      {
        $set: {
          offer: {
            discount: discount,
            startDate: startDate,
            endDate: endDate,
          },
        },
      }
    );

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: false, error: error.message });
  }
};



const deleteOffer=async(req,res)=>{
  try {
      const id=req.body.id
      const findCat=await Category.findByIdAndUpdate({_id:id},{
          $unset:{offer:""}
      })

      res.json({status:true})
  } catch (error) {
      console.log(error.message)
  }
}


const loadSales = async (req, res) => {
  try {
    const order = await Order.find({
      status: { $in: ["Delivered"] },

    }).sort({ _id: -1 });
    
    res.render("adminSales", { order });
  } catch (error) {
    console.log(error.message);
  }
};



const dateFilter = async (req, res) => {
  try {
    const date = req.query.value;
    const date2 = req.query.value1;
    
    const parts = date.split("-");
    const parts1 = date2.split("-");

    const day = parseInt(parts[2], 10);
    const day1 = parseInt(parts1[2], 10);

    const month = parseInt(parts[1], 10);
    const month1 = parseInt(parts1[1], 10);

    const rotatedDate = day + "-" + month + "-" + parts[0];
    const rotatedDate1 = day1 + "-" + month1 + "-" + parts1[0];

    const order = await Order.find({
      status: { $in: ["Delivered"] },
      orderDate: {
        $gte: rotatedDate,
        $lte: rotatedDate1
      }
    }).sort({ _id: -1 });

    res.render("adminSales", { order });
  } catch (error) {
    console.log(error.message);
  }
};




const sortDate = async (req, res) => {
  try {
    const sort = req.query.value;
    let orderDateQuery = {};

    const currentDate = new Date();

    const currentDateString = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`
    if (sort === "Day") {

      orderDateQuery = currentDateString;
    } else if (sort === "Week") {
      const firstDayOfWeek = new Date(currentDate);
      firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
      const lastDayOfWeek = new Date(currentDate);
      lastDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6); 
      const firstDayOfWeekString = `${firstDayOfWeek.getDate()}-${firstDayOfWeek.getMonth() + 1}-${firstDayOfWeek.getFullYear()}`;
      const lastDayOfWeekString = `${lastDayOfWeek.getDate()}-${lastDayOfWeek.getMonth() + 1}-${lastDayOfWeek.getFullYear()}`;
      orderDateQuery = {
        $gte: firstDayOfWeekString,
        $lte: lastDayOfWeekString
      };
    } else if (sort === "Month") {
      orderDateQuery = {
        $regex: `-${currentDate.getMonth() + 1}-`
      };
    } else if (sort === "Year") {
      orderDateQuery = {
        $regex: `-${currentDate.getFullYear()}$`
      };
    }

    const order = await Order.find({
      status: { $nin: ["Ordered", "Canceled", "Shipped"] },
      orderDate: orderDateQuery
    }).sort({ _id: -1 });


    res.render("adminSales", { order });
  } catch (error) {
    console.log(error.message);
  }
};











module.exports = {
  loadLogin,
  verifyAdmin,
  securePassword,
  loadDashboard,
  loadUsers,
  editUser,
  edit_User,
  adminLogout,
  delete_User,
  loadProducts,
  addProduct,
  add_Product,
  editProduct,
  edit_product,
  deleteProduct,
  loadCategory,
  createCategory,
  editCategory,
  edit_Category,
  deleteCategory,
  editproductImagePOST,
  loadSales,
  dateFilter,
  sortDate,
  loadCategoryOffer,
  addOfferLoad,
  addOffer,
  deleteOffer

}