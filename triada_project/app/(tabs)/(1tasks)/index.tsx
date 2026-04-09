import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Appbar, Searchbar, Snackbar, Button, useTheme } from 'react-native-paper';
import { TaskList } from '@/components/task/TaskList';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { Task } from '@/types';
import { TaskScreenStyles } from '@/styles/task/TaskScreenStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import { NotificationService } from '@/services/notifications';

export default function TasksScreen() {
  const { logout } = useAuth();
  const { tasks, isLoading, deleteTask, updateTaskStatus, refreshTasks } = useTasks();
  const { getReportByTaskId } = useReports();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const theme = useTheme();
  const styles = TaskScreenStyles(theme);

  // Храним предыдущее состояние задач для интеллектуального сравнения
  const previousTasksRef = useRef<Map<number, Task>>(new Map());

  // Обновляем данные при фокусе на экране
  useFocusEffect(
    React.useCallback(() => {
      refreshTasks();
    }, [])
  );

  // Интеллектуальное сравнение задач для перепланирования уведомлений
  useEffect(() => {
    if (tasks.length === 0) {
      previousTasksRef.current.clear();
      return;
    }

    const currentTasksMap = new Map(tasks.map(task => [task.id, task]));
    const previousTasksMap = previousTasksRef.current;

    // Анализируем изменения
    const changes = {
      added: [] as Task[],
      deleted: [] as number[],
      timeChanged: [] as Task[],
      statusChanged: [] as Task[],
      unchanged: [] as Task[]
    };

    // Проверяем добавленные и измененные задачи
    for (const [taskId, currentTask] of currentTasksMap) {
      const previousTask = previousTasksMap.get(taskId);

      if (!previousTask) {
        // Новая задача
        changes.added.push(currentTask);
      } else {
        // Существующая задача - проверяем изменения
        const startDateChanged = currentTask.start_date !== previousTask.start_date;
        const statusChanged = currentTask.status !== previousTask.status;

        if (startDateChanged) {
          changes.timeChanged.push(currentTask);
        } else if (statusChanged) {
          changes.statusChanged.push(currentTask);
        } else {
          changes.unchanged.push(currentTask);
        }
      }
    }

    // Проверяем удаленные задачи
    for (const [taskId] of previousTasksMap) {
      if (!currentTasksMap.has(taskId)) {
        changes.deleted.push(taskId);
      }
    }

    // Обрабатываем изменения интеллектуально
    processIntelligentRescheduling(changes);

    // Обновляем предыдущее состояние
    previousTasksRef.current = currentTasksMap;

  }, [tasks]);

  // Интеллектуальная обработка перепланирования
  const processIntelligentRescheduling = async (changes: {
    added: Task[];
    deleted: number[];
    timeChanged: Task[];
    statusChanged: Task[];
    unchanged: Task[];
  }) => {
    const { added, deleted, timeChanged, statusChanged } = changes;

    try {
      // 1. Отменяем уведомления для удаленных задач
      if (deleted.length > 0) {
        console.log(`🗑️ Отмена уведомлений для ${deleted.length} удаленных задач`);
        for (const taskId of deleted) {
          try {
            await NotificationService.cancelTaskReminders(taskId);
          } catch (error) {
            console.log(`❌ Ошибка при отмене уведомлений для удаленной задачи ${taskId}:`, error);
          }
        }
      }

      // 2. Планируем новые задачи (только те, которые подходят под условия)
      if (added.length > 0) {
        console.log(`➕ Обработка ${added.length} новых задач`);
        const validNewTasks = added.filter(task =>
          task.status === 'new' &&
          (task.start_date || task.due_date)
        );

        console.log(`📋 ${validNewTasks.length} подходящих новых задач для уведомлений`);

        if (validNewTasks.length > 0) {
          const schedulePromises = validNewTasks.map(async (task) => {
            try {
              const result = await NotificationService.scheduleAllTaskReminders(task);
              return !!result;
            } catch (error) {
              console.log(`❌ Ошибка при планировании уведомлений для новой задачи ${task.id}:`, error);
              return false;
            }
          });

          const results = await Promise.all(schedulePromises);
          const successCount = results.filter(Boolean).length;
          console.log(`✅ Успешно запланировано уведомлений для ${successCount} новых задач`);
        }
      }

    } catch (error) {
      console.log('❌ Критическая ошибка при интеллектуальном перепланировании:', error);
    }
  };

  const { upcomingTasks, allTasksSorted } = useMemo(() => {
    const now = new Date();

    const filtered = tasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.customer?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });

    const upcoming = sorted.filter(task => {
      return task.status === 'new';
    }).map(task => {
      const isOverdue = task.due_date ? new Date(task.due_date) < now : false;
      return {
        ...task,
        isOverdue
      };
    }).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      const dateA = a.start_date ? new Date(a.start_date).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });

    const allTasksWithOverdue = sorted.map(task => {
      const isOverdue = task.status === 'new' && task.due_date ? new Date(task.due_date) < now : false;
      return {
        ...task,
        isOverdue
      };
    });

    return {
      upcomingTasks: upcoming,
      allTasksSorted: allTasksWithOverdue
    };
  }, [tasks, searchQuery]);

  const displayedTasks = showAllTasks ? allTasksSorted : upcomingTasks;

  // Навигация к созданию отчета
  const handleCreateReport = (task: Task) => {
    try {
      router.push({
        pathname: '/(tabs)/(reports)/create-report',
        params: { task: JSON.stringify(task) }
      });
    } catch (error) {
      console.log('❌ Ошибка при навигации к созданию отчета:', error);
      setSnackbarMessage('Ошибка при переходе к созданию отчета');
    }
  };

  // Навигация к просмотру отчета
  const handleViewReport = async (task: Task) => {
    try {
      const report = await getReportByTaskId(task.id);
      if (report) {
        router.push({
          pathname: '/report-detail',
          params: { report: JSON.stringify(report) }
        });
      } else {
        setSnackbarMessage('Отчет для этой задачи не найден');
      }
    } catch (error: any) {
      console.log(`❌ Ошибка при загрузке отчета для задачи ${task.id}:`, error);
      setSnackbarMessage('Ошибка при загрузке отчета: ' + error.message);
    }
  };

  // Навигация к странице комментариев
  const handleViewComments = (task: Task) => {
    try {
      router.push({
        pathname: '/comments',
        params: { task: JSON.stringify(task) }
      });
    } catch (error) {
      console.log('❌ Ошибка при навигации к комментариям:', error);
      setSnackbarMessage('Ошибка при переходе к комментариям');
    }
  };

  // Навигация к странице деталей задачи
  const handleViewTaskDetails = (task: Task) => {
    try {
      router.push({
        pathname: '/detail',
        params: { task: JSON.stringify(task) }
      });
    } catch (error) {
      console.log('❌ Ошибка при навигации к деталям задачи:', error);
      setSnackbarMessage('Ошибка при переходе к деталям задачи');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string, pauseReason?: string) => {
    try {
      await updateTaskStatus(taskId, {
        status: newStatus,
        ...(pauseReason && { pause_reason: pauseReason })
      });
      setSnackbarMessage('Статус задачи обновлен');
    } catch (error: any) {
      console.log(`❌ Ошибка при обновлении статуса задачи ${taskId}:`, error);
      setSnackbarMessage(error.message || 'Ошибка при обновлении статуса задачи');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      setSnackbarMessage('Задача удалена');
    } catch (error: any) {
      console.log(`❌ Ошибка при удалении задачи ${taskId}:`, error);
      setSnackbarMessage(error.message || 'Ошибка при удалении задачи');
    }
  };

  // Навигация к редактированию задачи
  const handleEditTask = (task: Task) => {
    try {
      router.push({
        pathname: '/(tabs)/(1tasks)/edit',
        params: { task: JSON.stringify(task) }
      });
    } catch (error) {
      console.log('❌ Ошибка при навигации к редактированию задачи:', error);
      setSnackbarMessage('Ошибка при переходе к редактированию задачи');
    }
  };

  // Навигация к созданию задачи
  const handleAddTask = () => {
    try {
      router.push('/(tabs)/(1tasks)/create');
    } catch (error) {
      console.log('❌ Ошибка при навигации к созданию задачи:', error);
      setSnackbarMessage('Ошибка при переходе к созданию задачи');
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await NotificationService.cancelAllReminders();
      await logout();
      router.replace('/(auth)');
    } catch (error: any) {
      console.log('❌ Ошибка при выходе из системы:', error);
      setSnackbarMessage('Ошибка при выходе: ' + error.message);
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content
          title={
            showAllTasks
              ? `Все задачи (${allTasksSorted.length})`
              : `Предстоящие задачи (${upcomingTasks.length})`
          }
        />

        <Appbar.Action
          icon="logout"
          onPress={handleLogout}
          disabled={isLoggingOut}
        />
      </Appbar.Header>

      <Searchbar
        placeholder="Поиск задач..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.search}
      />

      <View style={styles.toggleContainer}>
        <Button
          mode={!showAllTasks ? "contained" : "outlined"}
          onPress={() => setShowAllTasks(false)}
          style={styles.toggleButton}
          labelStyle={{
            fontSize: 18,
            fontWeight: '600',
            lineHeight: 24,
          }}
        >
          Новые ({upcomingTasks.length})
        </Button>
        <Button
          mode={showAllTasks ? "contained" : "outlined"}
          onPress={() => setShowAllTasks(true)}
          style={styles.toggleButton}
          labelStyle={{
            fontSize: 18,
            fontWeight: '600',
            lineHeight: 24,
          }}>
          Все ({allTasksSorted.length})
        </Button>
      </View>

      <TaskList
        tasks={displayedTasks}
        onDeleteTask={handleDeleteTask}
        onUpdateTaskStatus={handleUpdateTaskStatus}
        onEditTask={handleEditTask}
        onAddTask={handleAddTask}
        onCreateReport={handleCreateReport}
        onViewReport={handleViewReport}
        onViewComments={handleViewComments}
        onViewTaskDetails={handleViewTaskDetails}
        isLoading={isLoading}
      />

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarMessage(''),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};