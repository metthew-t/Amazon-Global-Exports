import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://amazon-global-exports.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('❌ API Error:', err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

export default api;
