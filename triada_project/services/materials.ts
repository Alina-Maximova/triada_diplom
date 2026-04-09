import { API_BASE_URL, STORAGE_KEYS } from '@/constants';
import { AvailableMaterial, TaskMaterial, TaskMaterialsResponse, AddMaterialRequest, NewMaterialRequest } from '@/types/index';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import api from './apiClient';

export const materialsAPI = {
  getAvailableMaterials: async (): Promise<AvailableMaterial[]> => {
    try {
      const response = await api.get('/materials/available');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Ошибка загрузки доступных материалов';
      throw new Error(message);
    }
  },

  createMaterial: async (data: NewMaterialRequest): Promise<AvailableMaterial> => {
    try {
      const response = await api.post('/materials/available', data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Ошибка создания материала';
      throw new Error(message);
    }
  },

  getTaskMaterials: async (taskId: number): Promise<TaskMaterialsResponse> => {
    try {
      const response = await api.get(`/materials/${taskId}`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Ошибка загрузки материалов задачи';
      throw new Error(message);
    }
  },

  addMaterialToTask: async (taskId: number, data: AddMaterialRequest): Promise<TaskMaterial> => {
    try {
      const response = await api.post(`/materials/${taskId}`, data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Ошибка добавления материала к задаче';
      throw new Error(message);
    }
  },

  removeMaterialFromTask: async (taskMaterialId: number) => {
    try {
      await api.delete(`/materials/${taskMaterialId}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Ошибка удаления материала из задачи';
      throw new Error(message);
    }
  },

  updateMaterialQuantity: async (taskMaterialId: number, quantity: number): Promise<TaskMaterial> => {
    try {
      const response = await api.patch(`/materials/${taskMaterialId}/quantity`, { quantity });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Ошибка обновления количества';
      throw new Error(message);
    }
  }
};