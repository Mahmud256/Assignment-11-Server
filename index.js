const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5cknjnc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middleware
const logger = (req, res, next) => {
  console.log(req.method, req.url);
  next();
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  //console.log('token in the middle ware',token);
  if(!token){
    return res.status(401).send({message: 'unauthorizes access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded;
    next();
  })
  //next();
}

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const assignmentCollection = client.db('assignment-11').collection('assignments');

    // Create a new assignment
    app.post("/assignment", async (req, res) => {
      const c_assignment = req.body;
      c_assignment.creator = req.query.email; // Set the creator field based on the authenticated user
      const result = await assignmentCollection.insertOne(c_assignment);
      console.log(result);
      res.send(result);
    });

    //auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log('user for token', req.user);
      // if(req.user.email !== req.query.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log("Logout", user);
      res.clearCookie('token', { maxAge: 0 })
        .send({ success: true })
    })

    // Get all assignments
    app.get("/assignment", async (req, res) => {
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });

    // Get a single assignment by ID
    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    // Update an assignment by ID
    app.put("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const updatedAssignment = req.body;
      console.log("id", id, updatedAssignment);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const assignments = {
        $set: {
          title: updatedAssignment.title,
          assignmentLevel: updatedAssignment.assignmentLevel,
          marks: updatedAssignment.marks,
          dueDate: updatedAssignment.dueDate,
          description: updatedAssignment.description,
          product_img: updatedAssignment.product_img
        },
      };
      const result = await assignmentCollection.updateOne(filter, assignments, options);
      res.send(result);
    });

    // Delete an assignment by ID
    app.delete("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      console.log("delete", id);
      const query = {
        _id: new ObjectId(id),
      };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    // Submission
    const subCollection = client.db('assignment-11').collection('submissions');

    // Create a new assignment
    app.post("/submission", async (req, res) => {
      const subForm = req.body;
      subForm.submitted_by = req.query.email; // Set the creator field based on the authenticated user
      const result = await subCollection.insertOne(subForm);
      console.log(result);
      res.send(result);
    });


    // Get all submissions
    app.get("/submission", async (req, res) => {
      const result = await subCollection.find().toArray(); // Change findOne() to find()
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Close the client when you finish or encounter an error
    // await client.close();
  }
}

run().catch(console.error);

// Root route
app.get("/", (req, res) => {
  res.send("Assignment-11 is running...");
});

// Start the server
app.listen(port, () => {
  console.log(`Simple Assignment-11 is Running on port ${port}`);
});
