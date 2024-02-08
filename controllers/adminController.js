const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');

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
    res.render("adminlogin")
  }
  catch (error) {
    console.log(error.message);
  }
}

const verifyAdmin = async (req, res) => {
  try {

    const email = req.body.email;
    const password = req.body.password;
    console.log(email);
    console.log(password);
    const userData = await User.findOne({ email: email });
    // console.log(userData);
    if (userData) {

      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        console.log("Yes");
        if (userData.is_admin === 0) {
          console.log("yess");
          res.render('adminlogin', { message: 'Email and password is Incorrect.' });
          console.log(userData);

        }
        else {
          console.log("no");
          // console.log(userData);
          req.session.user_id = userData._id;
          res.redirect('/admin/home')
        }

      }
      else {
        res.render('adminlogin', { message: 'Email and password is Incorrect.' });
      }

    }
    else {
      res.render('adminlogin', { message: 'Email and password is Incorrect.' });
    }

  }
  catch (error) {
    console.log(error.message);
  }
}


const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id })
    res.render('adminhome', { admin: userData });

  }
  catch (error) {
    console.log(error.message);
  }
}






const loadUsers = async (req, res) => {
  try {
    const userData = await User.find({})
    //    console.log(userData)
    res.render('users', { userData })
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
    console.log(userDetails);
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
    const { name, email, mobile, password, verified, status } = req.body;
    //   console.log('hello');
    const updatedUser = await User.findByIdAndUpdate(id, {
      name,
      email,
      mobile,
      password,
      is_verified: verified === '1' ? true : false,
      is_blocked: status === '1' ? false : true, // Assuming status '1' means active and '0' means blocked
    });
    //   console.log(id);

    if (!updatedUser) {
      return res.status(404).send("User not found.");
    }

    // Redirect back to the user list page after updating
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

    // Find and delete the user by ID
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).send("User not found");
    }

    // Redirect to the user list page or render a success message
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




//   const addUser=async(req,res)=>{
//     try {
//       res.render("addUser", {
//         errorMessage: null,
//       });
//     } catch (error) {
//      console.log(error.message);
//     }
//   }







const loadProducts = async (req, res) => {
  try {
    const allProducts = await Product.find({})
    // console.log(allProducts)
    res.render('products', { allProducts })
  } catch (error) {
    console.log(error.message)
  }
}


const addProduct = async (req, res) => {
  try {

    res.render('addProduct');
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
      price: req.body.ProductPrice,
      // offprice: req.body.ProductOffPrice,
      description: req.body.ProductDetails,
      images: images,
      category: req.body.ProductCategory,
      brand: req.body.ProductBrand,
      color: req.body.ProductColor,
      material: req.body.ProductMaterial,
      caseSize: req.body.ProductCaseSize,
      is_listed: req.body.listed === 'true', // Assuming the value of 'listed' is a string 'true' or 'false'
    });

    await newProduct.save();
    console.log(newProduct);
    console.log('product issue');
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    console.log('error in adding images');
    res.status(500).send("Internal Server Error");
  }
};


const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findById(id);

    if (!product) {
      // Handle the case where the product is not found
      return res.status(404).send("Product not found");
    }

    res.render("editProduct", { product });
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
    }

    let existingImages = existingProduct.images || [];
    const newImages = req.files ? req.files.map(file => file.filename) : [];

    
    for (let i = 0; i < Math.min(newImages.length, existingImages.length); i++) {
      existingImages[i] = newImages[i];
    }

    if (newImages.length > existingImages.length) {
      existingImages.push(...newImages.slice(existingImages.length));
    }

    existingImages = existingImages.slice(0, 4);

    const updatedProduct = {
      pname: req.body.ProductName,
      price: req.body.ProductPrice,
      // offprice: req.body.ProductOffPrice,
      description: req.body.ProductDetails,
      category: req.body.ProductCategory,
      brand: req.body.ProductBrand,
      color: req.body.ProductColor,
      images: existingImages,
      material: req.body.ProductMaterial,
      caseSize: req.body.ProductCaseSize,
      is_listed: req.body.listed === 'true'
    };

    await Product.findByIdAndUpdate(productId, updatedProduct);

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};





// const edit_product = async (req, res) => {
//   try {
//       const productId = req.query.id;
//       const existingProduct = await Product.findById(productId);

//       if (!existingProduct) {
//           return res.status(404).send("Product not found.");
//       }

//       let existingImages = existingProduct.images || [];
//       const newImages = req.files ? req.files.map(file => file.filename) : [];

//       // Combine existing and new images, ensuring only 4 images are kept
//     const updatedImages = [...existingImages, ...newImages].slice(0, 4);

//       // Replace existing images with new images
//       // existingImages = newImages;

//       const updatedProduct = {
//           pname: req.body.ProductName,
//           price: req.body.ProductPrice,
//           description: req.body.ProductDetails,
//           category: req.body.ProductCategory,
//           brand: req.body.ProductBrand,
//           color: req.body.ProductColor,
//           images: updatedImages,
//           material: req.body.ProductMaterial,
//           caseSize: req.body.ProductCaseSize,
//           is_listed: req.body.listed === 'true' // Convert string to boolean
//       };

//       await Product.findByIdAndUpdate(productId, updatedProduct);

//       res.redirect("/admin/products");
//   } catch (error) {
//       console.error(error);
//       res.status(500).send("Internal Server Error");
//   }
// };



const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Find the product by ID and remove it
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
    const category = await Category.find();
    console.log(category);
    res.render("category",{category});
     
  } catch (error) {
    console.log(error.message);
  }
};


const createCategory = async (req, res) => {
  try {
    
    if (!req.body.name || !req.body.description) {
      return res.status(400).send("Category name and description are required.");
    }

    
    const newCategory = new Category({
      name: req.body.name.trim(), 
      description: req.body.description.trim(), 
    });


     await newCategory.save();

    res.redirect(`/admin/category`);

    // res.redirect(`/admin/category/${savedCategory._id}`);

    // res.render(`editCategory${savedCategory._id}`)
  } catch (error) {
    
    console.error(error);
    res.status(500).send("Failed to create category. Please try again later.");
  }
};



const editCategory = async (req, res) => {
  try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
      res.render('editCategory', { category });
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
};


const edit_Category = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, status } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name, description, is_blocked: status === 'Unlist' });

    
    if (!updatedCategory) {
      return res.status(404).send('Category not found');
    }

    res.redirect('/admin/category'); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}


// const deleteCategory = async (req, res) => {
//   try {
//     const id = req.query.id;

//     // Find and delete the user by ID
//     const deletedCategory = await Category.findByIdAndDelete(id);

//     if (!deletedCategory) {
//       return res.status(404).send("Category not found");
//     }

//     // Redirect to the user list page or render a success message
//     res.redirect("/admin/category");
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };


const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;

    // Find the category by ID
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Check if the category is listed
    if (!category.is_blocked) {
      return res.status(403).send("Cannot delete an listed category");
    }

    // Delete the category
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).send("Category not found");
    }

    // Redirect to the category list page or render a success message
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
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
  deleteCategory
}