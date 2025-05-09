// utils/recipeValidation.js

// Funções de sanitização reutilizáveis
const sanitizeString = v => (v ?? '').toString().trim();
const sanitizeNumber = v => {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};
const sanitizeArray = v => Array.isArray(v) ? v : [];

// Regras de validação: [ campo, função de check, mensagem de erro ]
const validationRules = [
  ['name',       v => sanitizeString(v).length > 0,                                    'Recipe name is required.'            ],
  ['category',   v => sanitizeString(v).length > 0,                                    'Recipe category is required.'        ],
  ['servings',   v => { const n = Number(v); return Number.isInteger(n) && n > 0; },   'Servings must be a positive integer.'],
  ['ingredients',v => Array.isArray(v) && v.length > 0,                                'At least one ingredient is required.']
];

/**
 * Recebe o corpo do request, dispara ValidationError se algo estiver inválido,
 * e retorna o objeto já sanitizado pronto para salvar.
 */
function sanitizeAndValidateRecipe(body) {
  // 1) Destructuring com defaults
  const {
    name,
    description   = '',
    instructions  = [],
    prep_time     = null,
    servings,
    category,
    cycle_tags    = [],
    image_url     = null,
    ingredients
  } = body;

  // 2) Checa cada regra
  for (const [field, checkFn, message] of validationRules) {
    if (!checkFn(body[field])) {
      const err = new Error(message);
      err.status = 400;
      throw err;
    }
  }

  // 3) Monta o objeto final já coerido
  return {
    name:        sanitizeString(name),
    description: sanitizeString(description),
    instructions,
    prep_time:   prep_time === null ? null : Number(prep_time),
    servings:    sanitizeNumber(servings),
    category:    sanitizeString(category),
    cycle_tags,
    image_url:   image_url ? sanitizeString(image_url) : null,
    ingredients: sanitizeArray(ingredients)
  };
}

module.exports = { sanitizeAndValidateRecipe };