const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const uri = "mongodb+srv://Aniketh:Nikki999@todoapp.4xxt1pe.mongodb.net/?retryWrites=true&w=majority&appName=todoApp";

const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

  } finally {
    await client.close();
  }
}
run().catch(console.dir);



app.get('/all-members', async (req, res) => {
    try {
        await client.connect();
    
        const database = client.db("app-database");
        const collection = database.collection("members");
        const members = await collection.find({}).toArray();
        res.json(members);
    } catch (error) {
        res.status(500).send(error.message);
    } finally {
        await client.close();
    }
});

app.get('/all-meetings', async (req, res) => {
  try {
      await client.connect();
  
      const database = client.db("app-database");
      const collection = database.collection("meetings");
      const meetings = await collection.find({}).toArray();
      res.json(meetings);
  } catch (error) {
      res.status(500).send(error.message);
  } finally {
      await client.close();
  }
});

app.get('/all-refferals', async (req, res) => {
  try {
      await client.connect();
  
      const database = client.db("app-database");
      const collection = database.collection("refferals");
      const refferals = await collection.find({}).toArray();
      res.json(refferals);
  } catch (error) {
      res.status(500).send(error.message);
  } finally {
      await client.close();
  }
});


app.post('/register', async (req, res) => {
  try {
      await client.connect();
      const {email, password} = req.body;
      // const {name, surname, gothram,  caste, category, age, marital_status, address, bussiness, blood_group, mla_constiunency, family_details, bussinness_profile, phone_number, aadhar_number, email, native_place, reffernce_code, area_location, any_service_activity} = req.body;
      const database = client.db("app-database");
      const collection = database.collection("members");
      const member = await database.collection("members").findOne({email: email});

      if(member == [] || member == null){
        const hassedPassword = await bcrypt.hash(password, 6);
        const new_member = {email: email,  password: hassedPassword};
       
        const result = await collection.insertOne(new_member); 
        const payload = {email: email};
        const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
        res.status(200).send({jwtToken});
      }else{
        res.status(401).send("Email Already Exists");
      }
      
      
  } catch (error) {
      res.status(500).send(error.message);
  } finally {
      await client.close();
  }
});


app.post('/login', async (req, res) => {
try {
    await client.connect();
    const {email, password} = req.body;
    // const {name, surname, gothram,  caste, category, age, marital_status, address, bussiness, blood_group, mla_constiunency, family_details, bussinness_profile, phone_number, aadhar_number, email, native_place, reffernce_code, area_location, any_service_activity} = req.body;
    const database = client.db("app-database");
    const member = await database.collection("members").findOne({email: email});
    if(member == [] || member == null){
      res.status(401).send("Invalid Email");
    }else{
      const isPasswordMatch = await bcrypt.compare(password, member.password);
      if(isPasswordMatch){
          const payload = {email: email};
          const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
          res.status(200).send({jwtToken});
    }else{
      res.status(401).send("Invalid Password");
    }

    
  }
} catch (error) {
    res.status(500).send(error.message);
} finally {
    await client.close();
}
});



const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.email = payload.email;
        next();
      }
    });
  }
};

app.get('/members/mydetails', authenticateToken, async (req, res) => {
  try {
      await client.connect();
      const {email} = req;
      const database = client.db("app-database");
      const collection = database.collection("members");
      const members = await collection.findOne({"email":email})
      res.json(members);
  } catch (error) {
      res.status(500).send(error.message);
  } finally {
      await client.close();
  }
});

app.get('/refferals/myrefferals', authenticateToken, async (req, res) => {
  try {
      await client.connect();
      const {email} = req;
      const database = client.db("app-database");
      const collection = database.collection("refferals");
      const refferals = await collection.findOne({$or :[{fromMemberId: email}, {toMemberId: email}]});
      res.json(refferals);
  } catch (error) {
      res.status(500).send(error.message);
  } finally {
      await client.close();
  }
});

app.post('/addrefferal', authenticateToken, async (req, res) => {
  try {
      await client.connect();
      const {email} = req;
      const {refferedId} = req.body;
      const database = client.db("app-database");
      const collection = database.collection("refferals");
      const refferals = await collection.insertOne({fromMemberId: email, toMemberId: refferedId});
      res.status(200).send("Refferal Added Successfully");
  } catch (error) {
      res.status(500).send(error.message);
  } finally {
      await client.close();
  }
})




