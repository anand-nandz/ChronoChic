const User = require("../models/userModel");

// const isLogin = async (req, res, next) => {
//     try {
//         if (req.session.user) {
//             next();
//         } else {
//             res.redirect('/login');
//         }
       
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }



// const isLogout = async (req, res, next) => {
//     try {

//         if (req.session.user_id) {
//             res.redirect('/home')
//         }
//         next();
//     }
//     catch (error) {
//         console.log(error.message);
//     }
// }


const checkAuth = (req, res, next) => {
    if (req.session.user) {
        
        next();
    } else {
        
        res.redirect('/login');
    }
};

const isBlocked = async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            if (user && user.is_blocked) {
                req.session.destroy(); 
                // req.flash('error', 'Your account has been blocked by the admin.');
                return res.redirect('/login');
            }
            
        }
        next();
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};






// const checkBlockedStatus = async (req, res, next) => {
//     try {
//       // Check if user is logged in
//       if (req.session.user) {
//         const userId = req.session.user._id; // Assuming user ID is stored in session
  
//         // Retrieve user from the database
//         const user = await User.findById(userId);
  
//         // Check if user account is blocked
//         if (user && user.is_blocked) {
//           // If account is blocked, send an alert message or redirect to a blocked page
//           return res.status(403).send("Your account has been blocked. Please contact the admin.");
//         }
//       }
      
//       // If user is not logged in or account is not blocked, proceed to the next middleware
//       next();
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send("Anand blocked");
//     }
//   };


// const isLogged = (req,res,next)=>{
//     if(req.session.user){
//         User.findById({_id:req.session.user}).lean()
//         .then((data)=>{
//             if(data.isBlocked == false){
//                 next();
//             }else{
//                 res.redirect('/login')
//             }
//         })
//     }
//     else{
//         res.redirect('/login')
//     }
// }
  
  



module.exports = {
    // isLogin,
    // isLogout,
    isBlocked,checkAuth
}
