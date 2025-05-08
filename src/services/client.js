import axios from 'axios';

// Determina a base URL conforme ambiente
const getBaseUrl = () => {
  const isProduction =
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.includes('127.0.0.1');

  if (isProduction) {
    // Produção: Firebase Hosting cuida do rewrite /api → função
    return '/api';
  } else {
    // Desenvolvimento: Functions emulator no localhost
    const projectId = 'licheskis-cook-assintant';
    const region    = 'us-central1';
    return `http://localhost:5001/${projectId}/${region}/api`;
  }
};

// Cria instância Axios
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// Log de requisições/respostas (opcional)
apiClient.interceptors.request.use(cfg => {
  console.log(`→ ${cfg.method.toUpperCase()} ${cfg.baseURL}${cfg.url}`);
  return cfg;
});
apiClient.interceptors.response.use(
  res => res,
  err => {
    console.error('← Response Error:', err.response?.status, err.response?.data || err.message);
    return Promise.reject(err);
  }
);


export default apiClient;