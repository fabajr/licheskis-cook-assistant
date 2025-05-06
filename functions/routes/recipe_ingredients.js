// functions/routes/recipeIngredients.js
const { Router } = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();
const router = Router();

// GET /recipe_ingredients
router.get('/recipe_ingredients', async (req, res) => {
  try {
    const snap = await db.collection('recipe_ingredients').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(data);
  } catch (e) {
    console.error('Error fetching recipe_ingredients:', e);
    return res.status(500).json({ error: 'Failed to fetch recipe_ingredients.', details: e.message });
  }
});

// POST /recipe_ingredients
router.post('/recipe_ingredients', async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: FieldValue.serverTimestamp() };
    const ref = await db.collection('recipe_ingredients').add(payload);
    const doc = await ref.get();
    return res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('Error creating recipe ingredient:', e);
    return res.status(500).json({ error: 'Failed to create recipe ingredient.', details: e.message });
  }
});

module.exports = router;
