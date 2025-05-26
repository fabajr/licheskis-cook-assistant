import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

import { getGroceryListById, deleteGroceryList } from '../services/api/grocery_lists';
import GroceryPreview from '../components/grocery/GroceryPreview';

export default function Profile() {
  // Inicializa groceryList como um objeto que já contém items: []
  const [groceryList, setGroceryList] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchGroceryList = async () => {
      try {
        setLoading(true);
        const data = await getGroceryListById(id);
        // Se o seu serviço retorna response.data, troque para: const { data } = await …
        setGroceryList(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGroceryList();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-4" role="alert">
        {error}
      </div>
    );
  }

  // 1) Pega o array de items (ou vazio)  
  const items = groceryList.items || [];

  // 2) Reduz para um objeto { categoria: [item, ...], ... }
  const categorizedIngredients = items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // 3) Extrai as categorias  
  const categories = Object.keys(categorizedIngredients);

  return (
    <div>
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3 className="h5 mb-0">Grocery List</h3>
          <div>
            <button className="btn btn-success btn-sm me-2">
              Create List ✓
            </button>
            <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => 
                navigate('/profile', {
                    state: { from: 'grocery-list', show: 'GroceryModal' },
                    replace: true
                 })}>
                Back
            </button>
          </div>
        </div>
        <div className="card-body">
          {categories.length === 0 ? (
            <p className="text-muted">No ingredients found.</p>
          ) : (
            categories.map(category => (
              <GroceryPreview
                key={category}
                title={category}
                items={categorizedIngredients[category]}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
