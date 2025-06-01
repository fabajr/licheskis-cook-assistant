// src/hooks/useMealPlanner.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipes } from '../services/api/recipes';
import { getUserProfile } from '../services/api/users';
import { getMealPlanById, createMealPlan, updateMealPlan } from '../services/api/meal_plans';
import { calculateCyclePhase, parseTimestamp } from '../services/utils/utils';

/* Mapeia cada slot para as categorias permitidas */
const categoryMap = {
  Breakfast:      ['Breakfast'],
  'Soups&Salads': ['Soups&Salads'],
  Lunch:          ['Entrees'],
  Dinner:         ['Entrees'],
  Snacks:         ['Snacks'],
  Desserts:       ['Desserts']
};

/* slots na ordem que você quer renderizar */
const defaultCategories = Object.keys(categoryMap);

/* Converte string "YYYY-MM-DD" em Date no horário local */
const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/* Formata um objeto Date para "YYYY-MM-DD" */
const formatYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Formata qualquer valor de data (string "YYYY-MM-DD", número ms ou Firestore Timestamp)
 * para exibição, tipo "Fri, May 30".
 */
export function formatDate(value) {
  let dateObj;

  // Se for string "YYYY-MM-DD", cria Date local
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    dateObj = new Date(y, m - 1, d);
  } else {
    // Se for Timestamp/number, converte para ms e depois Date local
    const ms = parseTimestamp(value);
    dateObj = new Date(ms);
  }

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric'
  });
}

export default function useMealPlanner(mealPlanId = null) {
  const navigate = useNavigate();

  // *** STATES PRINCIPAIS ***
  const [userCycle, setUserCycle] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const [planName, setPlanName] = useState('Weekly Meal Plan');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mealPlanDays, setMealPlanDays] = useState([]);
  const [isEditMode, setIsEditMode] = useState(!!mealPlanId);

  // *** NOVO: Um “mapa” que guarda para cada data (YYYY-MM-DD) as meals já selecionadas ***
  // Exemplo: { "2025-05-05": [ { type: "Breakfast", recipe_id: "abc" }, {...} ], ... }
  const [selectionsMap, setSelectionsMap] = useState({});

  // --- HELPERS INTERNOS REVISADOS (já estavam) ---
  // formatYMD e parseLocalDate declarados acima

  // --- 1) BUSCAR PERFIL (cycle) ---
  useEffect(() => {
    (async () => {
      try {
        const user = await getUserProfile();
        setUserCycle(user.hormonal_cycle || null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- 2) REDIRECIONA SE NÃO TIVER CYCLE ---
  useEffect(() => {
    if (!userCycle && !loading) {
      alert('Please set your hormonal cycle in your profile before.');
      navigate('/profile', {
        state: {
          from: 'meal-planner',
          showHormonalModal: true
        },
        replace: true
      });
    }
  }, [userCycle, navigate, loading]);

  // --- 3) BUSCAR RECEITAS (paginado) ---
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let all = [], token = null;
        do {
          const { recipes: page, nextPageToken } = await getRecipes(token);
          all = all.concat(Array.isArray(page) ? page : []);
          token = nextPageToken;
        } while (token);

        // Remover duplicados por docId (ou id)
        const unique = Array.from(
          new Map(all.map(r => [r.docId || r.id, r])).values()
        );
        setRecipes(unique);
        setFilteredRecipes(unique);

        if (!isEditMode) {
          // Se não for edição, inicializa start/end com hoje
          const today = formatYMD(new Date());
          setStartDate(today);
          setEndDate(today);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch recipes.');
      } finally {
        if (!isEditMode) setLoading(false);
      }
    })();
  }, [isEditMode]);

  // --- 4) SE FOR MODO EDIÇÃO, BUSCAR O MEAL PLAN EXISTENTE ---
  useEffect(() => {
    if (mealPlanId) {
      (async () => {
        try {
          setLoading(true);
          const mealPlan = await getMealPlanById(mealPlanId);
          console.log('Fetched meal plan raw:', mealPlan);

          // Converte start_date/end_date (Timestamp ou string) para string "YYYY-MM-DD"
          const startStr = (() => {
            if (typeof mealPlan.start_date === 'string') {
              return mealPlan.start_date;
            }
            const ms = parseTimestamp(mealPlan.start_date);
            return formatYMD(new Date(ms));
          })();
          const endStr = (() => {
            if (typeof mealPlan.end_date === 'string') {
              return mealPlan.end_date;
            }
            const ms = parseTimestamp(mealPlan.end_date);
            return formatYMD(new Date(ms));
          })();

          setPlanName(mealPlan.name || 'Weekly Meal Plan');
          setStartDate(startStr);
          setEndDate(endStr);

          // Converte cada dia de mealPlan.days (Timestamp/number/string) para string e mantém phase+meals
          const daysConverted = Array.isArray(mealPlan.days)
            ? mealPlan.days.map(day => {
                // extrair string no formato YYYY-MM-DD para day.date
                const dayDateStr = (
                  typeof day.date === 'string'
                    ? day.date
                    : formatYMD(new Date(parseTimestamp(day.date)))
                );
                return {
                  date: dayDateStr,
                  hormonal_phase: day.hormonal_phase,
                  meals: Array.isArray(day.meals)
                    ? day.meals.map(m => ({
                        type: m.type,
                        recipe_id: m.recipe_id || ''
                      }))
                    : defaultCategories.map(type => ({ type, recipe_id: '' }))
                };
              })
            : [];

          // --- NOVO: Preenche selectionsMap a partir dos dias existentes ---
          const mapaInicial = {};
          daysConverted.forEach(d => {
            // cada d.meals já é um array de { type, recipe_id }
            mapaInicial[d.date] = d.meals.map(m => ({ ...m }));
          });
          setSelectionsMap(mapaInicial);

          // Finalmente populo mealPlanDays com daysConverted
          setMealPlanDays(daysConverted);

        } catch (err) {
          console.error('Error fetching meal plan:', err);
          setError('Failed to load meal plan data.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mealPlanId]);

  // --- 5) Reconstrução de mealPlanDays a cada mudança de startDate/endDate/userCycle ---
  useEffect(() => {
    if (!startDate || !endDate || !userCycle) return;

    const start = parseLocalDate(startDate);
    const end   = parseLocalDate(endDate);
    const newDays = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const dayStr = formatYMD(cursor);
      const phase  = calculateCyclePhase(dayStr, userCycle);

      // *** NOVO: Se já existia seleção para essa data em selectionsMap, herdamos.
      //        Caso contrário, criamos um array “em branco” de meals ***
      if (selectionsMap[dayStr]) {
        newDays.push({
          date: dayStr,
          hormonal_phase: phase,
          meals: selectionsMap[dayStr].map(m => ({
            type: m.type,
            recipe_id: m.recipe_id
          }))
        });
      } else {
        newDays.push({
          date: dayStr,
          hormonal_phase: phase,
          meals: defaultCategories.map(type => ({ type, recipe_id: '' }))
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    setMealPlanDays(newDays);
  }, [startDate, endDate, userCycle, selectionsMap]);

  // --- 6) Handler para selecionar receita em um dia/slot ---
  // Agora também atualiza selectionsMap para “persistir” essa escolha
  const handleRecipeSelect = (dayIndex, mealIndex, recipeId) => {
    // Atualiza mealPlanDays normalmente
    const copyDays = [...mealPlanDays];
    copyDays[dayIndex].meals[mealIndex].recipe_id = recipeId;
    setMealPlanDays(copyDays);

    // --- NOVO: Atualiza selectionsMap ---
    const dateKey = copyDays[dayIndex].date; // string "YYYY-MM-DD"
    const prevForDate = selectionsMap[dateKey] || defaultCategories.map(type => ({ type, recipe_id: '' }));
    const newMealsForDate = prevForDate.map((m, i) => {
      if (i === mealIndex) {
        return { type: m.type, recipe_id: recipeId };
      } else {
        return { type: m.type, recipe_id: m.recipe_id };
      }
    });
    setSelectionsMap({
      ...selectionsMap,
      [dateKey]: newMealsForDate
    });
  };

  // --- 7) Enviar formulário (create ou update) ---
  const handleSubmit = (e) => {
    e.preventDefault();
    saveMealPlan();
  };

  // --- 8) Salvar/atualizar no backend ---
  const saveMealPlan = async () => {
    if (!planName.trim()) {
      setError('Please enter a plan name.');
      return;
    }

    setSavingPlan(true);
    try {
      // Monta payload usando os nomes das receitas encontradas em `recipes`
      const daysWithNames = mealPlanDays.map(day => ({
        date: day.date,
        hormonal_phase: day.hormonal_phase,
        meals: day.meals.map(meal => {
          const found = recipes.find(r => (r.docId || r.id) === meal.recipe_id);
          return {
            type: meal.type,
            recipe_id: meal.recipe_id,
            recipe_name: found?.name || ''
          };
        })
      }));

      const payload = {
        name: planName,
        start_date: startDate,
        end_date: endDate,
        days: daysWithNames
      };

      let result;
      if (isEditMode) {
        result = await updateMealPlan(mealPlanId, payload);
        console.log('Meal plan updated:', result);
      } else {
        result = await createMealPlan(payload);
        console.log('Meal plan created:', result);
      }

      // Após salvar, redireciona para detalhes do meal plan
      const newId = result.id || mealPlanId;
      console.log('newid', newId);
      navigate(`/meal-planner/${newId}`, {
        state: { from: 'meal-planner' },
        replace: true
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(`Failed to ${isEditMode ? 'update' : 'save'} plan.`);
    } finally {
      setSavingPlan(false);
    }
  };

  return {
    // STATES
    userCycle,
    recipes,
    filteredRecipes,
    loading,
    error,
    success,
    savingPlan,
    planName,
    startDate,
    endDate,
    mealPlanDays,
    isEditMode,
    // SETTERS
    setPlanName,
    setStartDate,
    setEndDate,
    setMealPlanDays,
    // HANDLERS
    handleRecipeSelect,
    handleSubmit,
    saveMealPlan,
    // HELPERS
    formatDate,
    formatYMD,
    parseLocalDate,
    // CONST
    categoryMap,
    defaultCategories
  };
}
