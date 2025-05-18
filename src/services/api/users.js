// src/services/api/users.js
import apiClient from '../client';

/**
 * GET /users/me
 * Busca o perfil do usuário logado.
 * @returns {Promise<Object>} objeto com dados do usuário, incluindo hormonal_cycle
 */
export const getUserProfile = async () => {
  const { data } = await apiClient.get('/users/me');
  return data;
};

/**
 * POST /users
 * Cria ou inicializa o perfil do usuário (usado na primeira vez que ele entra).
 * @param {Object} payload - { email, display_name, hormonal_cycle, ... }
 * @returns {Promise<Object>} objeto de resposta (p.ex. { success: true })
 */
export const createUserProfile = async (payload) => {
  const { data } = await apiClient.post('/users', payload);
  return data;
};

/**
 * PATCH /users/me
 * Atualiza campos do perfil do usuário (p.ex. hormonal_cycle).
 * @param {Object} payload - campos a atualizar, ex: { hormonal_cycle: { … } }
 * @returns {Promise<Object>} objeto de resposta (p.ex. { success: true })
 */
export const updateUserProfile = async (payload) => {
  const { data } = await apiClient.patch('/users/me', payload);
  return data;
};
