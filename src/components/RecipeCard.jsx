// src/components/RecipeCard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/client';
import { useNavigate } from 'react-router-dom';

export default function RecipeCard({ recipe }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const handleDelete = async () => {
    if (window.confirm('Confirma exclusão?')) {
      await apiClient.delete(`/recipes/${recipe.id}`);
      window.location.reload(); // ou use callback onDelete()
    }
  };

  return (
    <div className="card">
      <img src={recipe.image_url} alt={recipe.name} className="card-img-top" />
      <div className="card-body">
        <h5>{recipe.name}</h5>
        <p>{recipe.category}</p>
        {role === 'admin' && (
          <>
            <button onClick={() => navigate.push(`/recipes/${recipe.id}/edit`)}>
              Editar
            </button>
            <button onClick={handleDelete}>
              Excluir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
