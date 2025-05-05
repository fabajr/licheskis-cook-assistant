// src/pages/CreateRecipe.js

import React, { useState, useEffect, useCallback } from 'react';
import { createRecipe as saveRecipeToApi } from '../services/api';
import {
  createRecipe,
  searchLocalIngredients,
  createIngredient as createIngredientInApi,
  // … etc
} from '../services/api';


// Helpers mínimos para quantidade e unidades
const commonUnits = ['GRAMS','CUP','TBSP','TSP','OZ','ML','L','UNIT','SCOOP','PINCH','LBS','KG'];

function parseQuantity(qtyStr) {
  // exemplo simples: suporta "1", "1/2", "1 1/2"
  if (!qtyStr) return 0;
  const parts = qtyStr.split(' ').filter(Boolean);
  let total = 0;
  for (let p of parts) {
    if (p.includes('/')) {
      const [num, den] = p.split('/').map(Number);
      if (!isNaN(num) && !isNaN(den)) total += num/den;
    } else if (!isNaN(Number(p))) {
      total += Number(p);
    }
  }
  return total;
}

function CreateRecipe() {
  // --- estados básicos da receita ---
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState([{ step: 1, text: '' }]);
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [category, setCategory] = useState('');
  const [phase, setPhase] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // --- estados dos ingredientes da receita ---
  const [ingredients, setIngredients] = useState([]);

  // --- busca local de ingredientes ---
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [localSearchResults, setLocalSearchResults] = useState([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [selectedLocalIngredient, setSelectedLocalIngredient] = useState(null);

  // --- controle do form de novo ingrediente ---
  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [newIngredientCategory, setNewIngredientCategory] = useState('');
  const [newIngredientAliases, setNewIngredientAliases] = useState('');
  const [newIngredientDefaultUnit, setNewIngredientDefaultUnit] = useState('');
  const [newIngredientKcalPerUnit, setNewIngredientKcalPerUnit] = useState('');
  const [newIngredientIsVegan, setNewIngredientIsVegan] = useState(false);
  const [newIngredientIsGlutenFree, setNewIngredientIsGlutenFree] = useState(false);
  const [newAltUnits, setNewAltUnits] = useState([]);

  // --- quantidade e unidade ao adicionar ao recipe ---
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');

  // 1) Buscar em ingredients collection

  const performSearch = useCallback(async (term) => {

    if (term.trim().length < 2) {
      setLocalSearchResults([]);
      return;
    }

    setIsLoadingSearch(true);
    try {
      const localResults = await searchLocalIngredients(term);
      setLocalSearchResults(localResults || []);
      // Se não achou nenhum, mostra o form de "novo ingrediente"
      
      setShowNewIngredientForm(!localResults || localResults.length === 0);
    } catch (err) {
      console.error("Erro buscando ingredients locais:", err);
      setLocalSearchResults([]);
      setShowNewIngredientForm(true);
    } finally {
      setIsLoadingSearch(false);
    }
  }, []);

  // Debounce de 500ms
  useEffect(() => {
    // Se o termo bate exatamente com o ingrediente selecionado,
    // pulamos a busca para não reabrir o dropdown
    if (
      selectedLocalIngredient &&
      ingredientSearchTerm === selectedLocalIngredient.name
    ) {
      return;
    }
  
    const timeoutId = setTimeout(() => {
      performSearch(ingredientSearchTerm);
    }, 500);
  
    return () => clearTimeout(timeoutId);
  }, [
    ingredientSearchTerm, 
    performSearch, 
    selectedLocalIngredient  // agora levado em conta
  ]);

  // Quando o usuário clica num ingrediente existente
  const handleSelectLocalIngredient = (ing) => {
    setSelectedLocalIngredient(ing);
    setIngredientSearchTerm(ing.name);
    setLocalSearchResults([]);
    setShowNewIngredientForm(false);
    // pré-define unidade se default_unit existir
    setIngredientUnit(commonUnits.includes(ing.default_unit)
      ? ing.default_unit
      : ''
    );
  };

  // Adicionar ingrediente à lista da receita
  const handleAddIngredient = () => {
    const qty = parseQuantity(ingredientQuantity);
    if (qty <= 0) return alert("Quantidade inválida");
    if (!ingredientUnit) return alert("Selecione uma unidade");

    if (!selectedLocalIngredient) {
      return alert("Selecione um ingrediente existente ou crie um novo abaixo");
    }

        // Monta objeto conforme seu schema de recipe_ingredients,
        // suportando ingredientes novos (ingredient_id: null)
        let ingToAdd;
        if (selectedLocalIngredient) {
        ingToAdd = {
        ingredient_id: selectedLocalIngredient.id,
        name: selectedLocalIngredient.name,
        quantity: ingredientQuantity,
        unit: ingredientUnit,
        fdcId: selectedLocalIngredient.fdcId || null,
        calculatedKcal: selectedLocalIngredient.kcal_per_unit || null,
      };
    } else {
      // novo ingrediente: envia todos os metadados
      ingToAdd = {
        ingredient_id: null,
        name: ingredientSearchTerm.trim(),
        quantity: ingredientQuantity,
        unit: ingredientUnit,
        aliases: newIngredientAliases.split(',').map(s => s.trim()).filter(Boolean),
        category: newIngredientCategory,
        default_unit: newIngredientDefaultUnit,
        kcal_per_unit: parseFloat(newIngredientKcalPerUnit),
        is_vegan: newIngredientIsVegan,
        is_gluten_free: newIngredientIsGlutenFree,
        alternative_units: newAltUnits
          .map(u => ({ unit: u.unit, conversion_factor: parseFloat(u.conversion_factor) }))
          .filter(u => u.unit && !isNaN(u.conversion_factor)),
      };
    }

    setIngredients([...ingredients, ingToAdd]);
    
    // limpa campos
    setIngredientSearchTerm('');
    setSelectedLocalIngredient(null);
    setIngredientQuantity('');
    setIngredientUnit('');
  };


  // --- FUNÇÃO para criar um novo ingrediente no Firestore ---
  const handleCreateIngredient = async () => {
    const name = ingredientSearchTerm.trim();
    if (!name) return alert("Nome do ingrediente é obrigatório");
    if (!newIngredientCategory) return alert("Categoria é obrigatória");
    if (!newIngredientDefaultUnit) return alert("Unidade padrão é obrigatória");
    const kcal = parseFloat(newIngredientKcalPerUnit);
    if (isNaN(kcal) || kcal < 0) return alert("Kcal inválida");

    const payload = {
      name,
      aliases: newIngredientAliases
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      category: newIngredientCategory,
      default_unit: newIngredientDefaultUnit,
      kcal_per_unit: kcal,
      is_vegan: newIngredientIsVegan,
      is_gluten_free: newIngredientIsGlutenFree,
      alternative_units: newAltUnits
        .map(u => ({
          unit: u.unit,
          conversion_factor: parseFloat(u.conversion_factor),
        }))
        .filter(u => u.unit && !isNaN(u.conversion_factor)),
      // created_at e updated_at serão gerados no backend
    };

    try {
      const created = await createIngredientInApi(payload);
      // Seleciona e pré-define para adicionar à receita
      setSelectedLocalIngredient(created);
      setIngredientSearchTerm(created.name);
      setShowNewIngredientForm(false);
      // limpa form de novo ingrediente
      setNewIngredientCategory('');
      setNewIngredientAliases('');
      setNewIngredientDefaultUnit('');
      setNewIngredientKcalPerUnit('');
      setNewIngredientIsVegan(false);
      setNewIngredientIsGlutenFree(false);
      setNewAltUnits([]);
      alert(`Ingrediente "${created.name}" criado! Agora selecione quantidade e unidade.`);
    } catch (err) {
      console.error("Erro criando ingrediente:", err);
      alert("Não foi possível criar ingrediente. Veja console.");
    }
  };

  // Helper para linhas de alternative_units
  const handleAltUnitChange = (idx, field, value) => {
    const copy = [...newAltUnits];
    copy[idx] = { ...copy[idx], [field]: value };
    setNewAltUnits(copy);
  };
  const addAltUnitRow = () =>
    setNewAltUnits([...newAltUnits, { unit: '', conversion_factor: '' }]);
  const removeAltUnitRow = idx =>
    setNewAltUnits(newAltUnits.filter((_, i) => i !== idx));


  // --- Form Submission da receita (sem mudanças) ---
  const handleSubmit = async e => {

    e.preventDefault();

// Monta payload incluindo ingredientes novos (ingredient_id=null)
const newRecipeData = {
    name: recipeName,
    description,
    instructions,
    prep_time: prepTime,
    servings,
    category,
    cycle_tags: [phase],
    image_url: imageUrl,
    ingredients, // array com ingredient_id existentes e null para novos
};
const created = await saveRecipeToApi(newRecipeData);
     alert(`Recipe created with ID: ${created.id}`);
  };


  // --- JSX RENDER ---
  return (
    <div className="container py-4">
      <h1>Create New Recipe</h1>
      <form onSubmit={handleSubmit}>
        {/* ... campos de nome, desc, tempo, instruções etc ... */}

        <hr />
        <h2>Ingredients</h2>

        {/* Lista de ingredientes já adicionados */}
        <ul className="list-group mb-3">
          {ingredients.map((ing, i) => (
            <li key={i} className="list-group-item d-flex justify-content-between">
              <span>{ing.quantity} {ing.unit} — {ing.name}</span>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => setIngredients(ingredients.filter((_, j) => j!==i))}
              >Remove</button>
            </li>
          ))}
          {ingredients.length===0 && (
            <li className="list-group-item text-muted">Nenhum ingrediente adicionado</li>
          )}
        </ul>

        {/* Input de busca + seleção */}
        <div className="mb-3 position-relative">
          <label htmlFor="ingredientSearch" className="form-label">
            Search Ingredient (local only)
          </label>
          <input
            id="ingredientSearch"
            type="text"
            className="form-control"
            value={ingredientSearchTerm}
            onChange={e => {
              // sempre que o usuário digitar algo, zera seleção existente
              setIngredientSearchTerm(e.target.value);
              setSelectedLocalIngredient(null);
              setShowNewIngredientForm(false);
            }}
            disabled={isLoadingSearch}
          />
          {isLoadingSearch && (
            <div className="form-text position-absolute">Buscando...</div>
          )}
          {localSearchResults.length > 0 && !showNewIngredientForm && (
            <ul
              className="list-group position-absolute w-100 mt-1"
              style={{ zIndex:1000, maxHeight:200, overflowY:'auto' }}
            >
              {localSearchResults.map(ing => (
                <li
                  key={ing.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleSelectLocalIngredient(ing)}
                  style={{ cursor:'pointer' }}
                >
                  {ing.name} <small className="text-muted">({ing.category})</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Se não achou nenhum, mostra o formulário de criação */}
        {showNewIngredientForm && (
          <div className="card card-body mb-3">
            <h5>Add New Ingredient to Database</h5>
            {/* Name é o termo de busca */}
            <div className="mb-2">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={ingredientSearchTerm}
                readOnly
              />
            </div>
            <div className="row g-2 mb-2">
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={newIngredientCategory}
                  onChange={e => setNewIngredientCategory(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Default Unit</label>
                <select
                  className="form-select"
                  value={newIngredientDefaultUnit}
                  onChange={e => setNewIngredientDefaultUnit(e.target.value)}
                >
                  <option value="">Select Unit…</option>
                  {commonUnits.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label">Kcal per Default Unit</label>
              <input
                type="number"
                className="form-control"
                value={newIngredientKcalPerUnit}
                onChange={e => setNewIngredientKcalPerUnit(e.target.value)}
                min="0"
              />
            </div>
            <div className="form-check form-switch mb-2">
              <input
                id="isVegan"
                className="form-check-input"
                type="checkbox"
                checked={newIngredientIsVegan}
                onChange={e => setNewIngredientIsVegan(e.target.checked)}
              />
              <label htmlFor="isVegan" className="form-check-label">Is Vegan?</label>
            </div>
            <div className="form-check form-switch mb-2">
              <input
                id="isGlutenFree"
                className="form-check-input"
                type="checkbox"
                checked={newIngredientIsGlutenFree}
                onChange={e => setNewIngredientIsGlutenFree(e.target.checked)}
              />
              <label htmlFor="isGlutenFree" className="form-check-label">Is Gluten Free?</label>
            </div>
            <div className="mb-2">
              <label className="form-label">Aliases (comma-separated)</label>
              <input
                type="text"
                className="form-control"
                value={newIngredientAliases}
                onChange={e => setNewIngredientAliases(e.target.value)}
                placeholder="e.g., chickpeas, garbanzo beans"
              />
            </div>

            {/* Alternative Units Dynamic */}
            <label className="form-label">Alternative Units</label>
            {newAltUnits.map((u, i) => (
              <div className="row g-2 mb-1" key={i}>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="unit"
                    value={u.unit}
                    onChange={e => handleAltUnitChange(i, 'unit', e.target.value)}
                  />
                </div>
                <div className="col-5">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="conversion factor"
                    value={u.conversion_factor}
                    onChange={e => handleAltUnitChange(i, 'conversion_factor', e.target.value)}
                  />
                </div>
                <div className="col-1">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeAltUnitRow(i)}
                  >&times;</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-2"
              onClick={addAltUnitRow}
            >+ Add Alternative Unit</button>

            <hr/>
            <button
              type="button"
              className="btn btn-success"
              onClick={handleCreateIngredient}
            >Create Ingredient in DB</button>
          </div>
        )}

        {/* Campos de quantidade e unidade antes de adicionar */}
        {selectedLocalIngredient && (
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label">Quantity</label>
              <input
                type="text"
                className="form-control"
                value={ingredientQuantity}
                onChange={e => setIngredientQuantity(e.target.value)}
                placeholder="e.g., 1, 1/2, 100"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Unit</label>
              <select
                className="form-select"
                value={ingredientUnit}
                onChange={e => setIngredientUnit(e.target.value)}
              >
                <option value="">Select Unit…</option>
                {commonUnits.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="col-12 mt-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddIngredient}
              >Add Ingredient to Recipe</button>
            </div>
          </div>
        )}

        <hr/>
        {/* Botão de Submit da receita */}
        <button type="submit" className="btn btn-primary">Create Recipe</button>
      </form>
    </div>
  );
}

export default CreateRecipe;
