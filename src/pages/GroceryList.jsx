// src/pages/GroceryList.jsx
import React, { useState, useEffect, useCallback, useMemo, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { getMealPlans } from '../services/api/meal_plans';
import { createGroceryList } from '../services/api/grocery_lists';
import { getRecipeById } from '../services/api/recipes';
import { parseTimestamp, convert, unitOptionsMap} from '../services/utils/utils';

import GroceryPreview from '../components/grocery/GroceryPreview';


export default function GroceryList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [allMealPlans, setAllMealPlans] = useState([]);
  const [selectedMealPlans, setSelectedMealPlans] = useState([]);
  const [servingsByRecipe, setServingsByRecipe] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [error, setError] = useState(null);
  const [enrichedPlans, setEnrichedPlans] = useState({}); 

 /* useEffect(() => {
    console.log('teste', { 
      'allmealplans ': allMealPlans, 
      'selectedMealPlans' : selectedMealPlans, 
      'servingsByRecipe' : servingsByRecipe, 
      'previewOpen' : previewOpen, 
      'enrichedPlans' :enrichedPlans 
    });
    
  }, [ allMealPlans,selectedMealPlans, servingsByRecipe, previewOpen, enrichedPlans] ); */

  // Fetch all meal plans once
  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        setLoading(true);
        const plans = await getMealPlans();
        setAllMealPlans(plans);
        //console.log('Fetched meal plans:', plans);
      } catch (err) {
        console.error('Error fetching meal plans:', err);
        setError('Failed to load meal plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlans();
  }, [user]);
  
  // Update servings when selected meal plans change
  useEffect(() => {
    const map = new Map();
    selectedMealPlans.forEach(plan =>
      plan.days.forEach(day =>
        day.meals.forEach(meal => {
          if (!map.has(meal.recipe_id)) {
            map.set(meal.recipe_id, {
              id: meal.recipe_id,
              defaultCount: 0
            });
          }
          map.get(meal.recipe_id).defaultCount++;
        })
      )
    );
    const uniques = Array.from(map.values());

    setServingsByRecipe(prev => {
      const next = {};
      // For each selected recipe, use prev (if already adjusted) or defaultCount
      uniques.forEach(r => {
        next[r.id] = prev[r.id] != null ? prev[r.id] : r.defaultCount;
      });
      return next;
    });
  }, [selectedMealPlans]);

  // Close preview when selected meal plans change
  useEffect(() => {
    setPreviewOpen(false);
  }, [selectedMealPlans]);

  // Toggle meal plan selection with caching
  const toggleSelect = useCallback(async (plan) => {
    const isAlready = selectedMealPlans.some(p => p.id === plan.id);

    if (isAlready) {
      // Deselect
      setSelectedMealPlans(prev =>
        prev.filter(p => p.id !== plan.id)
      );
    } else {
      let planToAdd;

      if (enrichedPlans[plan.id]) { 
        // Reuse enriched plan
        planToAdd = enrichedPlans[plan.id];
      } else {
        // First access: fetch only necessary recipes
        const recipeIds = Array.from(new Set(
          plan.days.flatMap(d => d.meals.map(m => m.recipe_id))
        ));

        // Fetch recipes in parallel
        setLoadingRecipes(true);
        try {
        const recipes = await Promise.all(
          recipeIds.map(id => getRecipeById(id))
        );
        const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]));

        // Inject recipe in each meal
        planToAdd = {
          ...plan,
          days: plan.days.map(d => ({
            ...d,
            meals: d.meals.map(m => ({
              ...m,
              recipe: recipeMap[m.recipe_id]
            }))
          }))
        }
        } catch (err) {
          console.error('Error fetching recipes:', err);
          setError('Failed to load recipes for the selected meal plan. Please try again later.');
        } finally {
          setLoadingRecipes(false);
        }

        ;

        // Save in local cache
        setEnrichedPlans(prev => ({ ...prev, [plan.id]: planToAdd }));
      }

      // Add to selected plans
      setSelectedMealPlans(prev => [...prev, planToAdd]);
      //console.log('Selected meal plan:', planToAdd);
    }
  }, [selectedMealPlans, enrichedPlans]);

  // Update servings
  const handleServingsChange = (recipeId, newCount) => {
    setServingsByRecipe(prev => ({
      ...prev,
      [recipeId]: parseInt(newCount, 10) || 0
    }));
  };

  // Preview controls
  const togglePreview = () => setPreviewOpen(v => !v);
  const closePreview = () => setPreviewOpen(false);

  // Create grocery list with updated payload structure
  const handleCreateList = async () => {
    try {
      // 1) Build the flat items array as you already do…
  const categorizedIngredients = processIngredients(selectedMealPlans, servingsByRecipe);
  const items = [];
  Object.entries(categorizedIngredients).forEach(([category, list]) => {
    list.forEach(item => {
      items.push({
        name:     item.name,
        category,
        quantity: item.quantity,
        unit:     item.unit
      });
    });
  });

  // 2) Pull out the plan IDs into a simple array
  const meal_plan_id = selectedMealPlans.map(p => p.id);

  // 3) Create the payload object
  const payload = { meal_plan_id, items };
  console.log('Grocery list payload:', payload);

  // 4) Send it directly—no extra wrapper!
  await createGroceryList(payload);
      
    } catch (err) {
      console.error('Error creating grocery list:', err);
      //setError('Failed to create grocery list. Please try again.');
    } finally{
      
      setSelectedMealPlans([]);
      setPreviewOpen(false);
      navigate('/profile', {
            state: { from: 'grocery-list', show: 'GroceryModal' },
            replace: true
          });
          return;

    }
  };

  // Compute unique recipes for ServingsAdjuster
  const getUniqueRecipes = useMemo(() => {
    const map = new Map();
    selectedMealPlans.forEach(plan => {
      plan.days.forEach(day => {
        day.meals.forEach(meal => {
          if (meal.recipe_id && meal.recipe) {
            if (!map.has(meal.recipe_id)) {
              map.set(meal.recipe_id, {
                id: meal.recipe_id,
                name: meal.recipe.name,
                defaultCount: 0,
                servingPerRecipe: meal.recipe.servings || 1
              });
            }
            map.get(meal.recipe_id).defaultCount += 1;
          }
        });
      });
    });
    return Array.from(map.values());
  }, [selectedMealPlans]);

/**
 * Process meal plans into categorized ingredient totals with unit-aware conversion.
 * Uses user-selected servings directly (ignores recipe occurrences).
 * Rounds up to nearest integer after summing to avoid decimals.
 * @param {Array} mealPlans - List of meal plan objects.
 * @param {Object} servingsByRecipe - Map of recipe_id to desired servings count.
 * @returns {Object} categories - Map of category to list of { name, totalQuantity, unit }.
 */
const processIngredients = (mealPlans, servingsByRecipe) => {
  // 1) Build lookup of unique recipes from plan
  const recipeLookup = {};
  mealPlans.forEach(plan => {
    plan.days.forEach(day => {
      day.meals.forEach(meal => {
        if (meal.recipe) {
          recipeLookup[meal.recipe_id] = meal.recipe;
        }
      });
    });
  });

  // 2) Extract ingredients adjusted by user-selected servings
  const all = [];
  Object.entries(servingsByRecipe).forEach(([recipeId, targetServings]) => {
    const recipe = recipeLookup[recipeId];
    if (recipe && targetServings > 0) {
      const originalServings = recipe.servings || 1;
      recipe.ingredients.forEach(ing => {
        const rawQty = parseFloat(ing.quantity) || 0;
        const adjustedQty = (rawQty / originalServings) * targetServings;
        all.push({
          name: ing.name,
          quantity: adjustedQty,
          unit: (ing.unit || '').trim().toUpperCase(),
          category: ing.category || 'Other'
        });
      });
    }
  });

  // 3) Group by ingredient name
  const byName = all.reduce((acc, ing) => {
    acc[ing.name] = acc[ing.name] || [];
    acc[ing.name].push(ing);
    return acc;
  }, {});

  // 4) Sum same-unit items, convert allowed units, handle non-convertible
  const flattened = [];
  Object.entries(byName).forEach(([name, items]) => {
    const category = items[0].category;
    const allowed = unitOptionsMap[category] || [];

    // Sum items by unit
    const summedByUnit = items.reduce((acc, i) => {
      acc[i.unit] = (acc[i.unit] || 0) + i.quantity;
      return acc;
    }, {});

    // Separate convertible vs non-convertible
    const convertibleEntries = [];
    const nonConvertibleEntries = [];
    Object.entries(summedByUnit).forEach(([unit, qty]) => {
      if (allowed.includes(unit)) {
        convertibleEntries.push({ unit, quantity: qty });
      } else {
        nonConvertibleEntries.push({ unit, quantity: qty });
      }
    });

    // Convert convertible entries and round up
    if (convertibleEntries.length > 0) {
      const counts = {};
      convertibleEntries.forEach(e => { counts[e.unit] = (counts[e.unit] || 0) + 1; });
      let baseUnit = allowed[0];
      let max = 0;
      Object.entries(counts).forEach(([u, c]) => { if (c > max) { max = c; baseUnit = u; }});

      let sumConverted = 0;
      convertibleEntries.forEach(e => {
        try {
          sumConverted += convert(e.quantity, e.unit, baseUnit);
        } catch (err) {
          console.warn(`Conversion failed ${e.quantity} ${e.unit} → ${baseUnit}`, err);
          nonConvertibleEntries.push(e);
        }
      });

      const rounded = Math.ceil(sumConverted);
      if (rounded > 0) {
        flattened.push({ name, totalQuantity: rounded, unit: baseUnit, category });
      }
    }

    // Add non-convertible entries and round up
    nonConvertibleEntries.forEach(e => {
      const rounded = Math.ceil(e.quantity);
      if (rounded > 0) {
        flattened.push({ name, totalQuantity: rounded, unit: e.unit, category });
      }
    });
  });

  // 5) Group by category
  const categories = flattened.reduce((acc, i) => {
    acc[i.category] = acc[i.category] || [];
    acc[i.category].push({ name: i.name, quantity: i.totalQuantity, unit: i.unit });
    return acc;
  }, {});

  // 6) Sort each category alphabetically
  Object.keys(categories).forEach(cat => {
    categories[cat].sort((a, b) => a.name.localeCompare(b.name));
  });

  return categories;
};

  // Format date range for display
  const formatDateRange = (mealPlan) => {
    if (!mealPlan.start_date || !mealPlan.end_date) {
      return 'Date range not available';
    }
    const startDate = new Date(parseTimestamp(mealPlan.start_date));
    const endDate = new Date(parseTimestamp(mealPlan.end_date));
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return `Start: ${formatDate(startDate)} - End: ${formatDate(endDate)}`;
  };

  // Check if a meal plan is selected
  const isSelected = (mealPlanId) => {
    return selectedMealPlans.some(plan => plan.id === mealPlanId);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading meal plans...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Grocery List</h1>
      </div>

      {/* Meal Plan Selection Section */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h4 mb-3">Select Meal Plans&nbsp;</h2>
          <span className="badge bg-primary">
            Selected: {selectedMealPlans.length} Meal Plan(s)
          </span>
        </div>
        {allMealPlans.length === 0 ? (
          <div className="alert alert-info">
            You don't have any meal plans yet. Create a meal plan first to generate a grocery list.
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {allMealPlans.map(mealPlan => (
              <div className="col" key={mealPlan.id}>
                {/* Meal Plan Card */}
                <div 
                  className={`card shadow-sm ${isSelected(mealPlan.id) ? 'border border-primary bg-light' : ''}`}
                  onClick={() => toggleSelect(mealPlan)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <h5 className="card-title">{mealPlan.name || 'Unnamed Meal Plan'}</h5>
                    <p className="card-text">
                      <small className="text-muted">{formatDateRange(mealPlan)}</small>
                    </p>
                  </div>
                  
                  {/* Show selection indicator in select mode */}
                  {isSelected(mealPlan.id) && (
                    <div className="position-absolute top-0 end-0 p-2">
                      <span className="badge bg-primary rounded-pill">
                        <i className="bi bi-check-lg"></i>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Servings Adjuster Section */}
      { selectedMealPlans.length > 0 && (<div className="card mb-4">
        
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Step 1 – Adjust Servings</h3>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={togglePreview}
            disabled={selectedMealPlans.length === 0}
          >
            Preview {previewOpen ? '▼' : '▶'}
          </button>
        </div>
        
        <div className="card-body">
          {loadingRecipes ? (
            <p className="text-muted">
              Loading Recipes... Please wait.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Recipe Name</th>
                    <th>Servings in the Plan</th>
                    <th>Servings per Recipe</th>
                    <th>Select Servings </th>
                  </tr>
                </thead>
                <tbody>
                  {getUniqueRecipes.map(recipe => (
                    <tr key={recipe.id}>
                      <td>{recipe.name}</td>
                      <td>{recipe.defaultCount}×</td>
                      <td>{recipe.servingPerRecipe}</td>
                      <td style={{ width: '150px' }}>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={servingsByRecipe[recipe.id] || 0}
                          onChange={(e) => handleServingsChange(recipe.id, e.target.value)}
                          min="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>)}

      {/* Grocery Preview Section */}
      {previewOpen && (
        
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="h5 mb-0">Preview Grocery List</h3>
            <div>
              <button 
                className="btn btn-success btn-sm me-2"
                onClick={handleCreateList}
              >
                Create List ✓
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={closePreview}
              >
                Close ✕
              </button>
            </div>
          </div>
          
          <div className="card-body">
            {(() => {
              const categorizedIngredients = processIngredients(selectedMealPlans, servingsByRecipe);
              const categoryNames = Object.keys(categorizedIngredients).sort();
              
              return categoryNames.length === 0 ? (
                <p className="text-muted">
                  No ingredients found.  Try adjusting your meal plan selection or servings.
                </p>
              ) : (
                <div>
                  {categoryNames.map(category => (
                    <GroceryPreview 
                      key={category}
                      title={category}
                      items={categorizedIngredients[category]}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
