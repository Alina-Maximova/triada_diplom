// services/apiClient.ts (дополнение)
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '@/constants';
import { CacheService } from './cacheService';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен в заголовки
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Добавляем кэширование для GET-запросов
api.interceptors.response.use(
  async (response) => {
    // Если это GET-запрос и ответ успешный, сохраняем в кэш
    if (response.config.method === 'get') {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      await CacheService.set(cacheKey, response.data);
    }
    return response;
  },
  async (error) => {

    // Если нет сети (или сервер недоступен) и это GET-запрос, пытаемся вернуть кэш
    const originalRequest = error.config;
    if (originalRequest.method === 'get' && !error.response) {
      const cacheKey = `${originalRequest.url}${JSON.stringify(originalRequest.params || {})}`;
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        // Возвращаем имитацию ответа с кэшированными данными
        return Promise.resolve({ data: cachedData });
      }
    }
    return Promise.reject(error);
  }
);

export default api;