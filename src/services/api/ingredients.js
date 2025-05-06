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
 * POST /ingredients
 */
async function create(payload) {
  const res = await apiClient.post('/ingredients', payload);
  return res.data;
}

export const ingredients_db = { search, create };