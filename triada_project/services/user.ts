import { LoginData } from '@/types';
import api from './apiClient';

export const authAPI = {
  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    return response.data; // ← возвращаем data, а не весь response
  },
};