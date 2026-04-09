import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiClient';
import { CacheService } from './cacheService';

const QUEUE_KEY = 'sync_queue';
const MAX_RETRIES = 5; // увеличено с 1 до 5
let isProcessing = false; // защита от параллельного выполнения

interface QueueItem {
  id: string;
  method: string;
  url: string;
  data?: any;
  headers?: any;
  timestamp: number;
  tempId?: string | number;
  retries?: number;
}

export const SyncQueueService = {
  async addToQueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queue = await this.getQueue();
    const newItem: QueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };
    queue.push(newItem);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async getQueue(): Promise<QueueItem[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async updateQueueItem(updatedItem: QueueItem): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
      queue[index] = updatedItem;
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  },

  async removeFromQueue(id: string): Promise<void> {
    const queue = await this.getQueue();
    const newQueue = queue.filter(item => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
  },

  isRetryableError(error: any): boolean {
    if (!error.response) return true; // нет сети или таймаут
    const status = error.response.status;
    return status >= 500 || status === 429 || status === 408;
  },

  async processQueue(): Promise<void> {
    // Защита от параллельных вызовов
    if (isProcessing) {
      console.log('processQueue уже выполняется, пропускаем');
      return;
    }

    const isConnected = await CacheService.isConnected();
    if (!isConnected) return;

    isProcessing = true;
    try {
      const queue = await this.getQueue();
      if (queue.length === 0) return;

      // Работаем с копией, чтобы изменения в процессе не ломали итерацию
      for (const item of queue) {
        try {
          await api({
            method: item.method,
            url: item.url,
            data: item.data,
            headers: item.headers,
          });
          // Успешно – удаляем из очереди
          await this.removeFromQueue(item.id);
        } catch (error) {
          if (this.isRetryableError(error)) {
            const retries = (item.retries || 0) + 1;
            if (retries >= MAX_RETRIES) {
              console.error(`Элемент ${item.id} удалён после ${MAX_RETRIES} неудачных попыток`);
              await this.removeFromQueue(item.id);
            } else {
              // Увеличиваем счётчик, не удаляя и не создавая новый элемент
              const updatedItem = { ...item, retries };
              await this.updateQueueItem(updatedItem);
              console.log(`Элемент ${item.id} будет повторён (попытка ${retries} из ${MAX_RETRIES})`);
            }
          } else {
            // Критическая ошибка (4xx, кроме 429/408) – удаляем навсегда

            await this.removeFromQueue(item.id);
          }
        }
      }
    } finally {
      isProcessing = false;
    }
  },

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }
};