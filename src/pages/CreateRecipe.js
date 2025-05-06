// src/pages/CreateRecipe.js

import React, { useRef, useState, useEffect, useCallback } from 'react';
// Ensure correct import for createRecipe (used as saveRecipeToApi)
import {
  createRecipe as saveRecipeToApi,
  searchLocalIngredients,
  createIngredient as createIngredientInApi,
} from '../services/api';


// Helpers mínimos para quantidade e unidades
const commonUnits = ['GRAMS','CUP','TBSP','TSP','OZ','ML','L','UNIT','SCOOP','PINCH','LBS','KG'];


const categoryOptions = [
  'Breakfast',
  'Soups&Salads',
  'Entrees',
  'Snacks',
  'Desserts',
];

const newIngredientCategoryOptions = [
  "Baking",
  "Beverages",
  "Canned & Jarred Goods",
  "Condiments & Sauces",
  "Dairy",
  "Herbs",
  "Meat & Seafood",
  "Nuts & Seeds",
  "Oils & Vinegars",
  "Pantry",
  "Produce",
  "Spices"
];

// mapeamento categoria → lista de unidades
const unitOptionsMap = {
  Baking:                   ["CUP","TBSP","TSP","G","KG"],
  Beverages:                ["FL OZ","CUP","L","ML","BOTTLE"],
  "Canned & Jarred Goods":  ["CAN","OZ","G","KG"],
  "Condiments & Sauces":    ["TBSP","TSP","FL OZ"],
  Dairy:                    ["CUP","PT","QT","OZ"],
  Herbs:                    ["BUNCH","STEAMS","TBSP","TSP"],
  "Meat & Seafood":         ["LB","OZ","G","KG"],
  "Nuts & Seeds":           ["CUP","OZ","G","KG"],
  "Oils & Vinegars":        ["TBSP","FL OZ","ML"],
  Pantry:                   ["CUP","OZ","G","KG"],
  Produce:                  ["UNIT","LB","OZ","KG"],
  Spices:                   ["TSP","PINCH","TBSP"]
};

// normalize map para lookup case-insensitive
const unitOptionsMapNormalized = Object.fromEntries(
  Object.entries(unitOptionsMap).map(([k,v]) => [k.toLowerCase(), v])
);

const getUnitOptions = category => {
  if (!category) return [];
  return unitOptionsMapNormalized[category.toLowerCase()] || [];
};

// Opções de fase do ciclo menstrual
// (para tags de receita)
const cyclePhaseOptions = [
  { label: 'Menstruation', value: 'M' },
  { label: 'Late Follicular', value: 'L' },
  { label: 'Ovulatory', value: 'O' },
  { label: 'Mid-Luteal', value: 'ML' },
  { label: 'Late-Luteal', value: 'LL' },
];

function parseQuantity(qtyStr) {
  // exemplo simples: suporta "1", "1/2", "1 1/2"
  if (!qtyStr) return 0;
  const parts = String(qtyStr).split(' ').filter(Boolean);
  let total = 0;
  for (let p of parts) {
    if (p.includes('/')) {
      const [num, den] = p.split('/').map(Number);
      if (!isNaN(num) && !isNaN(den) && den !== 0) total += num/den;
    } else if (!isNaN(Number(p))) {
      total += Number(p);
    }
  }
  return total;
}



function CreateRecipe() {

  const newIngFormRef = useRef(null); // Ref for the new ingredient form
  const skipResetRef = useRef(false); // Ref to skip resetting the form on ingredient selection


  // --- estados básicos da receita ---
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState([{ step: 1, text: '' }]);
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [category, setCategory] = useState('');
  const [cycleTags, setCycleTags] = useState(''); // Assuming this is an array of cycle tags
  //const [phase, setPhase] = useState(''); // Assuming this maps to cycle_tags
  const [imageUrl, setImageUrl] = useState('');

  const handlePhaseChange = (value) => {
    setCycleTags((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };


  // --- estados dos ingredientes da receita ---
  const [ingredients, setIngredients] = useState([]);

  const [editingIndex, setEditingIndex]         = useState(null);
  const [editingQuantity, setEditingQuantity]   = useState("");
  const [editingUnit,     setEditingUnit]       = useState("");


  // --- busca local de ingredientes ---
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [localSearchResults, setLocalSearchResults] = useState([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [selectedLocalIngredient, setSelectedLocalIngredient] = useState(null);

  // --- controle do form de novo ingrediente ---
  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [newIngredientCategory, setNewIngredientCategory] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('');
  const [newIngredientAliases, setNewIngredientAliases] = useState('');
  const [newIngredientDefaultUnit, setNewIngredientDefaultUnit] = useState('');
  const [newIngredientKcalPerUnit, setNewIngredientKcalPerUnit] = useState('');
  const [newIngredientIsVegan, setNewIngredientIsVegan] = useState(false);
  const [newIngredientIsGlutenFree, setNewIngredientIsGlutenFree] = useState(false);
  const [newAltUnits, setNewAltUnits] = useState([]);
  const [newIngredientQuantity, setNewIngredientQuantity] = useState('');

  // --- quantidade e unidade ao adicionar ao recipe ---
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');

  // 1) Buscar em ingredients collection
  const performSearch = useCallback(async (term) => {
    if (term.trim().length < 2) {
      setLocalSearchResults([]);
      setShowNewIngredientForm(false); // Hide form if search term is too short
      return;
    }

    setIsLoadingSearch(true);
    try {
      const localResults = await searchLocalIngredients(term);
      setLocalSearchResults(localResults || []);
      // Show form only if search term is valid AND no results found
      setShowNewIngredientForm(term.trim().length >= 2 && (!localResults || localResults.length === 0));
    } catch (err) {
      console.error("Erro buscando ingredients locais:", err);
      setLocalSearchResults([]);
      setShowNewIngredientForm(term.trim().length >= 2); // Show form on error if term is valid
    } finally {
      setIsLoadingSearch(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocalIngredient?.default_unit) {
      setIngredientUnit(selectedLocalIngredient.default_unit);
    }
  }, [selectedLocalIngredient]);

  useEffect(() => {
    if (newIngredientDefaultUnit) {
      setNewIngredientUnit(newIngredientDefaultUnit);
    }
  }, [newIngredientDefaultUnit]);

  useEffect(() => {

  // if we're supposed to skip _this_ open, do so and clear the flag:
  if (skipResetRef.current) {
    skipResetRef.current = false;
    return;
  }
   
    if (showNewIngredientForm) {
      setNewIngredientCategory("");
      setNewIngredientDefaultUnit("");
      setNewIngredientKcalPerUnit("");
      setNewIngredientIsVegan(false);
      setNewIngredientIsGlutenFree(false);
      setNewIngredientAliases("");
      setNewAltUnits([]);
      setNewIngredientQuantity("");
      setNewIngredientUnit("");
      // … reset de qualquer outro campo …
    }
  }, [showNewIngredientForm]);

  // Debounce search
  useEffect(() => {
    if (selectedLocalIngredient && ingredientSearchTerm === selectedLocalIngredient.name) {
      setLocalSearchResults([]); // Clear results when an item is selected
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(ingredientSearchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [ingredientSearchTerm, performSearch, selectedLocalIngredient]);

  useEffect(() => {
    if (showNewIngredientForm && newIngFormRef.current) {
      newIngFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [showNewIngredientForm]);

  const handleDuplicateIngredient = ing => {
    const isString = v => typeof v === "string";
    const isObject = v => v !== null && typeof v === "object";
  
    const resetAndAlert = () => {
      alert(
        "This ingredient is already in your recipe. Change its quantity if you need more."
      );
      setIngredientSearchTerm("");
    };
  
    // 1) string (novo ingrediente)?
    if (isString(ing)) {
      const nameLower = ing.trim().toLowerCase();
      const isDupNew = ingredients.some(i =>
        i.isNew && i.name.trim().toLowerCase() === nameLower
      );
      if (isDupNew) {
        resetAndAlert();
        return true;      // sinaliza que é duplicata
      }
      return false;       // não é duplicata
    }
  
    // 2) objeto (ingrediente existente)?
    if (isObject(ing)) {
      const isDupExisting = ingredients.some(
        i => !i.isNew && i.ingredient_id === ing.id
      );
      if (isDupExisting) {
        resetAndAlert();
        return true;      // sinaliza que é duplicata
      }
      return false;       // não é duplicata
    }
  
    return false;         // qualquer outro caso
  };
  
  
  // When the user clicks an existing ingredient
  const handleSelectLocalIngredient = (ing) => {

    if (handleDuplicateIngredient(ing)) return; // Se duplicata, não faz nada
   
    setSelectedLocalIngredient(ing);
    setIngredientSearchTerm(ing.name);
    setLocalSearchResults([]); // Hide dropdown
    setShowNewIngredientForm(false); // Hide new ingredient form
    setIngredientUnit(commonUnits.includes(ing.default_unit) ? ing.default_unit : '');
  };

  // Add ingredient to the recipe list (in state)
  const handleAddIngredient = () => {

    const isNew = showNewIngredientForm;

  // escolhe a string certa para o parse
  const qtyStr = isNew
    ? newIngredientQuantity    // <<< aqui, puxe a quantidade do novo ingrediente
    : ingredientQuantity;      // <<< aqui, a quantidade do ingrediente local

  const qty = parseQuantity(qtyStr);
  if (isNaN(qty) || qty <= 0) {
    return alert("Invalid quantity");
  }

    let ingToAdd;

    if (selectedLocalIngredient) {
      // Using an existing ingredient
      ingToAdd = {
        ingredient_id: selectedLocalIngredient.id,
        name: selectedLocalIngredient.name,
        quantity: ingredientQuantity, // Keep original string for display/editing?
        unit: ingredientUnit,
        fdcId: selectedLocalIngredient.fdcId || null,
        calculatedKcal: selectedLocalIngredient.kcal_per_unit || null, // Or calculate based on qty?
        // Mark as existing
        isNew: false,
        category: selectedLocalIngredient.category,
        is_vegan: selectedLocalIngredient.is_vegan || false,
        is_gluten_free: selectedLocalIngredient.is_gluten_free || false,
        //default_unit: selectedLocalIngredient.default_unit || newIngredientDefaultUnit,
        //aliases: selectedLocalIngredient.aliases || [],
        //alternative_units: selectedLocalIngredient.alternative_units || [],

      };
    } else if (showNewIngredientForm && ingredientSearchTerm.trim()) {
      // Creating a new ingredient (data captured in state)
      const kcal = parseFloat(newIngredientKcalPerUnit);
      if (isNaN(kcal) || kcal < 0) return alert("Invalid Kcal for new ingredient");
      if (!newIngredientCategory) return alert("Category is required for new ingredient");
      if (!newIngredientDefaultUnit) return alert("Default unit is required for new ingredient");

      ingToAdd = {
        ingredient_id: null, // Will be created on backend
        name: ingredientSearchTerm.trim(),
        quantity: newIngredientQuantity,
        unit: newIngredientUnit,
        // Include metadata for backend creation
        aliases: newIngredientAliases.split(',').map(s => s.trim()).filter(Boolean),
        category: newIngredientCategory,
        default_unit: newIngredientDefaultUnit,
        kcal_per_unit: kcal,
        is_vegan: newIngredientIsVegan,
        is_gluten_free: newIngredientIsGlutenFree,
        alternative_units: newAltUnits
          .map(u => ({ unit: u.unit, conversion_factor: parseFloat(u.conversion_factor) }))
          .filter(u => u.unit && !isNaN(u.conversion_factor)),
        // Mark as new
        isNew: true,
      };
    } else {
      return alert("Please search and select an ingredient, or fill the details for a new one.");
    }

    setIngredients([...ingredients, ingToAdd]);

    // Clear fields
    setIngredientSearchTerm('');
    setSelectedLocalIngredient(null);
    setIngredientQuantity('');
    setIngredientUnit('');
    setShowNewIngredientForm(false);
    // Clear new ingredient form fields too
    setNewIngredientCategory('');
    setNewIngredientAliases('');
    setNewIngredientDefaultUnit('');
    setNewIngredientKcalPerUnit('');
    setNewIngredientIsVegan(false);
    setNewIngredientIsGlutenFree(false);
    setNewAltUnits([]);
  };

  // Remove ingredient from the recipe list (in state)
  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients(ingredients.filter((_, i) => i !== indexToRemove));
  };

  // --- Instructions Handling ---
  const handleInstructionChange = (index, value) => {
    const newInstructions = [...instructions];
    newInstructions[index].text = value;
    setInstructions(newInstructions);
  };

  const addInstruction = () => {
    setInstructions([...instructions, { step: instructions.length + 1, text: '' }]);
  };

  const removeInstruction = (index) => {
    if (instructions.length > 1) { // Keep at least one instruction
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  // --- Alternative Units Handling ---
  const handleAltUnitChange = (idx, field, value) => {
    const copy = [...newAltUnits];
    copy[idx] = { ...copy[idx], [field]: value };
    setNewAltUnits(copy);
  };
  const addAltUnitRow = () => setNewAltUnits([...newAltUnits, { unit: '', conversion_factor: '' }]);
  const removeAltUnitRow = idx => setNewAltUnits(newAltUnits.filter((_, i) => i !== idx));

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitizedIngredients = ingredients.map(ing => ({
      ...ing,
      quantity: parseQuantity(ing.quantity)
    }));// Ensure quantities are parsed correctly

    if (!recipeName || !recipeName.trim()) {
      window.alert("Recipe name is required.");
      return;
    }
  
    // 2) Validação de ingredientes
    if (ingredients.length === 0) {
      window.alert("Please add at least one ingredient.");
      return;
    }

    if(!category || !category.trim()) {
      window.alert("Recipe Category is required.");
      return;
    }

    if(!servings || !servings.trim()) {
      window.alert("Total Servings is required.");
      return;
    }

    

    // Prepare payload according to backend expectations
    const recipePayload = {
      name: recipeName,
      description: description,
      instructions: instructions.filter(inst => inst.text.trim()), // Remove empty instructions
      prep_time: prepTime ? parseInt(prepTime, 10) : null,
      servings: servings ? parseInt(servings, 10) : null,
      category: category,
      cycle_tags: cycleTags,  // agora será um array de strings, ex: ["M","O","LL"]
      image_url: imageUrl || null,
      // Send the ingredients array as built in the state
      // Backend will handle separating existing/new and saving correctly
      ingredients: sanitizedIngredients,
    };

    try {
      console.log("Submitting recipe payload:", recipePayload);
      const created = await saveRecipeToApi(recipePayload);
      alert(`Recipe created successfully! ID: ${created.id}`);
      // Optionally clear form or redirect
      setRecipeName('');
      setDescription('');
      setInstructions([{ step: 1, text: '' }]);
      setPrepTime('');
      setServings('');
      setCategory('');
      setCycleTags('');
      setImageUrl('');
      setIngredients([]);
    } catch (err) {
      console.error("Error creating recipe:", err);
      alert(`Failed to create recipe: ${err.message || 'Unknown error'}`);
    }
  };

    // abre o modo edição para o item i
    const handleEditIngredient = index => {
      const ing = ingredients[index]; //
    
      // ——— If it was a NEW ingredient, send it back to the "Add New" panel ———
      if (ing.isNew) {
        console.log(ing);
        skipResetRef.current = true; // Skip resetting the form fields
        // 1) remove from list
        setIngredients(prev =>
          prev.filter((_, i) => i !== index)
        );
        
        // 2) show the new-ingredient form
        setShowNewIngredientForm(true);
    
        // 3) populate the search-and-details panel
        setIngredientSearchTerm(ing.name);
    
        setNewIngredientCategory(ing.category);
        setNewIngredientDefaultUnit(ing.default_unit);
        setNewIngredientKcalPerUnit(String(ing.kcal_per_unit));
        setNewIngredientIsVegan(ing.is_vegan);
        setNewIngredientIsGlutenFree(ing.is_gluten_free);
        setNewIngredientAliases(ing.aliases.join(", "));
        setNewAltUnits(ing.alternative_units);
    
        // bottom “Quantity” + “Unit” fields:
        setNewIngredientQuantity(ing.quantity);
        setNewIngredientUnit(ing.unit);
    
        return;
      }
    
      // ——— Else, existing ingredient: your in-place edit logic ———
      setEditingIndex(index);
      setEditingQuantity(ing.quantity);
      setEditingUnit(ing.unit);
    };
  
    // salva o item editado
    const handleSaveIngredient = () => {
      setIngredients(prev =>
        prev.map((ing, i) =>
          i === editingIndex
            ? { ...ing, quantity: editingQuantity, unit: editingUnit }
            : ing
        )
      );
      // fecha edição
      setEditingIndex(null);
    };
  
    // cancela a edição
    const handleCancelEdit = () => {
      setEditingIndex(null);
    };

  // --- JSX RENDER ---
  return (
      <div className="container py-4">
        <h1>Create New Recipe</h1>
        <form onSubmit={handleSubmit}>

        {/* --- Basic Recipe Fields --- ADDED BACK --- */}
        <div className="mb-3">
          <label htmlFor="recipeName" className="form-label">Recipe Name</label>
          <input
            type="text"
            className="form-control"
            id="recipeName"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            //required
          />
        </div>

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

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <label htmlFor="prepTime" className="form-label">Prep Time (minutes)</label>
            <input
              type="number"
              className="form-control"
              id="prepTime"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              min="0"
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="servings" className="form-label">Servings</label>
            <input
              type="number"
              className="form-control"
              id="servings"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              min="1"
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="category" className="form-label">Category</label>
            <select 
            className="form-select" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            >
          <option value="">Select Category...</option>
          {categoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
          </div>
        </div>

        <div className="mb-3">
  <label className="form-label">Cycle Phase</label>
  <div className="d-flex flex-wrap">
    {cyclePhaseOptions.map(opt => (
      <div key={opt.value} className="form-check me-3 mb-2">
        <input
          id={`phase-${opt.value}`}
          type="checkbox"
          className="form-check-input"
          checked={cycleTags.includes(opt.value)}
          onChange={() => handlePhaseChange(opt.value)}
        />
        <label
          htmlFor={`phase-${opt.value}`}
          className="form-check-label"
        >
          {opt.label}
        </label>
      </div>
    ))}
  </div>
</div>

        <div className="mb-3">
          <label htmlFor="imageUrl" className="form-label">Image URL (Optional)</label>
          <input
            type="url"
            className="form-control"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {/* --- Instructions --- ADDED BACK --- */}
        <div className="mb-3">
          <label className="form-label">Instructions</label>
          {instructions.map((instruction, index) => (
            <div key={index} className="input-group mb-2">
              <span className="input-group-text">{index + 1}</span>
              <input
                type="text"
                className="form-control"
                value={instruction.text}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
              />
              {instructions.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => removeInstruction(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addInstruction}>
            + Add Instruction Step
          </button>
        </div>
        {/* --- End Basic Recipe Fields --- */}

        <hr />
        <h2>Ingredients</h2>

        {/* List of ingredients already added */}
        <ul className="list-group mb-3">
        {ingredients.map((ing, i) => (
  <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
    {editingIndex === i ? (
      // modo edição
      <>
        {/* Conteúdo editável */}
        <div className="d-flex align-items-center flex-grow-1 gap-2">
          <span className="me-2">{ing.name}</span>

          {/* Quantity */}
          <div style={{ minWidth: 70 }}>
            <label className="small text-muted d-block">Quantity</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={editingQuantity}
              onChange={e => setEditingQuantity(e.target.value)}
            />
          </div>

          {/* Unit */}
          <div style={{ minWidth: 80 }}>
            <label className="small text-muted d-block">Unit</label>

            {(() => {
              // 1) pega as opções pela categoria exata do ingrediente
              const opts = getUnitOptions(ing.category);

              // 2) garante que a unidade corrente esteja no topo
              const orderedUnits = [
                editingUnit,
                ...opts.filter(u => u !== editingUnit)
              ];

              return (
                <select
                  className="form-select form-select-sm"
                  value={editingUnit}
                  onChange={e => setEditingUnit(e.target.value)}
                >
                  {orderedUnits.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              );
            })()}
          </div>
        </div>

        {/* Botões alinhados à direita */}
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleSaveIngredient}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
        </div>
      </>
    ) : (
      /* modo leitura */
      <>
        <span>
          {ing.quantity} {ing.unit} — {ing.name} {ing.isNew ? "(New)" : ""}
        </span>
        <div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => handleEditIngredient(i)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => handleRemoveIngredient(i)}
          >
            Remove
          </button>
        </div>
      </>
    )}
  </li>
))}
      </ul>

        {/* Input de busca + seleção */}
        <div 
            ref={newIngFormRef} 
            className="mb-3 position-relative">
          <label htmlFor="ingredientSearch" className="form-label">
            Add Ingredient (Search Local First)
          </label>
          <input
            id="ingredientSearch"
            type="text"
            className="form-control"
            value={ingredientSearchTerm}
            onChange={e => {
              setIngredientSearchTerm(e.target.value);
              setSelectedLocalIngredient(null); // Clear selection on new input
              
              handleDuplicateIngredient(e.target.value); // Check for duplicates
                                }
            }
            placeholder="Type to search..."
            disabled={isLoadingSearch}
            autoComplete="off"
          />
          {isLoadingSearch && (
            <div className="spinner-border spinner-border-sm position-absolute end-0 top-50 translate-middle-y me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          {/* Search Results Dropdown */}
          {localSearchResults.length > 0 && !selectedLocalIngredient && (
            <ul
              className="list-group position-absolute w-100 mt-1 shadow-sm"
              style={{ zIndex: 1000, maxHeight: 200, overflowY: 'auto' }}
            >
              {localSearchResults.map(ing => (
                <li
                  key={ing.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleSelectLocalIngredient(ing)}
                  style={{ cursor: 'pointer' }}
                >
                  {ing.name} <small className="text-muted">({ing.category || 'No category'})</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quantity and Unit Input (Show when searching or selected) */}
        {selectedLocalIngredient && !showNewIngredientForm && (
          <div className="row g-2 mb-3 align-items-end">
            <div className="col-md-5">
              <label htmlFor="ingredientQuantity" className="form-label">Quantity</label>
              <input
                id="ingredientQuantity"
                type="text" // Allow fractions like 1/2
                className="form-control"
                value={ingredientQuantity}
                onChange={e => setIngredientQuantity(e.target.value)}
                placeholder="e.g., 1, 1/2, 1.5"
                //required
              />
            </div>
                  <div className="col-md-5">
                    <label htmlFor="ingredientUnit" className="form-label">
                      Unit
                    </label>
                         {(() => {
                                    const category    = selectedLocalIngredient?.category || newIngredientCategory;
                                    const unitOptions = getUnitOptions(category);        // todas as unidades da categoria
                                    const defaultUnit = selectedLocalIngredient?.default_unit;

                                    // Se tiver default, coloca ele à frente; senão, só as opções
                                    const orderedUnits = defaultUnit
                                    ? [defaultUnit, ...unitOptions.filter(u => u !== defaultUnit)]
                                    : unitOptions;

                                    return (
                                            <select
                                            id="ingredientUnit"
                                            className="form-select"
                                            value={ingredientUnit}
                                            onChange={e => setIngredientUnit(e.target.value)}
                                            disabled={!category}
                                            //required
                                            >
                                             {orderedUnits.map(u => 
                                             (<option key={u} value={u}>{u} </option>))}
                                            </select>
                                            );
                         })()}
                    </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={handleAddIngredient}
                disabled={!selectedLocalIngredient} // Only enable if existing ingredient is selected
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* New Ingredient Form (Conditional) */}
        {showNewIngredientForm && (
          <div  className="card card-body mb-3 bg-light">
            <h5>Add New Ingredient Details</h5>
            <p>Ingredient "<strong>{ingredientSearchTerm}</strong>" not found. Please provide details:</p>
            {/* Name is the search term */}
            <div className="row g-2 mb-2">
            <div className="col-md-6">
            <label htmlFor="newIngredientCategory" className="form-label">
              Category*
            </label>
            <select
              id="newIngredientCategory"
              className="form-select"
              value={newIngredientCategory}
              onChange={e => {
                setNewIngredientCategory(e.target.value);
                setNewIngredientDefaultUnit(""); 
                setNewIngredientUnit("");  // limpa o select de unidade
                setNewIngredientQuantity("") // limpa a quantidade"
              }}
              
              //required
            >
              <option value="">Select Category...</option>
              {newIngredientCategoryOptions.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
              <div className="col-md-6">
                <label htmlFor="newIngredientUnit" className="form-label">Default Unit*</label>
                <select
                  className="form-select"
                  value={newIngredientDefaultUnit}
                  onChange={e => setNewIngredientDefaultUnit(e.target.value)}
                  //required
                  disabled={!newIngredientCategory} // Disable until category is selected 
                >
                  <option value="">Select Default Unit...</option>
                  {getUnitOptions(newIngredientCategory).map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label">Kcal per Default Unit*</label>
              <input
                type="number"
                className="form-control"
                value={newIngredientKcalPerUnit}
                onChange={e => setNewIngredientKcalPerUnit(e.target.value)}
                min="0"
                //required
              />
            </div>
            <div className="form-check form-switch mb-2">
              <input
                id="isVegan"
                className="form-check-input"
                type="checkbox"
                checked={newIngredientIsVegan}
                onChange={e => setNewIngredientIsVegan(e.target.checked)}
              />
              <label htmlFor="isVegan" className="form-check-label">Is Vegan?</label>
            </div>
            <div className="form-check form-switch mb-2">
              <input
                id="isGlutenFree"
                className="form-check-input"
                type="checkbox"
                checked={newIngredientIsGlutenFree}
                onChange={e => setNewIngredientIsGlutenFree(e.target.checked)}
              />
              <label htmlFor="isGlutenFree" className="form-check-label">Is Gluten Free?</label>
            </div>
            <div className="mb-2">
              <label className="form-label">Aliases (comma-separated)</label>
              <input
                type="text"
                className="form-control"
                value={newIngredientAliases}
                onChange={e => setNewIngredientAliases(e.target.value)}
                placeholder="e.g., chickpeas, garbanzo beans"
              />
            </div>

            {/* Alternative Units Dynamic */}
            <label className="form-label">Alternative Units</label>
            {newAltUnits.map((u, i) => (
              <div className="row g-2 mb-1" key={i}>
                <div className="col-5">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="unit (e.g., CUP)"
                    value={u.unit}
                    onChange={e => handleAltUnitChange(i, 'unit', e.target.value)}
                  />
                </div>
                <div className="col-5">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="factor (to default unit)"
                    value={u.conversion_factor}
                    onChange={e => handleAltUnitChange(i, 'conversion_factor', e.target.value)}
                    step="any"
                    min="0"
                  />
                </div>
                <div className="col-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm w-100"
                    onClick={() => removeAltUnitRow(i)}
                  >&times;</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-3"
              onClick={addAltUnitRow}
            >
              + Add Alternative Unit
            </button>

            {/* Add New Ingredient to Recipe Button */}
            <div className="row g-2 mb-3 align-items-end">
            <div className="row g-2 align-items-end">
      {/* Quantity */}
      <div className="col-md-5">
        <label htmlFor="newIngredientQty" className="form-label">
          Quantity*
        </label>
        <input
          id="newIngredientQty"
          type="text"
          className="form-control"
          value={newIngredientQuantity}
          onChange={e => setNewIngredientQuantity(e.target.value)}
          disabled={!newIngredientCategory || !newIngredientDefaultUnit} // Disable until category and default unit are selected
          //required
        />
      </div>

      {/* Unit PARA NOVO INGREDIENTE */}
      <div className="col-md-5">
        <label htmlFor="newIngredientUnit" className="form-label">
          Unit*
        </label>
        <select
          id="newIngredientUnit"
          className="form-select"
          value={newIngredientUnit}                  // << usa o estado separado
          onChange={e => {
                      setNewIngredientUnit(e.target.value);
                      setNewIngredientQuantity("")}} // Clear quantity when unit changes
                     
          disabled={!newIngredientCategory || !newIngredientDefaultUnit} // Disable until category is selected
          // Se não tiver categoria, não tem unidades; se não tiver default, não tem unidades
          //required
        >
          {getUnitOptions(newIngredientCategory).map(u => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Botão Add New */}
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-success w-100"
          onClick={handleAddIngredient}
        >
          Add New
        </button>
      </div>
    </div>
              </div>
            </div>
          )}

          <hr />
          <button type="submit" className="btn btn-primary">Create Recipe</button>
        </form>
      </div>
    );
}

export default CreateRecipe;

