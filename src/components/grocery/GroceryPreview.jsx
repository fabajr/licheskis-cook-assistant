// src/components/grocery/GroceryPreview.jsx
import React, { useMemo } from 'react';
import { convert, parseQuantity } from '../../services/utils/utils';

// Component for displaying a category section
const CategorySection = ({ title, items }) => (
  <div className="card mb-3">
    <div className="card-header bg-light">
      <h4 className="h6 mb-0">{title}</h4>
    </div>
    <ul className="list-group list-group-flush">
      {items.map((item, index) => (
        <li key={index} className="list-group-item">
          <div className="form-check">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id={`item-${title}-${index}`}
            />
            <label className="form-check-label" htmlFor={`item-${title}-${index}`}>
              {item.name}: {item.totalQuantity} {item.unit}
            </label>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export default function GroceryPreview({ mealPlans, servingsByRecipe, onCreateList, onClose }) {
  // Process ingredients from all selected meal plans
  const categorizedIngredients = useMemo(() => {
    // Step 1: Extract all ingredients from selected recipes
    const allIngredients = [];
    
    mealPlans.forEach(plan => {
      plan.days.forEach(day => {
        day.meals.forEach(meal => {
          if (meal.recipe_id && meal.recipe && servingsByRecipe[meal.recipe_id] > 0) {
            const servings = servingsByRecipe[meal.recipe_id];
            
            // Add each ingredient with adjusted quantity
            meal.recipe.ingredients.forEach(ingredient => {
              const quantity = parseQuantity(ingredient.quantity);
              
              allIngredients.push({
                id: ingredient.id,
                name: ingredient.name,
                quantity: quantity * servings,
                unit: ingredient.unit,
                category: ingredient.category || 'Other'
              });
            });
          }
        });
      });
    });
    
    // Step 2: Normalize and combine ingredients
    const ingredientMap = new Map();
    
    allIngredients.forEach(ingredient => {
      const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`;
      
      if (ingredientMap.has(key)) {
        // Ingredient exists, add quantities
        const existing = ingredientMap.get(key);
        existing.quantity += ingredient.quantity;
      } else {
        // New ingredient
        ingredientMap.set(key, {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category
        });
      }
    });
    
    // Step 3: Group by category
    const categories = {};
    
    Array.from(ingredientMap.values()).forEach(ingredient => {
      const category = ingredient.category;
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push({
        name: ingredient.name,
        totalQuantity: parseFloat(ingredient.quantity.toFixed(2)),
        unit: ingredient.unit
      });
    });
    
    return categories;
  }, [mealPlans, servingsByRecipe]);
  
  // Get sorted category names
  const categoryNames = Object.keys(categorizedIngredients).sort();
  
  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="h5 mb-0">Preview Grocery List</h3>
        <div>
          <button 
            className="btn btn-success btn-sm me-2"
            onClick={onCreateList}
          >
            Create List ✓
          </button>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={onClose}
          >
            Close ✕
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {categoryNames.length === 0 ? (
          <p className="text-muted">
            No ingredients found. Try adjusting your meal plan selection or servings.
          </p>
        ) : (
          <div>
            {categoryNames.map(category => (
              <CategorySection 
                key={category}
                title={category}
                items={categorizedIngredients[category]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
