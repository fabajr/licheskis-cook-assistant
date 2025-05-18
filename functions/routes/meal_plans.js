// functions/routes/meal_plans.js
const { FieldValue } = require('firebase-admin/firestore');

const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db, admin } = require('../firebaseAdmin');

