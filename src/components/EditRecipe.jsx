// src/components/EditRecipe.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/client';

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);

  useEffect(() => {
    apiClient.get(`/recipes/${id}`)
      .then(({ data }) => setForm(data));
  }, [id]);

  if (!form) return <p>Carregando…</p>;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    await apiClient.put(`/recipes/${id}`, form);
    navigate.push('/');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Editar Receita</h2>
      <input name="name" value={form.name} onChange={handleChange} required />
      {/* demais campos */}
      <button type="submit">Salvar</button>
    </form>
  );
}
