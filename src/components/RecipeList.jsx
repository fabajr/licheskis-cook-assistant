// src/components/RecipeList.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api/client';
import RecipeCard from './RecipeCard';

export default function RecipeList() {
  const [recipes, setRecipes] = useState([]);
  const [nextPage, setNextPage] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async (token = null) => {
    const params = token ? { nextPageToken: token } : {};
    const { data } = await apiClient.get('/recipes', { params });
    setRecipes(prev => [...prev, ...data.recipes]);
    setNextPage(data.nextPageToken);
  };

  return (
    <div>
      <h1>Receitas</h1>
      <div className="recipe-grid">
        {recipes.map(r => <RecipeCard key={r.id} recipe={r} onDelete={() => {/* opcional */}} />)}
      </div>
      {nextPage && (
        <button onClick={() => fetchRecipes(nextPage)}>
          Carregar mais
        </button>
      )}
    </div>
  );
}
