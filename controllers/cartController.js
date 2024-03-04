const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel")
const Address = require("../models/addressModel");
const generateDate = require("../utils/dateGenrator");
const generateOrder = require("../utils/otphandle")
const Order = require("../models/orderModel")




const loadCart = async (req, res) => {
    console.log('loadcart loaded');
    try {

        const id = req.body.id;
        const price = req.body.pdtOffPrice

        const splitPrice = price.split("");
        const slice = splitPrice.shift();
        const priceOff = splitPrice.join("");

        const userData = await User.findOne(req.session.user);
        const pdtData = await Product.findOne({ _id: id })

        // console.log(pdtData, "pdtData.....");
        // console.log(userData, 'userData');
        const userCart = await Cart.findOne({ userId: userData._id })
        // const userCart = await Cart.findById(userData._id)

        // console.log(userCart, "userCart.........................");
        if (userCart) {
            console.log("usercart entered log....");
            const pdtCart = await Cart.findOne({ 'items.productId': id });

            console.log(pdtCart, 'padtcart.........');
            if (pdtCart) {
                res.json({ status: "viewCart" });
            }
            else {
                console.log("anand@1234");
                const updateCart = await Cart.findOneAndUpdate(
                    { userId: userData._id },
                    {
                        $push: {
                            items: {
                                productId: pdtData._id,
                                subTotal: priceOff,
                                quantity: 1,
                            },
                        },
                        $inc: {
                            total: priceOff,
                        },
                    }
                )
            }

        } else {
            console.log("else worked");
            const cartData = new Cart({
                userId: userData._id,
                items: [
                    {
                        productId: pdtData._id,
                        subTotal: priceOff,
                        quantity: 1,
                    }
                ],
                total: priceOff,
            });

            cartData.save();
            res.json({ status: true });
        }





    }
    catch (error) {
        console.log(error.message);
        // res.status(500).send("Internal Server Error");
    }
}

const loadCartpage = async (req, res) => {

    try {

        const userData = await User.findOne(req.session.user);

        const cartData = await Cart.findOne({ userId: userData._id });

        const array = [];
        for (let i = 0; i < cartData.items.length; i++) {
            array.push(cartData.items[i].productId.toString())
        }
        const pdtData = [];

        for (let i = 0; i < array.length; i++) {
            pdtData.push(await Product.findById({ _id: array[i] }))
        }

        res.render('cart', { pdtData, cartData });


    }
    catch (error) {
        console.log(error.message);
    }
}



// const loadCartpage = async (req, res) => {
//     console.log("entered cartpage");
//     try {
//         const userData = await User.findOne(req.session.user);
//         const cartData = await Cart.findOne({ userId: userData._id });

//         // Check if cartData exists and has items
//         if (cartData && cartData.items.length > 0) {
//             const array = [];
//             for (let i = 0; i < cartData.items.length; i++) {
//                 array.push(cartData.items[i].productId.toString())
//             }
//             const pdtData = [];
//             for (let i = 0; i < array.length; i++) {
//                 pdtData.push(await Product.findById({ _id: array[i] }))
//             }
//             res.render('cart', { pdtData, cartData });
//         } else {
//             // Render cart page with message indicating empty cart
//             res.render('cart', { emptyCart: true });
//         }
//     }
//     catch (error) {
//         console.log(error.message);
//     }
// }


const increment = async (req, res) => {
    console.log("addtocart");
    try {

        const { price, pdtId, index, subTotal, qty } = req.body;
        const prices = parseInt(price)
        // console.log(prices, 'price....');

        const quantity = parseInt(qty);
        const pdtIdString = pdtId.toString();
        const pdtData = await Product.findById({ _id: pdtIdString });
        // console.log(pdtData,'is there');
        const stock = pdtData.countInStock;
        // console.log(stock, "stock");
        if (stock > quantity) {
            if (quantity < 5) {

                const filter = { userId: req.session.user._id, 'items.productId': pdtData._id };
                console.log(filter, "filtered");
                const update = { $inc: { "items.$.quantity": 1, "items.$.subTotal": prices, "total": prices } };
                console.log(update, "updated");
                console.log(prices, ",,.....");
                const addPrice = await Cart.findOneAndUpdate(filter, update, { new: true });




                // console.log(addPrice, "addprice");
                const findCart = await Cart.findOne({ userId: req.session.user._id })
                // console.log(findCart, "findded cart");
                // console.log(findCart.total,'.............');
                res.json({ status: true, total: findCart.total })



            }
            else {
                res.json({ status: "minimum" })
            }
        }
        else {
            console.log('out of stock');
            res.json({ status: "stock" });
        }
    }
    catch (error) {
        console.log(error.message);
    }

}







const decrement = async (req, res) => {
    try {
        const { price, pdtId, index, subTotal, qty } = req.body
        console.log(typeof (price, "price...."));
        const pdtIdString = pdtId.toString();
        console.log(pdtIdString, 'string..........');
        const quantity = parseInt(qty)
        console.log(quantity, "qty........");
        const prices = parseInt(price)
        console.log(prices, "pri.................");


        if (quantity > 1) {

            const addPrice = await Cart.findOneAndUpdate({ userId: req.session.user._id, "items.productId": pdtIdString },
                {
                    $inc: { "items.$.quantity": -1, "items.$.subTotal": -prices, "total": -prices }
                })

            const findCart = await Cart.findOne({ userId: req.session.user._id })

            res.json({ status: true, total: findCart.total })
        } else {
            res.json({ status: "minimum" })
        }


    } catch (error) {
        console.log(error.message)
    }
}


const removeCart = async (req, res) => {
    try {
        const id = req.body.id
        const sbt = req.body.sbt
        console.log(id, '.............');
        console.log(sbt, 'sbt........');

        const delePro = await Cart.findOneAndUpdate({ userId: req.session.user._id }, {
            $pull: { items: { productId: id } },
            $inc: { "total": -sbt }
        })
        const findPro = await Cart.findOne({ userId: req.session.user._id })

        res.json({ status: true, total: findPro.total })
        // console.log(id)
    } catch (error) {
        console.log(error.message)
    }
}


const loadCheckOut = async (req, res) => {
    // console.log("enter to checkout");
    try {
        const userData = await User.findOne(req.session.user);
        // console.log(userData,"userData.................");
        const cartData = await Cart.findOne({ userId: userData._id });
        //   console.log(cartData,"cartData...............");
        const quantity = [];

        for (let i = 0; i < cartData.items.length; i++) {
            quantity.push(cartData.items[i].quantity);
        }
        //   console.log(quantity);
        const proId = [];
        for (let i = 0; i < cartData.items.length; i++) {
            proId.push(cartData.items[i].productId);
        }
        //   console.log(proId,"proId");
        const proData = [];

        for (let i = 0; i < proId.length; i++) {
            proData.push(await Product.findById({ _id: proId[i] }));
        }
        //   console.log(proData,"proData");
        for (let i = 0; i < proData.length; i++) {
            for (let j = 0; j < quantity.length; j++) {
                if (proData[i].countInStock < quantity[i]) {
                    res.json({ status: "checked" });
                }
            }
        }

        res.json({ status: true });
    } catch (error) {
        console.log(error.message);
    }
};



const loadCheckOutPage = async (req, res) => {
    // console.log("anand ........");
    try {
        const userData = await User.findOne(req.session.user);
        // console.log("userData",userData);
        const cartData = await Cart.findOne({ userId: userData._id });

        const proId = [];

        for (let i = 0; i < cartData.items.length; i++) {
            proId.push(cartData.items[i].productId);
        }

        const pdtData = [];

        for (let i = 0; i < proId.length; i++) {
            pdtData.push(await Product.findById({ _id: proId[i] }));
        }

        //   console.log(pdtData,"pdtdata...........................");

        const cartItems = cartData.items;
        //   console.log(cartItems,"itemss...................");
        const address = await Address.find({ userId: userData._id });
        //   console.log(address,"...addrerss");
        res.render("checkout", { pdtData, cartItems, cartData, address });
    } catch (error) {
        console.log(error.message);


    }
};


const addOrder = async (req, res) => {
    try {
        const { addressId, cartid, checkedOption, index } = req.body;

        const userData = await User.findOne(req.session.user);
        // console.log(userData,"user.........");
        const cartData = await Cart.findOne({ userId: userData._id });

        const pdtData = [];

        for (let i = 0; i < cartData.items.length; i++) {
            pdtData.push(cartData.items[i]);
        }
        console.log(pdtData, "okkkkkkkkkkkkkkkkkkkkkkkkkkkk");

        const orderNum = generateOrder.generateOrder();
        //   console.log(orderNum,"onnnnnnnnnnnnnnnnnnnnnnnnn");

        const addressData = await Address.findOne({ "address._id": addressId });

        let address = addressData.address[index]

        const date = generateDate()
        //   console.log(date,"dateeee");

        const orderData = new Order({
            userId: userData._id,
            orderNumber: orderNum,
            userEmail: userData.email,
            items: pdtData,
            totalAmount: cartData.total,
            orderType: checkedOption,
            orderDate: date,
            status: "Processing",
            shippingAddress: address,
        });

        //   console.log(s,"shippingg................");

        console.log(orderData, "orderrrrrrrrrrrrrrr");

        await orderData.save();

        for (const item of cartData.items) {
            const product = await Product.findById(item.productId);
            product.countInStock -= item.quantity; // Reduce countInStock by the ordered quantity
            await product.save();
            // console.log(product,"saved");
        }



        res.json({ status: true, order: orderData });
        await Cart.findByIdAndDelete({ _id: cartData._id });


        // const deleteCart = await Cart.findByIdAndDelete({ _id: cartData._id });


        // console.log(product,"pdtIdddddddddddddddddd");



    } catch (error) {
        console.log(error);
    }
};






const loadorderPlaced = async (req, res) => {
    try {
        const id = req.query.id;
        // const orders = await Order.find({})
        //     .sort({ _id: -1 })
        //     .limit(1)
        //     .populate('items.productId') // Populate the productId field within the items array
        //     .exec(); // Execute the query

        // console.log('Populated orders:', orders);
        // res.render('orderPlaced', { orders });

        const orders = await Order.findOne({ orderNumber: id });
        const pdt = [];

        for (let i = 0; i < orders.items.length; i++) {
            pdt.push(orders.items[i].productId)
        }

        const pdtData = [];
        for (let i = 0; i < pdt.length; i++) {
            pdtData.push(await Product.findById({ _id: pdt[i] }))
        }
        res.render('orderPlaced', { orders, pdtData })

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};





module.exports = {
    loadCart,
    loadCartpage,
    increment,
    decrement,
    removeCart,
    loadCheckOut,
    loadCheckOutPage,
    addOrder,
    loadorderPlaced


}