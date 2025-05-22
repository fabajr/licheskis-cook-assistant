// functions/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { db, admin } = require('../firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

// POST /users/ — cria ou inicializa perfil
router.post('/', auth, async (req, res) => {
  const userRef = db.collection('users').doc(req.uid);
  try {
    await userRef.set({
      id: req.uid,
      email: req.body.email,
      display_name: req.body.display_name,
      role: 'user',
      preferences: {},
      hormonal_cycle: req.body.hormonal_cycle || {},
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: req.uid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/me — lê perfil
// GET /users/me — Retrieve user profile (with fallback upsert from Auth data)
router.get('/me', auth, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      // Fallback: create profile using Firebase Auth record
      const userRecord = await admin.auth().getUser(req.uid);
      const defaultProfile = {
        id: req.uid,
        email: userRecord.email || '',
        display_name: userRecord.displayName || '',
        role: 'user',
        preferences: {},
        hormonal_cycle: {},
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      };

      await userRef.set(defaultProfile);
      return res.json(defaultProfile);
    }

    return res.json(snap.data());
  } catch (err) {
    console.error('Error in GET /users/me:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /users/me — atualiza perfil
router.patch('/me', auth, async (req, res) => {
  try {
    await db.collection('users').doc(req.uid).update({
      ...req.body,
      updated_at: FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


