// functions/index.js
const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const express   = require('express');
const cors      = require('cors');

admin.initializeApp();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// mount each resource router
app.use('/api', require('./routes/recipes'));
app.use('/api', require('./routes/ingredients'));
app.use('/api', require('./routes/recipe_ingredients'));

exports.api = functions.https.onRequest(app);
