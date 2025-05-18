// src/services/api/meal_plans.js

import apiClient from '../client';

// GET /meal-plans
export const getMealPlans = async (nextPageToken = null) => {
  const res = await apiClient.get('/meal-plans', {
    params: { nextPageToken }
  });
  return res.data; // { mealPlans, nextPageToken }
};

// GET /meal-plans/:id
export const getMealPlanById = async id => {
  const res = await apiClient.get(`/meal-plans/${id}`);
  return res.data;
};

// POST /meal-plans
export const createMealPlan = async mealPlanData => {
  const res = await apiClient.post('/meal-plans', mealPlanData);
  return res.data;
};

// UPDATE /meal-plans/:id
export const updateMealPlan = async (id, mealPlanData) => {
  const res = await apiClient.put(`/meal-plans/${id}`, mealPlanData);
  return res.data;
};

// DELETE /meal-plans/:id
export const deleteMealPlan = async id => {
  const res = await apiClient.delete(`/meal-plans/${id}`);
  return res.data;
};


