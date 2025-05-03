import React, { useState, useEffect, useCallback } from 'react';
import { searchFoods, getFoodDetails } from '../services/usdaApi';
// import { createRecipe as saveRecipeToApi } from '../services/api'; // Will uncomment later
// import { searchLocalIngredients } from '../services/api'; // Need this later

// --- Helper Functions --- 

// Basic function to parse quantity (handles fractions like "1/2")
function parseQuantity(qtyStr) {
  if (!qtyStr) return 0;
  qtyStr = qtyStr.trim();
  if (qtyStr.includes('/')) {
    const parts = qtyStr.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }
  const num = parseFloat(qtyStr);
  return isNaN(num) ? 0 : num;
}

// Basic weight conversion to grams
const conversionFactors = {
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  'oz': 28.3495,
  'ounce': 28.3495,
  'ounces': 28.3495,
  'lb': 453.592,
  'pound': 453.592,
  'pounds': 453.592,
  // Add more volume/piece conversions later if needed
};

function convertToGrams(quantity, unit) {
  const unitLower = unit?.toLowerCase().trim();
  const factor = conversionFactors[unitLower];
  if (factor) {
    return quantity * factor;
  } 
  // Return null if unit is not a recognized weight unit
  // We can't calculate kcal without conversion to grams
  console.warn(`Unit "${unit}" not recognized for weight conversion.`);
  return null; 
}

// --- Component --- 

function CreateRecipe() {
  // State for basic recipe details
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState([{ step: 1, text: '' }]); // Dynamic steps
  const [prepTime, setPrepTime] = useState(''); // Total time
  const [servings, setServings] = useState('');
  const [category, setCategory] = useState(''); // e.g., entree
  const [phase, setPhase] = useState(''); // Hormonal phase (cycle_tags)
  const [imageUrl, setImageUrl] = useState('');

  // State for managing ingredients
  const [ingredients, setIngredients] = useState([]);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [localSearchResults, setLocalSearchResults] = useState([]); // For local DB ingredients
  const [usdaSearchResults, setUsdaSearchResults] = useState([]); // For USDA results
  const [selectedLocalIngredient, setSelectedLocalIngredient] = useState(null);
  const [selectedUsdaFood, setSelectedUsdaFood] = useState(null);
  const [customIngredientName, setCustomIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // --- USDA/Local Search Logic --- 
  const performSearch = useCallback(async (term) => {
    if (term.trim().length < 2) {
      setLocalSearchResults([]);
      setUsdaSearchResults([]);
      return;
    }
    
    setIsLoadingSearch(true);
    setSelectedLocalIngredient(null);
    setSelectedUsdaFood(null);
    setCustomIngredientName('');

    try {
      // TODO: Implement local search first
      // const localResults = await searchLocalIngredients(term);
      // setLocalSearchResults(localResults || []);
      setLocalSearchResults([]); // Placeholder

      // If few/no local results, search USDA
      // if (!localResults || localResults.length < 3) { 
        const usdaResults = await searchFoods(term);
        // TODO: Refine USDA results to show best match(es)
        setUsdaSearchResults(usdaResults || []);
      // } else {
      //   setUsdaSearchResults([]);
      // }
    } catch (error) {
      console.error("Failed to search ingredients:", error);
      setLocalSearchResults([]);
      setUsdaSearchResults([]);
    }
    setIsLoadingSearch(false);
  }, []); // Add dependencies if needed, e.g., searchLocalIngredients

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(ingredientSearchTerm);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [ingredientSearchTerm, performSearch]);

  // --- Ingredient Handling Logic --- 
  const handleSelectLocalIngredient = (ingredient) => {
    setIngredientSearchTerm(ingredient.name);
    setSelectedLocalIngredient(ingredient);
    setSelectedUsdaFood(null);
    setCustomIngredientName('');
    setLocalSearchResults([]);
    setUsdaSearchResults([]);
    // Pre-fill unit if available
    setIngredientUnit(ingredient.defaultUnit || ''); 
  };

  const handleSelectUsdaFood = (food) => {
    setIngredientSearchTerm(food.description);
    setSelectedUsdaFood(food);
    setSelectedLocalIngredient(null);
    setCustomIngredientName('');
    setLocalSearchResults([]);
    setUsdaSearchResults([]);
    setIngredientUnit(''); // Clear unit, user needs to specify
  };

  const handleAddIngredient = async () => {
    const quantity = parseQuantity(ingredientQuantity);
    if (quantity <= 0) {
      alert("Please enter a valid quantity for the ingredient.");
      return;
    }
    if (!ingredientUnit.trim()) {
      alert("Please enter a unit for the ingredient.");
      return;
    }

    let ingredientToAdd = {
      name: '',
      quantity: ingredientQuantity, // Store original string for display
      unit: ingredientUnit.trim(),
      // --- Fields matching DB schema --- 
      ingredient_id: null, // Reference to our ingredients collection
      fdcId: null,         // USDA Food Data Central ID
      caloriesPer100g: null, // Standard kcal/100g from USDA
      calculatedKcal: null,  // Kcal for the specific quantity entered
      // is_vegan: null,      // Backend determines this
      // is_gluten_free: null // Backend determines this
    };

    let nameToUse = '';
    let fdcIdToUse = null;
    let localIdToUse = null;

    if (selectedLocalIngredient) {
      nameToUse = selectedLocalIngredient.name;
      localIdToUse = selectedLocalIngredient.id;
      fdcIdToUse = selectedLocalIngredient.fdcId; // Use FDC ID from local if available
    } else if (selectedUsdaFood) {
      nameToUse = selectedUsdaFood.description;
      fdcIdToUse = selectedUsdaFood.fdcId;
    } else if (customIngredientName.trim()) {
      nameToUse = customIngredientName.trim();
      // This is a new custom ingredient, needs adding to local DB later
    } else {
      alert("Please select or enter an ingredient name.");
      return;
    }

    ingredientToAdd.name = nameToUse;
    ingredientToAdd.ingredient_id = localIdToUse;
    ingredientToAdd.fdcId = fdcIdToUse;

    // Fetch details and calculate kcal if FDC ID exists
    if (fdcIdToUse) {
      try {
        const details = await getFoodDetails(fdcIdToUse);
        if (details?.calories) {
          ingredientToAdd.caloriesPer100g = details.calories;
          const quantityInGrams = convertToGrams(quantity, ingredientToAdd.unit);
          if (quantityInGrams !== null) {
            ingredientToAdd.calculatedKcal = Math.round((details.calories / 100) * quantityInGrams);
          }
        }
      } catch (error) {
        console.error(`Failed to get USDA details for ${fdcIdToUse}:`, error);
      }
    }

    setIngredients([...ingredients, ingredientToAdd]);

    // Clear ingredient input fields
    setIngredientSearchTerm('');
    setLocalSearchResults([]);
    setUsdaSearchResults([]);
    setSelectedLocalIngredient(null);
    setSelectedUsdaFood(null);
    setCustomIngredientName('');
    setIngredientQuantity('');
    setIngredientUnit('');
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients(ingredients.filter((_, index) => index !== indexToRemove));
  };

  // --- Instruction Handling --- 
  const handleInstructionChange = (index, value) => {
    const newInstructions = [...instructions];
    newInstructions[index].text = value;
    setInstructions(newInstructions);
  };

  const handleAddInstructionStep = () => {
    setInstructions([...instructions, { step: instructions.length + 1, text: '' }]);
  };

  const handleRemoveInstructionStep = (indexToRemove) => {
    if (instructions.length <= 1) return; // Keep at least one step
    const newInstructions = instructions
      .filter((_, index) => index !== indexToRemove)
      .map((instr, index) => ({ ...instr, step: index + 1 })); // Renumber steps
    setInstructions(newInstructions);
  };

  // --- Form Submission Logic --- 
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const parsedPrepTime = parseInt(prepTime, 10);
    const parsedServings = parseInt(servings, 10);

    if (isNaN(parsedPrepTime) || parsedPrepTime < 1) {
        alert("Please enter a valid Total Time (minimum 1 minute).");
        return;
    }
    if (isNaN(parsedServings) || parsedServings < 1) {
        alert("Please enter a valid number of Servings (minimum 1).");
        return;
    }
    if (ingredients.length === 0) {
        alert("Please add at least one ingredient.");
        return;
    }
    if (instructions.some(instr => !instr.text.trim())) {
        alert("Please ensure all instruction steps are filled in.");
        return;
    }

    const newRecipeData = {
      name: recipeName,
      description,
      instructions: instructions.map(instr => ({ step: instr.step, text: instr.text.trim() })), // Ensure instructions match schema
      prep_time: parsedPrepTime, // Matches schema field
      servings: parsedServings,
      category: category, // Matches schema field
      cycle_tags: phase ? [phase] : [], // Matches schema field (assuming phase maps to cycle_tags)
      image_url: imageUrl.trim() || null, // Matches schema field
      ingredients: ingredients.map(ing => ({
          // Map frontend state to backend schema for recipe's ingredient list
          ingredient_id: ing.ingredient_id, // ID from our ingredients collection
          name: ing.name,                 // Name used in recipe
          quantity: ing.quantity,         // Original quantity string
          unit: ing.unit,                 // Unit used
          fdcId: ing.fdcId,               // Store FDC ID if available
          calculatedKcal: ing.calculatedKcal // Store calculated kcal if available
      })),
      // is_vegan, is_gluten_free determined by backend
      // total_calories calculated by backend
      created_at: new Date(), 
      updated_at: new Date()
    };

    console.log("Submitting New Recipe Data (to be sent to backend):", newRecipeData);

    try {
      // Later: Call the function to save the recipe to Firebase
      // await saveRecipeToApi(newRecipeData);
      alert("Recipe data prepared! (Logged to console for now)");
      // Optionally clear form
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
          <input type="text" className="form-control" id="recipeName" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} required />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea className="form-control" id="description" rows="3" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>

        {/* Image URL */}
        <div className="mb-3">
          <label htmlFor="imageUrl" className="form-label">Image URL</label>
          <input type="url" className="form-control" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>

        {/* Total Time & Servings (inline) */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label htmlFor="prepTime" className="form-label">Total Time (mins)</label>
            <input type="number" className="form-control" id="prepTime" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} min="1" required />
          </div>
          <div className="col-md-6">
            <label htmlFor="servings" className="form-label">Servings</label>
            <input type="number" className="form-control" id="servings" value={servings} onChange={(e) => setServings(e.target.value)} min="1" required />
          </div>
        </div>

        {/* Category & Phase (inline) */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label htmlFor="category" className="form-label">Category</label>
            <select className="form-select" id="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select Category...</option>
              <option value="Breakfast">Breakfast</option>
              <option value="entree">Entrée</option> {/* Updated Label/Value */}
              <option value="Snack">Snack</option>
              <option value="Dessert">Dessert</option>
              <option value="Side Dish">Side Dish</option>
              <option value="Beverage">Beverage</option>
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="phase" className="form-label">Hormonal Phase Tag</label>
            <select className="form-select" id="phase" value={phase} onChange={(e) => setPhase(e.target.value)}>
              <option value="">Select Phase...</option>
              <option value="Menstrual">Menstrual</option>
              <option value="Follicular">Follicular</option>
              <option value="Ovulatory">Ovulatory</option>
              <option value="Luteal">Luteal</option>
            </select>
          </div>
        </div>

        {/* Instructions (Dynamic Steps) */}
        <div className="mb-3">
          <label className="form-label">Instructions</label>
          {instructions.map((instr, index) => (
            <div key={index} className="input-group mb-2">
              <span className="input-group-text">{instr.step}.</span>
              <textarea 
                className="form-control" 
                rows="2"
                value={instr.text}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                required
              ></textarea>
              <button 
                type="button" 
                className="btn btn-outline-danger" 
                onClick={() => handleRemoveInstructionStep(index)}
                disabled={instructions.length <= 1}
              >
                &times;
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm" 
            onClick={handleAddInstructionStep}
          >
            + Add Step
          </button>
        </div>

        <hr />

        {/* --- Ingredient Section --- */}
        <h2>Ingredients</h2>
        <ul className="list-group mb-3">
          {ingredients.map((ing, index) => (
            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
              <span>
                {ing.quantity} {ing.unit} {ing.name}
                {ing.calculatedKcal !== null && 
                  <small className="text-muted ms-2"> (~{ing.calculatedKcal} kcal)</small>
                }
                {ing.calculatedKcal === null && ing.caloriesPer100g !== null &&
                   <small className="text-muted ms-2"> (~{ing.caloriesPer100g} kcal/100g - unit conversion needed)</small>
                }
              </span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveIngredient(index)}>Remove</button>
            </li>
          ))}
          {ingredients.length === 0 && <li className="list-group-item text-muted">No ingredients added yet.</li>}
        </ul>

        {/* Ingredient Input Area */}
        <div className="card card-body mb-3">
          <h5>Add Ingredient</h5>
          {/* Search Input */}
          <div className="mb-2 position-relative">
            <label htmlFor="ingredientSearch" className="form-label">Search Local & USDA Database</label>
            <input 
              type="text" 
              className="form-control" 
              id="ingredientSearch" 
              placeholder="Search for ingredient (e.g., apple, chicken breast)"
              value={ingredientSearchTerm}
              onChange={(e) => setIngredientSearchTerm(e.target.value)}
              disabled={!!customIngredientName} 
            />
            {/* Search Results Dropdown */}
            {isLoadingSearch && <div className="form-text position-absolute bg-light p-1 rounded">Searching...</div>}
            {(localSearchResults.length > 0 || usdaSearchResults.length > 0) && (
              <ul className="list-group position-absolute w-100 border rounded mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                {localSearchResults.map(ing => (
                  <li key={`local-${ing.id}`} className="list-group-item list-group-item-action list-group-item-success" onClick={() => handleSelectLocalIngredient(ing)} style={{ cursor: 'pointer' }}>
                    {ing.name} <small>(Local)</small>
                  </li>
                ))}
                {usdaSearchResults.map(food => (
                  <li key={food.fdcId} className="list-group-item list-group-item-action" onClick={() => handleSelectUsdaFood(food)} style={{ cursor: 'pointer' }}>
                    {food.description} <small>(USDA)</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Custom Ingredient Input */}
          <div className="mb-2">
            <label htmlFor="customIngredient" className="form-label">Or Enter Custom Ingredient Name</label>
            <input 
              type="text" 
              className="form-control" 
              id="customIngredient" 
              placeholder="e.g., Grandma's secret spice blend"
              value={customIngredientName}
              onChange={(e) => {
                setCustomIngredientName(e.target.value);
                if (e.target.value) { 
                  setIngredientSearchTerm('');
                  setSelectedLocalIngredient(null);
                  setSelectedUsdaFood(null);
                  setLocalSearchResults([]);
                  setUsdaSearchResults([]);
                }
              }}
              disabled={!!ingredientSearchTerm && (!!selectedLocalIngredient || !!selectedUsdaFood)}
            />
          </div>

          {/* Quantity and Unit Inputs */}
          <div className="row g-2 mb-2">
            <div className="col-sm-6">
              <label htmlFor="ingredientQuantity" className="form-label">Quantity</label>
              <input type="text" className="form-control" id="ingredientQuantity" value={ingredientQuantity} onChange={(e) => setIngredientQuantity(e.target.value)} placeholder='e.g., 1, 1/2, 100'/>
            </div>
            <div className="col-sm-6">
              <label htmlFor="ingredientUnit" className="form-label">Unit</label>
              {/* TODO: Replace with dropdown of common/alternative units later */}
              <input type="text" className="form-control" id="ingredientUnit" value={ingredientUnit} onChange={(e) => setIngredientUnit(e.target.value)} placeholder="e.g., cups, grams, tbsp, piece"/>
            </div>
          </div>

          {/* Add Ingredient Button */}
          <button type="button" className="btn btn-secondary" onClick={handleAddIngredient}>Add Ingredient to Recipe</button>
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

