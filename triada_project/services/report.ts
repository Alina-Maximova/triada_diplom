import { Report, CreateReportData } from '@/types';
import api from './apiClient';
import { fileService } from './file'; // для getMediaUrl при необходимости

export const reportService = {
  async createReport(reportData: CreateReportData): Promise<Report> {
    const response = await api.post('/reports', reportData);
    return response.data; // ожидаем объект Report с полем files (может быть пустым)
  },

  async getReports(): Promise<Report[]> {
    const response = await api.get('/reports');
    return response.data;
  },

  async getReportsByDateRange(startDate: string, endDate: string): Promise<Report[]> {
    const response = await api.get('/reports/date-range', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  async getReportByTaskId(taskId: number): Promise<Report> {
    const response = await api.get(`/reports/task/${taskId}`);
    return response.data;
  },

  async deleteReport(id: number): Promise<void> {
    await api.delete(`/reports/${id}`);
  },

  // Вспомогательная функция для получения URL файла отчёта (можно использовать fileService.getFileUrl)
  getMediaUrl(filename: string): string {
    return fileService.getFileUrl('report', filename);
  },
};