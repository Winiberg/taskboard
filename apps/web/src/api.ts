import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './authStorage';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
});

/**
 * Interceptor de Solicitud (Request):
 * Inserta automáticamente el Access Token en la cabecera Authorization de cada petición.
 */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Controladores globales para evitar múltiples solicitudes de refresco concurrentes
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/**
 * Interceptor de Respuesta (Response):
 * Detecta errores 401 e intenta renovar los tokens transparentemente.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as any;

    // Si el error no es 401 o la petición ya fue reintentada antes, rechaza de inmediato
    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return Promise.reject(error);
    }

    // Marcamos la petición para evitar bucles infinitos de reintentos
    originalRequest._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;

        // Creamos la promesa de refresco compartida para todas las peticiones concurrentes
        refreshPromise = (async () => {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          );
          setTokens(data.access_token, data.refresh_token);
        })();

        await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;
      } else if (refreshPromise) {
        // Si ya hay un refresco en marcha, esperamos a que esa misma promesa termine
        await refreshPromise;
      }

      // Obtenemos el nuevo Access Token recién inyectado en el almacenamiento
      const newAccessToken = getAccessToken();
      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      // Re-ejecutamos la petición original fallida utilizando la instancia configurada
      return api(originalRequest);
    } catch (e) {
      // Si el proceso de refresh falla (por ejemplo, token inválido o expirado en BD), deslogueamos al usuario
      clearTokens();
      isRefreshing = false;
      refreshPromise = null;
      return Promise.reject(e);
    }
  }
);