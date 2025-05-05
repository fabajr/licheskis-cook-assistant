import axios from 'axios';

// Determina a base URL conforme ambiente
const getBaseUrl = () => {
  const isProduction =
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.includes('127.0.0.1');

  if (isProduction) {
    // Produção: Firebase Hosting cuida do rewrite /api → função
    return '/api';
  } else {
    // Desenvolvimento: Functions emulator no localhost
    const projectId = 'licheskis-cook-assintant';
    const region    = 'us-central1';
    return `http://localhost:5001/${projectId}/${region}/api`;
  }
};

// Cria instância Axios
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// Log de requisições/respostas (opcional)
apiClient.interceptors.request.use(cfg => {
  console.log(`→ ${cfg.method.toUpperCase()} ${cfg.baseURL}${cfg.url}`);
  return cfg;
});
apiClient.interceptors.response.use(
  res => res,
  err => {
    console.error('← Response Error:', err.response?.status, err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// ————— RECEITAS —————

// GET /recipes
export const getRecipes = async (filters = {}) => {
  const res = await apiClient.get('/recipes', { params: filters });
  return res.data;
};

// GET /recipes/:id
export const getRecipeById = async id => {
  const res = await apiClient.get(`/recipes/${id}`);
  return res.data;
};

// POST /recipes
export const createRecipe = async recipeData => {
  const res = await apiClient.post('/recipes', recipeData);
  return res.data;
};

// ————— INGREDIENTS LOCAL —————

// GET /ingredients?search=termo
// Se o backend não filtra por search, retorna todos e filtra no client
export const searchLocalIngredients = async term => {
  const res = await apiClient.get('/ingredients', {
    params: term ? { search: term } : {}
  });
  let list = res.data || [];
  if (term) {
    const lower = term.trim().toLowerCase();
    list = list.filter(i => i.name.toLowerCase().includes(lower));
  }
  return list;
};

// POST /ingredients
export const createIngredient = async payload => {
  const res = await apiClient.post('/ingredients', payload);
  return res.data;
};

// ————— EXPORTA instância caso precise —————
export default apiClient;
