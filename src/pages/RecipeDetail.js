// src/pages/RecipeDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipeById, deleteRecipe } from '../services/api/recipes';
import { useAuth } from '../context/AuthContext';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const { role } = useAuth();


  useEffect(() => {
    let isMounted = true;
    async function fetchRecipe() {
      try {
        setLoading(true);
        const data = await getRecipeById(id);
        if (isMounted) setRecipe(data);
      } catch (err) {
        console.error(err);
        if (isMounted) setError('Failed to load recipe. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRecipe();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try {
      await deleteRecipe(id);
      navigate('/recipes');
    } catch (err) {
      console.error(err);
      alert('Could not delete recipe.');
    }
  };

  const phaseClasses = {
    M: 'phase-M',
    F: 'phase-F',
    O: 'phase-O',
    ML: 'phase-ML',
    LL: 'phase-LL',
  };

  const phaseNames = {
    M: 'Menstrual',
    F: 'Follicular',
    O: 'Ovulation',
    ML: 'Mid-Luteal',
    LL: 'Late-Luteal',
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-5" role="alert">
        {error}
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="alert alert-warning my-5" role="alert">
        Recipe not found.
      </div>
    );
  }

  // Destructure with defaults
  const {
    name = '',
    description = '',
    category = 'Uncategorized',
    total_calories = null,
    servings = null,
    prep_time = null,
    is_vegan = false,
    is_gluten_free = false,
    cycle_tags = [],
    image_url = '',
    ingredients = [],
    instructions = [],
  } = recipe;

  return (
    <div className="container py-4 recipe-detail">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">{name}</h1>
        
      </div>

      <div className="d-flex flex-wrap align-items-center mb-4">
        <span className="badge bg-secondary me-2">{category}</span>
        {total_calories != null && (
          <span className="badge bg-info me-2">
            {total_calories} kcal
          </span>
        )}
        {servings != null && (
          <span className="badge bg-primary me-2">
            {servings} servings
          </span>
        )}
        {prep_time > 0 && (
          <span className="badge bg-dark me-2">
            {prep_time} min prep
          </span>
        )}
        {is_vegan && (
          <span className="badge bg-success me-2">Vegan</span>
        )}
        {is_gluten_free && (
          <span className="badge bg-warning text-dark me-2">
            Gluten-Free
          </span>
        )}
      </div>

      <div className="mb-4">
        <h5>Suitable for Hormonal Phases:</h5>
        <div>
          {Array.isArray(cycle_tags) && cycle_tags.length > 0 ? (
            cycle_tags.map(tag => (
              <span
                key={tag}
                className={`badge phase-badge ${phaseClasses[tag] || ''} me-2`}
                title={phaseNames[tag] || tag}
              >
                {phaseNames[tag] || tag}
              </span>
            ))
          ) : (
            <span className="text-muted">None</span>
          )}
        </div>
      </div>

      {image_url && (
        <div className="mb-4 text-center">
          <img
            src={image_url}
            alt={name}
            className="img-fluid rounded"
            style={{ maxHeight: 400, width: 'auto' }}
          />
        </div>
      )}

      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">Ingredients</h4>
            </div>
            <div className="card-body">
              <ul className="ingredient-list list-unstyled mb-0">
                {Array.isArray(ingredients) && ingredients.length > 0 ? (
                  ingredients.map((item, idx) => {
                    const name =
                      item.ingredient_details?.name || item.name || 'Item';
                    const qty = item.quantity != null ? item.quantity : '';
                    const unit = item.unit || '';
                    return (
                      <li key={idx} className="mb-1">
                        <strong>{qty} {unit}</strong> {name}
                      </li>
                    );
                  })
                ) : (
                  <li className="text-muted">No ingredients listed.</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Instructions</h4>
            </div>
            <div className="card-body">
              <ol className="instruction-list mb-0">
                {Array.isArray(instructions) && instructions.length > 0 ? (
                  instructions.map((inst, idx) => (
                    <li key={inst.step ?? idx}>{inst.text}</li>
                  ))
                ) : (
                  <li className="text-muted">No instructions provided.</li>
                )}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons at bottom */}
      <hr className="my-4" />
      {user && role === 'admin' && (      
      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/recipes/${id}/edit`)}
        >
          Edit
        </button>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div> )}
    </div>
  );
}
