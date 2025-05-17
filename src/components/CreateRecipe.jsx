// src/components/CreateRecipe.jsx
import React, { useState } from 'react';
import apiClient from '../services/client';
import { useNavigate } from 'react-router-dom';

export default function CreateRecipe() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', category:'', ingredients:[], instructions:[] /*…*/ });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { data } = await apiClient.post('/recipes', form);
    navigate.push(`/recipes/${data.id}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Nova Receita</h2>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Nome" required />
      {/* campos para category, prep_time, servings, ciclo_tags etc */}
      <button type="submit">Criar</button>
    </form>
  );
}
