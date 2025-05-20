// src/services/api/meal_plans.js

import apiClient from '../client';

// GET /meal_plans
export const getMealPlans = async (nextPageToken = null) => {
  const res = await apiClient.get('/meal_plans', {
    params: { nextPageToken }
  });
  return res.data; // { mealPlans, nextPageToken }
};

// GET /meal_plans/:id
export const getMealPlanById = async id => {
  const res = await apiClient.get(`/meal_plans/${id}`);
  return res.data;
};

// POST /meal_plans
export const createMealPlan = async data => {
  // data.days deve vir em ISO string (ex: "2025-05-18"), conversão é feita no backend
  const res = await apiClient.post('/meal_plans', data);
  return res.data;
};

// UPDATE /meal_plans/:id
export const updateMealPlan = async (id, mealPlanData) => {
  const res = await apiClient.put(`/meal_plans/${id}`, mealPlanData);
  return res.data;
};

// DELETE /meal_plans/:id
export const deleteMealPlan = async id => {
  const res = await apiClient.delete(`/meal_plans/${id}`);
  return res.data;
};


