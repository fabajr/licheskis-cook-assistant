// functions/middleware/auth.js
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
