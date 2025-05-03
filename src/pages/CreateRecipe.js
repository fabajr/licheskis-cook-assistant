import React, { useState, useEffect } from 'react';
import { searchFoods, getFoodDetails } from '../services/usdaApi'; // Import USDA API functions
// We will import the function to save recipes later
// import { createRecipe as saveRecipeToApi } from '../services/api'; 

function CreateRecipe() {
  // State for basic recipe details
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [category, setCategory] = useState(''); // e.g., Breakfast, Lunch, Dinner
  const [phase, setPhase] = useState(''); // Hormonal phase

  // State for managing ingredients
  const [ingredients, setIngredients] = useState([]); // List of ingredients added to the recipe
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null); // Food selected from USDA search
  const [customIngredientName, setCustomIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // --- USDA Search Logic --- 
  useEffect(() => {
    // Debounce search to avoid too many API calls
    const delayDebounceFn = setTimeout(async () => {
      if (ingredientSearchTerm.trim().length > 2) { // Only search if term is long enough
        setIsLoadingSearch(true);
        setSelectedFood(null); // Clear selection when search term changes
        try {
          const results = await searchFoods(ingredientSearchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error("Failed to search USDA foods:", error);
          setSearchResults([]); // Clear results on error
        }
        setIsLoadingSearch(false);
      } else {
        setSearchResults([]); // Clear results if search term is short
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delayDebounceFn); // Cleanup timeout on unmount or change
  }, [ingredientSearchTerm]);

  // --- Ingredient Handling Logic --- 
  const handleSelectFood = async (food) => {
    setIngredientSearchTerm(food.description); // Fill search bar with selected food
    setSelectedFood(food); // Store selected food (contains fdcId)
    setSearchResults([]); // Hide search results
    setCustomIngredientName(''); // Clear custom name field
    // Optionally fetch full details now if needed, e.g., for default unit/calories
    // const details = await getFoodDetails(food.fdcId);
    // console.log("Selected food details:", details);
  };

  const handleAddIngredient = async () => {
    let ingredientToAdd = {
      name: '',
      quantity: ingredientQuantity, 
      unit: ingredientUnit,
      fdcId: null, // USDA Food Data Central ID
      calories: null // Calories per serving/unit (optional)
    };

    if (selectedFood) {
      // Ingredient from USDA search
      ingredientToAdd.name = selectedFood.description;
      ingredientToAdd.fdcId = selectedFood.fdcId;
      // Fetch details to get calories (if not already fetched)
      try {
        const details = await getFoodDetails(selectedFood.fdcId);
        // Note: USDA calories are usually per 100g. We might need conversion later.
        ingredientToAdd.calories = details?.calories; 
      } catch (error) {
        console.error("Failed to get details for calorie info:", error);
      }
    } else if (customIngredientName.trim()) {
      // Custom ingredient entered by user
      ingredientToAdd.name = customIngredientName.trim();
    } else {
      alert("Please select an ingredient from search or enter a custom ingredient name.");
      return;
    }

    if (!ingredientQuantity || !ingredientUnit) {
      alert("Please enter quantity and unit for the ingredient.");
      return;
    }

    setIngredients([...ingredients, ingredientToAdd]);

    // Clear ingredient input fields
    setIngredientSearchTerm('');
    setSearchResults([]);
    setSelectedFood(null);
    setCustomIngredientName('');
    setIngredientQuantity('');
    setIngredientUnit('');
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients(ingredients.filter((_, index) => index !== indexToRemove));
  };

  // --- Form Submission Logic --- 
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission

    const newRecipeData = {
      name: recipeName,
      description,
      instructions,
      prepTime,
      cookTime,
      servings,
      category,
      phase,
      ingredients, // The list of ingredient objects
      createdAt: new Date() // Add a timestamp
    };

    console.log("Submitting New Recipe:", newRecipeData);

    try {
      // Later: Call the function to save the recipe to Firebase
      // await saveRecipeToApi(newRecipeData);
      alert("Recipe created successfully! (Logged to console for now)");
      // Optionally clear the form or redirect
      // setRecipeName(''); ... reset all state ...
    } catch (error) {
      console.error("Failed to save recipe:", error);
      alert("Error saving recipe. Please try again.");
    }
  };

  // --- JSX Form Structure --- 
  return (
    <div>
      <h1>Create New Recipe</h1>
      <form onSubmit={handleSubmit}>
        {/* Recipe Name */}
        <div className="mb-3">
          <label htmlFor="recipeName" className="form-label">Recipe Name</label>
          <input 
            type="text" 
            className="form-control" 
            id="recipeName" 
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            required 
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea 
            className="form-control" 
            id="description" 
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        {/* Prep Time, Cook Time, Servings (inline) */}
        <div className="row g-3 mb-3">
          <div className="col-md">
            <label htmlFor="prepTime" className="form-label">Prep Time (mins)</label>
            <input type="number" className="form-control" id="prepTime" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
          </div>
          <div className="col-md">
            <label htmlFor="cookTime" className="form-label">Cook Time (mins)</label>
            <input type="number" className="form-control" id="cookTime" value={cookTime} onChange={(e) => setCookTime(e.target.value)} />
          </div>
          <div className="col-md">
            <label htmlFor="servings" className="form-label">Servings</label>
            <input type="number" className="form-control" id="servings" value={servings} onChange={(e) => setServings(e.target.value)} />
          </div>
        </div>

        {/* Category & Phase (inline) */}
        <div className="row g-3 mb-3">
          <div className="col-md">
            <label htmlFor="category" className="form-label">Meal Category</label>
            <select className="form-select" id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select Category...</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
              <option value="Dessert">Dessert</option>
              {/* Add more categories as needed */}
            </select>
          </div>
          <div className="col-md">
            <label htmlFor="phase" className="form-label">Hormonal Phase</label>
            <select className="form-select" id="phase" value={phase} onChange={(e) => setPhase(e.target.value)}>
              <option value="">Select Phase...</option>
              <option value="Menstrual">Menstrual</option>
              <option value="Follicular">Follicular</option>
              <option value="Ovulatory">Ovulatory</option>
              <option value="Luteal">Luteal</option>
            </select>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-3">
          <label htmlFor="instructions" className="form-label">Instructions</label>
          <textarea 
            className="form-control" 
            id="instructions" 
            rows="5"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
          ></textarea>
        </div>

        <hr />

        {/* --- Ingredient Section --- */}
        <h2>Ingredients</h2>
        
        {/* List of added ingredients */}
        <ul className="list-group mb-3">
          {ingredients.map((ing, index) => (
            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
              {ing.quantity} {ing.unit} {ing.name} 
              {ing.calories && ` (~${ing.calories} kcal/100g)`} 
              {/* Note: Displaying calories per 100g might not be ideal, needs refinement */}
              <button 
                type="button" 
                className="btn btn-danger btn-sm"
                onClick={() => handleRemoveIngredient(index)}
              >
                Remove
              </button>
            </li>
          ))}
          {ingredients.length === 0 && <li className="list-group-item">No ingredients added yet.</li>}
        </ul>

        {/* Ingredient Input Area */}
        <div className="card card-body mb-3">
          <h5>Add Ingredient</h5>
          <div className="mb-2 position-relative">
            <label htmlFor="ingredientSearch" className="form-label">Search USDA Database</label>
            <input 
              type="text" 
              className="form-control" 
              id="ingredientSearch" 
              placeholder="Search for ingredient (e.g., chicken breast)"
              value={ingredientSearchTerm}
              onChange={(e) => setIngredientSearchTerm(e.target.value)}
              disabled={!!customIngredientName} // Disable if custom name is entered
            />
            {/* Search Results Dropdown */}
            {isLoadingSearch && <div className="form-text">Searching...</div>}
            {searchResults.length > 0 && (
              <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
                {searchResults.map(food => (
                  <li 
                    key={food.fdcId} 
                    className="list-group-item list-group-item-action" 
                    onClick={() => handleSelectFood(food)}
                    style={{ cursor: 'pointer' }}
                  >
                    {food.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-2">
            <label htmlFor="customIngredient" className="form-label">Or Enter Custom Ingredient</label>
            <input 
              type="text" 
              className="form-control" 
              id="customIngredient" 
              placeholder="e.g., Grandma's secret spice blend"
              value={customIngredientName}
              onChange={(e) => {
                setCustomIngredientName(e.target.value);
                if (e.target.value) { // If custom name is entered, clear USDA search
                  setIngredientSearchTerm('');
                  setSelectedFood(null);
                  setSearchResults([]);
                }
              }}
              disabled={!!ingredientSearchTerm && !!selectedFood} // Disable if USDA item is selected
            />
          </div>

          <div className="row g-2 mb-2">
            <div className="col-sm-6">
              <label htmlFor="ingredientQuantity" className="form-label">Quantity</label>
              <input 
                type="text" // Use text to allow fractions like "1/2"
                className="form-control" 
                id="ingredientQuantity" 
                value={ingredientQuantity}
                onChange={(e) => setIngredientQuantity(e.target.value)}
              />
            </div>
            <div className="col-sm-6">
              <label htmlFor="ingredientUnit" className="form-label">Unit</label>
              <input 
                type="text" 
                className="form-control" 
                id="ingredientUnit" 
                placeholder="e.g., cups, grams, tbsp"
                value={ingredientUnit}
                onChange={(e) => setIngredientUnit(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleAddIngredient}
          >
            Add Ingredient to Recipe
          </button>
        </div>
        {/* --- End Ingredient Section --- */}

        <hr />

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary">Create Recipe</button>
      </form>
    </div>
  );
}

export default CreateRecipe;

