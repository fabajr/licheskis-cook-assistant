import apiClient from '../client';

const searchCache = new Map();

/**
 * GET /ingredients?search=term
 * - skips API if <2 chars
 * - returns cached results if available
 */
async function search(term) {
  const key = term.trim().toLowerCase();
  if (key.length < 2) return [];
  if (searchCache.has(key)) return searchCache.get(key);

  const res = await apiClient.get('/ingredients', { params: { search: term } });
  // backend already filters by name, but we can double-check:
  const list = (res.data || []).filter(i => i.name.toLowerCase().includes(key));
  searchCache.set(key, list);
  return list;
}

/**
 * Limpa do cache o resultado de uma busca por esse termo
 */
export function clearSearchCache(term) {
  const key = term.trim().toLowerCase();
  if (searchCache.has(key)) {
    searchCache.delete(key);
  }
}

/**
 * (Opcional) limpa TODO o cache de buscas
 */
export function clearAllSearchCache() {
  searchCache.clear();
}

/**
 * POST /ingredients
 */
async function create(payload) {
  const res = await apiClient.post('/ingredients', payload);
  return res.data;
}

export const ingredients_db = { search, create, clearAllSearchCache, clearSearchCache };

/**
 * GET /ingredients
 * @returns {Promise<Array>} lista de ingredientes
 */
export async function getIngredients() {
  const { data } = await apiClient.get('/ingredients')
  return data
}

/**
 * GET /ingredients/:id
 * @param {string} id
 * @returns {Promise<Object>} ingrediente único
 */
export async function getIngredientById(id) {
  const { data } = await apiClient.get(`/ingredients/${id}`)
  return data
}

/**
 * POST /ingredients
 * @param {Object} payload — campos do ingrediente (name, aliases, category, default_unit, …)
 * @returns {Promise<Object>} ingrediente recém‐criado
 */
export async function createIngredient(payload) {
  const { data } = await apiClient.post('/ingredients', payload)
  return data
}

/**
 * PUT /ingredients/:id
 * @param {string} id
 * @param {Object} payload — campos a atualizar
 * @returns {Promise<Object>} ingrediente atualizado
 */
export async function updateIngredient(id, payload) {
  const { data } = await apiClient.put(`/ingredients/${id}`, payload)
  return data
}

/**
 * DELETE /ingredients/:id
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteIngredient(id) {
  await apiClient.delete(`/ingredients/${id}`)
}