import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRecipeById } from '../services/api/recipes'; // Adjust path if needed

function RecipeDetail() {
  const { id } = useParams(); // Get the recipe ID from the URL parameter
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return; // Don't fetch if ID is missing

      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching details for recipe ID: ${id}`);
        const data = await getRecipeById(id);
        console.log("Fetched recipe details:", data);
        setRecipe(data);
      } catch (err) {
        console.error(`Error fetching recipe ${id}:`, err);
        setError('Failed to load recipe details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]); // Re-run effect if the ID changes

  if (loading) {
    return <div className="container mt-4"><p>Loading recipe details...</p></div>;
  }

  if (error) {
    return <div className="container mt-4 alert alert-danger">{error}</div>;
  }

  if (!recipe) {
    return <div className="container mt-4"><p>Recipe not found.</p></div>;
  }

  // Helper to format instructions (assuming it's an array of objects or strings)
  const formatInstructions = (instructions) => {
    if (!instructions) return <p>No instructions provided.</p>;
    if (Array.isArray(instructions)) {
      return (
        <ol>
          {instructions.map((step, index) => (
            <li key={index}>{typeof step === 'object' && step.text ? step.text : step}</li>
          ))}
        </ol>
      );
    }
    // Handle plain text instructions if needed
    return <p>{instructions}</p>; 
  };

  // Helper to format ingredients
  const formatIngredients = (ingredients) => {
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return <p>No ingredients listed.</p>;
    }
    return (
      <ul>
        {ingredients.map((ing, index) => (
          <li key={index}>
            {ing.quantity} {ing.unit} {ing.name}
            {/* Optionally display FDC ID if available */}
            {/* {ing.fdcId && ` (FDC ID: ${ing.fdcId})`} */}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{recipe.name || 'Recipe Details'}</li>
        </ol>
      </nav>

      <div className="card">
        <img 
          src={recipe.image_url || 'https://placehold.co/600x300?text=No+Image'} 
          className="card-img-top" 
          alt={recipe.name} 
          style={{ maxHeight: '400px', objectFit: 'cover' }} 
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; 
            currentTarget.src='https://placehold.co/600x300?text=Image+Not+Found';
          }}
        />
        <div className="card-body">
          <h1 className="card-title">{recipe.name}</h1>
          <p className="card-text text-muted">Category: {recipe.category || 'N/A'}</p>
          {recipe.cycle_tags && recipe.cycle_tags.length > 0 && (
            <p className="card-text">Cycle Tags: {recipe.cycle_tags.join(', ')}</p>
          )}
          <p className="card-text">{recipe.description || 'No description available.'}</p>
          
          <hr />

          <div className="row mb-3">
            <div className="col-md-6">
              <h5>Preparation Time</h5>
              <p>{recipe.prep_time ? `${recipe.prep_time} minutes` : 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <h5>Servings</h5>
              <p>{recipe.servings || 'N/A'}</p>
            </div>
          </div>

          <hr />

          <h5>Ingredients</h5>
          {formatIngredients(recipe.ingredients)}

          <hr />

          <h5>Instructions</h5>
          {formatInstructions(recipe.instructions)}

          {/* Add Edit/Delete buttons later */}
          {/* <div className="mt-4">
            <Link to={`/recipes/${id}/edit`} className="btn btn-warning me-2">Edit Recipe</Link>
            <button className="btn btn-danger">Delete Recipe</button>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default RecipeDetail;

