const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

// Create Express app
const app = express();

// Automatically allow cross-origin requests (important for development)
app.use(cors({ origin: true }));

// Middleware to parse JSON request bodies
app.use(express.json());

// --- API Routes --- 

// Test Route
app.get("/"), (req, res) => {
  res.status(200).send("Lich. Cook Assistant API is running!");
});

// POST /recipes - Create a new recipe
app.post("/recipes", async (req, res) => {
  try {
    const recipeData = req.body; // Get data from the frontend

    // Basic validation (can be expanded)
    if (!recipeData || !recipeData.name || !recipeData.ingredients || recipeData.ingredients.length === 0) {
      return res.status(400).send({ error: "Missing required recipe data (name, ingredients)." });
    }

    // TODO: Add more validation based on schema
    // TODO: Process ingredients (e.g., check/add to ingredients collection)
    // TODO: Calculate total_calories, is_vegan, is_gluten_free

    // Add timestamps
    const now = admin.firestore.FieldValue.serverTimestamp();
    recipeData.created_at = now;
    recipeData.updated_at = now;

    // Add the recipe to the 'recipes' collection in Firestore
    const recipeRef = await db.collection("recipes").add(recipeData);

    console.log("Recipe created with ID:", recipeRef.id);
    // Return the created recipe data along with its new ID
    res.status(201).send({ id: recipeRef.id, ...recipeData }); 

  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).send({ error: "Failed to create recipe.", details: error.message });
  }
});

// GET /recipes - Get all recipes (add later)
// GET /recipes/:id - Get a specific recipe (add later)
// PUT /recipes/:id - Update a recipe (add later)
// DELETE /recipes/:id - Delete a recipe (add later)

// --- Export the Express API as a Cloud Function --- 
// The name 'api' here matches the rewrite rule in firebase.json
exports.api = functions.https.onRequest(app) ;

