import axios from 'axios';

// Determine API base URL based on environment
const getBaseUrl = () => {
  // Check if running in production (like on Firebase Hosting)
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // In production, use a relative path that Firebase Hosting will rewrite
    return '/api';
  } else {
    // In development, point to the Firebase emulated function URL
    // Replace 'your-firebase-project-id' with your actual Firebase project ID
    // You can find this ID in your Firebase project settings or .firebaserc file
    const projectId = 'licheskis-cook-assintant'; // <-- Replace if different!
    const region = 'us-central1'; // Or your function's region
    return `http://localhost:5001/${projectId}/${region}/api`;
  }
};

// Create an Axios instance with the base URL
const apiClient = axios.create({
  baseURL: getBaseUrl() ,
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

// Example: Function to get all recipes
export const getRecipes = async (filters = {}) => {
  try {
    // Use the apiClient to make the request
    const response = await apiClient.get('/recipes', { params: filters });
    return response.data; // Return the data from the response
  } catch (error) {
    // Log the error and re-throw it or handle it as needed
    console.error('Error in getRecipes:', error);
    throw error;
  }
};

// Add other functions for getting recipe by ID, creating recipes, etc.
// export const getRecipeById = async (id) => { ... };
// export const createRecipe = async (recipeData) => { ... };
// export const updateRecipe = async (id, recipeData) => { ... };
// export const getIngredients = async () => { ... };
// export const addIngredient = async (ingredientData) => { ... };

// Export the configured Axios instance if needed elsewhere
// export default apiClient;
