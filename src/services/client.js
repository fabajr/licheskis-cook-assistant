// src/services/client.js
import axios from 'axios';
import { auth } from '../firebase'; // seu firebase.js já expõe o auth

const getBaseUrl = () => {
  const isProduction =
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.includes('127.0.0.1');

  if (isProduction) {
    return '/api';
  } else {
    const projectId = 'licheskis-cook-assintant';
    const region    = 'us-central1';
    return `http://localhost:5001/${projectId}/${region}/api`;
  }
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// 1) Antes de logar a request, injete o JWT
apiClient.interceptors.request.use(async config => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`→ ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
}, error => Promise.reject(error));

// 2) Continua com o interceptor de response que você já tinha
apiClient.interceptors.response.use(
  res => res,
  err => {
    console.error(
      '← Response Error:',
      err.response?.status,
      err.response?.data || err.message
    );
    return Promise.reject(err);
  }
);


export default apiClient;
