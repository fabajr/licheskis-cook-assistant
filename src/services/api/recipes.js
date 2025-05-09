import apiClient from '../client';

// GET /recipes
/**
 * Busca receitas paginadas.
 * @param {string|null} nextPageToken – token da próxima página (null na primeira chamada)
 * @returns {Promise<{ recipes: Array, nextPageToken: string|null }>}
 */
  export const getRecipes = async (nextPageToken = null) => {
    const res = await apiClient.get('/recipes', {
      params: { nextPageToken }
    });
    return res.data; // { recipes, nextPageToken }
  }
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

  // UPDATE /recipes/:id
  export const updateRecipe = async (id, recipeData) => {
    const res = await apiClient.put(`/recipes/${id}`, recipeData);
    return res.data;
  };
  