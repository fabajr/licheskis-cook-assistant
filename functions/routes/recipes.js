// functions/routes/recipes.js
const { Router }                = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { parseQuantity }         = require('../utils/parseQuantity'); // Assuming this is the correct path
const { sanitizeAndValidateRecipe } = require('../utils/recipeValidation'); // Assuming this is the correct path

const db = getFirestore();
const router = Router();


/**
 * Helper function to fetch and enrich a recipe by ID.
 * This replicates the logic from the GET /recipes/:id route.
 */
async function getEnrichedRecipe(recipeId) {

  if (!recipeId) throw new Error('Recipe ID is required');
  const snap = await db.collection('recipes').doc(recipeId).get();
  if (!snap.exists) throw new Error('Recipe not found');
  const data = snap.data();

  const linksSnap = await db
    .collection('recipe_ingredients')
    .where('recipe_id', '==', recipeId)
    .get();
  const links = linksSnap.docs.map(d => d.data());

  const ingDocs = await Promise.all(
    links.map(l => db.collection('ingredients').doc(l.ingredient_id).get())
  );

  const ingMap = {};
  const missing = [];
  ingDocs.forEach(docSnap => {
    if (docSnap.exists) ingMap[docSnap.id] = docSnap.data();
    else missing.push(docSnap.id);
  });

  const ingredients = links
    .map(l => {
      const m = ingMap[l.ingredient_id];
      if (!m) return null;
      return {
        ingredient_id:  l.ingredient_id,
        name:           m.name,
        quantity:       l.quantity,
        unit:           l.unit,
        is_vegan:       m.is_vegan,
        is_gluten_free: m.is_gluten_free,
        kcal_per_unit:  m.kcal_per_unit,
        default_unit:   m.default_unit
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const recipeVegan      = ingredients.every(i => i.is_vegan);
  const recipeGlutenFree = ingredients.every(i => i.is_gluten_free);
  const totalKcal        = ingredients.reduce((sum, i) => sum + i.kcal_per_unit * i.quantity, 0);

  return {
    id:                  recipeId,
    ...data,
    ingredients,
    recipeVegan,
    recipeGlutenFree,
    totalKcal,
    missingIngredients:  missing,
  };
}


/**
 * GET /recipes?limit=50&startAfter=<docId>
 * Supports optional pagination.
 */
const PAGE_SIZE = 10;

router.get('/recipes', async (req, res) => {
  try {
    let query = db
      .collection('recipes')
      .orderBy('category', 'desc')      // ordenação explícita
      .limit(PAGE_SIZE);

    if (req.query.nextPageToken) {
      // paginar a partir do último documentId
      query = db
        .collection('recipes')
        .orderBy('__name__')             // orderBy no documentID
        .startAfter(req.query.nextPageToken)
        .limit(PAGE_SIZE);
    }

    const snap = await query.get();
    const recipes = snap.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));

    // se veio exatamente PAGE_SIZE docs, ainda há mais
    const hasMore = snap.docs.length === PAGE_SIZE;
    const nextPageToken = hasMore
      ? snap.docs[snap.docs.length - 1].id
      : null;

    return res.json({ recipes, nextPageToken });
  } catch (err) {
    console.error('GET /recipes error:', err);
    return res
      .status(500)
      .json({ error: 'Internal error', details: err.message });
  }
});

/**
 * GET /recipes/:id
 * Returns recipe with joined ingredients, flags, and totals.
 */
router.get('/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;
  try {
    const enriched = await getEnrichedRecipe(recipeId);
    return res.json(enriched);
  } catch (err) {
    console.error(`GET /recipes/${recipeId} error:`, err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

// POST /recipes
// functions/routes/recipes.js
router.post('/recipes', async (req, res) => {
  
  try {
    
  const recipeData = sanitizeAndValidateRecipe(req.body); // Validate and sanitize input

  const {
      name,
      description,
      instructions = [],
      prep_time,
      servings,
      category,
      cycle_tags = [], 
      image_url,
      ingredients
    } = recipeData;

  // 2) Normalize and sort instructions
  const instrClean = instructions
    .filter(i => i.text && i.text.trim())
    .sort((a, b) => a.step - b.step);

  
    // 3) Create the recipe document
    const recipeRef = db.collection('recipes').doc();
    await recipeRef.set({
      name:        name.trim(),
      description: description.trim(),
      instructions: instrClean,
      prep_time,
      servings,
      category,
      cycle_tags,
      image_url,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 4) For each ingredient, possibly create it, then link in recipe_ingredients
    const linkPromises = ingredients.map(async ing => {
      let ingredientId = ing.ingredient_id;

      // a) If new, create in `ingredients` collection first
      if (ing.isNew) {
        const newIngRef = db.collection('ingredients').doc();
        await newIngRef.set({
          name:              ing.name.trim(),
          aliases:           ing.aliases || [],
          category:          ing.category,
          default_unit:      ing.default_unit,
          kcal_per_unit:     ing.kcal_per_unit,
          is_vegan:          ing.is_vegan,
          is_gluten_free:    ing.is_gluten_free,
          alternative_units: ing.alternative_units || []
        });
        ingredientId = newIngRef.id;
      }

      // b) Link into recipe_ingredients
      const linkRef = db.collection('recipe_ingredients').doc();
      return linkRef.set({

        recipe_id:     recipeRef.id,
        ingredient_id: ingredientId,
        quantity:      parseQuantity(String(ing.quantity)),
        unit:          ing.unit
      });
    });

    // 5) Wait for all ingredient‐link writes to finish
    await Promise.all(linkPromises);

    // 6) Respond success
    return res.status(201).json({ id: recipeRef.id });
  } catch (err) {
    console.error('Error creating recipe:', err);
    return res
      .status(500)
      .json({ error: 'Failed to create recipe.', details: err.message });
  }
});

/**
 * PUT /recipes/:id
 * Atomic update of recipe + links, then return enriched payload.
 */
router.put('/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;
  if (!recipeId) return res.status(400).json({ error: 'Recipe ID is required' });

  try {

    const recipeData = sanitizeAndValidateRecipe(req.body); // Validate and sanitize input

    const {
      name,
      description,
      instructions,
      prep_time,
      servings,
      category,
      cycle_tags,
      image_url,
      ingredients
    } = recipeData;

    // Atomic transaction: update recipe & replace links
    await db.runTransaction(async tx => {
      const recRef = db.collection('recipes').doc(recipeId);
      tx.update(recRef, {
        name,
        description,
        instructions: Array.isArray(instructions)
          ? instructions.filter(i => typeof i.text === 'string' && i.text.trim())
          : [],
        prep_time,
        servings: Number(servings),
        category,
        cycle_tags,
        image_url,
        updatedAt: FieldValue.serverTimestamp()
      });

      const oldLinks = await tx.get(
        db.collection('recipe_ingredients').where('recipe_id', '==', recipeId)
      );
      oldLinks.forEach(docSnap => tx.delete(docSnap.ref));

      ingredients.forEach(ing => {
        const linkRef = db.collection('recipe_ingredients').doc();
        tx.set(linkRef, {
          recipe_id:     recipeId,
          ingredient_id: ing.ingredient_id,
          quantity:      ing.quantity,
          unit:          ing.unit
        });
      });
    });

    // Reuse GET logic for enriched response
    // Ideally extract into a helper; for brevity, call GET handler internally
    const enriched = await getEnrichedRecipe(recipeId);
    return res.json(enriched);

  } catch (err) {
    console.error(`PUT /recipes/${recipeId} error:`, err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

module.exports = router;