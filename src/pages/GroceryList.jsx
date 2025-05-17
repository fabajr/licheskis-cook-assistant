// src/pages/GroceryList.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Stub for generateGroceryList since API is not available
const generateGroceryList = async (recipeIds) => {
  console.log('Simulated generateGroceryList for recipes:', recipeIds);
  // Return a demo grocery list
  return {
    name: 'Demo Grocery List',
    items: [
      { ingredient_id: '1', name: 'Apples', category: 'Produce', quantity: 4, unit: 'unit', checked: false },
      { ingredient_id: '1', name: 'Apples', category: 'Produce', quantity: 4, unit: 'unit', checked: false },
      { ingredient_id: '2', name: 'Milk', category: 'Dairy', quantity: 1, unit: 'gal', checked: false },
      { ingredient_id: '3', name: 'Eggs', category: 'Dairy', quantity: 12, unit: 'unit', checked: false },
      { ingredient_id: '4', name: 'Carrots', category: 'Produce', quantity: 1, unit: 'lb', checked: false }
    ]
  };
};

function GroceryList() {
  const [recipeIds, setRecipeIds] = useState([]);
  const [groceryList, setGroceryList] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateList = async () => {
    setError(null);
    setGenerating(true);
    try {
      const result = await generateGroceryList(recipeIds);
      setGroceryList(result);
    } catch (err) {
      console.error(err);
      setError('Failed to generate grocery list. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleItemCheck = (itemIndex) => {
    setGroceryList(prev => {
      const updated = { ...prev };
      updated.items = [...updated.items];
      updated.items[itemIndex] = {
        ...updated.items[itemIndex],
        checked: !updated.items[itemIndex].checked
      };
      return updated;
    });
  };

  const printGroceryList = () => window.print();

  return (
    <div className="container py-4">
      <h1 className="mb-4">Grocery List</h1>

      {!groceryList ? (
        <div className="card mb-4">
          <div className="card-header">
            <h4 className="mb-0">Generate Grocery List</h4>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <p>
              You can generate a grocery list from your meal plan or select individual recipes.
            </p>

            <div className="d-grid gap-2">
              <Link to="/meal-planner" className="btn btn-outline-primary">
                Use Meal Plan
              </Link>
              <Link to="/recipes" className="btn btn-outline-secondary">
                Select Recipes
              </Link>
              <button
                className="btn btn-primary"
                onClick={handleGenerateList}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Generating...
                  </>
                ) : (
                  'Generate Demo Grocery List'
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grocery-list-container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>{groceryList.name}</h3>
            <div>
              <button
                className="btn btn-outline-secondary me-2"
                onClick={() => setGroceryList(null)}
              >
                Back
              </button>
              <button className="btn btn-primary" onClick={printGroceryList}>
                Print List
              </button>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              {groceryList.items.length === 0 ? (
                <div className="alert alert-info" role="alert">
                  No items in grocery list.
                </div>
              ) : (
                <>
                  {/* Group items by category */}
                  {Array.from(
                    new Set(groceryList.items.map(item => item.category))
                  ).map(category => (
                    <div key={category} className="mb-3">
                      <div className="grocery-category fw-bold mb-2">{category}</div>
                      {groceryList.items
                        .filter(item => item.category === category)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="grocery-item d-flex justify-content-between align-items-center mb-1"
                          >
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`item-${index}`}
                                checked={item.checked}
                                onChange={() => toggleItemCheck(index)}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`item-${index}`}
                                style={{ textDecoration: item.checked ? 'line-through' : 'none' }}
                              >
                                {item.name}
                              </label>
                            </div>
                            <span className="badge bg-light text-dark">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroceryList;
