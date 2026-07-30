import axios from 'axios';

// TEMPORARILY HARDCODE THE FULL URL WITH /api
const API_URL = 'https://amazon-global-exports.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,  // Hardcoded for testing
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🔍 API Base URL:', API_URL);
console.log('🔍 Full API baseURL:', api.defaults.baseURL);

api.interceptors.request.use(
  (config) => {
    console.log('🌐 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('❌ API Error:', err.response?.status, err.response?.data);
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/admin/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
