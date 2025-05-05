// functions/index.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = getFirestore();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/recipes", async (req, res) => {
  const incomingData = req.body;
  let recipeRef;
  try {
    if (!incomingData.name || !Array.isArray(incomingData.ingredients) || !incomingData.ingredients.length) {
      return res.status(400).json({ error: "Missing required recipe data (name, ingredients)." });
    }
    const now = FieldValue.serverTimestamp();

    // 1. Create main recipe document
    const mainRecipeData = {
      name: incomingData.name,
      description: incomingData.description || null,
      instructions: incomingData.instructions || [],
      prep_time: incomingData.prep_time || null,
      servings: incomingData.servings || null,
      category: incomingData.category || null,
      cycle_tags: incomingData.cycle_tags || [],
      image_url: incomingData.image_url || null,
      total_calories: null,
      is_vegan: null,
      is_gluten_free: null,
      created_at: now,
      updated_at: now,
    };
    recipeRef = await db.collection("recipes").add(mainRecipeData);
    const recipeId = recipeRef.id;

    // 2. Inline creation of any new ingredients
    for (const ing of incomingData.ingredients) {
      if (!ing.ingredient_id && ing.category) {
        // Build payload from inline metadata
        const newIng = {
          name: ing.name,
          aliases: ing.aliases || [],
          category: ing.category,
          default_unit: ing.default_unit || ing.unit || null,
          kcal_per_unit: ing.kcal_per_unit || null,
          is_vegan: ing.is_vegan || false,
          is_gluten_free: ing.is_gluten_free || false,
          alternative_units: ing.alternative_units || [],
          createdAt: now,
          updatedAt: now,
        };
        const newRef = await db.collection("ingredients").add(newIng);
        ing.ingredient_id = newRef.id;
      }
    }

    // 3. Save all recipe_ingredients
    const ingredientPromises = incomingData.ingredients.map(async ing => {
      const quantityNum = parseQuantity(ing.quantity);
      if (quantityNum <= 0) return;
      const recipeIngredientData = {
        recipe_id: recipeId,
        ingredient_id: ing.ingredient_id,
        name: ing.name,
        quantity: quantityNum,
        unit: ing.unit,
        fdcId: ing.fdcId || null,
        calculatedKcal: ing.calculatedKcal || null,
        created_at: now,
        updated_at: now,
      };
      return db.collection("recipe_ingredients").add(recipeIngredientData);
    });
    await Promise.all(ingredientPromises);

    const finalDoc = await recipeRef.get();
    return res.status(201).json({ id: finalDoc.id, ...finalDoc.data() });
  } catch (e) {
    console.error("Error creating recipe:", e);
    if (recipeRef) {
      await db.collection("recipes").doc(recipeRef.id).delete();
    }
    return res.status(500).json({ error: "Failed to create recipe.", details: e.message });
  }
});

// Export
exports.api = functions.https.onRequest(app);