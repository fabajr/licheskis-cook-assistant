// src/pages/RecipeDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link }           from 'react-router-dom';
import { getRecipeById }              from '../services/api/recipes';
import veganIcon                      from '../assets/vegan.png';
import gfIcon                         from '../assets/gluten-free.png';

function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getRecipeById(id);
        console.log('Full recipe GET payload:', data);
        
        if (Array.isArray(data.missingIngredients) && data.missingIngredients.length) {
          alert(
            `Warning: ${data.missingIngredients.length} ingredient(s) ` +
            `not found: ${data.missingIngredients.join(', ')}`
          );
        }

        setRecipe(data);
      } catch (err) {
        console.error(`Error fetching recipe ${id}:`, err);
        setError('Failed to load recipe details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="container mt-4"><p>Loading recipe details...</p></div>;
  }
  if (error) {
    return <div className="container mt-4 alert alert-danger">{error}</div>;
  }
  if (!recipe) {
    return <div className="container mt-4"><p>Recipe not found.</p></div>;
  }

  // Destructure the enriched payload
  const {
    name,
    image_url,
    description,
    prep_time,
    servings,
    category,
    recipeVegan,
    recipeGlutenFree,
    totalKcal,
    cycle_tags_labels = [],
    ingredients = [],
    instructions = []
  } = recipe;

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{name}</li>
        </ol>
      </nav>

      <div className="card">
        <img 
          src={image_url || 'https://placehold.co/600x300?text=No+Image'} 
          className="card-img-top" 
          alt={name}
          style={{ maxHeight: 400, objectFit: 'cover' }}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = 'https://placehold.co/600x300?text=Image+Not+Found';
          }}
        />

        <div className="card-body">
          {/* === Title + Icons (yellow area) */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h1 className="card-title">{name}</h1>
            <div>
              {recipeVegan && (
                <img
                  src={veganIcon}
                  alt="Vegan"
                  title="Vegan"
                  style={{ width: 28, marginRight: 8 }}
                />
              )}
              {recipeGlutenFree && (
                <img
                  src={gfIcon}
                  alt="Gluten Free"
                  title="Gluten Free"
                  style={{ width: 28 }}
                />
              )}
            </div>
          </div>

          {/* === Category larger */}
          <h5 className="text-muted mb-3">{category}</h5>

          {/* === Cycle Tags + Total Calories (blue area) */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>{cycle_tags_labels.join(' - ')}</div>
            <div>
              <strong>Total Calories:</strong> {totalKcal} kcal
            </div>
          </div>

          {/* === Description */}
          <p className="card-text">{description || 'No description available.'}</p>

          <hr />

          {/* === Prep Time & Servings */}
          <div className="row mb-3">
            <div className="col-md-6">
              <h6>Preparation Time</h6>
              <p>{prep_time ? `${prep_time} minutes` : 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <h6>Servings</h6>
              <p>{servings}</p>
            </div>
          </div>

          <hr />

          {/* === Ingredients */}
          <h5>Ingredients</h5>
          {ingredients.length === 0 ? (
            <p>No ingredients listed.</p>
          ) : (
            <ul>
              {ingredients.map((ing, idx) => (
                <li key={idx}>
                  {ing.name}: {ing.quantity} {ing.unit}
                </li>
              ))}
            </ul>
          )}

          <hr />

          {/* === Instructions */}
          <h5>Instructions</h5>
          {instructions.length === 0 ? (
            <p>No instructions provided.</p>
          ) : (
            <ol>
              {instructions.map((step, i) => (
                <li key={i}>{typeof step === 'object' ? step.text : step}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetail;
