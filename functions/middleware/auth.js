// functions/middleware/auth.js

// Middleware to authenticate requests using Firebase Auth
// This middleware checks for a valid Firebase ID token in the Authorization header
// and verifies it using Firebase Admin SDK.
// If the token is valid, it adds the user's UID to the request object and calls next().
// If the token is missing or invalid, it responds with a 401 Unauthorized status.
// This middleware is used to protect routes that require authentication.

const { admin } = require('../firebaseAdmin');

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;
