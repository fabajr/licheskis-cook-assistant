// functions/routes/recipes.js
const { Router } = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const parseQuantity = require('../utils/parseQuantity'); // Assuming you have a utility function to parse quantities

const db = getFirestore();
const router = Router();

// GET /recipes
router.get('/recipes', async (req, res) => {
  try {
    const snap = await db.collection('recipes').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(data);
  } catch (e) {
    console.error('Error fetching recipes:', e);
    return res.status(500).json({ error: 'Failed to fetch recipes.', details: e.message });
  }
});

// GET /recipes/:id
router.get('/recipes/:id', async (req, res) => {
  try {
    const doc = await db.collection('recipes').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Recipe not found.' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('Error fetching recipe:', e);
    return res.status(500).json({ error: 'Failed to fetch recipe.', details: e.message });
  }
});

// POST /recipes
router.post('/recipes', async (req, res) => {
  try {
    const incomingData = { ...req.body, createdAt: FieldValue.serverTimestamp() };
    const recipeRef = await db.collection('recipes').add(incomingData);
    const recipeId = recipeRef.id;

    // Process ingredients (example: write to recipe_ingredients)
    const ingredientPromises = incomingData.ingredients.map(async ing => {
      const qty = parseQuantity(ing.quantity);
      if (qty <= 0) return;
      // Insert new ingredient if needed, then link…
      /* your existing logic */
    });
    await Promise.all(ingredientPromises);

    return res.status(201).json({ id: recipeId });
  } catch (e) {
    console.error('Error creating recipe:', e);
    return res.status(500).json({ error: 'Failed to create recipe.', details: e.message });
  }
});

module.exports = router;
