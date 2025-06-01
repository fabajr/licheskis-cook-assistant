// functions/routes/ingredients.js
const { FieldValue } = require('firebase-admin/firestore');

const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db, admin } = require('../firebaseAdmin');

// GET /ingredients
router.get('/', async (req, res) => {
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
router.post('/', auth,  async (req, res) => {
  try {
    const payload = { ...req.body, created_at: FieldValue.serverTimestamp() };
    const ref = await db.collection('ingredients').add(payload);
    const doc = await ref.get();
    return res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('Error creating ingredient:', e);
    return res.status(500).json({ error: 'Failed to create ingredient.', details: e.message });
  }
});


// PUT /ingredients/:id
router.put('/:id', auth, async (req, res) => {
  // só admin pode editar
  const userSnap = await db.collection('users').doc(req.uid).get();
  if (!userSnap.exists || userSnap.data().role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await db.collection('ingredients')
      .doc(req.params.id)
      .update({ ...req.body, updated_at: FieldValue.serverTimestamp() });
    const doc = await db.collection('ingredients').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /ingredients/:id
router.delete('/:id', auth, async (req, res) => {
  const ingredientId = req.params.id;
  const userSnap = await db.collection('users').doc(req.uid).get();
  if (!userSnap.exists || userSnap.data().role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // 1) Começa batch
    const batch = db.batch();

    // 2) Agenda deleção do próprio ingrediente
    const ingredientRef = db.collection('ingredients').doc(ingredientId);
    batch.delete(ingredientRef);

    // 3) Busca todas as relações em recipe_ingredients
    const relsSnap = await db
      .collection('recipe_ingredients')
      .where('ingredient_id', '==', ingredientId)
      .get();

    // 4) Agenda deleção de cada relação
    relsSnap.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 5) Executa batch
    await batch.commit();

    // 6) Responde sem conteúdo
    return res.status(204).end();
  } catch (e) {
    console.error('Erro ao deletar ingredient e suas relações:', e);
    return res.status(500).json({ error: e.message });
  }
});


module.exports = router;
