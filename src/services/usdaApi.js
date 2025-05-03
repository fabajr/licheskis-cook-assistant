import axios from 'axios';

// IMPORTANT: Store your API key securely, e.g., in environment variables
// For now, we'll use a placeholder. Replace this when you get your key.
const USDA_API_KEY = process.env.REACT_APP_USDA_API_KEY; // <-- Replace with your actual key later

const usdaApiClient = axios.create({
  baseURL: 'https://api.nal.usda.gov/fdc/v1',
  headers: {
    'Content-Type': 'application/json',
  },
}) ;

// Function to search for foods by query
export const searchFoods = async (query) => {
  if (!USDA_API_KEY || USDA_API_KEY === 'YOUR_USDA_API_KEY_HERE') {
    console.error('USDA API Key not configured!');
    // In a real app, you might return an empty array or throw a specific error
    return []; 
  }
  try {
    const response = await usdaApiClient.get('/foods/search', {
      params: {
        query: query,
        api_key: USDA_API_KEY,
        pageSize: 10, // Limit results for search suggestions
      },
    });
    return response.data.foods || []; // Return the list of foods found
  } catch (error) {
    console.error('Error searching USDA foods:', error.response?.data || error.message);
    throw error;
  }
};

// Function to get details for a specific food by FDC ID
export const getFoodDetails = async (fdcId) => {
  if (!USDA_API_KEY || USDA_API_KEY === 'YOUR_USDA_API_KEY_HERE') {
    console.error('USDA API Key not configured!');
    return null;
  }
  try {
    const response = await usdaApiClient.get(`/food/${fdcId}`, {
      params: {
        api_key: USDA_API_KEY,
      },
    });
    // Find the calorie information (usually nutrient ID 1008 for Energy in kcal)
    const calories = response.data.foodNutrients?.find(
      (nutrient) => nutrient.nutrient.id === 1008
    );
    return {
      description: response.data.description,
      fdcId: response.data.fdcId,
      calories: calories ? calories.amount : null, // Amount per 100g usually
      // You can extract other nutrient info here if needed
    };
  } catch (error) {
    console.error(`Error getting USDA food details for ${fdcId}:`, error.response?.data || error.message);
    throw error;
  }
};
