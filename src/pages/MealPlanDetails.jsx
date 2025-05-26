// src/pages/MealPlanDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMealPlanById, deleteMealPlan } from '../services/api/meal_plans';
import { parseTimestamp } from '../services/utils/utils';

export default function MealPlanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch meal plan data
  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        setLoading(true);
        const data = await getMealPlanById(id);
        setMealPlan(data);
        console.log('Fetched meal plan:', data);
      } catch (err) {
        console.error('Error fetching meal plan:', err);
        setError('Failed to load meal plan details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMealPlan();
    }
  }, [id]);

  // Empty handlers for edit and delete (to be implemented later)
  const handleEdit = () => {
    // Will be implemented later
    console.log('Edit meal plan:', id);
  };

 const handleDelete = async (id) => {
     if (window.confirm('Are you sure you want to delete this meal plan?')) {
       try {
         await deleteMealPlan(id);
       } catch (err) {
         console.error('Error deleting meal plan:', err);
         alert('Failed to delete meal plan. Please try again.');
       }
        // Redirect to profile after deletion
        navigate('/profile', {
            state: { from: 'meal-plan-details', deleted: true },
            replace: true
          });
     }
   };

  // Helper unificado para qualquer formato de data
const formatDate = (value) => {
  // parseTimestamp lida com number | Timestamp | string
  const ms = parseTimestamp(value)
  const date = new Date(ms)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric'
  })
}

  // Format date range for display
  const formatDateRange = () => {
    if (!mealPlan || !mealPlan.start_date || !mealPlan.end_date) {
      return 'Date range not available';
    }
    
    const startDate = new Date(parseTimestamp(mealPlan.start_date));
    const endDate = new Date(parseTimestamp(mealPlan.end_date));
    
    const formatDateDisplay = (date) => {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    return (
      <div>
        <p><strong>Start Date:</strong> {formatDateDisplay(startDate)}</p>
        <p><strong>End Date:</strong> {formatDateDisplay(endDate)}</p>
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading meal plan details...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/profile')}
        >
          Back to Profile
        </button>
      </div>
    );
  }

  // Render not found state
  if (!mealPlan) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          Meal plan not found.
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/profile')}
        >
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{mealPlan.name || 'Unnamed Meal Plan'}</h1>
        <div>
          <button 
            className="btn btn-outline-primary me-2"
            onClick={handleEdit}
          >
            <i className="bi bi-pencil me-1"></i> Edit
          </button>
          <button 
            className="btn btn-outline-danger"
            onClick={handleDelete}
          >
            <i className="bi bi-trash me-1"></i> Delete
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="card mb-4">
        <div className="card-body">
          {formatDateRange()}
        </div>
      </div>

      {/* Meal Plan Days */}
      {mealPlan.days && mealPlan.days.map((day, index) => (
        <div key={index} className={`meal-day mb-4`}>
          <div className="card ">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{formatDate(day.date)}</h5>
              <span className={`badge phase-${day.hormonal_phase}`} > Phase: {day.hormonal_phase}</span>
            </div>
            <div className="card-body">
              <table className="table table-striped"> 
                <thead>
                  <tr>
                    <th>Meal Type</th>
                    <th>Recipe</th>
                  </tr>
                </thead>
                <tbody>
                  {day.meals && day.meals.map((meal, mealIndex) => (
                    <tr key={mealIndex}>
                      <td>{meal.type}</td>
                      <td>
                        {meal.recipe_name} 
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* Back button */}
      <div className="text-center mt-4">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/profile')}
        >
          Back to Profile
        </button>
      </div>
    </div>
  );
}
