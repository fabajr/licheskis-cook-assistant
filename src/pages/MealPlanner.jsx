// src/pages/MealPlanner.jsx (Create)
import React from 'react';
import useMealPlanner from '../hooks/useMealPlanner';

import { calculateCyclePhase } from '../services/utils/utils';

//subcomponents
import HormonalCalendar from '../components/profile/HormonalCalendar';

export default function CreateMealPlanner() {
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

    // Constantes
    categoryMap
  } = useMealPlanner();

  if (loading) return <p>Loading...</p>;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (success) return <div className="alert alert-success">Plan saved!</div>;

  return (
    <div className="container py-4">
      <form onSubmit={handleSubmit} >
        <h1>Create Meal Plan</h1>

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
                  const allowed = categoryMap[meal.type] || [];
                  const options = recipes.filter(r =>
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

        <div className="text-center">
          <button type="submit" className="btn btn-primary">Save Meal Plan</button>
        </div>
      </form>
    </div>
  );
}
