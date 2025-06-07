// src/pages/EditMealPlanner.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useMealPlanner from '../hooks/useMealPlanner';
import { calculateCyclePhase } from '../services/utils/utils';

//subcomponents
import HormonalCalendar from '../components/profile/HormonalCalendar';

export default function EditMealPlanner() {
  const { id } = useParams();

  const navigate = useNavigate();
  
  const {
    // State
    userCycle,
    recipes,
    loading,
    error,
    success,
    planName,
    startDate,
    endDate,
    mealPlanDays,
    
    // Setters
    setPlanName,
    setStartDate,
    setEndDate,
    
    // Handlers
    handleRecipeSelect,
    handleSubmit,
    
    // Helpers
    formatDate,
    
    // Constants
    categoryMap
  } = useMealPlanner(id);

  // Render states
  if (loading) return <p>Loading...</p>;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (success) return <div className="alert alert-success">Plan updated!</div>;

  // Render component
  return (
    <div className="container py-4">
      <form onSubmit={handleSubmit} >
      <h1>Edit Meal Plan</h1>

      {/* Plan Details */}
      <div className="row mb-4">
        <div className="col-md-4">
          <label>Plan Name</label>
          <input
            className="form-control"
            value={planName}
            onChange={e => setPlanName(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label>Start</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label>End</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>
    
      {/* Hormonal Phase Calendar */}
                    {userCycle && (
                      <div className="card shadow-sm mb-4">
                        <div className="card-header bg-light">
                          <h5 className="mb-0">Your Hormonal Phase Calendar</h5>
                        </div>
                        <div className="card-body">
                          <HormonalCalendar 
                            cycleData={userCycle} 
                            calculatePhase={calculateCyclePhase} 
                          />
                        </div>
                      </div>
                    )}

      {/* Meal Plan Table */}
      {mealPlanDays.map((day, di) => (
        <div key={di} className={`meal-day mb-4 phase-${day.hormonal_phase}`}>
          <h5>{formatDate(day.date)}</h5>
          <table className="table table-sm">
            <thead>
              <tr><th>Meal</th><th>Recipe</th></tr>
            </thead>
            <tbody>
              {day.meals.map((meal, mi) => {
                // filtra por fase e categoria
                const allowed = categoryMap[meal.type] || [];
                const options = recipes
                  .filter(r =>
                    r.cycle_tags?.includes(day.hormonal_phase) &&
                    allowed.includes(r.category)
                  );
                return (
                  <tr key={`${day.date}-${meal.type}`}>
                    <td>{meal.type}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={meal.recipe_id}
                        onChange={e => handleRecipeSelect(di, mi, e.target.value)}
                      >
                        <option value="">Select</option>
                        {options.map((r, oi) => (
                          <option
                            key={`${r.docId || r.id}-${oi}`}
                            value={r.docId || r.id}
                          >
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="d-flex justify-content-center gap-2">
        <button type="submit" className="btn btn-primary">Update Meal Plan</button>

         {/* Botão “Cancel” que volta uma página no histórico */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
      </div>

      </form>
    </div>
  );
}
