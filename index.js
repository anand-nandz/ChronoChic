const mongoose = require("mongoose");
const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const session = require('express-session');
const flash = require('connect-flash');

app.set('view engine','ejs');

app.set('views','./views/users')
// const flash = require('express-flash');



mongoose.connect(`mongodb://127.0.0.1:27017/chronoChic`);

mongoose.connection.on("connected", () => {
    console.log('DataBase connected');
})

mongoose.connection.on("disconnected", () => {
    console.log('DataBase disconnected');
})
mongoose.connection.on("error", () => {
    console.log('DataBase error');
})


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))


//Serve static files form the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use("/products", express.static(path.join(__dirname, "public")));
app.use("/admin/users", express.static(path.join(__dirname, "public")));
app.use("/admin/products", express.static(path.join(__dirname, "public")));


app.use(session({
    secret: "chroNO@9876",
    resave: true,
    saveUninitialized: true,
}));

app.use(flash());



//for user route
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

//for admin route
const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute);

app.use('*',(req,res,next)=>{
    res.render('error404')
})




app.listen(8080, function check(error) {
    if (error) {
        console.log('Error......');
    }
    else {
        console.log("server is running...  http://localhost:8080")

    }
})