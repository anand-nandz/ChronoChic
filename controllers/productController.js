const Product = require("../models/productModel");

// const bcrypt = require("bcrypt");

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
  
        // Combine existing and new images, ensuring only 4 images are kept
      const updatedImages = [...existingImages, ...newImages].slice(0, 4);
  
        // Replace existing images with new images
        // existingImages = newImages;
  
        const updatedProduct = {
            pname: req.body.ProductName,
            price: req.body.ProductPrice,
            description: req.body.ProductDetails,
            category: req.body.ProductCategory,
            brand: req.body.ProductBrand,
            color: req.body.ProductColor,
            images: updatedImages,
            material: req.body.ProductMaterial,
            caseSize: req.body.ProductCaseSize,
            is_listed: req.body.listed === 'true' // Convert string to boolean
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
  //     // Extract the product ID from the query parameter
     
  //       const productId = req.query.id;
  //       let existingImages = [];
  //       const existingProduct = await Product.findById(req.query.id);
  
  //       if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
  //         existingImages = existingProduct.images;
  //       }
  
  //       let newImages = [];
  //       if (req.files && Array.isArray(req.files)) {
  //         newImages = req.files.map(file => file.filename);
  //       }
  
  //       const allImages = existingImages.concat(newImages);
  //       console.log(allImages,"all images.........................................");
  //       console.log(productId, "lllllllllllllllllllllllllllllllllll");
  //       console.log(req.body, "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
  
  //       // Update the product details based on the data in req.body
  //       const updatedProduct = {
  //         pname: req.body.ProductName,
  //         price: req.body.ProductPrice,
  //         description: req.body.ProductDetails,
  //         category: req.body.ProductCategory,
  //         brand: req.body.ProductBrand,
  //         color: req.body.ProductColor,
  //         images: allImages,
  //         material: req.body.ProductMaterial,
  //         caseSize: req.body.ProductCaseSize,
  //         is_listed: req.body.listed === 'true' ? true : false // Convert string to boolean
  //       };
  
  //       console.log(updatedProduct,"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  
  //       // Check if new images were uploaded
  //       // if (req.files && req.files.ProductImage) {
  //       //   const newImages = req.files.ProductImage.map(file => file.filename);
  //       //   updatedProduct.images = newImages;
  //       // }
  
  //       // Update the product in the database
  //       await Product.findByIdAndUpdate(productId, updatedProduct);
  
  //       res.redirect("/admin/products");
      
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send("Internal Server Error");
  //   }
  // };
  
  
  
  
  
  
  
  
  
  
  // const edit_product = async (req, res) => {
  //   try {
  //     const productId = req.query.id;
  
  //         // upload(req,res,async function(err){
  //         let existingImages = [];
  //         const existingProduct = await Product.findById(req.query.id);
  
  //         if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
  //             existingImages = existingProduct.images;
  //         }
  
  //         let newImages = [];
  //         if (req.files && Array.isArray(req.files)) {
  //             newImages = req.files.map(file => file.filename);
  //         }
  
  //         const allImages = existingImages.concat(newImages);
  //       // Extract the product ID from the query parameter
  //       console.log(productId,"lllllllllllllllllllllllllllllllllll");
  //       console.log(req.body,"kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
  
  //       // Update the product details based on the data in req.body
  //       const updatedProduct = {
  //           pname: req.body.ProductName,
  //           price: req.body.ProductPrice,
  //           description: req.body.ProductDetails,
  //           category: req.body.ProductCategory,
  //           brand: req.body.ProductBrand,
  //           color: req.body.ProductColor,
  //           images: allImages,
  //           material: req.body.ProductMaterial,
  //           caseSize: req.body.ProductCaseSize,
  //           is_listed: req.body.listed === 'true' ? true : false // Convert string to boolean
  //       };
  
  //       // Check if new images were uploaded
  //       // if (req.files && req.files.ProductImage) {
  //       //     const newImages = req.files.ProductImage.map(file => file.filename);
  //       //     updatedProduct.images = newImages;
  //       // }
  
  //       // Update the product in the database
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
  
  
  
  
  
  module.exports = {

    loadProducts,
    addProduct,
    add_Product,
    editProduct,
    edit_product,
    deleteProduct
  }