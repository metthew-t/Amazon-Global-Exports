import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // This should NOT have /api at the end
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
console.log('🔍 API Base URL:', import.meta.env.VITE_API_URL);
console.log('🔍 Full API baseURL:', api.defaults.baseURL);

// Log requests for debugging
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
      if (path !== '/login' && path !== '/register' && path !== '/admin/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
