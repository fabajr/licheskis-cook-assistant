import apiClient from '../client';

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

  