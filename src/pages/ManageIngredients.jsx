// src/pages/ManageIngredients.jsx
import React, { useState, useEffect, useRef, use } from 'react'
import IngredientForm from '../components/IngredientForm'
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient
  
} from '../services/api/ingredients'

import { parseTimestamp, newIngredientCategoryOptions} from '../services/utils/utils';

export default function ManageIngredients() {
  const [list, setList] = useState([])
  const [editing, setEditing] = useState(null) // null = nenhum form aberto
    const formRef = useRef(null) // Referência para o formulário

// efeito ordenar a lista de ingredientes por updated_at
   useEffect(() => {
    setList(prev => prev.sort((a, b) => {
            const aTime = a.updated_at ? parseTimestamp(a.updated_at) : 0
            const bTime = b.updated_at ? parseTimestamp(b.updated_at) : 0
            return aTime - bTime
            }
        ))
      
    }, [list])


  useEffect(() => {
    ;(async () => {
      const all = await getIngredients()
      setList(all)
      //sort list by updated_at acending tratando qunado updated_at é null
        // se updated_at for null, tratar como 0
        
    })()
    }, [])    
        

  // assim que “editing” mudar para não-null, o form já estará no DOM
  useEffect(() => {
    if (editing !== null && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [editing])

  const handleSaved = async data => {
    let saved
    if (editing?.id) {
      saved = await updateIngredient(editing.id, data)
      console.log('Saved ingredient:', saved)
    } else {
      saved = await createIngredient(data)
        console.log('Created ingredient:', saved)
    }
    // Atualiza a lista de ingredientes
    // Verifica se já existe na lista
    // Se existir, atualiza; se não, adiciona no início
    setList(prev => {
      const idx = prev.findIndex(i => i.id === saved.id)
      if (idx > -1) {
        const copy = [...prev]
        copy[idx] = saved
        return copy
      }
      return [saved, ...prev]
    })
    setEditing(null)
  }

  const handleDeleted = async id => {
    await deleteIngredient(id)
    setList(prev => prev.filter(i => i.id !== id))
    setEditing(null)
  }

  const handleCancel = () => {
    setEditing(null)
  }

  return (
    <div className="container py-4" >
      <h1>Manage Ingredients</h1>
      <button
        className="btn btn-success mb-3"
        onClick={() => setEditing({})}
        disabled={!!editing}
      >
        + New Ingredient
      </button>

      {editing !== null && (
        <div ref={formRef} className="mb-4">
        <IngredientForm
          ingredient={editing}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onCancel={handleCancel}
        />
        </div>
      )}
     
      <div className="container">
      {newIngredientCategoryOptions.map(cat => (
        <div key={cat} className="mb-5">
          {/* Título da categoria */}
          <h4 className="mb-3">{cat}</h4>

          {/* Lista simples */}
          <ul className="list-group">
            {list
              .filter(ing => ing.category === cat)
              .map(ing => (
                <li
                  key={ing.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {/* Nome do ingrediente */}
                  {ing.name}

                  {/* Botão Edit */}
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setEditing(ing)}
                    disabled={!!editing}
                  >
                    Edit
                  </button>
                </li>
              ))
            }
          </ul>
        </div>
      ))}
    </div>
    </div>
  )
}
