// functions/routes/recipes.js
const { Router } = require('express');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const parseQuantity = require('../utils/parseQuantity'); // Assuming you have a utility function to parse quantities

const db = getFirestore();
const router = Router();

// GET /recipes
router.get('/recipes', async (req, res) => {
  try {
    const snap = await db.collection('recipes').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(data);
  } catch (e) {
    console.error('Error fetching recipes:', e);
    return res.status(500).json({ error: 'Failed to fetch recipes.', details: e.message });
  }
});



// POST /recipes
// functions/routes/recipes.js
router.post('/recipes', async (req, res) => {
  const {
    name,
    description = '',
    instructions = [],
    prep_time = null,
    servings  = null,
    category  = null,
    cycle_tags = [],
    image_url = null,
    ingredients = []
  } = req.body;

 // 1) Basic validation
 if (!name || !name.trim()) {
  return res.status(400).json({ error: 'Recipe name is required.' });
}
if (!category || !category.trim()) {
  return res.status(400).json({ error: 'Recipe category is required.' });
}
if (
  servings == null ||
  typeof servings !== 'number' ||
  !Number.isInteger(servings) ||
  servings <= 0
) {
  return res
    .status(400)
    .json({ error: 'Servings must be a positive integer.' });
}
if (!Array.isArray(ingredients) || ingredients.length === 0) {
  return res.status(400).json({ error: 'At least one ingredient is required.' });
}

  // 2) Normalize and sort instructions
  const instrClean = instructions
    .filter(i => i.text && i.text.trim())
    .sort((a, b) => a.step - b.step);

  try {
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

router.get('/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;
  
  try {
    // 1) Load recipe
    const recipeDoc = await db.collection('recipes').doc(recipeId).get();
    if (!recipeDoc.exists) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }
    
    // 1) fetch recipe data …
    const doc = await db.collection('recipes').doc(recipeId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    const recipeData = doc.data();

    // 2) fetch all recipe_ingredients links
    const linksSnap = await db
      .collection('recipe_ingredients')
      .where('recipe_id', '==', recipeId)
      .get();
    const links = linksSnap.docs.map(d => d.data());

    // 3) fetch all ingredient docs in parallel
    const ingDocs = await Promise.all(
      links.map(l => db.collection('ingredients').doc(l.ingredient_id).get())
    );

    // 4) build a map of existing masters + collect missing IDs
    const ingMap = {}; 
    const missing = [];
    ingDocs.forEach(snap => {
      if (snap.exists) ingMap[snap.id] = snap.data();
      else              missing.push(snap.id);
    });

    // 5) now safely build your ingredients array—skip any missing
    const ingredients = links
      .map(link => {
        const master = ingMap[link.ingredient_id];
        if (!master) {
          console.warn(`Orphaned link for ingredient ${link.ingredient_id}`);
          return null;
        }
        return {
          ingredient_id:  link.ingredient_id,
          name:           master.name,
          quantity:       link.quantity,
          unit:           link.unit,
          is_vegan:       master.is_vegan,
          is_gluten_free: master.is_gluten_free,
          kcal_per_unit:  master.kcal_per_unit,
          default_unit:   master.default_unit
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));


    // 6) Compute flags
    const recipeVegan       = ingredients.every(i => i.is_vegan);
    const recipeGlutenFree  = ingredients.every(i => i.is_gluten_free);

    // 7) Stub totalKcal (replace with your real sum logic later)
    // TODO: Implement proper logic to calculate totalKcal based on ingredients
    const totalKcal = ingredients.reduce(
      (sum, i) => sum + (i.quantity * i.kcal_per_unit),
      0
    );

    // 8) Convert cycle_tags codes to labels
    

    // 9) Return enriched payload
     return res.json({
      id:                 recipeId,
      ...recipeData,
      ingredients,
      recipeVegan,
      recipeGlutenFree,
      totalKcal,
      missingIngredients: missing,
      // recipeVegan, recipeGlutenFree, totalKcal, cycle_tags_labels…
    });
  } catch (err) {
    console.error('Error fetching recipe details:', err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

router.put('/recipes/:id', async (req, res) => {
  const recipeId = req.params.id;
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
  } = req.body;

  // 1) Basic validation
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Recipe name is required.' });
  }
  if (!category?.trim()) {
    return res.status(400).json({ error: 'Recipe category is required.' });
  }
  if (
    servings == null ||
    typeof servings !== 'number' ||
    !Number.isInteger(servings) ||
    servings <= 0
  ) {
    return res
      .status(400)
      .json({ error: 'Servings must be a positive integer.' });
  }
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res
      .status(400)
      .json({ error: 'At least one ingredient is required.' });
  }

  try {
    // 2) Transaction: update recipe + replace links atomically
    await db.runTransaction(async tx => {
      const recipeRef = db.collection('recipes').doc(recipeId);

      // 2a) update recipe fields
      tx.update(recipeRef, {
        name,
        description,
        instructions,
        prep_time,
        servings,
        category,
        cycle_tags,
        image_url,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 2b) delete old links
      const oldLinksSnap = await tx.get(
        db.collection('recipe_ingredients').where('recipe_id', '==', recipeId)
      );
      oldLinksSnap.forEach(docSnap => tx.delete(docSnap.ref));

      // 2c) create new links
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

    // 3) After commit, re-fetch & enrich payload
    const recipeSnap = await db.collection('recipes').doc(recipeId).get();
    const recipeData = recipeSnap.data();

    const linksSnap = await db
      .collection('recipe_ingredients')
      .where('recipe_id', '==', recipeId)
      .get();
    const links = linksSnap.docs.map(d => d.data());

    // fetch all ingredient masters
    const ingDocs = await Promise.all(
      links.map(l => db.collection('ingredients').doc(l.ingredient_id).get())
    );

    const ingMap = {};
    const missingIngredients = [];
    ingDocs.forEach(snap => {
      if (snap.exists) ingMap[snap.id] = snap.data();
      else missingIngredients.push(snap.id);
    });

    const ingredientsArray = links
      .map(l => {
        const master = ingMap[l.ingredient_id];
        if (!master) return null;
        return {
          ingredient_id:  l.ingredient_id,
          name:           master.name,
          quantity:       l.quantity,
          unit:           l.unit,
          is_vegan:       master.is_vegan,
          is_gluten_free: master.is_gluten_free,
          kcal_per_unit:  master.kcal_per_unit,
          default_unit:   master.default_unit
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    // compute recipe flags & totals
    const recipeVegan      = ingredientsArray.every(i => i.is_vegan);
    const recipeGlutenFree = ingredientsArray.every(i => i.is_gluten_free);
    const totalKcal        = ingredientsArray.reduce(
      (sum, i) => sum + i.kcal_per_unit * i.quantity,
      0
    );
    const cycle_tags_labels = (recipeData.cycle_tags || []).map(tag => {
      const opt = cyclePhaseOptions.find(o => o.value === tag);
      return opt ? opt.label : tag;
    });

    // 4) send enriched response
    return res.json({
      id:                  recipeId,
      ...recipeData,
      ingredients:         ingredientsArray,
      missingIngredients,
      recipeVegan,
      recipeGlutenFree,
      totalKcal,
      cycle_tags_labels
    });
  } catch (err) {
    console.error('Error updating recipe:', err);
    return res
      .status(500)
      .json({ error: 'Failed to update recipe.', details: err.message });
  }
});

// This router handles all recipe-related API endpoints, including creating, reading, updating, 
// and deleting recipes. It interacts with Firestore to manage recipe data and related ingredients.
module.exports = router;

