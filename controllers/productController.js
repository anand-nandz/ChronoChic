const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel");
const Address = require("../models/addressModel");
const Wishlist = require("../models/wishlistModel")
const { use } = require("../routes/userRoute");



const loadProduct = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user_id);
        const productData = await Product.find({ is_listed: true }).limit(12)
        const productSortData = await Product.find({ is_listed: true })
            .sort({ _id: -1 }) 
            .limit(4);
        // console.log(productSortData);
        const categoryData = await Category.find({});
        
        let findWish = {};
        if (req.session.user._id) {
          console.log(req.session.user._id);
            const wishlistData = await Wishlist.findOne({ user_id: req.session.user._id});
            // console.log(wishlistData,"wishlistdata of anana");
            if (wishlistData) {
                for (let i = 0; i < productData.length; i++) {
                    findWish[productData[i]._id] = wishlistData.products.some(p => p.productId.equals(productData[i]._id));
                }
            }
        }
        // console.log(findWish,"wishfindddddddddd");

        res.render('home', { user: userData, product: productData, category: categoryData, productSort: productSortData ,findWish })




    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const loadIndividualProduct = async (req, res) => {
    try {

        const id = req.query.id;
        const userData = await User.findById(req.session.user_id);
        const productData = await Product.findById({ _id: id, is_listed: true });
        const categoryData = await Category.find({});

        const category = categoryData.find(cat => cat._id.toString() === productData.category.toString());

        // console.log(categoryData, 'id.........................');
        let findWish = {};
        if (req.session.user._id) {
          console.log(req.session.user._id);
            const wishlistData = await Wishlist.findOne({ user_id: req.session.user._id});
            console.log(wishlistData,"wishlistdata of anana");
            if (wishlistData) {
                for (let i = 0; i < productData.length; i++) {
                    findWish[productData[i]._id] = wishlistData.products.some(p => p.productId.equals(productData[i]._id));
                }
            }
        }
        console.log(findWish,"wishfindddddddddd");
        if (productData) {
            res.render('productDetails', {
                product: productData,
                user: userData,
                category: category.name,
                findWish
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


// const loadShop = async (req, res) => {
//     try {
//         const { sortby } = req.query;
//         console.log(sortby,"sortby");
//         let productData;

//         const perPage = 8;
//         let page = parseInt(req.query.page) || 1;

//         // Calculate total number of products
//         const totalpdts = await Product.countDocuments({});
//         // Calculate total number of pages
//         const totalPage = Math.ceil(totalpdts / perPage);

//         // Validate page number to prevent out-of-range errors
//         if (page < 1) {
//             page = 1;
//         } else if (page > totalPage) {
//             page = totalPage;
//         }

//         let sortQuery = {};

//         switch (sortby) {
//             case 'name_az':
//                 sortQuery = { pname: 1 };
//                 break;
//             case 'name_za':
//                 sortQuery = { pname: -1 };
//                 break;
//             case 'price_low_high':
//                 sortQuery = { offprice: 1 };
//                 break;
//             case 'price_high_low':
//                 sortQuery = { offprice: -1 };
//                 break;
//             case 'rating_lowest':
//                 sortQuery = { rating: 1 };
//                 break;
//             default:
//                 // Default sorting or when sortby parameter is not provided
//                 break;
//         }

//         // Fetch products based on pagination and sorting
//         productData = await Product.find({})
//             .sort(sortQuery)
//             .skip(perPage * (page - 1))
//             .limit(perPage);

//             console.log(productData,"pdtdata");
//         // const userData = await User.findById(req.session.user_id);
//         const userData = req.session.user_id ? await User.findById(req.session.user_id) : null;
//         const categoryData = await Category.find({});
        
//         let findWish = {};
//         if (req.session.user._id) {
//           console.log(req.session.user._id);
//             const wishlistData = await Wishlist.findOne({ user_id: req.session.user._id});
//             // console.log(wishlistData,"wishlistdata of anana");
//             if (wishlistData) {
//                 for (let i = 0; i < productData.length; i++) {
//                     findWish[productData[i]._id] = wishlistData.products.some(p => p.productId.equals(productData[i]._id));
//                 }
//             }
//         }
//         // console.log(findWish,"wishfindddddddddd");
//         res.render('shop', { user: userData, product: productData, category: categoryData, page, totalPage, sortby, findWish });

//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };











const loadShop = async (req, res) => {
    try {
        const sortby  = req.query.sortby || null;
        // console.log(sortby, "sortby");
        let productData;


        const perPage = 8;
        let page = parseInt(req.query.page) || 1;

        // Calculate total number of products
        const totalpdts = await Product.countDocuments({});
        // Calculate total number of pages
        const totalPage = Math.ceil(totalpdts / perPage);

        // Validate page number to prevent out-of-range errors
        if (page < 1) {
            page = 1;
        } else if (page > totalPage) {
            page = totalPage;
        }

        let sortQuery = {};

        switch (sortby) {
            case 'name_az':
                sortQuery = { pname: 1 };
                break;
            case 'name_za':
                sortQuery = { pname: -1 };
                break;
            case 'price_low_high':
                sortQuery = { offprice: 1 };
                break;
            case 'price_high_low':
                sortQuery = { offprice: -1 };
                break;
            case 'rating_lowest':
                sortQuery = { rating: 1 };
                break;
            default:
                
                sortQuery = { all: -1 }; // Setting a default sorting option
                break;
        }
        console.log(sortQuery,'sortquery');

        // Fetch products based on pagination and sorting
        productData = await Product.find({})
            .sort(sortQuery)
            .skip(perPage * (page - 1))
            .limit(perPage);

        console.log(productData, "pdtdata");
        
        // Fetch user and category data
        const userData = req.session.user_id ? await User.findById(req.session.user_id) : null;
        const categoryData = await Category.find({});
        
        // Fetch wishlist data if user is logged in
        let findWish = {};
        if (req.session.user._id) {
            const wishlistData = await Wishlist.findOne({ user_id: req.session.user._id });
            if (wishlistData) {
                for (let i = 0; i < productData.length; i++) {
                    findWish[productData[i]._id] = wishlistData.products.some(p => p.productId.equals(productData[i]._id));
                }
            }
        }

        res.render('shop', { user: userData, product: productData, category: categoryData, page, totalPage, sortby, findWish ,sortby});

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};



const loadWishList = async(req,res)=>{
    try{
        console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
        
        const wishlistData = await Wishlist.findOne({user_id:req.session.user._id});
        console.log(wishlistData,"wishlistdata");
        if (!wishlistData || wishlistData.products.length === 0) {
            // Wishlist is empty or not found
            return res.render('wishlist', { wishlistData: null, pdtData: null });
        }

        let pdtId=[];
        for(let i=0;i<wishlistData.products.length;i++){
            pdtId.push(wishlistData.products[i].productId)
        }

        let pdtData=[];
        for(let i=0;i<pdtId.length;i++){
            pdtData.push(await Product.findById({_id:pdtId[i]}))
        }

        console.log(pdtData,'pdtdata on ');
        const cartData = [];

        for(let i=0;i<pdtId.length;i++){
            cartData.push(await Cart.findOne({userId:req.session.user._id,"items.productId":pdtId[i]}));
        }
        res.render('wishlist',{wishlistData,pdtData});
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}


const addToWishlist = async(req,res)=>{
    try{
        const id= req.body.id;
        console.log(id,'add wishlist');
        
        const findPdtData = await Product.findById({_id:id});
            const userFind = await Wishlist.findOne({user_id:req.session.user._id});
            
            if(userFind){
                let wishlistPdt = false;
                for(let i=0;i<userFind.products.length;i++){
                    if(findPdtData._id === userFind.products[i].productId){
                        wishlistPdt = true;
                        break;
                    }
                }

                if(wishlistPdt){
                    // res.status(400)
                    res.json({ status: 400 });    
                }
                else{
                    const updateWishlist = await Wishlist.findOneAndUpdate(
                        {user_id:req.session.user._id},
                        {
                            $push:{
                                products:{
                                    productId:findPdtData._id,
                                },
                            },
                        },
                    );
                }

            }
            else{
                const wishlist = new Wishlist({
                    user_id:req.session.user._id,
                    products:[
                        {
                            productId:findPdtData._id,
                        },
                    ],
                });
                 wishlist.save();
                 console.log(wishlist);
            }
            res.json({status:true});

    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}



const removeWish=async(req,res)=>{
    try {
        const id=req.body.id
        const findUser=await User.findOne(req.session.user)

        const deletePdt=await Wishlist.findOneAndUpdate(
            {user_id:findUser._id},
            {
                $pull:{products:{productId:id}}
            }

        )

        res.json({status:true})

    } catch (error) {
        console.log(error.message)
    }
}



const removeFromWishlist=async(req,res)=>{
    try {
      
        const id=req.body.id;
        console.log(id);
      

        const delePro=await Wishlist.findOneAndUpdate(
            {user_id:req.session.user._id},
            {
                $pull:{products:{productId:id}}
            }

        )

        res.json({status:true})

    } catch (error) {
        console.log(error.message)
    }
}




const searchProducts = async(req,res)=>{
    try{
      console.log("hello");
        const {searchDataValue} = req.body
        const searchProducts = await Product.find({pname:{
            $regex: searchDataValue , $options: 'i'
        }})
        // console.log(searchProducts);
        console.log(searchProducts,"searchpdts")
        res.json({status:"searched",searchProducts})
  
    }catch(err){
        console.log(err);
      }
   }
  







module.exports = {
    loadProduct,
    loadIndividualProduct,
    loadShop,
    loadWishList,
    addToWishlist,
    removeFromWishlist,
    removeWish,
    searchProducts

}