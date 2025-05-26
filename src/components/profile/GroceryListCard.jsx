// src/components/profile/GroceryListCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { parseTimestamp } from '../../services/utils/utils';

export default function GroceryListCard({ groceryList, onDelete }) {
  // Format date for display
  const formatDate = () => {
    if (!groceryList.created_at) {
      return 'Date not available';
    }
    
    const date = parseTimestamp(groceryList.created_at);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        
        <p className="card-text">
          <small className="text-muted">{formatDate()}</small>
        </p>
        <p className="card-text">
          <small> {groceryList.items?.length || 0} items </small>
        </p>
      </div>
      <div className="card-footer bg-transparent border-top-0">
        <div className="d-flex justify-content-between">
          <Link to={`/grocery-list/${groceryList.id}`} className="btn btn-outline-primary btn-sm">
            <i className="bi bi-eye me-1"></i> View
          </Link>
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={() => onDelete(groceryList.id)}
          >
            <i className="bi bi-trash me-1"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
