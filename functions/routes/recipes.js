// functions/routes/recipes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db, admin } = require('../firebaseAdmin');


const { sanitizeAndValidateRecipe } = require('../utils/recipeValidation');
const parseQuantity         = require('../utils/parseQuantity'); // Assuming this is the correct path


const { FieldValue } = require('firebase-admin/firestore');

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
      if (!m) {
          console.warn(`Orphaned link for ingredient ${l.ingredient_id}`);
          return null;
        }
      return {
        ingredient_id:  l.ingredient_id,
        name:           m.name,
        quantity:       l.quantity,
        unit:           l.unit,
        is_vegan:       m.is_vegan,
        is_gluten_free: m.is_gluten_free,
        kcal_per_unit:  m.kcal_per_unit,
        default_unit:   m.default_unit,
        category:       m.category,
        alternative_units: m.alternative_units || [],
        aliases:        m.aliases || [],
        
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
const PAGE_SIZE = 100;

router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.post('/', auth, async (req, res) => {
  // 1) Verifica se é admin
  try {
    const userSnap = await db.collection('users').doc(req.uid).get();
    if (!userSnap.exists || userSnap.data().role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (err) {
    console.error('Erro ao verificar role:', err);
    return res.status(500).json({ error: 'Internal error' });
  }

  try {
    // 2) Sanitiza e valida payload
    const recipeData = sanitizeAndValidateRecipe(req.body);
    const {
      name,
      description,
      instructions = [],
      prep_time,
      servings,
      category,
      cycle_tags = [],
      image_url,
      ingredients = []
    } = recipeData;

    // 3) Normaliza e ordena instruções
    const instrClean = instructions
      .filter(i => typeof i.text === 'string' && i.text.trim())
      .sort((a, b) => a.step - b.step)
      .map(i => ({ step: i.step, text: i.text.trim() }));

    // 4) Cria documento de receita
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
      created_at:   FieldValue.serverTimestamp(),
      updated_at:   FieldValue.serverTimestamp()
    });

    // 5) Cria promessas para ingredientes e links
    const linkPromises = ingredients.map(ing => {
      // retorna Promise que resolve no ID correto do ingrediente
      const ingredientIdPromise = ing.isNew
        ? (async () => {
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
            return newIngRef.id;
          })()
        : Promise.resolve(ing.ingredient_id);

      // após obter o ID, cria o link em recipe_ingredients
      return ingredientIdPromise.then(ingredientId => {
        const linkRef = db.collection('recipe_ingredients').doc();
        return linkRef.set({
          recipe_id:     recipeRef.id,
          ingredient_id: ingredientId,
          quantity:      parseQuantity(String(ing.quantity)),
          unit:          ing.unit
        });
      });
    });

    // 6) Aguarda todas as operações em paralelo
    await Promise.all(linkPromises);

    // 7) Responde sucesso
    return res.status(201).json({ id: recipeRef.id });
  } catch (err) {
    console.error('Error creating recipe:', err);
    return res
      .status(500)
      .json({ error: 'Failed to create recipe.', details: err.message });
  }
});

// === PUT /recipes/:id ===
// Atualiza uma receita e recria seus links em recipe_ingredients
router.put('/:id', auth, async (req, res) => {
  const recipeId = req.params.id;
  if (!recipeId) return res.status(400).json({ error: 'Recipe ID is required' });

  // 1) Verifica admin
  try {
    const userSnap = await db.collection('users').doc(req.uid).get();
    if (!userSnap.exists || userSnap.data().role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (err) {
    console.error('Role check failed:', err);
    return res.status(500).json({ error: 'Internal error' });
  }

  // 2) Desinfeção e validação
  let recipeData;
  try {
    recipeData = sanitizeAndValidateRecipe(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
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

  // 3) Transação: atualiza receita + limpa e recria links
  try {
    await db.runTransaction(async tx => {
      const recRef = db.collection('recipes').doc(recipeId);
      const recDoc = await tx.get(recRef);
      if (!recDoc.exists) throw new Error('NOT_FOUND');

      // busca links antigos
      const oldLinksSnap = await tx.get(
        db.collection('recipe_ingredients').where('recipe_id', '==', recipeId)
      );

      // atualiza campos da receita
      tx.update(recRef, {
        name,
        description,
        instructions: Array.isArray(instructions)
          ? instructions
              .filter(i => typeof i.text === 'string' && i.text.trim())
              .map(i => ({ step: i.step, text: i.text.trim() }))
          : [],
        prep_time,
        servings: Number(servings),
        category,
        cycle_tags,
        image_url,
        updated_at: FieldValue.serverTimestamp()
      });

      // deleta links antigos
      oldLinksSnap.forEach(linkDoc => tx.delete(linkDoc.ref));

      // cria novos links (e registros de ingredientes novos se necessário)
      ingredients.forEach(ing => {
        let ingId = ing.ingredient_id;

        if (ing.isNew) {
          // se for novo, já cria o documento em ingredients
          const newIngRef = db.collection('ingredients').doc();
          tx.set(newIngRef, {
            name:              ing.name.trim(),
            aliases:           ing.aliases || [],
            category:          ing.category,
            default_unit:      ing.default_unit,
            kcal_per_unit:     ing.kcal_per_unit,
            is_vegan:          ing.is_vegan,
            is_gluten_free:    ing.is_gluten_free,
            alternative_units: ing.alternative_units || []
          });
          ingId = newIngRef.id;
        }

        // por fim, cria o link recipe ↔ ingredient
        const linkRef = db.collection('recipe_ingredients').doc();
        tx.set(linkRef, {
          recipe_id:     recipeId,
          ingredient_id: ingId,
          quantity:      parseQuantity(String(ing.quantity)),
          unit:          ing.unit
        });
      });
    });

    // depois da transação, retorna a receita “enriquecida”
    const enriched = await getEnrichedRecipe(recipeId);
    return res.json(enriched);
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    console.error(`PUT /recipes/${recipeId} failed:`, err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
});


// DELETE /recipes/:id
router.delete('/:id', auth, async (req, res) => {
  const recipeId = req.params.id;
  if (!recipeId) {
    return res.status(400).json({ error: 'Recipe ID is required' });
  }

  // 1) Verifica se o usuário é admin
  try {
    const userSnap = await db.collection('users').doc(req.uid).get();
    if (!userSnap.exists || userSnap.data().role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (err) {
    console.error('Error checking user role:', err);
    return res.status(500).json({ error: 'Internal error' });
  }

  // 2) Transação para apagar recipe_ingredients e a receita
  try {
    await db.runTransaction(async tx => {
      const recRef = db.collection('recipes').doc(recipeId);
      const recDoc = await tx.get(recRef);
      if (!recDoc.exists) {
        // dispara rollback e cai no catch abaixo
        throw new Error('NOT_FOUND');
      }

      // apaga todos os links em recipe_ingredients
      const linksQuery = db
        .collection('recipe_ingredients')
        .where('recipe_id', '==', recipeId);
      const linksSnap = await tx.get(linksQuery);
      linksSnap.forEach(linkDoc => tx.delete(linkDoc.ref));

      // apaga a receita
      tx.delete(recRef);
    });

    // sucesso sem conteúdo
    return res.status(204).end();
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    console.error(`Error deleting recipe ${recipeId}:`, err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

module.exports = router;
