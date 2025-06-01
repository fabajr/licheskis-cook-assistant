// src/components/IngredientForm.jsx
import React, { useState, useEffect } from 'react'
import {
  recipeCategoryOptions,
  newIngredientCategoryOptions as categoryOptions,
  cyclePhaseOptions,
  getUnitOptions,
  parseQuantity
} from '../services/utils/utils';

export default function IngredientForm({
  ingredient = {},
  onSaved,
  onDeleted,
  onCancel
}) {
  // Estados iniciais
  const [category, setCategory] = useState(ingredient.category || '')
  const [defaultUnit, setDefaultUnit] = useState(
    ingredient.default_unit || ''
  )
  const [kcalPerUnit, setKcalPerUnit] = useState(
    ingredient.kcal_per_unit ?? ''
  )
  const [isVegan, setIsVegan] = useState(!!ingredient.is_vegan)
  const [isGlutenFree, setIsGlutenFree] = useState(
    !!ingredient.is_gluten_free
  )
  const [aliases, setAliases] = useState(
    (ingredient.aliases || []).join(', ')
  )
  const [altUnits, setAltUnits] = useState(
    ingredient.alternative_units || []
  )

  const [name, setName] = useState(ingredient.name || '')

 

  const handleAltUnitChange = (idx, field, val) => {
    setAltUnits(prev =>
      prev.map((u, i) => (i === idx ? { ...u, [field]: val } : u))
    )
  }
  const addAltUnitRow = () =>
    setAltUnits(prev => [...prev, { unit: '', conversion_factor: '' }])
  const removeAltUnitRow = idx =>
    setAltUnits(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = e => {
    e.preventDefault()
    const data = {
      name,
      category,
      default_unit: defaultUnit,
      kcal_per_unit: parseFloat(kcalPerUnit) || 0,
      is_vegan: isVegan,
      is_gluten_free: isGlutenFree,
      aliases: aliases
        .split(',')
        .map(a => a.trim())
        .filter(Boolean),
      alternative_units: altUnits,
      
    }
    onSaved(data)
  }

  const handleDelete = () => {
    if (ingredient.id && window.confirm('Deletar esse ingrediente?')) {
      onDeleted(ingredient.id)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card card-body mb-3 bg-light"
    >
      {/* Category + Default Unit */}
      <div className='mb-2'>
          <label className="form-label">Name*</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          /> </div>
      <div className="row g-2 mb-2">
        
        <div className="col-md-6">
          <label className="form-label">Category*</label>
          <select
            className="form-select"
            value={category}
            onChange={e => {
              setCategory(e.target.value)
              setDefaultUnit('')
            }}
            required
          >
            <option value="">Select Category...</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Default Unit*</label>
          <select
            className="form-select"
            value={defaultUnit}
            onChange={e => setDefaultUnit(e.target.value)}
            disabled={!category}
            required
          >
            <option value="">Select Default Unit...</option>
            {getUnitOptions(category).map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kcal, Vegan & Gluten-Free */}
      <div className="mb-2">
        <label className="form-label">
          Kcal per Default Unit*
        </label>
        <input
          type="number"
          className="form-control"
          value={kcalPerUnit}
          onChange={e => setKcalPerUnit(e.target.value)}
          min="0"
          required
        />
      </div>
      <div className="form-check form-switch mb-2">
        <input
          id="isVegan"
          className="form-check-input"
          type="checkbox"
          checked={isVegan}
          onChange={e => setIsVegan(e.target.checked)}
        />
        <label htmlFor="isVegan" className="form-check-label">
          Is Vegan?
        </label>
      </div>
      <div className="form-check form-switch mb-2">
        <input
          id="isGlutenFree"
          className="form-check-input"
          type="checkbox"
          checked={isGlutenFree}
          onChange={e => setIsGlutenFree(e.target.checked)}
        />
        <label htmlFor="isGlutenFree" className="form-check-label">
          Is Gluten Free?
        </label>
      </div>

      {/* Aliases */}
      <div className="mb-2">
        <label className="form-label">
          Aliases (comma-separated)
        </label>
        <input
          type="text"
          className="form-control"
          value={aliases}
          onChange={e => setAliases(e.target.value)}
          placeholder="e.g. chickpeas, garbanzo beans"
        />
      </div>

      {/* Alternative Units */}
      <label className="form-label">Alternative Units</label>
      {altUnits.map((u, i) => (
        <div className="row g-2 mb-1" key={i}>
          <div className="col-5">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="unit (e.g., CUP)"
              value={u.unit}
              onChange={e =>
                handleAltUnitChange(i, 'unit', e.target.value)
              }
            />
          </div>
          <div className="col-5">
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="factor (to default unit)"
              value={u.conversion_factor}
              onChange={e =>
                handleAltUnitChange(
                  i,
                  'conversion_factor',
                  e.target.value
                )
              }
              step="any"
              min="0"
            />
          </div>
          <div className="col-2">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm w-100"
              onClick={() => removeAltUnitRow(i)}
            >
              &times;
            </button>
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

      <div className="row g-2 align-items-end">
        
        <div className="col-md-2 d-flex gap-1">
          <button
            type="submit"
            className="btn btn-success w-100"
          >
            {ingredient.id ? 'Save' : 'Add'}
          </button>
          <button
            type="button"
            className="btn btn-secondary w-100"
            onClick={onCancel}
          >
            Cancel
          </button>
          {ingredient.id && (
            <button
              type="button"
              className="btn btn-danger w-100"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
