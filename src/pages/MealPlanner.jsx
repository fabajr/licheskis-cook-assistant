// src/pages/MealPlanner.js
import React, { useState, useEffect } from 'react';
import { getRecipes } from '../services/api/recipes'; // Only API call available

// Simulated data for phases and categories
const defaultPhases = [
  { code: 'M', name: 'Menstrual' },
  { code: 'F', name: 'Follicular' },
  { code: 'O', name: 'Ovulation' },
  { code: 'ML', name: 'Mid-Luteal' },
  { code: 'LL', name: 'Late-Luteal' }
];
const defaultCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Simulated createMealPlan function
const createMealPlan = async (plan) => {
  console.log('Simulated createMealPlan payload:', plan);
  return Promise.resolve({ id: 'SIMULATED_PLAN_ID' });
};

function MealPlanner() {
  const [recipes, setRecipes] = useState([]);
  const [phases] = useState(defaultPhases);
  const [categories] = useState(defaultCategories);
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // Meal plan details
  const [planName, setPlanName] = useState('Weekly Meal Plan');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mealPlanDays, setMealPlanDays] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch recipes only
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const data = await getRecipes();
        // getRecipes returns an object: { recipes: [...], nextPageToken }
        const list = Array.isArray(data?.recipes) ? data.recipes : [];
        setRecipes(list);
        setFilteredRecipes(list);

        // default week dates
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        setStartDate(startOfWeek.toISOString().split('T')[0]);
        setEndDate(endOfWeek.toISOString().split('T')[0]);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch recipes.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // Generate days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        days.push({
          date: cursor.toISOString().split('T')[0],
          hormonal_phase: '',
          meals: defaultCategories.map(type => ({ type, recipe_id: '', servings: 1 }))
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      setMealPlanDays(days);
    }
  }, [startDate, endDate]);

  // Filter recipes client-side
  useEffect(() => {
    let filtered = [...recipes];
    if (selectedPhase) {
      filtered = filtered.filter(r => r.cycle_tags?.includes(selectedPhase));
    }
    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }
    setFilteredRecipes(filtered);
  }, [recipes, selectedPhase, selectedCategory]);

  const handlePhaseChange = (dayIndex, phase) => {
    const copy = [...mealPlanDays];
    copy[dayIndex].hormonal_phase = phase;
    setMealPlanDays(copy);
  };
  const handleRecipeSelect = (dayIndex, mealIndex, recipeId) => {
    const copy = [...mealPlanDays];
    copy[dayIndex].meals[mealIndex].recipe_id = recipeId;
    setMealPlanDays(copy);
  };
  const handleServingsChange = (dayIndex, mealIndex, val) => {
    const copy = [...mealPlanDays];
    copy[dayIndex].meals[mealIndex].servings = parseInt(val, 10) || 1;
    setMealPlanDays(copy);
  };

  const saveMealPlan = async () => {
    if (!planName) return setError('Enter a name');
    setSavingPlan(true);
    try {
      const validDays = mealPlanDays.map(d => ({ ...d, meals: d.meals.filter(m => m.recipe_id) }));
      const payload = { name: planName, start_date: startDate, end_date: endDate, days: validDays };
      await createMealPlan(payload);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const formatDate = d => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (loading) return <p>Loading...</p>;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (success) return <div className="alert alert-success">Meal plan simulated!</div>;

  return (
    <div className="container py-4">
      <h1>Meal Planner</h1>

      {/* Plan Details */}
      <div className="row mb-4">
        <div className="col-md-4">
          <label>Plan Name</label>
          <input className="form-control" value={planName} onChange={e => setPlanName(e.target.value)} />
        </div>
        <div className="col-md-4">
          <label>Start</label>
          <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="col-md-4">
          <label>End</label>
          <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <label>Phase</label>
          <select className="form-select" value={selectedPhase} onChange={e => setSelectedPhase(e.target.value)}>
            <option value="">All</option>
            {phases.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label>Category</label>
          <select className="form-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">All</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Plan Table */}
      {mealPlanDays.map((day, di) => (
        <div key={di} className="mb-4">
          <h5>
            {formatDate(day.date)}
            <select
              className="form-select form-select-sm d-inline-block w-auto ms-2"
              value={day.hormonal_phase}
              onChange={e => handlePhaseChange(di, e.target.value)}
            >
              <option value="">Phase</option>
              {phases.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
            </select>
          </h5>
          <table className="table table-sm">
            <thead>
              <tr><th>Meal</th><th>Recipe</th><th>Servings</th></tr>
            </thead>
            <tbody>
              {day.meals.map((meal, mi) => (
                <tr key={mi}>
                  <td>{meal.type}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={meal.recipe_id}
                      onChange={e => handleRecipeSelect(di, mi, e.target.value)}
                    >
                      <option value="">Select</option>
                      {filteredRecipes.map(r => (
                        <option key={r.docId || r.id} value={r.docId || r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={meal.servings}
                      onChange={e => handleServingsChange(di, mi, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="text-center">
        <button className="btn btn-primary" onClick={saveMealPlan} disabled={savingPlan}>
          {savingPlan ? 'Saving...' : 'Save Plan'}
        </button>
      </div>
    </div>
  );
}

export default MealPlanner;
