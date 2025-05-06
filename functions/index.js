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

// --- Helper Functions --- 

// Basic function to parse quantity (handles fractions like "1/2")
// Duplicated from frontend for backend validation/parsing
function parseQuantity(qtyStr) {
  if (typeof qtyStr !== "string") {
    // If it's already a number, return it
    if (typeof qtyStr === "number" && !isNaN(qtyStr)) {
      return qtyStr;
    }
    console.warn(`parseQuantity expected string, got ${typeof qtyStr}`);
    return 0; // Or handle error appropriately
  }
  qtyStr = qtyStr.trim();
  if (qtyStr.includes("/")) {
    const parts = qtyStr.split("/");
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }
  const num = parseFloat(qtyStr);
  return isNaN(num) ? 0 : num;
}


// --- Routes --- 

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Licheskis Cook Assistant API is running!");
});

// --- RECIPES --- 

// GET /recipes - Fetch all recipes
app.get("/recipes", async (req, res) => {
  try {
    const snap = await db.collection("recipes").get();
    // Add the document ID to the data
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
    // Add the document ID to the data
    return res.json({ id: doc.id, ...doc.data() }); 

  } catch (e) {
    console.error(`Error fetching recipe ${req.params.id}:`, e);
    return res.status(500).json({ error: "Failed to fetch recipe.", details: e.message });
  }
});

// POST /recipes - Create a new recipe (Refactored for Schema Compliance)
app.post("/recipes", async (req, res) => {
  const incomingData = req.body;
  let recipeRef = null; // To store the reference to the created recipe document

  try {
    // 1. Validate incoming data
    if (!incomingData || !incomingData.name || !Array.isArray(incomingData.ingredients) || incomingData.ingredients.length === 0) {
      return res.status(400).json({ error: "Missing required recipe data (name, ingredients)." });
    }

    const now = FieldValue.serverTimestamp();

    // 2. Prepare main recipe data (excluding ingredients array)
    const mainRecipeData = {
      name: incomingData.name,
      description: incomingData.description || null, // Add description if present
      instructions: incomingData.instructions || [],
      prep_time: incomingData.prep_time || null,
      servings: incomingData.servings || null,
      category: incomingData.category || null,
      cycle_tags: incomingData.cycle_tags || [],
      image_url: incomingData.image_url || null,
      // Placeholders for derived fields - calculation logic to be added later
      total_calories: null, 
      is_vegan: null, 
      is_gluten_free: null,
      created_at: now,
      updated_at: now,
    };

    // 3. Save main recipe data to 'recipes' collection
    recipeRef = await db.collection("recipes").add(mainRecipeData);
    const recipeId = recipeRef.id;
    console.log("Main recipe document created with ID:", recipeId);

    // 4. Process and save ingredients to 'recipe_ingredients' collection

    const ingredientTasks = incomingData.ingredients.map(async ing => {
      const qty = parseQuantity(ing.quantity);
      if (qty <= 0) {
        console.warn(`Skipping invalid quantity for ingredient: ${ing.name}`);
        return;
      }
  
      // 4.1. Se não houve ID, cria novo ingrediente em 'ingredients'
      let ingredientId = ing.ingredient_id;
      if (!ingredientId) {
        const newIng = {
          name:           ing.name,
          aliases:        ing.aliases       || [],
          category:       ing.category      || null,
          default_unit:   ing.default_unit  || null,
          kcal_per_unit:  ing.kcal_per_unit || null,
          is_vegan:       ing.is_vegan      || false,
          is_gluten_free: ing.is_gluten_free|| false,
          alternative_units: ing.alternative_units || [],
          createdAt:      now,
          updatedAt:      now,
        };
        const ref = await db.collection("ingredients").add(newIng);
        ingredientId = ref.id;
      }
  
      // 4.2. Agora liga ingrediente à receita
      const ri = {
        recipe_id:     recipeId,
        ingredient_id: ingredientId,
        quantity:      qty,
        unit:          ing.unit         || null,
        created_at:    now,
        updated_at:    now,
      };
      await db.collection("recipe_ingredients").add(ri);
    });
    await Promise.all(ingredientTasks);

    /*
    const ingredientPromises = incomingData.ingredients.map(async (ing) => {
      const quantityNum = parseQuantity(ing.quantity); // Parse quantity string to number
      if (quantityNum <= 0) {
        console.warn(`Skipping ingredient with invalid quantity: ${ing.name} (${ing.quantity})`);
        return; // Skip if quantity is invalid
      }

      const recipeIngredientData = {
        recipe_id: recipeId, // Link to the created recipe
        ingredient_id: ing.ingredient_id || null, // Link to ingredients collection (if available)
        name: ing.name || "Unnamed Ingredient", // Ingredient name from frontend
        quantity: quantityNum, // Parsed numeric quantity
        unit: ing.unit || null, // Unit from frontend
        fdcId: ing.fdcId || null, // Store FDC ID if available
        calculatedKcal: ing.calculatedKcal || null, // Store calculated kcal if available
        created_at: now,
        updated_at: now,
      };
      // Add a new document to recipe_ingredients
      return db.collection("recipe_ingredients").add(recipeIngredientData);
    });

    // Wait for all ingredient documents to be created
    await Promise.all(ingredientPromises);

    */
    console.log(`Processed ${incomingData.ingredients.length} ingredients for recipe ${recipeId}`);

    // 5. TODO: Implement logic to calculate derived fields (total_calories, is_vegan, is_gluten_free)
    // This might involve fetching ingredient details based on ingredient_id or fdcId
    // and then updating the main recipe document using recipeRef.update({...})

    // 6. Fetch the final main recipe document to return
    const finalRecipeDoc = await recipeRef.get();
    return res.status(201).json({ id: finalRecipeDoc.id, ...finalRecipeDoc.data() });

  } catch (e) {
    console.error("Error creating recipe and ingredients:", e);
    // Optional: Add cleanup logic here if needed (e.g., delete the main recipe if ingredient saving failed)
    // if (recipeRef) { ... await recipeRef.delete(); ... }
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












