// functions/index.js
const functions = require('firebase-functions');
const express   = require('express');
const cors      = require('cors');

const auth                     = require('./middleware/auth');
const usersRouter              = require('./routes/users');
const recipesRouter            = require('./routes/recipes');
const ingredientsRouter        = require('./routes/ingredients');
const recipeIngredientsRouter  = require('./routes/recipe_ingredients');

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// health-check público
app.get('/ping', (req, res) => res.send('pong'));

// mount de usuários (exige token válido)
app.use('/users', auth, usersRouter);

// rotas de receitas, ingredientes e links
app.use('/recipes', recipesRouter);
app.use('/ingredients', ingredientsRouter);
app.use('/recipe_ingredients', recipeIngredientsRouter);

if (typeof window !== 'undefined') {
    window._auth = auth;
  }



exports.api = functions.https.onRequest(app);
