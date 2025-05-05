import axios from 'axios';

// Determine API base URL based on environment
const getBaseUrl = () => {
  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
  if (isProduction) {
    // In production, use a relative path that Firebase Hosting will rewrite
    return '/api'; // <-- Make sure this line is exactly '/api'
  } else {
    // In development...
    const projectId = 'licheskis-cook-assintant'; 
    const region = 'us-central1'; 
    return `http://localhost:5001/${projectId}/${region}`;
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
    // Use the apiClient to make the request
    const response = await apiClient.get('/recipes', { params: filters });
    return response.data; // Return the data from the response
  } catch (error) {
    // Log the error and re-throw it or handle it as needed
    console.error('Error in getRecipes:', error);
    throw error;
  }
};

// Function to create a new recipe
export const createRecipe = async (recipeData) => {
  try {
    // Make a POST request to the /recipes endpoint
    const response = await apiClient.post("/recipes", recipeData);
    // Return the data from the backend (which should include the new recipe ID)
    return response.data;
  } catch (error) {
    console.error("Error creating recipe via API:", error.response?.data || error.message);
    // Re-throw the error so the component can handle it (e.g., show an error message)
    throw error;
  }
};


// Add other functions for getting recipe by ID, updating recipes, etc.
// export const getRecipeById = async (id) => { ... };
// export const updateRecipe = async (id, recipeData) => { ... };
// export const getIngredients = async () => { ... };
// export const addIngredient = async (ingredientData) => { ... };

// Export the configured Axios instance if needed elsewhere
// export default apiClient;

