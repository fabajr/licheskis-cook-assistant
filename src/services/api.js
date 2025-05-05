import axios from 'axios';

// Determine API base URL based on environment
const getBaseUrl = () => {
  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
  if (isProduction) {
    // In production, use a relative path that Firebase Hosting will rewrite
    return '/api'; 
  } else {
    // In development...
    const projectId = 'licheskis-cook-assintant'; 
    const region = 'us-central1'; 
    // Ensure /api is included for emulator consistency
    return `http://localhost:5001/${projectId}/${region}/api`; 
  }
};


// Create an Axios instance with the base URL
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors for logging or error handling
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Sending request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

// --- Define API functions here --- 

// Function to get all recipes
export const getRecipes = async (filters = {}) => {
  try {
    const response = await apiClient.get('/recipes', { params: filters });
    return response.data; 
  } catch (error) {
    console.error('Error in getRecipes:', error);
    throw error;
  }
};

// Function to get a single recipe by ID
export const getRecipeById = async (id) => {
  if (!id) {
    throw new Error("Recipe ID is required to fetch details.");
  }
  try {
    const response = await apiClient.get(`/recipes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe with ID ${id}:`, error);
    throw error;
  }
};

// Function to create a new recipe
export const createRecipe = async (recipeData) => {
  try {
    const response = await apiClient.post("/recipes", recipeData);
    return response.data;
  } catch (error) {
    console.error("Error creating recipe via API:", error.response?.data || error.message);
    throw error;
  }
};


// Add other functions for updating recipes, ingredients, etc.
// export const updateRecipe = async (id, recipeData) => { ... };
// export const getIngredients = async () => { ... };
// export const addIngredient = async (ingredientData) => { ... };

// Export the configured Axios instance if needed elsewhere
// export default apiClient;

