import axios from 'axios';

// Read API key from environment variable
const USDA_API_KEY = process.env.REACT_APP_USDA_API_KEY;

const usdaApiClient = axios.create({
  baseURL: 'https://api.nal.usda.gov/fdc/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to search for foods by query
export const searchFoods = async (query) => {
  if (!USDA_API_KEY) { // Simplified check now that placeholder is removed
    console.error('USDA API Key not configured in .env file!');
    return []; 
  }
  try {
    const response = await usdaApiClient.get('/foods/search', {
      params: {
        query: query,
        api_key: USDA_API_KEY,
        // --- Refinement --- 
        // Prioritize more generic food types over branded ones
        dataType: ['Foundation', 'SR Legacy'].join(','), 
        // Limit results to top 3 matches
        pageSize: 3, 
        // Sort by relevance score (default behavior, but explicit)
        sortBy: 'score',
        sortOrder: 'desc',
      },
    });
    // Return the potentially smaller list of foods found
    return response.data.foods || []; 
  } catch (error) {
    console.error('Error searching USDA foods:', error.response?.data || error.message);
    // Avoid throwing error, just return empty array on failure
    return []; 
  }
};

// Function to get details for a specific food by FDC ID
export const getFoodDetails = async (fdcId) => {
  if (!USDA_API_KEY) {
    console.error('USDA API Key not configured!');
    return null;
  }
  try {
    const response = await usdaApiClient.get(`/food/${fdcId}`, {
      params: {
        api_key: USDA_API_KEY,
        // Optionally specify nutrients if needed, e.g., format=full&nutrients=208,204,205
        // Default format=full gets many nutrients
      },
    });
    // Find the calorie information (nutrient ID 1008 for Energy in kcal)
    const calories = response.data.foodNutrients?.find(
      (nutrient) => nutrient.nutrient.id === 1008
    );
    return {
      description: response.data.description,
      fdcId: response.data.fdcId,
      // Standard calorie value (usually per 100g)
      caloriesPer100g: calories ? calories.amount : null, 
      // Add other details if needed, e.g., default serving size info
      // servingSize: response.data.servingSize,
      // servingSizeUnit: response.data.servingSizeUnit,
    };
  } catch (error) {
    console.error(`Error getting USDA food details for ${fdcId}:`, error.response?.data || error.message);
    // Avoid throwing error, return null on failure
    return null; 
  }
};

