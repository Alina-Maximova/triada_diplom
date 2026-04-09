// hooks/useNotifications.ts
import { useEffect, useCallback, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notifications';
import { Task } from '../types';

export const useNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [notificationListeners, setNotificationListeners] = useState<{
    received: any;
    response: any;
  } | null>(null);

  // Инициализация слушателей уведомлений
  useEffect(() => {
    const initializeListeners = async () => {
      await NotificationService.requestPermissions();

      // Обработчик получения уведомления (когда приложение активно)
      const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        // Обработка различных типов уведомлений
        const { taskId, type } = notification.request.content.data;

        if (type === 'task_completion' && taskId) {
          // Уведомление о возможности создания отчета для выполненной задачи
        }
      });

      // Обработчик нажатия на уведомление
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        // Обработка клика по уведомлению
        const { taskId, type } = response.notification.request.content.data;

        if (taskId) {
          // Навигация к задаче или другие действия
          if (type === 'task_completion') {
            // При клике на уведомление о выполнении задачи
          }
        }
      });

      setNotificationListeners({
        received: receivedSubscription,
        response: responseSubscription
      });
    };

    initializeListeners();

    return () => {
      // Очистка слушателей при размонтировании
      if (notificationListeners) {
        notificationListeners.received.remove();
        notificationListeners.response.remove();
      }
    };
  }, []);

  // Планирование уведомлений для задачи
  const scheduleTaskReminders = useCallback(async (task: Task) => {
    return await NotificationService.scheduleAllTaskReminders(task);
  }, []);

  // Отмена уведомлений для задачи
  const cancelTaskReminders = useCallback(async (taskId: number) => {
    await NotificationService.cancelTaskReminders(taskId);
  }, []);

  // Планирование уведомлений для всех задач
  const scheduleRemindersForAllTasks = useCallback(async (tasks: Task[]) => {
    setIsLoading(true);
    try {
      const result = await NotificationService.scheduleRemindersForTaskList(tasks);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Отмена всех уведомлений
  const cancelAllReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      await NotificationService.cancelAllReminders();
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Показать план уведомлений
  const showNotificationPlan = useCallback(async () => {
    setIsLoading(true);
    try {
      await NotificationService.showNotificationCache();
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Показать статистику уведомлений
  const showNotificationStats = useCallback(async () => {
    try {
      await NotificationService.showCacheStats();
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Очистить все уведомления
  const clearAllNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      await NotificationService.cancelAllReminders();
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Принудительное перепланирование уведомлений для задачи
  const rescheduleTaskReminders = useCallback(async (task: Task) => {
    setIsLoading(true);
    try {
      const result = await NotificationService.rescheduleTaskReminders(task);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Массовое перепланирование уведомлений
  const bulkRescheduleTasks = useCallback(async (tasks: Task[]) => {
    setIsLoading(true);
    try {
      const result = await NotificationService.bulkRescheduleTasks(tasks);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Проверка существующих уведомлений для задачи
  const hasExistingNotifications = useCallback(async (taskId: number) => {
    return await NotificationService.hasExistingNotifications(taskId);
  }, []);

  // Получение всех запланированных уведомлений
  const getScheduledNotifications = useCallback(async () => {
    return await NotificationService.getScheduledNotifications();
  }, []);

  // Получение Expo Push Token
  const getExpoPushToken = useCallback(async () => {
    return await NotificationService.getExpoPushToken();
  }, []);

  return {
    // Основные методы
    scheduleTaskReminders,
    cancelTaskReminders,
    scheduleRemindersForAllTasks,
    cancelAllReminders,
    
    // Просмотр и отладка
    showNotificationPlan,
    showNotificationStats,
    clearAllNotifications,
    
    // Перепланирование
    rescheduleTaskReminders,
    bulkRescheduleTasks,
    
    // Проверки и информация
    hasExistingNotifications,
    getScheduledNotifications,
    getExpoPushToken,
    
    // Состояние
    isLoading,
  };
};