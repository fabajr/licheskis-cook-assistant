// functions/index.js
const { onRequest } = require('firebase-functions/v2/https');
const express   = require('express');
const cors      = require('cors');

const auth                     = require('./middleware/auth');
const usersRouter              = require('./routes/users');
const recipesRouter            = require('./routes/recipes');
const ingredientsRouter        = require('./routes/ingredients');
const recipeIngredientsRouter  = require('./routes/recipe_ingredients');
const mealPlanRouter           = require('./routes/meal_plans');
const groceryListRouter        = require('./routes/grocery_lists');

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

// mount de plano alimentar (exige token válido)
app.use('/meal_plans', auth, mealPlanRouter);

app.use('/grocery_lists' , auth, groceryListRouter);


if (typeof window !== 'undefined') {
    window._auth = auth;
  }




// “envelope” que expõe o app em / **e** em /api
const root = express();
root.use(cors({ origin: true }));
root.use(express.json());

// roda o mesmo app sem prefixo (emulador)
root.use('/', app);
// roda o mesmo app com /api (produção via Hosting rewrite)
root.use('/api', app);

// exporta como função Gen2
exports.api = onRequest({ region: 'us-central1' }, root);