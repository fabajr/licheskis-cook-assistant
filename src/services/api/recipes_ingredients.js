import apiClient from './client';

// GET /recipe_ingredients
export const getRecipesIngredients = async (filters = {}) => {
    const res = await apiClient.get('/recipe_ingredients', { params: filters });
    return res.data;
  };
  
  // GET /recipe_ingredients/:id
  export const getRecipeIngredientById = async id => {
    const res = await apiClient.get(`/recipe_ingredients/${id}`);
    return res.data;
  };
  
  // POST /recipe_ingredients
  export const createRecipeIngredient = async recipeIngredientData => {
    const res = await apiClient.post('/recipe_ingredients', recipeIngredientData);
    return res.data;
  };
  
    // PUT /recipe_ingredients/:id
    export const updateRecipeIngredient = async (id, recipeIngredientData) => {
      const res = await apiClient.put(`/recipe_ingredients/${id}`, recipeIngredientData);
      return res.data;
    }
