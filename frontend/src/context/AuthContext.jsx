import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://amazon-global-exports.onrender.com/api',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    
    // Only redirect for 401 if NOT already on login/register pages
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      // Don't redirect if already on auth pages
      if (!['/login', '/register', '/admin/login'].includes(path)) {
        // Clear any stale token
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
