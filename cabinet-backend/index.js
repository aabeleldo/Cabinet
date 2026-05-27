require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors());

const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
});

let db;

async function connectDB() {
  await client.connect();
  db = client.db('cabinet');
  console.log('Connected to MongoDB');
}

// ESP32 posts sensor data
app.post('/data', async (req, res) => {
  console.log('Received from ESP32:', req.body);
  try {
    await db.collection('readings').updateOne(
      { rfid: req.body.rfid },
      { $set: { ...req.body, timestamp: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('Failed to save to MongoDB:', err);
  }
  res.sendStatus(200);
});

// Get all containers
app.get('/', async (req, res) => {
  try {
    const readings = await db.collection('readings').find({}).toArray();
    res.json(readings);
  } catch (err) {
    console.error('Failed to fetch from MongoDB:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Register a name for an RFID
app.post('/register', async (req, res) => {
  const { rfid, name } = req.body;
  try {
    await db.collection('readings').updateOne(
      { rfid },
      { $set: { name } },
      { upsert: true }
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Failed to register name:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Delete a container
app.delete('/container/:rfid', async (req, res) => {
  console.log('Deleting rfid:', req.params.rfid);
  try {
    const result = await db.collection('readings').deleteOne({ rfid: req.params.rfid });
    console.log('Delete result:', result);
    res.sendStatus(200);
  } catch (err) {
    console.error('Failed to delete:', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Get all recipes
app.get('/recipes', async (req, res) => {
  try {
    const recipes = await db.collection('recipes').find({}).toArray();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get matched recipes based on current cabinet contents
app.get('/recipes/match', async (req, res) => {
  try {
    const readings = await db.collection('readings').find({ name: { $exists: true } }).toArray();
    const recipes = await db.collection('recipes').find({}).toArray();

    // Build ingredient map from cabinet: { "eggs": 300, "flour": 500, ... }
    const cabinet = {};
    for (const r of readings) {
      if (r.name && r.weight > 0) {
        cabinet[r.name.toLowerCase()] = r.weight;
      }
    }

    // For each recipe check if cabinet has enough of every ingredient
    const matched = recipes.map(recipe => {
      const missing = [];
      const available = [];

      for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
        const cabinetAmount = cabinet[ingredient.toLowerCase()] ?? 0;
        if (cabinetAmount >= amount) {
          available.push(ingredient);
        } else {
          missing.push({ ingredient, need: amount, have: cabinetAmount });
        }
      }

      return {
        ...recipe,
        available,
        missing,
        canMake: missing.length === 0,
        missingCount: missing.length,
      };
    });

    // Sort: fully makeable first, then by least missing
    matched.sort((a, b) => a.missingCount - b.missingCount);

    res.json(matched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to match recipes' });
  }
});

// Add a new recipe
app.post('/recipes', async (req, res) => {
  try {
    const result = await db.collection('recipes').insertOne(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add recipe' });
  }
});

// Update a recipe
app.put('/recipes/:id', async (req, res) => {
  try {
    await db.collection('recipes').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete a recipe
app.delete('/recipes/:id', async (req, res) => {
  try {
    await db.collection('recipes').deleteOne({ _id: new ObjectId(req.params.id) });
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

connectDB().then(() => {
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
});