const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5cknjnc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const assignmentCollection = client.db('assignment-11').collection('assignments');
        
    app.post("/assignment", async (req, res) => {
      const c_assignment = req.body;
      console.log("Create Assignment:", c_assignment);
      const result = await assignmentCollection.insertOne(c_assignment);
      console.log(result);
      res.send(result);
  });

  app.get("/assignment", async (req, res) => {
    const result = await assignmentCollection.find().toArray();
    res.send(result);
});

app.get("/assignment/:id", async (req, res) => {
    const id = req.params.id;
    const query = {
        _id: new ObjectId(id)
    };
    const result = await assignmentCollection.findOne(query);
    console.log(result);
    res.send(result);
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Assignment-11 is running...");
});

app.listen(port, () => {
  console.log(`Simple Assignment-11 is Running on port ${port}`);
});