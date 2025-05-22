// src/components/grocery/MealPlanCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { parseTimestamp } from '../../services/utils/utils';

export default function MealPlanCard({ mealPlan, mode = "default", selected = false, onClick, onDelete }) {
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

  // Determine card classes based on selection state
  const cardClasses = `card shadow-sm ${selected ? 'border border-primary bg-light' : ''}`;

  return (
    <div 
      className={cardClasses} 
      onClick={mode === "select" ? onClick : undefined}
      style={mode === "select" ? { cursor: 'pointer' } : {}}
    >
      <div className="card-body">
        <h5 className="card-title">{mealPlan.name || 'Unnamed Meal Plan'}</h5>
        <p className="card-text">
          <small className="text-muted">{formatDateRange()}</small>
        </p>
      </div>
      
      {/* Only show footer with buttons in default mode */}
      {mode === "default" && (
        <div className="card-footer bg-transparent border-top-0">
          <div className="d-flex justify-content-between">
            <Link to={`/meal-planner/${mealPlan.id}`} className="btn btn-outline-primary btn-sm">
              <i className="bi bi-pencil me-1"></i> Edit
            </Link>
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                onDelete(mealPlan.id);
              }}
            >
              <i className="bi bi-trash me-1"></i> Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Show selection indicator in select mode */}
      {mode === "select" && selected && (
        <div className="position-absolute top-0 end-0 p-2">
          <span className="badge bg-primary rounded-pill">
            <i className="bi bi-check-lg"></i>
          </span>
        </div>
      )}
    </div>
  );
}
