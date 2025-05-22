//src/api/grocery_lists.js

import apiClient from '../client';

// GET /grocery_lists
export const getGroceryLists = async (nextPageToken = null) => {
  const res = await apiClient.get('/grocery_lists', {
    params: { nextPageToken }
  });
  return res.data; // { groceryLists, nextPageToken }
};

// GET /grocery_lists/:id
export const getGroceryListById = async id => {
  const res = await apiClient.get(`/grocery_lists/${id}`);
  return res.data;
};

// POST /grocery_lists
export const createGroceryList = async data => {
  const res = await apiClient.post('/grocery_lists', data);
  return res.data;
};

// UPDATE /grocery_lists/:id
export const updateGroceryList = async (id, groceryListData) => {
  const res = await apiClient.put(`/grocery_lists/${id}`, groceryListData);
  return res.data;
};

// DELETE /grocery_lists/:id
export const deleteGroceryList = async id => {
  const res = await apiClient.delete(`/grocery_lists/${id}`);
  return res.data;
};

