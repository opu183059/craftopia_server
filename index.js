const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.ljsyrma.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const UsersData = client.db("criftopia").collection("users");
    const ClassCollection = client.db("criftopia").collection("class");
    const ClassBooking = client.db("criftopia").collection("bookings");

    // get user and update
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await UsersData.updateOne(query, updateDoc, options);
      // console.log(result)
      res.send(result);
    });

    // Get all user
    app.get("/allusers", async (req, res) => {
      const result = await UsersData.find({}).toArray();
      res.json(result);
    });
    // Get Instructor
    app.get("/instructor", async (req, res) => {
      const result = await UsersData.find({ role: "Instructor" }).toArray();
      res.json(result);
    });

    // Get all Classes
    app.get("/allClasses", async (req, res) => {
      const result = await ClassCollection.find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.json(result);
    });

    //get class by id and update
    app.put("/classApprove/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const user = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await ClassCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // Delete user
    app.delete("/deleteUsers/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await UsersData.deleteOne(query);
      res.json(result);
    });

    // Find single user
    app.get("/usermail/:email", async (req, res) => {
      // console.log(req.params.id);
      const email = req.params.email;
      const query = { email: email };
      const result = await UsersData.findOne(query);
      res.json(result);
    });

    // Add class
    app.post("/addClass", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      const result = await ClassCollection.insertOne(body);
      console.log(result);
      res.json(result);
    });

    // get instructors data my email
    app.get("/myClass/:email", async (req, res) => {
      const result = await ClassCollection.find({
        instructoremail: req.params.email,
      })
        .sort({ createdAt: -1 })
        .toArray();
      res.json(result);
    });

    // class delete
    app.delete("/classDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ClassCollection.deleteOne(query);
      res.json(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`this server is running on port ${port}`);
});
