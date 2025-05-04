// src/pages/Home.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecipes } from '../services/api'; // adjust path if needed

function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  // ← fixed here

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching recipes for homepage...");
        const data = await getRecipes();
        console.log("Fetched recipes:", data);

        if (Array.isArray(data)) {
          setRecipes(data);
        } else {
          console.error("Fetched data is not an array:", data);
          setRecipes([]);
          setError('Received invalid recipe data.');
        }
      } catch (err) {
        console.error("Error fetching recipes for homepage:", err);
        setError('Failed to load recipes. Please try again later.');
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Recipes</h1>
        <Link to="/recipes/create" className="btn btn-primary">
          Create New Recipe
        </Link>
      </div>

      {loading && <p>Loading recipes...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="row">
          {recipes.length === 0 ? (
            <p>No recipes found. Why not create one?</p>
          ) : (
            recipes.map(recipe => (
              <div key={recipe.id} className="col-md-4 mb-4">
                <div className="card h-100">
                  <img
                    src={
                      recipe.image_url ||
                      'https://placehold.co/300x200?text=No+Image'
                    }
                    className="card-img-top"
                    alt={recipe.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src =
                        'https://placehold.co/300x200?text=Image+Not+Found';
                    }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{recipe.name}</h5>
                    <p className="card-text flex-grow-1">
                      {recipe.description
                        ? recipe.description.length > 100
                          ? recipe.description.slice(0, 100) + '…'
                          : recipe.description
                        : 'No description available.'}
                    </p>
                    <button className="btn btn-secondary mt-auto" disabled>
                      View Details (Coming Soon)
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
