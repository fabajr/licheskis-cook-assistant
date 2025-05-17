// functions/firebaseAdmin.js
const admin = require('firebase-admin');

// Inicializa o Firebase Admin SDK  
// Se estiver no Cloud Functions, não precisa de chave — ele já pega a credencial do projeto.
// Se for local, configure GOOGLE_APPLICATION_CREDENTIALS antes de rodar o emulator ou deploy.

admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db };