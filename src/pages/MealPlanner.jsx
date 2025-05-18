// src/pages/MealPlanner.jsx
import React, { useState, useEffect } from 'react';
import { getRecipes } from '../services/api/recipes';
import { getUserProfile } from '../services/api/users';
import { calculateCyclePhase } from '../services/utils/utils';


// Mapeia cada slot para as categorias permitidas
const categoryMap = {
  Breakfast:      ['Breakfast'],
  'Soups&Salads': ['Soups&Salads'],
  Lunch:          ['Entrees'],
  Dinner:         ['Entrees'],
  Snacks:         ['Snacks'],
  Desserts:       ['Desserts']
};
// slots na ordem que você quer renderizar
const defaultCategories = Object.keys(categoryMap);

// Simulated API call to create a meal plan (replace with real endpoint)
const createMealPlan = async (plan) => {
  console.log('Simulated createMealPlan payload:', plan);
  return Promise.resolve({ id: 'SIMULATED_PLAN_ID' });
};

export default function MealPlanner() {
  // Helper: parse "YYYY-MM-DD" into a local Date at midnight
  const parseLocalDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Helper: format "YYYY-MM-DD" string for display
  const formatDate = (dateStr) =>
    parseLocalDate(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });

  // Helper: format Date object to "YYYY-MM-DD"
  const formatYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // State
  const [userCycle, setUserCycle]     = useState(null);
  const [recipes, setRecipes]         = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);
  const [savingPlan, setSavingPlan]   = useState(false);

  const [planName, setPlanName]       = useState('Weekly Meal Plan');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [mealPlanDays, setMealPlanDays] = useState([]);

  // Fetch user cycle
  useEffect(() => {
    (async () => {
      try {
        const user = await getUserProfile();
        setUserCycle(user.hormonal_cycle);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load user data.');
      }
    })();
  }, []);

  // Fetch all recipe pages and set default week
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // 1) busca paginada, 2) deduplica por id/docId
        let all = [], token = null;
          do {
            const { recipes: page, nextPageToken } = await getRecipes(token);
            all = all.concat(Array.isArray(page) ? page : []);
            token = nextPageToken;
          } while (token);
          const unique = Array.from(
            new Map(all.map(r => [r.docId || r.id, r])).values()
          );

          console.log('Fetched recipes:', unique);
          setRecipes(unique);
          setFilteredRecipes(unique);

        // Initialize to current week (Sunday to Saturday)
        const today = formatYMD(new Date());

        setStartDate(today);
        setEndDate(today);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch recipes.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Generate mealPlanDays when dates or cycle change
  useEffect(() => {
    if (!startDate || !endDate || !userCycle) return;

    const start  = parseLocalDate(startDate);
    const end    = parseLocalDate(endDate);
    const days   = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const dayStr = formatYMD(cursor);
      const phase  = calculateCyclePhase(dayStr, userCycle);
      days.push({
        date: dayStr,
        hormonal_phase: phase,
        meals: defaultCategories.map(type => ({ type, recipe_id: '' }))
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    setMealPlanDays(days);
  }, [startDate, endDate, userCycle]);

  // Handler: update selected recipe
  const handleRecipeSelect = (dayIndex, mealIndex, recipeId) => {
    const copy = [...mealPlanDays];
    copy[dayIndex].meals[mealIndex].recipe_id = recipeId;
    setMealPlanDays(copy);
  };

  // Save meal plan: aggregate recipe counts
  const saveMealPlan = async () => {
    if (!planName.trim()) {
      setError('Please enter a plan name.');
      return;
    }
    setSavingPlan(true);
    try {
      const recipeCounts = mealPlanDays
        .flatMap(d => d.meals.map(m => m.recipe_id))
        .filter(id => id)
        .reduce((acc, id) => {
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {});

      const payload = {
        name: planName,
        start_date: startDate,
        end_date: endDate,
        recipe_counts: recipeCounts
      };
      await createMealPlan(payload);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to save plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  // Render states
  if (loading) return <p>Loading...</p>;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (success) return <div className="alert alert-success">Plan saved!</div>;

  // Render component
  return (
    <div className="container py-4">
      <h1>Meal Planner</h1>

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

      <div className="text-center">
        <button
          className="btn btn-primary"
          onClick={saveMealPlan}
          disabled={savingPlan}
        >
          {savingPlan ? 'Saving...' : 'Save Plan'}
        </button>
      </div>
    </div>
  );
}
