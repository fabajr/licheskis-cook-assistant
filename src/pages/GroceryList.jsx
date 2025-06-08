// src/pages/GroceryList.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { getMealPlans } from '../services/api/meal_plans';
import { createGroceryList } from '../services/api/grocery_lists';
import { getRecipeById } from '../services/api/recipes';
import { convert, unitOptionsMap, formatDate, parseQuantity} from '../services/utils/utils';

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
  const [pendingFetches, setPendingFetches] = useState(0);
  const [error, setError] = useState(null);
  const [enrichedPlans, setEnrichedPlans] = useState({});
  
  const previewRef = useRef(null);
  // Highlighting for grocery list preview
  const [ highlightGroceryListPreview, setHighlightGroceryListPreview ] = useState(null);


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

  // Reflect recipe loading state
  useEffect(() => {
    setLoadingRecipes(pendingFetches > 0);
  }, [pendingFetches]);
  
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
  const toggleSelect = useCallback((plan) => {
    const isAlready = selectedMealPlans.some(p => p.id === plan.id);

    if (isAlready) {
      // Deselect
      setSelectedMealPlans(prev => prev.filter(p => p.id !== plan.id));
    } else {
      // Immediately mark as selected so UI updates instantly
      setSelectedMealPlans(prev => [...prev, plan]);

      const loadRecipes = async () => {
        setPendingFetches(c => c + 1);
        let planToAdd = plan;

        if (enrichedPlans[plan.id]) {
          planToAdd = enrichedPlans[plan.id];
        } else {
          const recipeIds = Array.from(new Set(
            plan.days.flatMap(d => d.meals.map(m => m.recipe_id))
          ));

          try {
            const recipes = await Promise.all(
              recipeIds.map(id => getRecipeById(id))
            );
            const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]));

            planToAdd = {
              ...plan,
              days: plan.days.map(d => ({
                ...d,
                meals: d.meals.map(m => ({
                  ...m,
                  recipe: recipeMap[m.recipe_id]
                }))
              }))
            };

            setEnrichedPlans(prev => ({ ...prev, [plan.id]: planToAdd }));
          } catch (err) {
            console.error('Error fetching recipes:', err);
            setError('Failed to load recipes for the selected meal plan. Please try again later.');
          }
        }

        // Replace placeholder plan with enriched version
        setSelectedMealPlans(prev => prev.map(p => p.id === plan.id ? planToAdd : p));
        setPendingFetches(c => c - 1);
      };

      loadRecipes();
    }
  }, [selectedMealPlans, enrichedPlans]);

  // layout effect to scroll preview into view when opened
  useLayoutEffect(() => {
    if (previewOpen && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [previewOpen]);

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
        quantity: parseQuantity(item.quantity),
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
          category: ing.category || 'Other',
          default_unit: ing.default_unit,
          alternative_units: ing.alternative_units || []
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

  // 4) Unifica e converte
  const flattened = [];

  Object.entries(byName).forEach(([name, items]) => {
    const { category, default_unit, alternative_units = [] } = items[0];
    const allowed = unitOptionsMap[category] || [];

    // Agrupa por unidade
    const units = {};
    items.forEach(i => {
      units[i.unit] = (units[i.unit] || 0) + i.quantity;
    });
    const unitList = Object.keys(units);

    // 1. Se só tem UMA unidade, só soma
    if (unitList.length === 1) {
      const u = unitList[0];
      const total = Math.ceil(units[u]);
      if (total > 0) {
        flattened.push({ name, totalQuantity: total, unit: u, category });
      }
      return;
    }

    // 2. Se todas estão no allowed, tenta converter para baseUnit
    let baseUnit = allowed[0] || default_unit || unitList[0];
    let allAllowed = unitList.every(u => allowed.includes(u));

    if (allAllowed) {
      let total = 0;
      let failedUnits = [];
      unitList.forEach(u => {
        try {
          total += convert(units[u], u, baseUnit);
        } catch (e) {
          failedUnits.push(u);
        }
      });
      if (failedUnits.length === 0 && Math.ceil(total) > 0) {
        flattened.push({ name, totalQuantity: Math.ceil(total), unit: baseUnit, category });
        return; // tudo convertido, segue para o próximo ingrediente
      }
      // Os que não conseguiram, vão cair nas próximas etapas
    }

    // 3. Tenta allowed + alternative_units
    let used = {}; // registra unidades que conseguiu converter
    let totalAlt = 0;
    // 3a. Allowed
    unitList.forEach(u => {
      if (allowed.includes(u)) {
        try {
          totalAlt += convert(units[u], u, baseUnit);
          used[u] = true;
        } catch (e) {
          // se falhar, vai tentar nas alternativas depois
        }
      }
    });
    // 3b. Tenta alternative_units para as que faltaram
    unitList.forEach(u => {
      if (!used[u]) {
        const alt = alternative_units.find(au => au.unit === u);
        if (alt && default_unit) {
          try {
            totalAlt += units[u] * alt.conversion_factor;
            used[u] = true;
            baseUnit = default_unit; // força base para default_unit
          } catch (e) {
            // se falhar, fica para nonConvertibleEntries
          }
        }
      }
    });
    if (Math.ceil(totalAlt) > 0) {
      flattened.push({ name, totalQuantity: Math.ceil(totalAlt), unit: baseUnit, category });
    }

    // 4. O que não conseguiu converter, entra separado
    unitList.forEach(u => {
      if (!used[u]) {
        const total = Math.ceil(units[u]);
        if (total > 0) {
          flattened.push({ name, totalQuantity: total, unit: u, category });
        }
      }
    });
  });

  // 5) Group by category
  const categories = flattened.reduce((acc, i) => {
    acc[i.category] = acc[i.category] || [];
    acc[i.category].push({ name: i.name, quantity: i.totalQuantity, unit: i.unit });
    return acc;
  }, {});
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
    const startDate = formatDate(mealPlan.start_date);
    const endDate = formatDate(mealPlan.end_date);
    
    
    
    return `Start: ${(startDate)} - End: ${(endDate)}`;
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
        { selectedMealPlans.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h4 mb-3">Select Meal Plans&nbsp;</h2>
          <span className="badge bg-primary">
            Selected: {selectedMealPlans.length} Meal Plan(s)
          </span>
        </div> )}
        {allMealPlans.length === 0 ? (
          <div>
            <div className="alert alert-info">
              You don't have any meal plans yet. Create a meal plan first to generate a grocery list.
            </div>
            <Link to="/meal-planner" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i> New Meal Plan
            </Link>
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
        
        <div 
            ref = {previewRef}
            className="card mb-4">
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
