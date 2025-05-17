// src/pages/Recipes.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRecipes } from '../services/api/recipes';
import { useAuth } from '../context/AuthContext';

function Recipes() {
  const [recipes, setRecipes]             = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const loadMoreRef                       = useRef(null);
  const observerRef                       = useRef(null);

  const { user } = useAuth();
  const { role } = useAuth();


  // 1) Fetch inicial
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

  // 2) Função de carregar próxima página
  const loadMore = useCallback(async () => {
    if (!nextPageToken || loading) return;   // ❶
  
    try {
      setLoading(true);
      const { recipes: more, nextPageToken: token } = await getRecipes(nextPageToken);
  
      setRecipes(prev => {
        // filtra só os que ainda não estão no array
        const uniqueNew = more.filter(item =>
          !prev.some(old => old.docId === item.docId)
        );
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

  // 3) Intersection Observer controlado por nextPageToken
  useEffect(() => {
    // Se já existir um observer, desconecta antes de criar outro
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;

    }

    // Só cria observer se ainda tiver próxima página
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

    // cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [loadMore, nextPageToken]);  // reexecuta sempre que mudar o token

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Recipes</h1>
        {role === 'admin' && (
        <Link to="/recipes/create" className="btn btn-primary">
          Create New Recipe
        </Link>)}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        {!loading && recipes.length === 0 && !error && (
          <p>No recipes found. Why not create one?</p>
        )}
        {recipes.map(recipe => (
          <div key={recipe.docId} className="col-md-4 mb-4">
            <div className="card h-100">
              <img
                src={recipe.image_url || 'https://placehold.co/300x200?text=No+Image'}
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
                <Link to={`/recipes/${recipe.docId}`} className="btn btn-secondary mt-auto">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel: só existe para ser observado */}
      <div ref={loadMoreRef} />

      {/* Mensagem de carregamento ou fim de lista */}
      {loading && <p>Loading recipes...</p>}
      {!loading && !nextPageToken && recipes.length > 0 && (
        <p className="text-center mt-3">All recipes loaded.</p>
      )}
    </div>
  );
}

export default Recipes;
