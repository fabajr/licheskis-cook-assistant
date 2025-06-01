// functions/triggers/users.js
const { onUserCreated } = require('firebase-functions/v2/auth');
const { db } = require('../firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

// toda vez que um usuário é criado no Auth, gera o documento em Firestore
exports.createUserProfile = onUserCreated(
  { region: 'us-central1' },
  async (event) => {
    const user = event.data;
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      email: user.email,
      display_name: user.displayName || '',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
);
