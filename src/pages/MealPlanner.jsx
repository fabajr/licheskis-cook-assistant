// src/pages/MealPlanner.js
import React, { useState, useEffect } from 'react';
import { getRecipes } from '../services/api/recipes'; // Only API call available
import { calculateCyclePhase } from '../services/utils/utils';
import { getUserProfile } from '../services/api/users'; // Only API call available

// Simulated data for phases and categories

const defaultCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Simulated createMealPlan function
const createMealPlan = async (plan) => {
  console.log('Simulated createMealPlan payload:', plan);
  return Promise.resolve({ id: 'SIMULATED_PLAN_ID' });
};

function MealPlanner() {

  const [userCycle, setUserCycle] = useState(null);

  const [recipes, setRecipes] = useState([]);
  //const [phases] = useState(defaultPhases);
  const [categories] = useState(defaultCategories);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
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

  // Fetch user profile to get hormonal cycle
  useEffect(() => {
  async function loadUser() {
    try {
      const user = await getUserProfile();
      setUserCycle(user.hormonal_cycle);
      console.log('userCycle', user.hormonal_cycle);
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    }
  }
  loadUser();
}, []);  

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
     if (startDate && endDate && userCycle) {
       const start = new Date(startDate);
       const end   = new Date(endDate);
       const days  = [];
       const cursor = new Date(start);
       while (cursor <= end) {
         const dayStr = cursor.toISOString().split('T')[0];
        days.push({
          date: dayStr,
          hormonal_phase: calculateCyclePhase(dayStr, userCycle),
          meals: defaultCategories.map(type => ({ type, recipe_id: '', servings: 1 }))
        });
        console.log('mealPlanDays', days);
         cursor.setDate(cursor.getDate() + 1);
       }
       setMealPlanDays(days);
     }
   }, [startDate, endDate, userCycle]);

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

  function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

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


  // Render the meal planner JSX
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

      
      {/* Plan Table */}
      {mealPlanDays.map((day, di) => (
        <div key={di} className={`mb-4 phase-${day.hormonal_phase}`}>
          <h5>
            {formatDate(day.date)}
            
          </h5>
          <table className="table table-sm">
            <thead>
              <tr><th>Meal</th><th>Recipe</th></tr>
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
