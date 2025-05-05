// functions/index.js

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const cors = require("cors");

// Init
admin.initializeApp();
const db = getFirestore();

// App & middleware
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Router
const router = express.Router();

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Licheskis Cook Assistant API is running!");
});

// --- RECIPES --- 

// GET /recipes - Fetch all recipes
app.get("/recipes", async (req, res) => {
  try {
    const snap = await db.collection("recipes").get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(data);
  } catch (e) {
    console.error("Error fetching recipes:", e);
    return res.status(500).json({ error: "Failed to fetch recipes.", details: e.message });
  }
});

// GET /recipes/:id - Fetch a single recipe by ID
app.get("/recipes/:id", async (req, res) => {
  try {
    const recipeId = req.params.id;
    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required." });
    }
    const docRef = db.collection("recipes").doc(recipeId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Recipe not found." });
    }

    return res.json({ id: doc.id, ...doc.data() });

  } catch (e) {
    console.error(`Error fetching recipe ${req.params.id}:`, e);
    return res.status(500).json({ error: "Failed to fetch recipe.", details: e.message });
  }
});

// POST /recipes - Create a new recipe
app.post("/recipes", async (req, res) => {
  try {
    // Basic validation (can be expanded)
    const recipeData = req.body;
    if (!recipeData || !recipeData.name || !Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      return res.status(400).json({ error: "Missing required recipe data (name, ingredients)." });
    }

    // Add server-side timestamps
    const now = FieldValue.serverTimestamp();
    recipeData.created_at = now;
    recipeData.updated_at = now;

    // Save to Firestore
    const ref = await db.collection("recipes").add(recipeData);
    const doc = await ref.get(); // Fetch the created doc to get timestamps
    console.log("Recipe created with ID:", ref.id);
    return res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error("Error creating recipe:", e);
    return res.status(500).json({ error: "Failed to create recipe.", details: e.message });
  }
});

// --- INGREDIENTS --- (Keep existing ingredient routes)
app.get("/ingredients", async (req, res) => {
  try {
    const snap = await db.collection("ingredients").get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(data);
  } catch (e) {
    console.error("Error fetching ingredients:", e);
    return res.status(500).json({ error: "Failed to fetch ingredients.", details: e.message });
  }
});
app.post("/ingredients", async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: FieldValue.serverTimestamp() };
    const ref = await db.collection("ingredients").add(payload);
    const doc = await ref.get();
    return res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error("Error creating ingredient:", e);
    return res.status(500).json({ error: "Failed to create ingredient.", details: e.message });
  }
});

// --- RECIPE_INGREDIENTS --- (Keep existing recipe_ingredients routes)
app.get("/recipe_ingredients", async (req, res) => {
  try {
    const snap = await db.collection("recipe_ingredients").get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(data);
  } catch (e) {
    console.error("Error fetching recipe ingredients:", e);
    return res.status(500).json({ error: "Failed to fetch recipe ingredients.", details: e.message });
  }
});
app.post("/recipe_ingredients", async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: FieldValue.serverTimestamp() };
    const ref = await db.collection("recipe_ingredients").add(payload);
    const doc = await ref.get();
    return res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error("Error creating recipe ingredient:", e);
    return res.status(500).json({ error: "Failed to create recipe ingredient.", details: e.message });
  }
});



// Export
exports.api = functions.https.onRequest(app);

