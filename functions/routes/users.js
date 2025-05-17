// functions/routes/users.js
const express     = require('express');
const router      = express.Router();
const { db, admin } = require('../firebaseAdmin');

// POST /users/ — cria ou inicializa perfil
router.post('/', async (req, res) => {
  const userRef = db.collection('users').doc(req.uid);
  try {
    await userRef.set({
      id: req.uid,
      email: req.body.email,
      display_name: req.body.display_name,
      role: 'user',
      preferences: {},
      hormonal_cycle: req.body.hormonal_cycle || {},
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: req.uid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/me — lê perfil
router.get('/me', async (req, res) => {
  const snap = await db.collection('users').doc(req.uid).get();
  if (!snap.exists) return res.status(404).json({ error: 'User not found' });
  res.json(snap.data());
});

// PATCH /users/me — atualiza perfil
router.patch('/me', async (req, res) => {
  try {
    await db.collection('users').doc(req.uid).update({
      ...req.body,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
