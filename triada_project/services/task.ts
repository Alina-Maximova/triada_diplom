import { Task, CreateTaskData } from '@/types';
import api from './apiClient';
import { encrypt, decrypt } from '@/utils/encryption';

export const taskService = {
  async getTasks(): Promise<Task[]> {
    const response = await api.get('/tasks');
    return response.data.map((task: Task) => ({
      ...task,
      phone: decrypt(task.phone),
      customer: decrypt(task.customer),
    }));
  },
  async getTask(id: number): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    const task = response.data;
    return {
      ...task,
      phone: decrypt(task.phone),
      customer: decrypt(task.customer),
    };
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    const encryptedData = {
      ...data,
      phone: encrypt(data.phone),
      customer: encrypt(data.customer),
    };
    const response = await api.post('/tasks', encryptedData);
    return response.data
  },

   async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const encryptedData = { ...data };
    if (data.phone) encryptedData.phone = encrypt(data.phone);
    if (data.customer) encryptedData.customer = encrypt(data.customer);
    const response = await api.put(`/tasks/${id}`, encryptedData);
    return response.data
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