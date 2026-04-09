import { useState, useEffect, useCallback } from 'react';
import { Report, CreateReportData } from '@/types';
import { reportService } from '@/services/report';
import { CacheService } from '@/services/cacheService';
import { SyncQueueService } from '@/services/syncQueueService';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsDate, setReportsDate] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await reportService.getReports();
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки отчетов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadReportsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await reportService.getReportsByDateRange(startDate, endDate);
      setReportsDate(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки отчетов по датам');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReport = useCallback(async (reportData: CreateReportData) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      const tempId = -Date.now();
      const tempReport: Report = {
        id: tempId,
        task_id: reportData.task_id,
        description: reportData.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        files: [],
      };
      setReports(prev => [tempReport, ...prev]);

      await SyncQueueService.addToQueue({
        method: 'POST',
        url: '/reports',
        data: reportData,
        tempId: tempId,
      });
      return tempReport;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newReport = await reportService.createReport(reportData);
      setReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании отчета');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReportByTaskId = useCallback(async (taskId: number) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return null;

    try {
      setIsLoading(true);
      setError(null);
      const report = await reportService.getReportByTaskId(taskId);
      return report;
    } catch (err: any) {
      setError(err.message || 'Ошибка при получении отчета');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (id: number) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      setReports(prev => prev.filter(r => r.id !== id));
      await SyncQueueService.addToQueue({
        method: 'DELETE',
        url: `/reports/${id}`,
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await reportService.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении отчета');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        loadReports();
      }
    });
    return unsubscribe;
  }, [loadReports]);

  return {
    reports,
    reportsDate,
    isLoading,
    error,
    loadReports,
    loadReportsByDateRange,
    createReport,
    getReportByTaskId,
    deleteReport,
    clearError: () => setError(null),
  };
};