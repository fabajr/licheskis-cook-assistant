// src/pages/Recipes.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRecipes } from '../services/api/recipes';
import { useAuth } from '../context/AuthContext';

function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const { role } = useAuth();

  // 1) Fetch initial recipes
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        setError(null);
        const { recipes: list, nextPageToken: token } = await getRecipes();
        setRecipes(list);
        setNextPageToken(token);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError('Failed to load recipes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // 2) Load more for pagination
  const loadMore = useCallback(async () => {
    if (!nextPageToken || loading) return;
    try {
      setLoading(true);
      const { recipes: more, nextPageToken: token } = await getRecipes(nextPageToken);
      setRecipes(prev => {
        const uniqueNew = more.filter(item => !prev.some(old => old.docId === item.docId));
        return [...prev, ...uniqueNew];
      });
      setNextPageToken(token);
    } catch (err) {
      console.error("Error loading more recipes:", err);
      setError('Failed to load more recipes.');
    } finally {
      setLoading(false);
    }
  }, [nextPageToken, loading]);

  // 3) Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (nextPageToken && loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        { rootMargin: '200px' }
      );
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [loadMore, nextPageToken]);

  // Derive categories and filtered list
  const categories = Array.from(new Set(recipes.map(r => r.category))).sort();
  const filteredRecipes = recipes.filter(r =>
    (!categoryFilter || r.category === categoryFilter) &&
    (!searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mt-4">
      {/* Header with Create button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Recipes</h1>
        {role === 'admin' && (
          <Link to="/recipes/create" className="btn btn-primary">
            Create New Recipe
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4 mb-2">
          <select
            className="form-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-8 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Recipes Grid */}
      <div className="row">
        {!loading && filteredRecipes.length === 0 && !error && (
          <p>No recipes match your search.</p>
        )}
        {filteredRecipes.map(recipe => (
          <div key={recipe.docId} className="col-md-4 mb-4">
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
                <Link
                  to={`/recipes/${recipe.docId}`}
                  className="btn btn-secondary mt-auto"
                >
                  View Details
                </Link>
              </div>
              {/* Edit button below the card for admin */}
            {role === 'admin' && (
              <div className="mt-2 text-center">
                <Link
                  to={`/recipes/${recipe.docId}/edit`}
                  className="btn btn-sm btn-secondary"
                >
                  Edit
                </Link>
              </div>
            )}
            </div>
            
          </div>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={loadMoreRef} />

      {/* Loading / End of list */}
      {loading && <p>Loading recipes...</p>}
      {!loading && !nextPageToken && recipes.length > 0 && (
        <p className="text-center mt-3">All recipes loaded.</p>
      )}
    </div>
  );
}

export default Recipes;
