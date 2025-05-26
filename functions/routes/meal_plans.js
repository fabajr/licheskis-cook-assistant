// functions/routes/meal_plans.js

const { Router } = require('express');
const auth = require('../middleware/auth');
const { db } = require('../firebaseAdmin');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const router = Router();

// Helper: valida e normaliza payload
function buildMealPlanPayload(body, uid) {
  const { name, start_date, end_date, days } = body;

  if (!Array.isArray(days) || days.length === 0) {
    const err = new Error('É obrigatório fornecer ao menos um dia de plano.');
    err.status = 400;
    throw err;
  }

  return {
    user_id:    uid,
    name:       name || 'Untitled',
    start_date: Timestamp.fromDate(new Date(start_date)),
    end_date:   Timestamp.fromDate(new Date(end_date)),
    days:       days.map(d => ({
      date:            Timestamp.fromDate(new Date(d.date)),
      hormonal_phase:  d.hormonal_phase,    // ← adiciona aqui
      meals:           d.meals
    })),
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp()
  };
}

// Aplica middleware de auth em todos os endpoints
router.use(auth);

/**
 * GET /meal-plans
 */
router.get('/', auth, async (req, res) => {
  try {
    const snap = await db
      .collection('users')
      .doc(req.uid)
      .collection('meal_plans')
      .orderBy('start_date', 'desc')
      .get();

    const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meal plans', details: err.message });
  }
});

/**
 * GET /meal-plans/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const ref = db
      .collection('users')
      .doc(req.uid)
      .collection('meal_plans')
      .doc(req.params.id);

    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Meal plan não encontrado.' });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[GET /meal-plans/:id] error', req.uid, req.params.id, err);
    return res
      .status(500)
      .json({ error: 'Falha ao buscar meal plan.', details: err.message });
  }
});

/**
 * POST /meal-plans
 */
router.post('/', async (req, res) => {
  try {
    const payload = buildMealPlanPayload(req.body, req.uid);
    console.log('[POST /meal-plans] payload:', JSON.stringify(payload, null, 2));
    const ref = await db
      .collection('users')
      .doc(req.uid)
      .collection('meal_plans')
      .add(payload);

    const created = await ref.get();
    return res.status(201).json({ id: created.id, ...created.data() });
  } catch (err) {
    console.error('[POST /meal-plans] error', req.uid, err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

/**
 * PUT /meal-plans/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const payload = buildMealPlanPayload(req.body, req.uid);
    // atualiza updated_at
    payload.updated_at = FieldValue.serverTimestamp();

    const ref = db
      .collection('users')
      .doc(req.uid)
      .collection('meal_plans')
      .doc(req.params.id);

    await ref.update(payload);
    const updated = await ref.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('[PUT /meal-plans/:id] error', req.uid, req.params.id, err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

/**
 * DELETE /meal-plans/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const ref = db
      .collection('users')
      .doc(req.uid)
      .collection('meal_plans')
      .doc(req.params.id);

    await ref.delete();
    return res.status(204).end();
  } catch (err) {
    console.error('[DELETE /meal-plans/:id] error', req.uid, req.params.id, err);
    return res
      .status(500)
      .json({ error: 'Falha ao deletar meal plan.', details: err.message });
  }
});

module.exports = router;
