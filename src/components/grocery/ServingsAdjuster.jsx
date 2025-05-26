// src/components/grocery/ServingsAdjuster.jsx
import React from 'react';

export default function ServingsAdjuster({ 
  recipes, 
  servingsByRecipe, 
  onChangeServings, 
  onTogglePreview, 
  previewEnabled, 
  previewOpen 
}) {
  console.log('ServingsAdjuster', { recipes, servingsByRecipe, onChangeServings, onTogglePreview, previewEnabled, previewOpen });

  // Handle input change for servings
  const handleServingChange = (recipeId, e) => {
    const newValue = e.target.value;
    onChangeServings(recipeId, newValue);
  };

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="h5 mb-0">Step 1 – Adjust Servings</h3>
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={onTogglePreview}
          disabled={!previewEnabled}
        >
          Preview {previewOpen ? '▼' : '▶'}
        </button>
      </div>
      
      <div className="card-body">
        {recipes.length === 0 ? (
          <p className="text-muted">
            Select at least one meal plan to adjust servings.
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
                {recipes.map(recipe => (
                  <tr key={recipe.id}>
                    <td>{recipe.name}</td>
                    <td>{recipe.defaultCount}×</td>
                    <td>{recipe.servingPerRecipe}</td>
                    <td style={{ width: '150px' }}>
                      <input
                        type="number"
                        
                        className="form-control form-control-sm"
                        value={servingsByRecipe[recipe.id] || 0}
                        
                        onChange={(e) => handleServingChange(recipe.id, e)}
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
    </div>
  );
}
