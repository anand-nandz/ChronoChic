const User = require("../models/userModel");
const Product=require("../models/productModel");

const bcrypt = require("bcrypt");
// const config = require('../config/config');

const securePassword = async(password)=>{

    try{

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    }
    catch(error){
        console.log(error.message);
    }

}



const loadLogin = async(req,res)=>{
    try{
        res.render("adminlogin")
    }
    catch(error){
        console.log(error.message);
    }
}

const verifyAdmin = async(req,res)=>{
    try{

        const email = req.body.email;
        const password = req.body.password;
        console.log(email);
        console.log(password);
        const userData = await User.findOne({email:email});
        // console.log(userData);
        if(userData){

            const passwordMatch = await bcrypt.compare(password,userData.password);

            if(passwordMatch){
                console.log("Yes");
                if(userData.is_admin === 0){
                    console.log("yess");
                    res.render('adminlogin',{message:'Email and password is Incorrect.'});
                    console.log(userData);

                }
                else{
                    console.log("no");
                    // console.log(userData);
                    req.session.user_id = userData._id;
                    res.redirect('/admin/home')
                }

            }
            else{
                res.render('adminlogin',{message:'Email and password is Incorrect.'});
            }

        }
        else{
            res.render('adminlogin',{message:'Email and password is Incorrect.'});
        }

    }
    catch(error){
        console.log(error.message);
    }
}


const loadDashboard = async(req,res)=>{
    try{
        const userData = await User.findById({_id:req.session.user_id})
        res.render('adminhome',{admin:userData});

    }
    catch(error){
        console.log(error.message);
    }
}






 const loadUsers=async(req,res)=>{
    try {
       const userData=await User.find({})
    //    console.log(userData)
       res.render('users',{userData})
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
      res.render("editUser", { userDetails, errorMessage:null });
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


  const adminLogout = async(req, res) => {
    try {
      req.session.destroy();
      res.redirect('/admin');
    } 
    catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error logging out" });
    }
   };



//   const delete_User = async (req, res) => {
//     try {
//         const id = req.query.id;
//         console.log(id,'hloooo');
//         // Find and delete the user by ID
//         const deletedUser = await User.findByIdAndDelete(id);
//         console.log(deletedUser);
//         if (!deletedUser) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         // Send a success response
//         res.status(200).json({ message: "User deleted successfully" });
//     } 
//     catch (error) {
//         console.log(error.message);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };

  


//   const addUser=async(req,res)=>{
//     try {
//       res.render("addUser", {
//         errorMessage: null,
//       });
//     } catch (error) {
//      console.log(error.message);
//     }
//   }


 




  const loadProducts=async(req,res)=>{
    try {
       const allProducts=await User.find({})
       console.log(allProducts)
       res.render('products',{allProducts})
    } catch (error) {
       console.log(error.message)
    }
 }













// const logout = async(req,res)=>{
//     try{
//         req.session.destroy();
//         res.redirect('/admin')
//     }
//     catch(error){
//         console.log(error.message);
//     }
// }


module.exports ={
    loadLogin,
    verifyAdmin,
    securePassword,
    loadDashboard,
    loadUsers,
    editUser,
    edit_User,
    adminLogout,
    // delete_User,
    loadProducts
    
}