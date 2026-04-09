import { Task, CreateTaskData } from '@/types';
import api from './apiClient';

export const taskService = {
  async getTasks(): Promise<Task[]> {
    const response = await api.get('/tasks');
    return response.data;
  },

  async getTask(id: number): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  async updateTaskStatus(id: number, data: { status: string; pause_reason?: string }): Promise<Task> {


    const response = await api.put(`/tasks/status/${id}`, data);
    return response.data;
  },

  async deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async addInvoice(taskId: number, invoiceData: { filename: string; path: string }): Promise<Task> {
    const response = await api.post(`/tasks/${taskId}/invoice`, invoiceData);
    return response.data;
  },

  async removeInvoice(taskId: number): Promise<Task> {
    const response = await api.delete(`/tasks/${taskId}/invoice`);
    return response.data;
  },
};