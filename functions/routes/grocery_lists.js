// functions/routes/grocery_lists.js

const { Router } = require('express');
const auth = require('../middleware/auth');
const { db } = require('../firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const router = Router();

// Helper: validate and normalize payload for grocery list
function buildGroceryListPayload(body, uid) {
  const { meal_plan_id, items } = body;

  if (!Array.isArray(meal_plan_id) || meal_plan_id.length === 0) {
    const err = new Error('At least one meal_plan_id is required.');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Items array must contain at least one ingredient.');
    err.status = 400;
    throw err;
  }
  
  return {
    user_id:       uid,
    meal_plan_id,  // array of plan IDs
    items,         // [{ ingredient_id, name, category, quantity, unit }]
    created_at:    FieldValue.serverTimestamp(),
    updated_at:    FieldValue.serverTimestamp()
  };
}

// apply authentication to all routes
router.use(auth);

// GET /grocery_lists
router.get('/',auth, async (req, res) => {
  try {
    const uid = req.uid;
    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('grocery_lists')
      .orderBy('created_at', 'desc')
      .get();

    const lists = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(lists);
  } catch (err) {
    console.error('[GET /grocery_lists] error', req.uid, err);
    return res.status(500).json({ error: 'Failed to fetch grocery lists.' });
  }
});

// GET /grocery_lists/:id
router.get('/:id', auth,  async (req, res) => {
  try {
    const uid   = req.uid;
    const listId = req.params.id;
    const ref   = db
      .collection('users')
      .doc(uid)
      .collection('grocery_lists')
      .doc(listId);

    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Grocery list not found.' });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[GET /grocery_lists/:id] error', req.uid, req.params.id, err);
    return res.status(500).json({ error: 'Failed to fetch grocery list.' });
  }
});

// POST /grocery_lists
router.post('/', auth, async (req, res) => {
  try {
    const uid     = req.uid;
    const payload = buildGroceryListPayload(req.body, uid);
    const ref     = await db
      .collection('users')
      .doc(uid)
      .collection('grocery_lists')
      .add(payload);

    const created = await ref.get();
    return res.status(201).json({ id: created.id, ...created.data() });
  } catch (err) {
    console.error('[POST /grocery_lists] error', req.uid, err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

// PUT /grocery_lists/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const uid      = req.uid;
    const listId   = req.params.id;
    const payload  = buildGroceryListPayload(req.body, uid);
    payload.updated_at = FieldValue.serverTimestamp();

    const ref = db
      .collection('users')
      .doc(uid)
      .collection('grocery_lists')
      .doc(listId);

    await ref.update(payload);
    const updated = await ref.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('[PUT /grocery_lists/:id] error', req.uid, req.params.id, err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

// DELETE /grocery_lists/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const uid    = req.uid;
    const listId = req.params.id;
    await db
      .collection('users')
      .doc(uid)
      .collection('grocery_lists')
      .doc(listId)
      .delete();

    return res.status(204).end();
  } catch (err) {
    console.error('[DELETE /grocery_lists/:id] error', req.uid, req.params.id, err);
    return res.status(500).json({ error: 'Failed to delete grocery list.' });
  }
});

module.exports = router;
