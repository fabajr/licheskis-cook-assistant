// functions/routes/ingredients.js
const { Router } = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();
const router = Router();

// GET /ingredients
router.get('/ingredients', async (req, res) => {
  try {
    const q = req.query.search || '';
    const snap = await db.collection('ingredients').get();
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(lower));
    }
    return res.json(list);
  } catch (e) {
    console.error('Error fetching ingredients:', e);
    return res.status(500).json({ error: 'Failed to fetch ingredients.', details: e.message });
  }
});

// POST /ingredients
router.post('/ingredients', async (req, res) => {
  try {
    const payload = { ...req.body, createdAt: FieldValue.serverTimestamp() };
    const ref = await db.collection('ingredients').add(payload);
    const doc = await ref.get();
    return res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('Error creating ingredient:', e);
    return res.status(500).json({ error: 'Failed to create ingredient.', details: e.message });
  }
});

module.exports = router;
