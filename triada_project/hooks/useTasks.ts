import { useState, useCallback, useEffect } from 'react';
import { Task, CreateTaskData } from '@/types';
import { taskService } from '@/services/task';
import { CacheService } from '@/services/cacheService';
import { SyncQueueService } from '@/services/syncQueueService';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadTasks = useCallback(async () => {
    console.log(SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN))
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return; // не авторизован – не грузим

    try {
      setIsLoading(true);
      setError(null);
      const tasksData = await taskService.getTasks();
      setTasks(tasksData);
      return tasksData;
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка загрузки задач';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTask = useCallback(async (id: number) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return null;

    try {
      setIsLoading(true);
      setError(null);
      const taskData = await taskService.getTask(id);
      setTask(taskData);
      return taskData;
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка загрузки задачи';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTask = useCallback(async (data: CreateTaskData) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      // Оптимистическое обновление
      const tempId = -Date.now();
      const tempTask: Task = {
        id: tempId,
        title: data.title,
        description: data.description,
        phone: data.phone,
        customer: data.customer,
        addressNote: data.addressNote,
        status: 'new',
        start_date: data.start_date,
        due_date: data.due_date,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.location.address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        startDate: data.start_date,
        dueDate: data.due_date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        has_invoice: false,
        invoice: {
          filename: '',
          originalname: '',
          type: '',
          size: 1
        }
      };
      setTasks(prev => [tempTask, ...prev]);

      await SyncQueueService.addToQueue({
        method: 'POST',
        url: '/tasks',
        data: data,
        tempId: tempId,
      });
      return tempTask;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newTask = await taskService.createTask(data);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка создания задачи';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (id: number, data: Partial<Task>) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      if (task?.id === id) setTask(prev => prev ? { ...prev, ...data } : prev);

      await SyncQueueService.addToQueue({
        method: 'PUT',
        url: `/tasks/${id}`,
        data: data,
      });
      return { id, ...data } as Task;
    }

    try {
      setIsLoading(true);
      setError(null);
      const updatedTask = await taskService.updateTask(id, data);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      if (task?.id === id) setTask(updatedTask);
      return updatedTask;
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка обновления задачи';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [task]);

  const updateTaskStatus = useCallback(async (id: number, data: { status: string; }) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: data.status } : t));
      if (task?.id === id) setTask(prev => prev ? { ...prev, ...data } : prev);

      await SyncQueueService.addToQueue({
        method: 'PUT',
        url: `/tasks/status/${id}`,
        data: data,
      });
      return { id, ...data } as Task;
    }


    try {
      setIsLoading(true);
      setError(null);

      const updatedTask = await taskService.updateTaskStatus(id, data);

      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      if (task?.id === id) setTask(updatedTask);
      return updatedTask;
    } catch (err: any) {
      console.log(err);

      const errorMessage = err.message || 'Ошибка обновления статуса задачи';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [task]);

  const deleteTask = useCallback(async (id: number) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      setTasks(prev => prev.filter(t => t.id !== id));
      if (task?.id === id) setTask(null);

      await SyncQueueService.addToQueue({
        method: 'DELETE',
        url: `/tasks/${id}`,
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      if (task?.id === id) setTask(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка удаления задачи';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [task]);

  const refreshTasks = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [refreshTrigger, loadTasks]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        loadTasks();
      }
    });
    return unsubscribe;
  }, [loadTasks]);

  return {
    tasks,
    task,
    isLoading,
    error,
    loadTasks,
    loadTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    refreshTasks,
    clearError,
  };
};