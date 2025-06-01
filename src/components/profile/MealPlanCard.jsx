// src/components/profile/MealPlanCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

import { parseTimestamp } from '../../services/utils/utils';

export default function MealPlanCard({ mealPlan, onDelete }) {
  // Format date range for display
  const formatDateRange = () => {
    if (!mealPlan.start_date || !mealPlan.end_date) {
      return 'Date range not available';
    }

    const startDate = new Date(parseTimestamp(mealPlan.start_date));
    const endDate = new Date(parseTimestamp(mealPlan.end_date));
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return `Start: ${formatDate(startDate)} - End: ${formatDate(endDate)}`;
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title">{mealPlan.name || 'Unnamed Meal Plan'}</h5>
        <p className="card-text">
          <small className="text-muted">{formatDateRange()}</small>
        </p>
      </div>
      <div className="card-footer bg-transparent border-top-0">
        <div className="d-flex justify-content-between">
          
          <Link to={`/meal-planner/${mealPlan.id}`} className="btn btn-outline-primary btn-sm">
            <i className="bi bi-eye me-1"></i> View
          </Link>
          
          <Link to={`/meal-planner/${mealPlan.id}/edit`} className="btn btn-outline-primary btn-sm">
            <i className="bi bi-pencil me-1"></i> Edit
          </Link>
          
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={() => onDelete(mealPlan.id)}
          >
            <i className="bi bi-trash me-1"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
