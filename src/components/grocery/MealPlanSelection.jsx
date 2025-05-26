// src/components/grocery/MealPlanSelection.jsx
import React from 'react';
import MealPlanCard from '../grocery/MealPlanCard';

export default function MealPlanSelection({ mealPlans, selectedMealPlans, onToggleSelect }) {
  // Check if a meal plan is selected
  const isSelected = (mealPlanId) => {
    return selectedMealPlans.some(plan => plan.id === mealPlanId);
  };

  console.log('MealPlanSelection', { mealPlans, selectedMealPlans, onToggleSelect });
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
      <h2 className="h4 mb-3">Select Meal Plans&nbsp;</h2>
      <span className="badge bg-primary">
          Selected: {selectedMealPlans.length} Meal Plan(s)
        </span>
      </div>
      {mealPlans.length === 0 ? (
        <div className="alert alert-info">
          You don't have any meal plans yet. Create a meal plan first to generate a grocery list.
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {mealPlans.map(mealPlan => (
            <div className="col" key={mealPlan.id}>
              <MealPlanCard 
                mealPlan={mealPlan}
                mode="select"
                selected={isSelected(mealPlan.id)}
                onClick={() => onToggleSelect(mealPlan)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
