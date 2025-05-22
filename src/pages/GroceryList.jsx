// src/pages/GroceryList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMealPlans } from '../services/api/meal_plans';
import { createGroceryList } from '../services/api/grocery_lists';
import MealPlanSelection from '../components/grocery/MealPlanSelection';
import ServingsAdjuster from '../components/grocery/ServingsAdjuster';
import GroceryPreview from '../components/grocery/GroceryPreview';

export default function GroceryList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [allMealPlans, setAllMealPlans] = useState([]);
  const [selectedMealPlans, setSelectedMealPlans] = useState([]);
  const [servingsByRecipe, setServingsByRecipe] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all meal plans on component mount
  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        setLoading(true);
        const plans = await getMealPlans();
        setAllMealPlans(plans);
        
        // Initialize servings state with default counts
        const initialServings = {};
        plans.forEach(plan => {
          plan.days.forEach(day => {
            day.meals.forEach(meal => {
              if (meal.recipe_id) {
                initialServings[meal.recipe_id] = initialServings[meal.recipe_id] || 0;
                initialServings[meal.recipe_id] += 1;
              }
            });
          });
        });
        setServingsByRecipe(initialServings);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching meal plans:', err);
        setError('Failed to load meal plans. Please try again later.');
        setLoading(false);
      }
    };

    fetchMealPlans();
  }, [user]);

  // Toggle meal plan selection
  const toggleMealPlanSelection = (mealPlan) => {
    setSelectedMealPlans(prev => {
      const isSelected = prev.some(plan => plan.id === mealPlan.id);
      
      if (isSelected) {
        // Remove from selection
        return prev.filter(plan => plan.id !== mealPlan.id);
      } else {
        // Add to selection
        return [...prev, mealPlan];
      }
    });
  };

  // Update servings for a recipe
  const handleServingsChange = (recipeId, newCount) => {
    setServingsByRecipe(prev => ({
      ...prev,
      [recipeId]: parseInt(newCount, 10) || 0
    }));
  };

  // Toggle preview section
  const togglePreview = () => {
    setPreviewOpen(prev => !prev);
  };

  // Close preview section
  const closePreview = () => {
    setPreviewOpen(false);
  };

  // Create grocery list
  const handleCreateList = async () => {
    try {
      // Get only the recipes that are in selected meal plans
      const relevantRecipes = {};
      selectedMealPlans.forEach(plan => {
        plan.days.forEach(day => {
          day.meals.forEach(meal => {
            if (meal.recipe_id && servingsByRecipe[meal.recipe_id]) {
              relevantRecipes[meal.recipe_id] = servingsByRecipe[meal.recipe_id];
            }
          });
        });
      });
/*
      await createGroceryList({
        name: `Grocery List - ${new Date().toLocaleDateString()}`,
        plans: selectedMealPlans.map(plan => plan.id),
        servings: relevantRecipes,
        created_at: new Date().toISOString()
      }); */

      // Reset state or redirect
      setSelectedMealPlans([]);
      setPreviewOpen(false);
      navigate('/profile'); // Redirect to profile page where grocery lists are shown
    } catch (err) {
      console.error('Error creating grocery list:', err);
      setError('Failed to create grocery list. Please try again.');
    }
  };

  // Get unique recipes from selected meal plans
  const getUniqueRecipes = () => {
    const recipesMap = new Map();
    
    selectedMealPlans.forEach(plan => {
      plan.days.forEach(day => {
        day.meals.forEach(meal => {
          if (meal.recipe_id && meal.recipe) {
            if (!recipesMap.has(meal.recipe_id)) {
              recipesMap.set(meal.recipe_id, {
                id: meal.recipe_id,
                name: meal.recipe.name,
                defaultCount: 0
              });
            }
            
            // Increment the default count
            const recipe = recipesMap.get(meal.recipe_id);
            recipe.defaultCount += 1;
          }
        });
      });
    });
    
    return Array.from(recipesMap.values()); 
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading meal plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Grocery List</h1>
        <span className="badge bg-primary">
          Selected: {selectedMealPlans.length} Meal Plan(s)
        </span>
      </div>

      {/* Meal Plan Selection */}
      <MealPlanSelection 
        mealPlans={allMealPlans}
        selectedMealPlans={selectedMealPlans}
        onToggleSelect={toggleMealPlanSelection}
      />

      {/* Servings Adjuster */}
      <ServingsAdjuster 
        recipes={getUniqueRecipes()}
        servingsByRecipe={servingsByRecipe}
        onChangeServings={handleServingsChange}
        onTogglePreview={togglePreview}
        previewEnabled={selectedMealPlans.length > 0}
        previewOpen={previewOpen}
      />

      {/* Grocery Preview (conditionally rendered) */}
      {previewOpen && (
        <GroceryPreview 
          mealPlans={selectedMealPlans}
          servingsByRecipe={servingsByRecipe}
          onCreateList={handleCreateList}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
