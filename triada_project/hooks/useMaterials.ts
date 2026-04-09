import { useState, useCallback, useEffect } from 'react';
import { AvailableMaterial, AddMaterialRequest, NewMaterialRequest, TaskMaterial, TaskMaterialsResponse } from '@/types';
import { materialsAPI } from '@/services/materials';
import { CacheService } from '@/services/cacheService';
import { SyncQueueService } from '@/services/syncQueueService';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

export const useMaterials = () => {
  const [taskMaterials, setTaskMaterials] = useState<TaskMaterial[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<AvailableMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTaskMaterials = useCallback(async (taskId: number) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return;

    try {
      setIsLoading(true);
      const data: TaskMaterialsResponse = await materialsAPI.getTaskMaterials(taskId);
      setTaskMaterials(data.materials);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки материалов задачи');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAvailableMaterials = useCallback(async () => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return [];

    try {
      setIsLoading(true);
      const data = await materialsAPI.getAvailableMaterials();
      setAvailableMaterials(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки справочника материалов');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMaterial = useCallback(async (materialData: NewMaterialRequest) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      const tempMaterial: AvailableMaterial = {
        id: -Date.now(),
        name: materialData.name,
        unit: materialData.unit,
        description: materialData.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAvailableMaterials(prev => [tempMaterial, ...prev]);

      await SyncQueueService.addToQueue({
        method: 'POST',
        url: '/materials/available',
        data: materialData,
        tempId: tempMaterial.id,
      });
      return tempMaterial;
    }

    try {
      setIsLoading(true);
      const newMaterial = await materialsAPI.createMaterial(materialData);
      setAvailableMaterials(prev => [newMaterial, ...prev]);
      return newMaterial;
    } catch (err: any) {
      setError(err.message || 'Ошибка создания материала');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMaterialToTask = useCallback(async (taskId: number, materialData: AddMaterialRequest) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      const tempTaskMaterial: TaskMaterial = {
        id: -Date.now(),
        task_id: taskId,
        material_id: materialData.material_id || null,
        quantity: materialData.quantity,
        custom_name: materialData.custom_name || null,
        custom_unit: materialData.custom_unit || null,
        note: materialData.note || null,
        created_at: new Date().toISOString(),
        material_name: materialData.custom_name || availableMaterials.find(m => m.id === materialData.material_id)?.name,
        material_unit: materialData.custom_unit || availableMaterials.find(m => m.id === materialData.material_id)?.unit,
      };
      setTaskMaterials(prev => [tempTaskMaterial, ...prev]);

      await SyncQueueService.addToQueue({
        method: 'POST',
        url: `/materials/${taskId}`,
        data: materialData,
        tempId: tempTaskMaterial.id,
      });
      return tempTaskMaterial;
    }

    try {
      setIsLoading(true);
      const taskMaterial = await materialsAPI.addMaterialToTask(taskId, materialData);
      setTaskMaterials(prev => [taskMaterial, ...prev]);
      return taskMaterial;
    } catch (err: any) {
      setError(err.message || 'Ошибка добавления материала');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [availableMaterials]);

  const removeMaterialFromTask = useCallback(async (taskMaterialId: number) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      setTaskMaterials(prev => prev.filter(m => m.id !== taskMaterialId));
      await SyncQueueService.addToQueue({
        method: 'DELETE',
        url: `/materials/${taskMaterialId}`,
      });
      return;
    }

    try {
      setIsLoading(true);
      await materialsAPI.removeMaterialFromTask(taskMaterialId);
      setTaskMaterials(prev => prev.filter(m => m.id !== taskMaterialId));
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления материала');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMaterialQuantity = useCallback(async (taskMaterialId: number, quantity: number) => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      setTaskMaterials(prev => prev.map(m => m.id === taskMaterialId ? { ...m, quantity } : m));
      await SyncQueueService.addToQueue({
        method: 'PATCH',
        url: `/materials/${taskMaterialId}/quantity`,
        data: { quantity },
      });
      return { id: taskMaterialId, quantity } as TaskMaterial;
    }

    try {
      setIsLoading(true);
      const updated = await materialsAPI.updateMaterialQuantity(taskMaterialId, quantity);
      setTaskMaterials(prev => prev.map(m => m.id === taskMaterialId ? updated : m));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления количества');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableMaterials();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        loadAvailableMaterials();
      }
    });
    return unsubscribe;
  }, [loadAvailableMaterials]);

  return {
    taskMaterials,
    availableMaterials,
    isLoading,
    error,
    loadTaskMaterials,
    loadAvailableMaterials,
    createMaterial,
    addMaterialToTask,
    removeMaterialFromTask,
    updateMaterialQuantity,
    clearError: () => setError(null),
  };
};