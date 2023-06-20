const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
// verify jwt token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorised Access" });
  }
  // console.log(authorization);

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.Token_Secret, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorised Access" });
    }
    req.decoded = decoded;
    next();
  });
  // console.log(token);
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const UsersData = client.db("criftopia").collection("users");
    const ClassCollection = client.db("criftopia").collection("class");
    const ClassBooking = client.db("criftopia").collection("bookings");

    // generate token
    // require('crypto').randomBytes(64).toString('hex')
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.Token_Secret, {
        expiresIn: "1h",
      });
      // console.log(token);
      res.json({ token });
    });

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
      res.json(result);
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

    // Get all Classes for ADMIN
    app.get("/allClasses", async (req, res) => {
      const result = await ClassCollection.find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.json(result);
    });

    // get approved classes
    app.get("/allApprovedClasses", async (req, res) => {
      const query = { status: "Approved" };
      const result = await ClassCollection.find(query)
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
      res.json(result);
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

    // Select a class
    app.post("/sellectClass", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      const result = await ClassBooking.insertOne(body);
      console.log(result);
      res.json(result);
    });

    // get instructors data my email
    app.get("/myClass/:email", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      // console.log(decodedEmail);
      const email = req.params.email;
      // console.log(email);

      if (email != decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden Access" });
      }

      const result = await ClassCollection.find({
        instructoremail: req.params.email,
      })
        .sort({ createdAt: -1 })
        .toArray();
      res.json(result);
    });

    // get class data by id
    app.get("/classSearch/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ClassCollection.findOne(query);
      res.json(result);
    });

    // get classdata and update data
    app.put("/classUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedClass = req.body;
      const updtdClass = {
        $set: {
          classname: updatedClass.classname,
          instructorName: updatedClass.instructorName,
          instructoremail: updatedClass.instructoremail,
          description: updatedClass.description,
          price: updatedClass.price,
          available: updatedClass.available,
        },
      };
      const result = await ClassCollection.updateOne(query, updtdClass, option);
      res.json(result);
    });

    // get selected class data my email
    app.get("/selectedClasses/:email", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      // console.log(decodedEmail);
      const email = req.params.email;
      // console.log(email);

      if (email != decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden Access" });
      }

      const result = await ClassBooking.find({
        studentEmail: req.params.email,
      })
        .sort({ createdAt: -1 })
        .toArray();
      res.json(result);
    });

    // class delete
    app.delete("/myClass/classDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ClassCollection.deleteOne(query);
      res.json(result);
    });
    // Delete sellected classes
    app.delete(
      "/selectedClasses/selectedClassesDelete/:id",
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await ClassBooking.deleteOne(query);
        res.json(result);
      }
    );

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
