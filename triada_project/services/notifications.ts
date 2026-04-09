// services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Task } from '@/types';

// Конфигурация уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static notificationCache = new Map<number, string[]>();
  private static isProcessing = false;
  private static pendingTasks = new Set<number>();

  // Проверка, должна ли задача получать уведомления
  private static shouldScheduleForTask(task: Task): boolean {
    return task.status === 'new';
  }

  // Проверка, находится ли задача в периоде от 1 до 7 дней до начала
  private static isWithinWeekRange(task: Task): boolean {
    if (!task.start_date) return false;
    
    const startDate = new Date(task.start_date);
    const now = new Date();
    const diffMs = startDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    return diffDays >= 1 && diffDays <= 7;
  }

  // Проверка, осталось ли до задачи меньше суток
  private static isLessThanDayAway(task: Task): boolean {
    if (!task.start_date) return false;
    
    const startDate = new Date(task.start_date);
    const now = new Date();
    const diffMs = startDate.getTime() - now.getTime();
    
    return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
  }

  // Быстрое планирование уведомления с минимальной проверкой
  private static async scheduleNotificationFast(
    task: Task, 
    triggerDate: Date, 
    title: string, 
    body: string, 
    type: string
  ): Promise<string | null> {
    const now = new Date();
    const secondsFromNow = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);
    
    if (secondsFromNow <= 0) return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            taskId: task.id,
            type,
            taskTitle: task.title,
            timestamp: Date.now()
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
          repeats: false,
        },
      });

      this.addToCache(task.id, notificationId);
      return notificationId;
    } catch (error) {
      return null;
    }
  }

  // Показать немедленное уведомление (не планировать)
  private static async showImmediateNotification(task: Task, type: string) {
    try {
      const timeUntilStart = this.getTimeUntilStartText(new Date(task.start_date!));
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Задача скоро начнется!',
          body: `Скоро начинается: "${task.title}" (${timeUntilStart})`,
          data: { 
            taskId: task.id,
            type: type,
            taskTitle: task.title,
            timestamp: Date.now()
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
          repeats: false,
        },
      });
    } catch (error) {
      // Ошибка при показе уведомления
    }
  }

  // Планирование уведомления за неделю до начала задачи
  static async scheduleTaskWeekBeforeReminder(task: Task): Promise<string | null> {
    if (!task.start_date || !this.shouldScheduleForTask(task)) return null;

    const start_date = new Date(task.start_date);
    const now = new Date();
    const diffDays = Math.floor((start_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 1 || diffDays > 7) return null;

    const reminderDate = new Date(start_date);
    reminderDate.setDate(reminderDate.getDate() - 7);
    reminderDate.setHours(9, 0, 0, 0);

    if (reminderDate <= now) {
      await this.showImmediateNotification(task, 'week_before_immediate');
      return null;
    }

    return this.scheduleNotificationFast(
      task,
      reminderDate,
      '📅 Задача через неделю',
      `Через неделю начинается: "${task.title}"`,
      'week_before_reminder'
    );
  }

  // Планирование ежедневных уведомлений за неделю до начала
  static async scheduleTaskDailyReminders(task: Task): Promise<string[]> {
    if (!task.start_date || !this.shouldScheduleForTask(task)) return [];

    const start_date = new Date(task.start_date);
    const now = new Date();
    const diffDays = Math.floor((start_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 1 || diffDays > 7) return [];

    const notificationIds: string[] = [];

    for (let daysBefore = diffDays; daysBefore >= 1; daysBefore--) {
      const reminderDate = new Date(start_date);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);
      reminderDate.setHours(9, 0, 0, 0);

      if (reminderDate <= now) continue;

      const daysText = this.getDaysText(daysBefore);
      
      const notificationId = await this.scheduleNotificationFast(
        task,
        reminderDate,
        `📋 Напоминание о задаче`,
        `До начала "${task.title}" осталось ${daysBefore} ${daysText}`,
        `daily_reminder_${daysBefore}days`
      );

      if (notificationId) {
        notificationIds.push(notificationId);
      }
    }

    return notificationIds;
  }

  // Оптимизированное планирование уведомления за день до начала задачи
  static async scheduleTaskReminder(task: Task): Promise<string | null> {
    if (!task.start_date || !this.shouldScheduleForTask(task)) return null;

    const start_date = new Date(task.start_date);
    
    if (this.isLessThanDayAway(task)) {
      await this.showImmediateNotification(task, 'immediate_reminder');
      return null;
    }

    const reminderDate = new Date(start_date);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);

    return this.scheduleNotificationFast(
      task,
      reminderDate,
      '📅 Напоминание о задаче',
      `Завтра начинается: "${task.title}"`,
      'day_before_reminder'
    );
  }

  // Оптимизированное планирование уведомления за час до начала задачи
  static async scheduleTaskHourBeforeReminder(task: Task): Promise<string | null> {
    if (!task.start_date || !this.shouldScheduleForTask(task)) return null;

    const start_date = new Date(task.start_date);
    
    if (this.isLessThanDayAway(task)) return null;

    const reminderDate = new Date(start_date);
    reminderDate.setHours(reminderDate.getHours() - 1);

    return this.scheduleNotificationFast(
      task,
      reminderDate,
      '⏰ Скоро начало задачи',
      `Через час начинается: "${task.title}"`,
      'hour_before_reminder'
    );
  }

  // Планирование уведомления о просрочке
  static async scheduleOverdueReminder(task: Task): Promise<string | null> {
    if (!task.due_date || task.status !== 'new') return null;

    const dueDate = new Date(task.due_date);
    const now = new Date();

    if (dueDate < now) {
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🚨 Задача просрочена!',
            body: `Задача "${task.title}" просрочена на ${daysOverdue} ${this.getDayText(daysOverdue)}`,
            data: { 
              taskId: task.id,
              type: 'overdue',
              taskTitle: task.title,
              daysOverdue: daysOverdue,
              timestamp: Date.now()
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3,
            repeats: false,
          },
        });

        return notificationId;
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  // Метод для планирования всех типов уведомлений для одной задачи
  static async scheduleAllTaskReminders(task: Task) {
    const permissionsGranted = await this.requestPermissions();
    if (!permissionsGranted) {
      return null;
    }

    try {
      const [weekBeforeId, dailyReminders, dayBeforeId, hourBeforeId, overdueId] = await Promise.all([
        this.scheduleTaskWeekBeforeReminder(task),
        this.scheduleTaskDailyReminders(task),
        this.scheduleTaskReminder(task),
        this.scheduleTaskHourBeforeReminder(task),
        this.scheduleOverdueReminder(task)
      ]);

      return {
        weekBeforeId,
        dailyReminders: dailyReminders.length,
        dayBeforeId,
        hourBeforeId,
        overdueId
      };
    } catch (error) {
      return null;
    }
  }

  // ОСНОВНОЙ ОПТИМИЗИРОВАННЫЙ МЕТОД - ПАРАЛЛЕЛЬНАЯ ОБРАБОТКА
  static async scheduleRemindersForTaskList(tasks: Task[]): Promise<number> {
    if (this.isProcessing) {
      tasks.forEach(task => this.pendingTasks.add(task.id));
      return 0;
    }

    this.isProcessing = true;

    try {
      const permissionsGranted = await this.requestPermissions();
      if (!permissionsGranted) {
        return 0;
      }

      let scheduledCount = 0;
      let immediateCount = 0;

      const validTasks = tasks.filter(task => 
        (task.start_date || task.due_date) && 
        this.shouldScheduleForTask(task)
      );

      const processingPromises = validTasks.map(async (task) => {
        const taskPromises = [];

        if (task.start_date) {
          if (this.isWithinWeekRange(task)) {
            taskPromises.push(
              this.scheduleTaskWeekBeforeReminder(task).then(id => { if (id) scheduledCount++; }),
              this.scheduleTaskDailyReminders(task).then(ids => { scheduledCount += ids.length; }),
              this.scheduleTaskReminder(task).then(id => { if (id) scheduledCount++; }),
              this.scheduleTaskHourBeforeReminder(task).then(id => { if (id) scheduledCount++; })
            );
          } else if (this.isLessThanDayAway(task)) {
            taskPromises.push(this.showImmediateNotification(task, 'immediate_start').then(() => immediateCount++));
          } else {
            taskPromises.push(
              this.scheduleTaskReminder(task).then(id => { if (id) scheduledCount++; }),
              this.scheduleTaskHourBeforeReminder(task).then(id => { if (id) scheduledCount++; })
            );
          }
        }

        if (task.due_date) {
          taskPromises.push(this.scheduleOverdueReminder(task).then(id => { if (id) scheduledCount++; }));
        }

        await Promise.all(taskPromises);
      });

      await Promise.all(processingPromises);

      return scheduledCount + immediateCount;
    } finally {
      this.isProcessing = false;
      
      if (this.pendingTasks.size > 0) {
        const pendingTaskIds = Array.from(this.pendingTasks);
        this.pendingTasks.clear();
      }
    }
  }

  // СУПЕР-БЫСТРОЕ ПЕРЕПЛАНИРОВАНИЕ ДЛЯ ОДНОЙ ЗАДАЧИ
  static async rescheduleTaskReminders(task: Task) {
    try {
      const [permissionsGranted] = await Promise.all([
        this.requestPermissions(),
        this.cancelTaskReminders(task.id)
      ]);

      if (!permissionsGranted) {
        return null;
      }

      if (!this.shouldScheduleForTask(task)) {
        return null;
      }

      const [weekBeforeId, dailyReminders, dayBeforeId, hourBeforeId, overdueId] = await Promise.all([
        this.scheduleTaskWeekBeforeReminder(task),
        this.scheduleTaskDailyReminders(task),
        this.scheduleTaskReminder(task),
        this.scheduleTaskHourBeforeReminder(task),
        this.scheduleOverdueReminder(task)
      ]);

      return {
        weekBeforeId,
        dailyReminders: dailyReminders.length,
        dayBeforeId,
        hourBeforeId,
        overdueId,
        rescheduled: true
      };
    } catch (error) {
      return null;
    }
  }

  // МАССОВОЕ ПЕРЕПЛАНИРОВАНИЕ ДЛЯ НЕСКОЛЬКИХ ЗАДАЧ
  static async bulkRescheduleTasks(tasks: Task[]): Promise<{success: number, failed: number}> {
    const permissionsGranted = await this.requestPermissions();
    if (!permissionsGranted) {
      return { success: 0, failed: tasks.length };
    }

    let success = 0;
    let failed = 0;

    const batchSize = 5;
    const totalBatches = Math.ceil(tasks.length / batchSize);

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (task) => {
        try {
          await this.cancelTaskReminders(task.id);
          
          if (!this.shouldScheduleForTask(task)) {
            return { success: false, taskId: task.id, reason: 'invalid_status' };
          }

          await Promise.all([
            this.scheduleTaskWeekBeforeReminder(task),
            this.scheduleTaskDailyReminders(task),
            this.scheduleTaskReminder(task),
            this.scheduleTaskHourBeforeReminder(task),
            this.scheduleOverdueReminder(task)
          ]);

          return { success: true, taskId: task.id };
        } catch (error) {
          return { success: false, taskId: task.id, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          success++;
        } else {
          failed++;
        }
      });
    }

    return { success, failed };
  }

  // ОПТИМИЗИРОВАННАЯ ОТМЕНА УВЕДОМЛЕНИЙ
  static async cancelTaskReminders(taskId: number): Promise<void> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const taskNotifications = allNotifications.filter(notification => 
        notification.content.data?.taskId === taskId
      );

      if (taskNotifications.length === 0) {
        return;
      }

      const cancelPromises = taskNotifications.map(notification =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      );

      await Promise.all(cancelPromises);
      this.notificationCache.delete(taskId);
    } catch (error) {
      // Ошибка при отмене уведомлений
    }
  }

  // Отмена всех уведомлений
  static async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.notificationCache.clear();
    } catch (error) {
      // Ошибка при отмене всех уведомлений
    }
  }

  // ОПТИМИЗИРОВАННАЯ ПРОВЕРКА СУЩЕСТВУЮЩИХ УВЕДОМЛЕНИЙ
  static async hasExistingNotifications(taskId: number): Promise<boolean> {
    if (this.notificationCache.has(taskId)) {
      return true;
    }

    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return allNotifications.some(notification => 
        notification.content.data?.taskId === taskId
      );
    } catch (error) {
      return false;
    }
  }

  // Получение всех запланированных уведомлений
  static async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      return [];
    }
  }

  // === МЕТОДЫ ДЛЯ ПРОСМОТРА КЭША УВЕДОМЛЕНИЙ ===

  // Показать весь кэш уведомлений
  static async showNotificationCache() {
    if (this.notificationCache.size === 0) {
      return;
    }

    // Показываем кэш в памяти
    this.notificationCache.forEach((notificationIds, taskId) => {
      notificationIds.forEach((id, index) => {
        // Логирование кэша
      });
    });

    // Показываем реальные запланированные уведомления
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      if (scheduledNotifications.length === 0) {
        return;
      }

      const notificationsByTask = new Map<number, any[]>();
      
      scheduledNotifications.forEach(notification => {
        const taskId = notification.content.data?.taskId;
        if (taskId) {
          if (!notificationsByTask.has(taskId)) {
            notificationsByTask.set(taskId, []);
          }
          notificationsByTask.get(taskId)!.push({
            id: notification.identifier,
            title: notification.content.title,
            type: notification.content.data?.type,
            trigger: notification.trigger
          });
        }
      });

      // Показываем несоответствия между кэшем и реальными уведомлениями
      this.notificationCache.forEach((cachedIds, taskId) => {
        const realNotifications = notificationsByTask.get(taskId) || [];
        const realIds = realNotifications.map(n => n.id);
        
        const missingInCache = realIds.filter(id => !cachedIds.includes(id));
        const missingInReal = cachedIds.filter(id => !realIds.includes(id));
        
        if (missingInCache.length > 0 || missingInReal.length > 0) {
          // Логирование несоответствий
        }
      });
    } catch (error) {
      // Ошибка при получении уведомлений
    }
  }

  // Показать статистику кэша
  static showCacheStats() {
    let totalNotifications = 0;
    this.notificationCache.forEach((notificationIds) => {
      totalNotifications += notificationIds.length;
    });
    
    // Логирование статистики
  }

  // Очистить кэш для конкретной задачи
  static clearCacheForTask(taskId: number) {
    const hadCache = this.notificationCache.has(taskId);
    this.notificationCache.delete(taskId);
  }

  // Очистить весь кэш
  static clearAllCache() {
    this.notificationCache.clear();
  }

  // Проверить кэш для конкретной задачи
  static checkTaskCache(taskId: number) {
    const cachedIds = this.notificationCache.get(taskId);
    
    if (!cachedIds || cachedIds.length === 0) {
      return [];
    }
    
    return cachedIds;
  }

  // === СЛУШАТЕЛИ УВЕДОМЛЕНИЙ ===

  static addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  static addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // === УТИЛИТЫ ===

  static async requestPermissions(): Promise<boolean> {
    if (Device.isDevice) {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('task-reminders', {
          name: 'Напоминания о задачах',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    }
    return false;
  }

  // Получение Expo Push Token
  static async getExpoPushToken() {
    if (!Device.isDevice) {
      return null;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      return token;
    } catch (error) {
      return null;
    }
  }

  // Вспомогательный метод для форматирования времени
  private static getTimeUntilStartText(startDate: Date): string {
    const now = new Date();
    const diffMs = startDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'уже началась';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours < 1) {
      return `менее чем через час (${diffMinutes} мин)`;
    } else if (diffHours < 24) {
      return `менее чем через день (${diffHours} ч)`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `через ${diffDays} ${this.getDayText(diffDays)}`;
    }
  }

  // Вспомогательный метод для склонения дней (для ежедневных уведомлений)
  private static getDaysText(days: number): string {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }

  // Вспомогательный метод для склонения (для других случаев)
  private static getDayText(days: number): string {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }

  // Вспомогательные методы для кэширования
  private static addToCache(taskId: number, notificationId: string) {
    if (!this.notificationCache.has(taskId)) {
      this.notificationCache.set(taskId, []);
    }
    this.notificationCache.get(taskId)!.push(notificationId);
  }

  private static removeFromCache(notificationId: string) {
    for (const [taskId, notificationIds] of this.notificationCache.entries()) {
      const index = notificationIds.indexOf(notificationId);
      if (index > -1) {
        notificationIds.splice(index, 1);
        if (notificationIds.length === 0) {
          this.notificationCache.delete(taskId);
        }
        break;
      }
    }
  }
}