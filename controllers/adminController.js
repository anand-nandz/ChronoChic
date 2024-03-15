const User = require("../models/userModel");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
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



// const loadLogin = async (req, res) => {
//   try {
//     res.render("adminlogin")
//   }
//   catch (error) {
//     console.log(error.message);
//   }
// }

// const verifyAdmin = async (req, res) => {
//   try {

//     // const email = req.body.email;
//     // const password = req.body.password;
//     const { email, password } = req.body;
//     console.log(email);
//     console.log(password);
//     if (!email || !password) {
//       req.flash('error', 'Email and password are required')
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       req.flash('error', 'Please enter a valid email address');
//       return res.redirect('/adminlogin');
//     }

//     const userData = await User.findOne({ email: email });
//     if(!userData){
//       req.flash('error', "You are not an admin");
//       return res.redirect('/adminlogin')
//     }
//     if (userData) {
//       const passwordMatch = await bcrypt.compare(password, userData.password);
//       if (passwordMatch) {    
//         if (userData.is_admin === 0) {         
//           res.render('adminlogin', { message: 'Email and password is Incorrect.' });
//           console.log(userData);
//         }
//         else {
//           console.log("no");
//           // console.log(userData);
//           req.session.user_id = userData._id;
//           res.redirect('/admin/home')
//         }
//       }
//       else {
//         res.render('adminlogin', { message: 'Email and password is Incorrect.' });
//       }

//     }
//     else {
//       res.render('adminlogin', { message: 'Email and password is Incorrect.' });
//     }

//   }
//   catch (error) {
//     console.log(error.message);
//   }
// }



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
    console.log('req.body:', req.body);
    console.log('updatedUser:', updatedUser);
    req.session.save();
    console.log(updatedUser, 'this is user');
    //   console.log(id);

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
    console.log('hi.........');
    const images = req.files.map((file) => file.filename);
    console.log(req.body.ProductName);
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
    console.log(newProduct);
    // console.log('product issue not found');
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
    console.log(product.images);
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
    console.log(req.body);
    console.log("loggged edit");
    const productId = req.query.id;
    console.log(productId, "idd");
    const existingProduct = await Product.findById(productId);
console.log(existingProduct,"existing");
    if (!existingProduct) {
      return res.status(404).send("Product not found.");
    } else {
      console.log("else inside");
      const updatedCategory = req.body.ProductCategory;



      console.log(req.body.ProductName);  
      console.log(req.body.ProductPrice);
      console.log(req.body.ProductOffPrice);
      console.log(req.body.DiscountPercentage);
      console.log(req.body.ProductDetails);
      console.log(req.body.ProductBrand);
      console.log(req.body.ProductColor);
      console.log(req.body.ProductMaterial);
      console.log(req.body.ProductStock);
      console.log(updatedCategory);
      console.log(req.body.ProductCaseSize);






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
      console.log(data,'saved');
      res.redirect("/admin/products");
    }

    // let existingImages = existingProduct.images || [];
    // const newImages = req.files ? req.files.map(file => file.filename) : [];


    // for (let i = 0; i < Math.min(newImages.length, existingImages.length); i++) {
    //   existingImages[i] = newImages[i];
    // }

    // if (newImages.length > existingImages.length) {
    //   existingImages.push(...newImages.slice(existingImages.length));
    // }

    // existingImages = existingImages.slice(0, 4);


  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error ...........");
  }
};


const editproductImagePOST = async (req, res) => {
  try {
    console.log(req.file);
    const image = req.body.imagename;
    const index = parseInt(req.body.index);
    const productID = req.body.productID;
    console.log(image , index , productID);

    if (image) {
      const productDetails = await Product.findOne({ _id: productID });
      console.log(productDetails.images);
      productDetails.images.splice(index, 1, image);
      console.log(productDetails.images);
      await productDetails.save();
      console.log(productDetails.images);
      res.json({ status: "okay" })
    } else {
      res.json({ status: "oops" })
    }
  } catch (error) {
    console.log(error);
  }
}

// const editProduct = async (req, res) => {
//   try {
//       const id = req.query.id;
//       const image = req.query.delete;

//       if (image) {
//           const product = await Product.findById(id);
//           const index = product.images.indexOf(image);

//           if (index > -1) {
//               await Product.findByIdAndUpdate(id, { $unset: { [`images.${index}`]: 1 } });
//               await Product.findByIdAndUpdate(id, { $pull: { images: null } });
//               return res.status(200).send("Image deleted successfully");
//           } else {
//               return res.status(404).send("Image not found in the array");
//           }
//       }

//       const product = await Product.findById(id);
//       const categories = await Category.find({ is_blocked: false });

//       if (!product) {
//           return res.status(404).send("Product not found");
//       }

//       res.render("editProduct", { product, categories });
//   } catch (error) {
//       console.error(error);
//       res.status(500).send("Internal Server Error");
//   }
// };

// const edit_product = async (req, res) => {
//   try {
//     const productId = req.query.id;
//     const existingProduct = await Product.findById(productId);

//     if (!existingProduct) {
//       return res.status(404).send("Product not found.");
//     }

//     let existingImages = existingProduct.images || [];
//     const newImages = req.files ? req.files.map(file => file.filename) : [];

//     // Remove images based on index
//     const removeIndices = req.body.remove_image || [];
//     removeIndices.forEach(index => {
//       existingImages.splice(index, 1);
//     });

//     // Handle image deletion based on image name
//     const deletedImageName = req.query.delete;
//     if (deletedImageName) {
//       const index = existingImages.indexOf(deletedImageName);
//       if (index !== -1) {
//         // Delete the existing image file
//         fs.unlinkSync(path.join(__dirname, 'public', 'productAssets', deletedImageName));
//         existingImages.splice(index, 1);
//       }
//     }

//     // Replace image if provided
//     const imageToReplaceIndex = req.body.imageToReplace;
//     if (imageToReplaceIndex !== undefined && req.file) {
//       // Delete the existing image
//       const imageToReplace = existingImages[imageToReplaceIndex];
//       if (imageToReplace) {
//         // Delete the replaced image file
//         fs.unlinkSync(path.join(__dirname, 'public', 'productAssets', imageToReplace));
//       }
//       // Add the new image
//       existingImages[imageToReplaceIndex] = req.file.filename;
//     }

//     // Limit to 4 images
//     existingImages = existingImages.slice(0, 4);

//     // Update other product details
//     const updatedCategory = req.body.ProductCategory;
//     const updatedProduct = {
//       pname: req.body.ProductName,
//       price: parseFloat(req.body.ProductPrice),
//       offprice: parseFloat(req.body.ProductOffPrice),
//       discountPercentage: parseInt(req.body.DiscountPercentage),
//       description: req.body.ProductDetails,
//       category: updatedCategory,
//       brand: req.body.ProductBrand,
//       color: req.body.ProductColor,
//       images: existingImages,
//       material: req.body.ProductMaterial,
//       countInStock: parseInt(req.body.ProductStock),
//       caseSize: req.body.ProductCaseSize,
//       is_listed: req.body.listed === 'true'
//     };

//     // Update the product in the database
//     await Product.findByIdAndUpdate(productId, updatedProduct);

//     // Redirect to the products page after successful update
//     res.redirect("/admin/products");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error.");
//   }
// };





// // Define the route handler function for image replacement
// const replaceImage = (req, res) => {
//     const imageToReplace = req.body.imageToReplace;
//     const newImage = req.file;

//     if (!newImage) {
//         return res.status(400).send('No new image provided');
//     }

//     // Logic to delete the existing image (if it exists)
//     if (imageToReplace && fs.existsSync(path.join(__dirname, 'public', 'productAssets', imageToReplace))) {
//         fs.unlinkSync(path.join(__dirname, 'public', 'productAssets', imageToReplace));
//     }

//     // Logic to save the new image
//     const imagePath = path.join(__dirname, 'public', 'productAssets', newImage.filename);
//     fs.renameSync(newImage.path, imagePath);

//     // Optionally, you can update the database or send a response to the client
//     res.sendStatus(200); // Send a success status code
// };





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

    console.log("en tooo");
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
    console.log(existingCategory, 'existing');

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


// const edit_Category = async (req, res) => {
//   try {
//     const categoryId = req.params.id;
//     const { name, description, status } = req.body;
//     const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name, description, is_blocked: status === 'Unlist' });


//     if (!updatedCategory) {
//       return res.status(404).send('Category not found');
//     }
//     req.flash('success', 'Category updated successfully.');
//     res.redirect('/admin/category');
//   } catch (err) {
//     console.error(err);
//     req.flash('error', 'Failed to update category.');
//     res.status(500).send('Internal Server Error');
//   }
// }

const edit_Category = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, status } = req.body;
    var nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    if (!nameRegex.test(name)) {
      req.flash("error", "Category Name must contain only characters with spaces between names.");
      return res.redirect('/admin/category/edit/' + categoryId);


    }
    // Validate name and description
    if (!name || !name.trim()) {
      req.flash('error', 'Category name cannot be empty.');
      return res.redirect('/admin/category/edit/' + categoryId);
    }
    if (!description || !description.trim()) {
      req.flash('error', 'Category description cannot be empty.');
      return res.redirect('/admin/category/edit/' + categoryId);
    }
    // const existingCategory = await Category.findOne({ name: name.trim() });
    // console.log(existingCategory, 'existing');

    // if (existingCategory) {
    //   req.flash('error', 'Category name already exists.');
    //   return res.redirect('/admin/category');
    // }
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name, description, is_blocked: status === 'Unlist' });

    if (!updatedCategory) {
      req.flash('error', 'Category not found.');
      return res.redirect('/admin/category');
    } else {
      // await updatedCategory.save();
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
  editproductImagePOST
  // replaceImage
}