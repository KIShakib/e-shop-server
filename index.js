const express = require('express');
const cors = require('cors');
require("colors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// MongoDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mogodb-practice.uoisaxb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Root API
app.get("/", (req, res) => {
    res.send("E-Shop Server Is Running...")
})


// JWT
function verifyJWT(req, res, next) {
    // const token = req.headers.authorization;
    // console.log(token);
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send("UnAuthorized Access")
    }
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden" })
        }
        req.decoded = decoded;
        next();
    })
}


// DataBase Connection
async function dataBase() {
    try {
        const usersCollection = client.db("e-shop").collection("users");
        const productsCollection = client.db("e-shop").collection("products");
        const ordersCollection = client.db("e-shop").collection("orders");

        // Save User Info
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            // const userEmail = user.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            }

            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN);

            res.send({ result, token })
        })

        // Send All User
        app.get("/customers", async (req, res) => {


            const filter = {}

            const customersWithAdmin = await usersCollection.find(filter).toArray();
            res.send(customersWithAdmin)
        })


        // Load Specific Admin By Email
        app.get("/user/admin/:email", async (req, res) => {
            const email = req.params.email;

            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user.isAdmin === "Admin") {
                return res.send({ isAdmin: "Admin" })
            }
            else {
                res.send({ isAdmin: false })
            }
        })


        // Send All Products
        app.get("/products", async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products)
        })

        // Send Product By Id
        app.get("/product/:_id", async (req, res) => {
            const _id = req.params._id;
            console.log(_id);
            const filter = { _id: new ObjectId(_id) };
            const product = await productsCollection.findOne(filter);
            if (product) {
                res.send({ message: "success", data: product });
                return
            }
            else {
                res.send({ message: "error" })
            }
        })

        // Delete Product
        app.delete("/product/delete/:_id", async (req, res) => {
            const _id = req.params._id;
            const query = { _id: new ObjectId(_id) };
            const result = await productsCollection.deleteOne(query);
            res.send({ message: "success", data: result })
        })

        // Save Product Into DataBase
        app.post("/add-product", async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result)
        })

        // Save Order Into DataBase
        app.post("/order-product", async (req, res) => {
            const product = req.body;
            const result = await ordersCollection.insertOne(product);
            res.send(result)
        })
        // Send Order
        app.get("/orders", async (req, res) => {
            const query = {};
            const result = await ordersCollection.find(query).toArray();
            res.send(result)
        })

        // Delete Order
        app.delete("/order/delete/:_id", async (req, res) => {
            const _id = req.params._id;
            const query = { _id: new ObjectId(_id) };
            const result = await ordersCollection.deleteOne(query);
            res.send({ message: "success", data: result })
        })

        // Send Cart Product By Email
        app.get("/order-product/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await ordersCollection.find(query).toArray();
            res.send(result)
        })
    }
    catch (err) {
        console.log(err.message.bgRed.bold)
        console.log(err.stack.bgBlue.bold)
    }
}


dataBase().catch(err => console.log(err.bold.bgRed))


// Listen
app.listen(port, () => {
    console.log(`Server Is Running On ${port}`.bgCyan.bold);
})