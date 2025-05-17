// src/hooks/useRecipeForm.js

import { useState, useRef, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import {
  createRecipe as saveRecipeToApi,
  getRecipeById,
  getRecipes,
  updateRecipe
} from '../services/api/recipes';
import { ingredients_db } from '../services/api/ingredients';
import {
  recipeCategoryOptions,
  newIngredientCategoryOptions,
  cyclePhaseOptions,
  getUnitOptions,
  parseQuantity
} from '../services/utils/utils';

export function useRecipeForm({ recipeId = null, onSuccessRedirect }) {
  // 1) REFS
  const newIngFormRef = useRef(null);
  const skipResetRef  = useRef(false);

  // 2) STATE
  const [loading, setLoading]     = useState(!!recipeId);
  const [error, setError]         = useState(null);

  const [recipeName, setRecipeName]         = useState('');
  const [description, setDescription]       = useState('');
  const [instructions, setInstructions]     = useState([{ step: 1, text: '' }]);
  const [prepTime, setPrepTime]             = useState('');
  const [servings, setServings]             = useState('');
  const [category, setCategory]             = useState('');
  const [cycleTags, setCycleTags]           = useState([]);
  const [imageUrl, setImageUrl]             = useState('');

  const [originalName, setOriginalName] = useState('');

  const [ingredients, setIngredients]       = useState([]);
  const [editingIndex, setEditingIndex]     = useState(null);
  const [editingQuantity, setEditingQuantity] = useState('');
  const [editingUnit, setEditingUnit]       = useState('');

  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [localSearchResults, setLocalSearchResults]     = useState([]);
  const [isLoadingSearch, setIsLoadingSearch]           = useState(false);
  const [selectedLocalIngredient, setSelectedLocalIngredient] = useState(null);

  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [newIngredientCategory, setNewIngredientCategory] = useState('');
  const [newIngredientDefaultUnit, setNewIngredientDefaultUnit] = useState('');
  const [newIngredientUnit, setNewIngredientUnit]           = useState('');
  const [newIngredientKcalPerUnit, setNewIngredientKcalPerUnit] = useState('');
  const [newIngredientIsVegan, setNewIngredientIsVegan]     = useState(false);
  const [newIngredientIsGlutenFree, setNewIngredientIsGlutenFree] = useState(false);
  const [newIngredientAliases, setNewIngredientAliases]     = useState('');
  const [newAltUnits, setNewAltUnits]                       = useState([]);
  const [newIngredientQuantity, setNewIngredientQuantity]   = useState('');

  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit]         = useState('');

  // 3) LOAD RECIPE FOR EDIT
  useEffect(() => {
    if (!recipeId) return;
    setLoading(true);
    getRecipeById(recipeId)
      .then(data => {
        setRecipeName(data.name);
        setDescription(data.description || '');
        setInstructions(data.instructions || [{ step: 1, text: '' }]);
        setPrepTime(data.prep_time?.toString() || '');
        setServings(data.servings?.toString() || '');
        setCategory(data.category || '');
        setCycleTags(data.cycle_tags || []);
        setImageUrl(data.image_url || '');
        setIngredients((data.ingredients || []).map(i => ({ ...i, isNew: false })));

        setOriginalName(data.name);
      })
      .catch(err => setError('Erro ao carregar receita'))
      .finally(() => setLoading(false));
  }, [recipeId]);

  // 4) HANDLERS E EFEITOS

  // a) Ciclo hormonal
  const handlePhaseChange = useCallback(
    value =>
      setCycleTags(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      ),
    []
  );

  // b) Pesquisa fuzzy de nomes duplicados (onBlur)
  const checkSimilarNames = useCallback(async () => {
    const name = recipeName.trim();
    if (name.length < 2) return;
    const { recipes } = await getRecipes();
    const list = recipes.filter(r => r.id !== recipeId);
    const fuse = new Fuse(list, { keys: ['name'], threshold: 0.4 });
    const results = fuse.search(name);
    if (results.length) {
      const sugestoes = results
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
        .map(r => r.item.name)
        .join('”, “');
      alert(
        `Existem receitas com nomes parecidos (“${sugestoes}”). ` +
        `Tem certeza que deseja manter “${recipeName}”?`
      );
    }
  }, [recipeName, recipeId]);

  // c) Busca de ingredientes locais
  const performSearch = useCallback(async term => {
    if (term.trim().length < 2) {
      setLocalSearchResults([]);
      setShowNewIngredientForm(false);
      return;
    }
    setIsLoadingSearch(true);
    try {
      const results = await ingredients_db.search(term);
      setLocalSearchResults(results || []);
      setShowNewIngredientForm(
        term.trim().length >= 2 && (!results || results.length === 0)
      );
    } catch {
      setLocalSearchResults([]);
      setShowNewIngredientForm(term.trim().length >= 2);
    } finally {
      setIsLoadingSearch(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!selectedLocalIngredient || ingredientSearchTerm !== selectedLocalIngredient.name) {
        performSearch(ingredientSearchTerm);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [ingredientSearchTerm, selectedLocalIngredient, performSearch]);

  // d) Seleção de ingrediente local

  const handleDuplicateIngredient = ing => {
    const isString = v => typeof v === "string"; //
    const isObject = v => v !== null && typeof v === "object";
  
    const resetAndAlert = () => { //
      alert(
        "This ingredient is already in your recipe. Change its quantity if you need more."
      );
      setIngredientSearchTerm("");
    };
  
    // 1) string (novo ingrediente)?
    if (isString(ing)) {
      const nameLower = ing.trim().toLowerCase();
      const isDupNew = ingredients.some(i =>
        i.isNew && i.name.trim().toLowerCase() === nameLower
      );
      if (isDupNew) {
        resetAndAlert();
        return true;      // sinaliza que é duplicata
      }
      return false;       // não é duplicata
    }
  
    // 2) objeto (ingrediente existente)?
    if (isObject(ing)) {
      const isDupExisting = ingredients.some(
        i => !i.isNew && i.ingredient_id === ing.id
      );
      if (isDupExisting) {
        resetAndAlert();
        return true;      // sinaliza que é duplicata
      }
      return false;       // não é duplicata
    }
  
    return false;         // qualquer outro caso
  };


  const handleSelectLocalIngredient = (ing) => {

    if (handleDuplicateIngredient(ing)) return; // Se duplicata, não faz nada
   
    setSelectedLocalIngredient(ing);
    setIngredientSearchTerm(ing.name);
    setLocalSearchResults([]); // Hide dropdown
    setShowNewIngredientForm(false); // Hide new ingredient form
    
  };

  // e) Adição de ingrediente (novo ou existente)
  function handleAddIngredient() {
    const isNew = showNewIngredientForm;
    const qtyStr = isNew ? newIngredientQuantity : ingredientQuantity;
    const qty = parseQuantity(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      return alert('Invalid Quantity');
    }
    let ingToAdd;
    if (selectedLocalIngredient && !isNew) {
      // Using an existing ingredient
      ingToAdd = {
        ingredient_id: selectedLocalIngredient.id,
        name: selectedLocalIngredient.name,
        quantity: ingredientQuantity, // Keep original string for display/editing?
        unit: ingredientUnit,
        fdcId: selectedLocalIngredient.fdcId || null,
        kcal_per_unit: selectedLocalIngredient.kcal_per_unit || null, // Or calculate based on qty?
        // Mark as existing
        isNew: false,
        category: selectedLocalIngredient.category,
        is_vegan: selectedLocalIngredient.is_vegan || false,
        is_gluten_free: selectedLocalIngredient.is_gluten_free || false,
        //default_unit: selectedLocalIngredient.default_unit || newIngredientDefaultUnit,
        //aliases: selectedLocalIngredient.aliases || [],
        //alternative_units: selectedLocalIngredient.alternative_units || [],

      };
    } else {
      // novo ingrediente
      if (!newIngredientCategory || !newIngredientDefaultUnit) {
        return alert('Preencha categoria e unidade padrão');
      }
      ingToAdd = {
        ingredient_id: null,
        name: ingredientSearchTerm.trim(),
        quantity: newIngredientQuantity,
        unit: newIngredientUnit,
        aliases: newIngredientAliases
          .split(',')
          .map(a => a.trim())
          .filter(Boolean),
        category: newIngredientCategory,
        default_unit: newIngredientDefaultUnit,
        kcal_per_unit: parseFloat(newIngredientKcalPerUnit) || 0,
        is_vegan: newIngredientIsVegan,
        is_gluten_free: newIngredientIsGlutenFree,
        alternative_units: newAltUnits
          .map(u => ({
            unit: u.unit,
            conversion_factor: parseFloat(u.conversion_factor)
          }))
          .filter(u => u.unit && !isNaN(u.conversion_factor)),
        isNew: true
      };
    }
    setIngredients(prev => [...prev, ingToAdd]);
    // limpa campos
    setIngredientSearchTerm('');
    setSelectedLocalIngredient(null);
    setIngredientQuantity('');
    setIngredientUnit('');
    setShowNewIngredientForm(false);
    setNewIngredientCategory('');
    setNewIngredientAliases('');
    setNewIngredientDefaultUnit('');
    setNewIngredientKcalPerUnit('');
    setNewIngredientIsVegan(false);
    setNewIngredientIsGlutenFree(false);
    setNewAltUnits([]);
    setNewIngredientQuantity('');
  }

  // f) Edit/Remove/Salvar ingrediente
  function handleRemoveIngredient(idx) {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  }
  function handleEditIngredient(idx) {
    const ing = ingredients[idx];
    if (ing.isNew) {
      skipResetRef.current = true;
      setShowNewIngredientForm(true);
      setIngredientSearchTerm(ing.name);
      setNewIngredientCategory(ing.category);
      setNewIngredientDefaultUnit(ing.default_unit);
      setNewIngredientKcalPerUnit(String(ing.kcal_per_unit));
      setNewIngredientIsVegan(ing.is_vegan);
      setNewIngredientIsGlutenFree(ing.is_gluten_free);
      setNewIngredientAliases(ing.aliases.join(', '));
      setNewAltUnits(ing.alternative_units);
      setNewIngredientQuantity(ing.quantity);
      setNewIngredientUnit(ing.unit);
      return;
    }
    setEditingIndex(idx);
    setEditingQuantity(ing.quantity);
    setEditingUnit(ing.unit);
  }
  function handleSaveIngredient() {
    setIngredients(prev =>
      prev.map((ing, i) =>
        i === editingIndex
          ? { ...ing, quantity: editingQuantity, unit: editingUnit }
          : ing
      )
    );
    setEditingIndex(null);
  }
  function handleCancelEdit() {
    setEditingIndex(null);
  }

  // g) Instruções
  const handleInstructionChange = (idx, text) =>
    setInstructions(prev =>
      prev.map((inst, i) =>
        i === idx ? { step: inst.step, text } : inst
      )
    );
  const addInstruction = () =>
    setInstructions(prev => [...prev, { step: prev.length + 1, text: '' }]);
  const removeInstruction = idx =>
    setInstructions(prev =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
    );

  // h) Alternative Units
  const handleAltUnitChange = (i, field, val) => {
    const copy = [...newAltUnits];
    copy[i] = { ...copy[i], [field]: val };
    setNewAltUnits(copy);
  };
  const addAltUnitRow = () =>
    setNewAltUnits(prev => [...prev, { unit: '', conversion_factor: '' }]);
  const removeAltUnitRow = i =>
    setNewAltUnits(prev => prev.filter((_, idx) => idx !== i));

  // i) Submit (create ou update)
  const handleSubmit = async () => {
    if (!recipeName.trim()) return alert('Nome é obrigatório');
    if (!category) return alert('Categoria é obrigatória');
    if (!servings) return alert('Servings é obrigatório');
    if (ingredients.length === 0) return alert('Adicione pelo menos 1 ingrediente');

    const payload = {
      name: recipeName,
      description,
      instructions: instructions.filter(inst => inst.text.trim()),
      prep_time: prepTime ? parseInt(prepTime, 10) : null,
      servings: parseInt(servings, 10),
      category,
      cycle_tags: cycleTags,
      image_url: imageUrl || null,
      ingredients: ingredients.map(i => ({
          ingredient_id: i.ingredient_id ?? null,    // 👈 nunca undefined
          quantity:      parseQuantity(i.quantity),   // número
          unit:          i.unit                       // string
        }))
};

  try {
    console.log("Submitting recipe payload:", payload);
    if (recipeId) {
      await updateRecipe(recipeId, payload);
      onSuccessRedirect(`/recipes/${recipeId}`);
      } else {
        // chama a API e extrai o .id do response
        const created = await saveRecipeToApi(payload);
        const newId = created.id;      // ⬅️ aqui
        onSuccessRedirect(`/recipes/${newId}`);  // path correto
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar receita');
    }
};

  // 5) O QUE O HOOK RETORNA
  return {
    // estados básicos
    loading,
    error,
    recipeName,
    setRecipeName,
    description,
    setDescription,
    instructions,
    handleInstructionChange,
    addInstruction,
    removeInstruction,
    prepTime,
    setPrepTime,
    servings,
    setServings,
    category,
    setCategory,
    cycleTags,
    handlePhaseChange,
    imageUrl,
    setImageUrl,
    originalName,
    setOriginalName,

    //recipes
    recipeCategoryOptions,
    cyclePhaseOptions,

    // ingredientes
    ingredients,
    ingredientSearchTerm,
    setIngredientSearchTerm,
    localSearchResults,
    isLoadingSearch,
    selectedLocalIngredient,
    setSelectedLocalIngredient,
    handleSelectLocalIngredient,
    performSearch,
    showNewIngredientForm,
    newIngFormRef,
    newIngredientCategoryOptions,
    newIngredientCategory,
    setNewIngredientCategory,
    newIngredientDefaultUnit,
    setNewIngredientDefaultUnit,
    newIngredientUnit,
    setNewIngredientUnit,
    newIngredientKcalPerUnit,
    setNewIngredientKcalPerUnit,
    newIngredientIsVegan,
    setNewIngredientIsVegan,
    newIngredientIsGlutenFree,
    setNewIngredientIsGlutenFree,
    newIngredientAliases,
    setNewIngredientAliases,
    newAltUnits,
    handleAltUnitChange,
    addAltUnitRow,
    removeAltUnitRow,
    newIngredientQuantity,
    setNewIngredientQuantity,
    ingredientQuantity,
    setIngredientQuantity,
    ingredientUnit,
    setIngredientUnit,
    handleAddIngredient,
    handleEditIngredient,
    editingIndex,
    editingQuantity,
    setEditingQuantity,
    editingUnit,
    setEditingUnit,
    handleSaveIngredient,
    handleCancelEdit,
    handleRemoveIngredient,
    handleDuplicateIngredient,
    getUnitOptions,

    // ações
       

    checkSimilarNames,
    
    handleSubmit
  };
}
