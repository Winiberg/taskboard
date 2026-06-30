import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. http://localhost:3000
  timeout: 10000,
});

// Interceptor: Antes de que salga cualquier petición, revisa si hay un token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Agrega el candado
  }
  return config;
});