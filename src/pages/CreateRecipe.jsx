// src/pages/CreateRecipe.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeForm } from '../hooks/useRecipeForm';
import { recipeCategoryOptions, cyclePhaseOptions, getUnitOptions, parseQuantity } from '../services/utils/utils';

export default function CreateRecipe() {
  const navigate = useNavigate();
  const {
    loading,
    error,

    // basic fields
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
    recipeNameRef,
    servingsRef,
    categoryRef,
    ingredientSearchRef,
    invalidFields,
    clearInvalidField,
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

  } = useRecipeForm({
    recipeId: null,
    onSuccessRedirect: id => navigate(`/recipes/${id}`)
  });

  if (loading) return <p>Loading...</p>;
  if (error)   return <div className="alert alert-danger">{error}</div>;

  // --- JSX RENDER ---
  return (
      <div className="container py-4">
        <h1>Create New Recipe</h1>
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>

        {/* --- Basic Recipe Fields --- ADDED BACK --- */}
        <div className="mb-3">
          <label htmlFor="recipeName" className="form-label">Recipe Name</label>
          <input
            type="text"
            className={`form-control ${invalidFields.recipeName ? 'is-invalid' : ''}`}
            id="recipeName"
            ref={recipeNameRef}
            value={recipeName}
            onChange={(e) => {
              const val = e.target.value;
              setRecipeName(val);
              if (invalidFields.recipeName && val.trim()) clearInvalidField('recipeName');

            }}
          />
          {invalidFields.recipeName && (
            <div className="invalid-feedback">{invalidFields.recipeName}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            className="form-control"
            id="description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <label htmlFor="prepTime" className="form-label">Prep Time (minutes)</label>
            <input
              type="number"
              className="form-control"
              id="prepTime"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              min="0"
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="servings" className="form-label">Servings</label>
            <input
              type="number"
              className={`form-control ${invalidFields.servings ? 'is-invalid' : ''}`}
              id="servings"
              ref={servingsRef}
              value={servings}
              onChange={(e) => {
                const val = e.target.value;
                setServings(val);
                if (invalidFields.servings && val) clearInvalidField('servings');

              }}
              min="1"
            />
            {invalidFields.servings && (
              <div className="invalid-feedback">{invalidFields.servings}</div>
            )}
          </div>
          <div className="col-md-4">
            <label htmlFor="category" className="form-label">Category</label>
            <select
            className={`form-select ${invalidFields.category ? 'is-invalid' : ''}`}
            id="category"
            ref={categoryRef}
            value={category}
            onChange={(e) => {
              const val = e.target.value;
              setCategory(val);
              if (invalidFields.category && val) clearInvalidField('category');

            }}
            >
          <option value="">Select Category...</option>
          {recipeCategoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {invalidFields.category && (
          <div className="invalid-feedback">{invalidFields.category}</div>
        )}
          </div>
        </div>

        <div className="mb-3">
  <label className="form-label">Cycle Phase</label>
  <div className="d-flex flex-wrap">
    {cyclePhaseOptions.map(opt => (
      <div key={opt.value} className="form-check me-3 mb-2">
        <input
          id={`phase-${opt.value}`}
          type="checkbox"
          className="form-check-input"
          checked={cycleTags.includes(opt.value)}
          onChange={() => handlePhaseChange(opt.value)}
        />
        <label
          htmlFor={`phase-${opt.value}`}
          className="form-check-label"
        >
          {opt.label}
        </label>
      </div>
    ))}
  </div>
</div>

        <div className="mb-3">
          <label htmlFor="imageUrl" className="form-label">Image URL (Optional)</label>
          <input
            type="url"
            className="form-control"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {/* --- Instructions --- ADDED BACK --- */}
        <div className="mb-3">
          <label className="form-label">Instructions</label>
          {instructions.map((instruction, index) => (
            <div key={index} className="input-group mb-2">
              <span className="input-group-text">{index + 1}</span>
              <input
                type="text"
                className="form-control"
                value={instruction.text}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
              />
              {instructions.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => removeInstruction(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addInstruction}>
            + Add Instruction Step
          </button>
        </div>
        {/* --- End Basic Recipe Fields --- */}

        <hr />
        <h2>Ingredients</h2>

        {/* List of ingredients already added */}
        <ul className="list-group mb-3">
        {ingredients.map((ing, i) => (
  <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
    {editingIndex === i ? (
      // modo edição
      <>
        {/* Conteúdo editável */}
        <div className="d-flex align-items-center flex-grow-1 gap-2">
          <span className="me-2">{ing.name}</span>

          {/* Quantity */}
          <div style={{ minWidth: 70 }}>
            <label className="small text-muted d-block">Quantity</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={editingQuantity}
              onChange={e => setEditingQuantity(e.target.value)}
            />
          </div>

          {/* Unit */}
          <div style={{ minWidth: 80 }}>
            <label className="small text-muted d-block">Unit</label>

            {(() => {
              // 1) pega as opções pela categoria exata do ingrediente
              const opts = getUnitOptions(ing.category);

              // 2) garante que a unidade corrente esteja no topo
              const orderedUnits = [
                editingUnit,
                ...opts.filter(u => u !== editingUnit)
              ];

              return (
                <select
                  className="form-select form-select-sm"
                  value={editingUnit}
                  onChange={e => setEditingUnit(e.target.value)}
                >
                  {orderedUnits.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              );
            })()}
          </div>
        </div>

        {/* Botões alinhados à direita */}
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleSaveIngredient}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
        </div>
      </>
    ) : (
      /* modo leitura */
      <>
        <span>
          {ing.quantity} {ing.unit} — {ing.name} {ing.isNew ? "(New)" : ""}
        </span>
        <div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary me-2"
            onClick={() => handleEditIngredient(i)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => handleRemoveIngredient(i)}
          >
            Remove
          </button>
        </div>
      </>
    )}
  </li>
))}
      </ul>

        {/* Input de busca + seleção */}
        <div 
            ref={newIngFormRef} 
            className="mb-3 position-relative">
          <label htmlFor="ingredientSearch" className="form-label">
            Add Ingredient (Search Local First)
          </label>
          <input
            id="ingredientSearch"
            type="text"
            className={`form-control ${invalidFields.ingredients ? 'is-invalid' : ''}`}
            ref={ingredientSearchRef}
            value={ingredientSearchTerm}
            onChange={e => {
              setIngredientSearchTerm(e.target.value);
              setSelectedLocalIngredient(null); // Clear selection on new input

              handleDuplicateIngredient(e.target.value); // Check for duplicates

            }}
            placeholder="Type to search..."
            disabled={isLoadingSearch}
            autoComplete="off"
          />
          {invalidFields.ingredients && (
            <div className="invalid-feedback">{invalidFields.ingredients}</div>
          )}
          {isLoadingSearch && (
            <div className="spinner-border spinner-border-sm position-absolute end-0 top-50 translate-middle-y me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          {/* Search Results Dropdown */}
          {localSearchResults.length > 0 && !selectedLocalIngredient && (
            <ul
              className="list-group position-absolute w-100 mt-1 shadow-sm"
              style={{ zIndex: 1000, maxHeight: 200, overflowY: 'auto' }}
            >
              {localSearchResults.map(ing => (
                <li
                  key={ing.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleSelectLocalIngredient(ing)}
                  style={{ cursor: 'pointer' }}
                >
                  {ing.name} <small className="text-muted">({ing.category || 'No category'})</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quantity and Unit Input (Show when searching or selected) */}
        {selectedLocalIngredient && !showNewIngredientForm && (
          <div className="row g-2 mb-3 align-items-end">
            <div className="col-md-5">
              <label htmlFor="ingredientQuantity" className="form-label">Quantity</label>
              <input
                id="ingredientQuantity"
                type="text" // Allow fractions like 1/2
                className={`form-control ${invalidFields.ingredientQuantity ? 'is-invalid' : ''}`}
                value={ingredientQuantity}
                onChange={e => {
                  const val = e.target.value;
                  setIngredientQuantity(val);
                  if (invalidFields.ingredientQuantity && parseQuantity(val) > 0) {
                    clearInvalidField('ingredientQuantity');
                  }
                }}
                placeholder="e.g., 1, 1/2, 1.5"
              />
              {invalidFields.ingredientQuantity && (
                <div className="invalid-feedback">{invalidFields.ingredientQuantity}</div>
              )}
            </div>
                  <div className="col-md-5">
                    <label htmlFor="ingredientUnit" className="form-label">
                      Unit
                    </label>
                         {(() => {
                                    const category    = selectedLocalIngredient?.category || newIngredientCategory;
                                    const unitOptions = getUnitOptions(category);        // todas as unidades da categoria
                                    const defaultUnit = selectedLocalIngredient?.default_unit;

                                    // Se tiver default, coloca ele à frente; senão, só as opções
                                    const orderedUnits = defaultUnit
                                    ? [defaultUnit, ...unitOptions.filter(u => u !== defaultUnit)]
                                    : unitOptions;

                                    return (
                                            <select
                                            id="ingredientUnit"
                                            className={`form-select ${invalidFields.ingredientUnit ? 'is-invalid' : ''}`}
                                            value={ingredientUnit}
                                            onChange={e => {
                                              const val = e.target.value;
                                              setIngredientUnit(val);
                                              if (invalidFields.ingredientUnit && val) {
                                                clearInvalidField('ingredientUnit');
                                              }
                                            }}
                                            disabled={!category}
                                            >
                                            {orderedUnits.map(u =>
                                             (<option key={u} value={u}>{u} </option>))}
                                            </select>
                                            {invalidFields.ingredientUnit && (
                                              <div className="invalid-feedback">{invalidFields.ingredientUnit}</div>
                                            )}
                                            );
                         })()}
                    </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={handleAddIngredient}
                disabled={!selectedLocalIngredient} // Only enable if existing ingredient is selected
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* New Ingredient Form (Conditional) */}
        {showNewIngredientForm && (
          <div  className="card card-body mb-3 bg-light">
            <h5>Add New Ingredient Details</h5>
            <p>Ingredient "<strong>{ingredientSearchTerm}</strong>" not found. Please provide details:</p>
            {/* Name is the search term */}
            <div className="row g-2 mb-2">
            <div className="col-md-6">
            <label htmlFor="newIngredientCategory" className="form-label">
              Category*
            </label>
            <select
              id="newIngredientCategory"
              className={`form-select ${invalidFields.newIngredientCategory ? 'is-invalid' : ''}`}
              value={newIngredientCategory}
              onChange={e => {
                const val = e.target.value;
                setNewIngredientCategory(val);
                setNewIngredientDefaultUnit("");
                setNewIngredientUnit("");  // limpa o select de unidade
                setNewIngredientQuantity(""); // limpa a quantidade
                if (invalidFields.newIngredientCategory && val) clearInvalidField('newIngredientCategory');
              }}
            >
              <option value="">Select Category...</option>
              {newIngredientCategoryOptions.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {invalidFields.newIngredientCategory && (
              <div className="invalid-feedback">{invalidFields.newIngredientCategory}</div>
            )}
          </div>
              <div className="col-md-6">
                <label htmlFor="newIngredientUnit" className="form-label">Default Unit*</label>
                <select
                  className={`form-select ${invalidFields.newIngredientDefaultUnit ? 'is-invalid' : ''}`}
                  value={newIngredientDefaultUnit}
                  onChange={e => {
                    const val = e.target.value;
                    setNewIngredientDefaultUnit(val);
                    if (invalidFields.newIngredientDefaultUnit && val) clearInvalidField('newIngredientDefaultUnit');
                  }}
                  disabled={!newIngredientCategory}
                >
                  <option value="">Select Default Unit...</option>
                  {getUnitOptions(newIngredientCategory).map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                  ))}
                </select>
                {invalidFields.newIngredientDefaultUnit && (
                  <div className="invalid-feedback">{invalidFields.newIngredientDefaultUnit}</div>
                )}
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label">Kcal per Default Unit*</label>
              <input
                type="number"
                className={`form-control ${invalidFields.newIngredientKcalPerUnit ? 'is-invalid' : ''}`}
                value={newIngredientKcalPerUnit}
                onChange={e => {
                  const val = e.target.value;
                  setNewIngredientKcalPerUnit(val);
                  if (invalidFields.newIngredientKcalPerUnit && val && parseFloat(val) >= 0) {
                    clearInvalidField('newIngredientKcalPerUnit');
                  }
                }}
                min="0"
              />
              {invalidFields.newIngredientKcalPerUnit && (
                <div className="invalid-feedback">{invalidFields.newIngredientKcalPerUnit}</div>
              )}
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
                <div className="col-5">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="unit (e.g., CUP)"
                    value={u.unit}
                    onChange={e => handleAltUnitChange(i, 'unit', e.target.value)}
                  />
                </div>
                <div className="col-5">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="factor (to default unit)"
                    value={u.conversion_factor}
                    onChange={e => handleAltUnitChange(i, 'conversion_factor', e.target.value)}
                    step="any"
                    min="0"
                  />
                </div>
                <div className="col-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm w-100"
                    onClick={() => removeAltUnitRow(i)}
                  >&times;</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-3"
              onClick={addAltUnitRow}
            >
              + Add Alternative Unit
            </button>

            {/* Add New Ingredient to Recipe Button */}
            <div className="row g-2 mb-3 align-items-end">
            <div className="row g-2 align-items-end">
      {/* Quantity */}
      <div className="col-md-5">
        <label htmlFor="newIngredientQty" className="form-label">
          Quantity*
        </label>
        <input
          id="newIngredientQty"
          type="text"
          className={`form-control ${invalidFields.newIngredientQuantity ? 'is-invalid' : ''}`}
          value={newIngredientQuantity}
          onChange={e => {
            const val = e.target.value;
            setNewIngredientQuantity(val);
            if (invalidFields.newIngredientQuantity && parseQuantity(val) > 0) {
              clearInvalidField('newIngredientQuantity');
            }
          }}
          disabled={!newIngredientCategory || !newIngredientDefaultUnit}
        />
        {invalidFields.newIngredientQuantity && (
          <div className="invalid-feedback">{invalidFields.newIngredientQuantity}</div>
        )}
      </div>

      {/* Unit PARA NOVO INGREDIENTE */}
      <div className="col-md-5">
        <label htmlFor="newIngredientUnit" className="form-label">
          Unit*
        </label>
        <select
          id="newIngredientUnit"
          className={`form-select ${invalidFields.newIngredientUnit ? 'is-invalid' : ''}`}
          value={newIngredientUnit}
          onChange={e => {
                      const val = e.target.value;
                      setNewIngredientUnit(val);
                      setNewIngredientQuantity("");
                      if (invalidFields.newIngredientUnit && val) clearInvalidField('newIngredientUnit');
                    }}
          disabled={!newIngredientCategory || !newIngredientDefaultUnit}
        >
          {getUnitOptions(newIngredientCategory).map(u => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {invalidFields.newIngredientUnit && (
          <div className="invalid-feedback">{invalidFields.newIngredientUnit}</div>
        )}
      </div>

      {/* Botão Add New */}
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-success w-100"
          onClick={handleAddIngredient}
        >
          Add New
        </button>
      </div>
    </div>
              </div>
            </div>
          )}

          <hr />
          <button type="submit" className="btn btn-primary">Create Recipe</button>
        </form>
      </div>
    );
}

