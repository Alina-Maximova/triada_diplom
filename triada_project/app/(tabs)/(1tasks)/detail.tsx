import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Linking,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Appbar,
  Text,
  Button,
  IconButton,
  Card,
  ActivityIndicator,
  useTheme,
  Snackbar,
  Chip,
  Menu,
  Portal,
  Dialog,
  Badge,
  TextInput,
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Task, Report } from '@/types/index';
import { useTasks } from '@/hooks/useTasks';
import { useReports } from '@/hooks/useReports';
import { useComments } from '@/hooks/useComments';
import { TaskDetailStyles } from '@/styles/task/TaskDetailStyles';
import { AppTheme } from '@/constants/theme';
import { fileService } from '@/services/file';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// HTML для Яндекс Карт
const getMapHTML = (coordinates: { lat: number; lon: number } | null, taskTitle?: string, taskAddress?: string) => {
  if (!coordinates) return '';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Местоположение задачи</title>
    <script src="https://api-maps.yandex.ru/2.1/?apikey=7f66d4c8-981a-4b98-b4b0-8bef0dae0b1c&lang=ru_RU"></script>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
        #map { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        ymaps.ready(init);
        
        function init() {
            const map = new ymaps.Map('map', {
                center: [${coordinates.lat}, ${coordinates.lon}],
                zoom: 15,
                controls: ['zoomControl', 'fullscreenControl']
            });
            
            const placemark = new ymaps.Placemark([${coordinates.lat}, ${coordinates.lon}], {
                balloonContentHeader: '${taskTitle || 'Местоположение'}',
                balloonContentBody: '${taskAddress || 'Адрес не указан'}',
                balloonContentFooter: 'Координаты: ${coordinates.lat.toFixed(6)}, ${coordinates.lon.toFixed(6)}'
            }, {
                preset: 'islands#redIcon',
                draggable: false
            });
            
            map.geoObjects.add(placemark);
            
            // Открываем балун при загрузке
            placemark.balloon.open();
        }
    </script>
</body>
</html>
`;
};

// Функция для получения данных статуса
const getStatusData = (status: string, theme: AppTheme) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Выполнено',
        color: theme.colors.status.completed,
        icon: 'check-circle',
        backgroundColor: theme.colors.status.completedContainer
      };
    case 'in_progress':
      return {
        label: 'В работе',
        color: theme.colors.status.inProgress,
        icon: 'progress-clock',
        backgroundColor: theme.colors.status.inProgressContainer
      };
    case 'paused':
      return {
        label: 'На паузе',
        color: theme.colors.status.paused,
        icon: 'pause-circle',
        backgroundColor: theme.colors.status.pausedContainer
      };
    case 'report_added':
      return {
        label: 'Добавлен отчет',
        color: theme.colors.status.reportAdded,
        icon: 'file-document',
        backgroundColor: theme.colors.status.reportAddedContainer
      };
    case 'accepted_by_customer':
      return {
        label: 'Принято заказчиком',
        color: theme.colors.status.accepted,
        icon: 'account-check',
        backgroundColor: theme.colors.status.acceptedContainer
      };
    case 'rejected':
      return {
        label: 'Отклонено заказчиком',
        color: theme.colors.status.rejected,
        icon: 'account-cancel',
        backgroundColor: theme.colors.status.rejectedContainer
      };
    case 'new':
    default:
      return {
        label: 'Новая',
        color: theme.colors.status.new,
        icon: 'clock-outline',
        backgroundColor: theme.colors.status.newContainer
      };
  }
};

// Функция для проверки возможности изменения статуса
const canChangeStatus = (currentStatus: string, newStatus: string): boolean => {
  if (currentStatus === 'completed' || currentStatus === 'accepted_by_customer') {
    return false;
  }

  if (currentStatus === 'new') {
    return newStatus === 'in_progress' || newStatus === 'paused';
  }

  if (currentStatus === 'in_progress') {
    return newStatus === 'completed' || newStatus === 'paused';
  }

  if (currentStatus === 'paused') {
    return newStatus === 'in_progress' || newStatus === 'completed';
  }

  if (currentStatus === 'report_added') {
    return newStatus === 'accepted_by_customer' || newStatus === 'rejected';
  }
  if (currentStatus === 'rejected') {
    return newStatus === 'in_progress';
  }

  return false;
};

// Функция для получения доступных статусов
const getAvailableStatuses = (currentStatus: string): string[] => {
  if (currentStatus === 'completed' || currentStatus === 'accepted_by_customer') {
    return [];
  }

  if (currentStatus === 'new') {
    return ['in_progress', 'paused'];
  }

  if (currentStatus === 'in_progress') {
    return ['completed', 'paused'];
  }

  if (currentStatus === 'paused') {
    return ['in_progress', 'completed'];
  }

  if (currentStatus === 'rejected') {
    return ['in_progress'];
  }
  if (currentStatus === 'report_added') {
    return ['accepted_by_customer', 'rejected'];
  }

  return [];
};

// Функция для проверки, нужно ли искать отчет для задачи
const shouldLoadReport = (taskStatus: string): boolean => {
  const reportStatuses = ['report_added', 'accepted_by_customer'];
  return reportStatuses.includes(taskStatus);
};

// Тип для накладной (расширенный)
interface Invoice {
  filename: string;
  originalname?: string;
  type: string;
  size?: number;
}

export default function TaskDetailPage() {
  const theme = useTheme() as AppTheme;
  const styles = TaskDetailStyles(theme);
  const { task: taskParam } = useLocalSearchParams();
  const taskData = taskParam ? JSON.parse(taskParam as string) as Task : null;

  const {
    task,
    loadTask,
    updateTaskStatus,
    deleteTask,
    isLoading: isTasksLoading,
    error: tasksError
  } = useTasks();

  const { getReportByTaskId } = useReports();
  const { comments, refreshComments, addComment } = useComments();

  const [report, setReport] = useState<Report | null>(null);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ newStatus: string } | null>(null);
  const [pauseDialogVisible, setPauseDialogVisible] = useState(false);
  const [pauseReason, setPauseReason] = useState('');

  // Состояния для накладной
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

  // Вспомогательные функции для отображения файлов
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture-as-pdf';
    if (mimeType?.startsWith('video/')) return 'videocam';
    return 'insert-drive-file';
  };

  const getFileExtension = (filename?: string) => {
    if (!filename) return 'ФАЙЛ';
    return filename.split('.').pop()?.toUpperCase() || 'ФАЙЛ';
  };

  const getReadableFilename = (filename?: string) => {
    if (!filename) return '';
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    return nameWithoutExt || filename;
  };

  // Загружаем данные задачи и комментариев
  useEffect(() => {
    loadTaskData();
  }, []);

  useEffect(() => {
    if (task) {
      if (shouldLoadReport(task.status)) {
        loadReport();
      } else {
        setReport(null);
      }
      loadComments();

      // Загружаем накладную если она есть
      if (task.has_invoice && task.invoice) {
        setInvoice({
          filename: task.invoice.filename,
          originalname: task.invoice.originalname,
          type: task.invoice.type,
          size: task.invoice.size,
        });
      } else {
        setInvoice(null);
      }
    }
  }, [task]);

  const loadTaskData = async () => {
    if (!taskData) return;

    try {
      setIsLoading(true);
      const freshTask = await loadTask(taskData.id);
    } catch (error: any) {
      console.error('Error loading task:', error);
      setSnackbarMessage(error.message || 'Ошибка загрузки данных задачи');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReport = async () => {
    if (!task) return;

    if (!shouldLoadReport(task.status)) {
      setReport(null);
      return;
    }

    try {
      setIsLoadingReport(true);
      const reportData = await getReportByTaskId(task.id);
      setReport(reportData);
    } catch (error: any) {
      console.error('Error loading report:', error);
      setReport(null);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const loadComments = async () => {
    if (!task) return;

    try {
      await refreshComments(task.id);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTaskData();
    if (task && shouldLoadReport(task.status)) {
      await loadReport();
    }
    await loadComments();
    setRefreshing(false);
  }, [task]);

  // Функция для просмотра накладной (через Linking)
  const handleOpenInvoice = async () => {
    if (!invoice || !invoice.filename) {
      setSnackbarMessage('Файл накладной не найден');
      return;
    }

    try {
      setIsInvoiceLoading(true);
      const url = fileService.getFileUrl('invoice', invoice.filename);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        setSnackbarMessage('Открываю накладную...');
      } else {
        throw new Error('Не удалось открыть файл. Установите приложение для просмотра документов.');
      }
    } catch (error: any) {
      console.error('Error opening invoice:', error);
      setSnackbarMessage(error.message || 'Не удалось открыть накладную');
    } finally {
      setIsInvoiceLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!task) return;

    if (!canChangeStatus(task.status, newStatus)) {
      setStatusMenuVisible(false);
      return;
    }

    if (newStatus === 'paused') {
      setPauseReason('');
      setPendingStatusChange({ newStatus });
      setPauseDialogVisible(true);
    } else {
      setPendingStatusChange({ newStatus });
      setDialogVisible(true);
    }
    setStatusMenuVisible(false);
  };

  const confirmStatusChange = async () => {
    if (!task || !pendingStatusChange) return;

    try {
      setIsLoading(true);
      await updateTaskStatus(task.id, {
        status: pendingStatusChange.newStatus
      });
      await loadTask(task.id);

      if (shouldLoadReport(pendingStatusChange.newStatus)) {
        await loadReport();
      } else {
        setReport(null);
      }

      setSnackbarMessage('Статус задачи обновлен');
      setDialogVisible(false);
      setPendingStatusChange(null);
    } catch (error: any) {
      console.error('Error updating status:', error);
      setSnackbarMessage(error.message || 'Ошибка обновления статуса');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPauseWithReason = async () => {
    if (!task || !pendingStatusChange || !pauseReason.trim()) return;

    try {
      setIsLoading(true);
      console.log(task.id+pendingStatusChange.newStatus)
      await updateTaskStatus(task.id, {
        status: pendingStatusChange.newStatus
      });
      console.log(task.id+pendingStatusChange.newStatus)

      await addComment({
        task_id: task.id,
        content: `Задача поставлена на паузу. Причина: ${pauseReason.trim()}`,
        comment_type: 'system'
      });

      await loadTask(task.id);
      await refreshComments(task.id);

      setSnackbarMessage('Задача поставлена на паузу');
      setPauseDialogVisible(false);
      setPauseReason('');
      setPendingStatusChange(null);
    } catch (error: any) {
      console.error('Error pausing task:', error);
      console.log(error)
      setSnackbarMessage(error.message || 'Ошибка при постановке на паузу'|| error.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = () => {
    if (task) {
      router.push({
        pathname: '/(tabs)/(1tasks)/edit',
        params: { task: JSON.stringify(task) }
      });
    }
  };

  const handleCreateReport = () => {
    if (task) {
      router.push({
        pathname: '/(tabs)/(reports)/create-report',
        params: { task: JSON.stringify(task) }
      });
    }
  };

  const handleViewReport = () => {
    if (report) {
      router.push({
        pathname: '/(tabs)/(reports)/report-detail',
        params: { report: JSON.stringify(report) }
      });
    }
  };

  const handleViewComments = () => {
    if (task) {
      router.push({
        pathname: '/comments',
        params: { task: JSON.stringify(task) }
      });
    }
  };

  const handleCallPhone = () => {
    if (task?.phone) {
      Linking.openURL(`tel:${task.phone}`).catch(err => {
        Alert.alert('Ошибка', 'Не удалось совершить звонок');
        console.error('Error calling phone:', err);
      });
    }
  };

  const handleOpenMap = () => {
    if (task?.latitude && task?.longitude) {
      const url = `https://yandex.ru/maps/?pt=${task.longitude},${task.latitude}&z=15`;
      Linking.openURL(url).catch(err => {
        Alert.alert('Ошибка', 'Не удалось открыть карту');
        console.error('Error opening map:', err);
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    Alert.alert(
      'Удаление задачи',
      `Вы уверены, что хотите удалить задачу "${task.title}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteTask(task.id);
              setSnackbarMessage('Задача удалена');
              router.replace('/(tabs)');
            } catch (error: any) {
              console.error('Error deleting task:', error);
              setSnackbarMessage(error.message || 'Ошибка удаления задачи');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getTaskCoordinates = () => {
    if (!task?.latitude || !task?.longitude) return null;

    try {
      const lat = parseFloat(task.latitude);
      const lng = parseFloat(task.longitude);

      if (isNaN(lat) || isNaN(lng)) return null;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

      return {
        lat: lat,
        lon: lng,
      };
    } catch (error) {
      console.error('Ошибка парсинга координат:', error);
      return null;
    }
  };

  const coordinates = getTaskCoordinates();
  const currentStatusData = task ? getStatusData(task.status, theme) : null;
  const availableStatuses = task ? getAvailableStatuses(task.status) : [];

  if (!task) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Ошибка" />
        </Appbar.Header>
        <View style={styles.center}>
          <Text variant="bodyLarge">Задача не найдена</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Детали задачи" />
        <Appbar.Action
          icon="refresh"
          onPress={onRefresh}
          disabled={refreshing}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Заголовок и статус */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.taskTitle}>
              {task.title}
            </Text>

            <View style={styles.statusRow}>
              {currentStatusData && (
                <Menu
                  visible={statusMenuVisible}
                  onDismiss={() => setStatusMenuVisible(false)}
                  anchor={
                    <Chip
                      mode="outlined"
                      icon={currentStatusData.icon}
                      textStyle={[
                        styles.chipText,
                        { color: currentStatusData.color }
                      ]}
                      style={[
                        styles.statusChip,
                        {
                          borderColor: currentStatusData.color,
                          backgroundColor: currentStatusData.backgroundColor
                        }
                      ]}
                      onPress={() => {
                        if (availableStatuses.length > 0) {
                          setStatusMenuVisible(true);
                        }
                      }}
                      disabled={availableStatuses.length === 0}
                    >
                      {currentStatusData.label}
                    </Chip>
                  }
                >
                  {availableStatuses.includes('in_progress') && (
                    <Menu.Item
                      leadingIcon="progress-clock"
                      onPress={() => handleStatusChange('in_progress')}
                      title="В работу"
                    />
                  )}
                  {availableStatuses.includes('completed') && (
                    <Menu.Item
                      leadingIcon="check-circle"
                      onPress={() => handleStatusChange('completed')}
                      title="Выполнено"
                    />
                  )}
                  {availableStatuses.includes('paused') && (
                    <Menu.Item
                      leadingIcon="pause-circle"
                      onPress={() => handleStatusChange('paused')}
                      title="На паузу"
                    />
                  )}
                  {availableStatuses.includes('accepted_by_customer') && (
                    <Menu.Item
                      leadingIcon="account-check"
                      onPress={() => handleStatusChange('accepted_by_customer')}
                      title="Принято заказчиком"
                    />
                  )}
                </Menu>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Быстрые действия */}
        <View style={styles.quickActions}>
          <View style={{ flex: 1, position: 'relative' }}>
            <Button
              mode="outlined"
              onPress={handleViewComments}
              style={styles.quickActionButton}
              icon="comment-text-multiple"
              compact={true}
            >
              {/* Пустой текст - только иконка */}
            </Button>
            <View style={{
              position: 'absolute',
              top: -5,
              right: -5,
              zIndex: 1,
            }}>
              <Badge
                size={20}
                style={{
                  backgroundColor: theme.colors.primary,
                }}
              >
                {comments.length}
              </Badge>
            </View>
          </View>

          {(task.status === 'new' || task.status === 'in_progress' || task.status === 'paused') && (
            <Button
              mode="outlined"
              onPress={handleEditTask}
              style={styles.quickActionButton}
              icon="pencil"
              compact={true}
            >
              {/* Пустой текст - только иконка */}
            </Button>
          )}

          {task.status === 'completed' && !report && (
            <Button
              mode="contained"
              onPress={handleCreateReport}
              style={styles.quickActionButton}
              icon="file-document"
            >
              Создать
            </Button>
          )}

          {report && (
            <Button
              mode="contained"
              onPress={handleViewReport}
              style={styles.quickActionButton}
              icon="file-eye"
            >
              Просмотреть
            </Button>
          )}

          {/* Кнопка накладной – будет отображаться, если есть накладная */}
          {invoice && (
            <Button
              mode="outlined"
              onPress={handleOpenInvoice}
              style={styles.quickActionButton}
              icon="file-document-outline"
              compact={true}
            />
          )}

          {(task.status === 'new' || task.status === 'in_progress' || task.status === 'paused') && (
            <Button
              mode="outlined"
              onPress={handleDeleteTask}
              style={styles.quickActionButton}
              icon="delete"
              textColor={theme.colors.error}
            />
          )}
          {task.status === 'in_progress' && (
            <Button
              mode="outlined"
              onPress={() => router.push({
                pathname: '/(tabs)/(materials)/add-materials',
                params: { task: JSON.stringify(task) }
              })}
              style={styles.quickActionButton}
              icon="toolbox-outline"
              compact={true}
            />
          )}
          <Button
            mode="outlined"
            onPress={() => {
              router.push({
                pathname: '/(tabs)/(1tasks)/files',
                params: { task: JSON.stringify(task) }
              });
            }}
            style={styles.quickActionButton}
            icon="file-document-multiple"
            compact={true}
          />
        </View>

        {/* Информация о заказчике */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Заказчик
            </Text>

            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={styles.infoText}>
                {task.customer}
              </Text>
            </View>

            {task.phone && (
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.infoText}>
                  {task.phone}
                </Text>
                <IconButton
                  icon="phone"
                  size={20}
                  onPress={handleCallPhone}
                  style={styles.actionIcon}
                />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Описание */}
        {task.description && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Описание
              </Text>
              <Text variant="bodyMedium" style={styles.descriptionText}>
                {task.description}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Накладная – в стиле комментариев */}
        {invoice && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Накладная
              </Text>
              <TouchableOpacity onPress={handleOpenInvoice} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  {invoice.type?.startsWith('image/') ? (
                    <Image
                      source={{ uri: fileService.getFileUrl('invoice', invoice.filename) }}
                      style={{ width: 50, height: 50, borderRadius: 4, marginRight: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons
                      name={getFileIcon(invoice.type)}
                      size={32}
                      color={theme.colors.primary}
                      style={{ marginRight: 12 }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500' }}>
                      { getReadableFilename(invoice.filename)}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                      {getFileExtension(invoice.filename)} {invoice.size ? `• ${formatFileSize(invoice.size)}` : ''}
                    </Text>
                  </View>
                  <Button
                    mode="text"
                    onPress={handleOpenInvoice}
                    loading={isInvoiceLoading}
                    disabled={isInvoiceLoading}
                    icon="eye-outline"
                  />
                </View>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}

        {/* Сроки выполнения */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Сроки выполнения
            </Text>

            {task.start_date && (
              <View style={styles.infoRow}>
                <MaterialIcons name="play-arrow" size={18} color={theme.colors.primary} />
                <View style={styles.dateInfo}>
                  <Text variant="labelMedium" style={styles.dateLabel}>
                    Дата начала
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoText}>
                    {new Date(task.start_date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            )}

            {task.due_date && (
              <View style={styles.infoRow}>
                <MaterialIcons name="flag" size={18} color={theme.colors.error} />
                <View style={styles.dateInfo}>
                  <Text variant="labelMedium" style={styles.dateLabel}>
                    Дата окончания
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoText}>
                    {new Date(task.due_date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Местоположение */}
        {(coordinates || task.address) && (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Местоположение
              </Text>

              {task.address && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={20} color="#007AFF" />
                  <Text variant="bodyLarge" style={styles.infoText}>
                    {task.address}
                  </Text>
                  {coordinates && (
                    <IconButton
                      icon="map"
                      size={20}
                      onPress={handleOpenMap}
                      style={styles.actionIcon}
                    />
                  )}
                </View>
              )}

              {coordinates && (
                <>
                  <Text variant="bodySmall" style={styles.coordinatesText}>
                    Координаты: {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
                  </Text>
                  {task.addressNote && task.addressNote.trim() !== '' && (
                    <Text variant="bodySmall" style={styles.coordinatesText}>
                      Примечание к адресу: {task.addressNote}
                    </Text>
                  )}

                  <View style={styles.mapContainer}>
                    {isMapLoading && (
                      <View style={styles.mapLoadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.mapLoadingText}>Загрузка карты...</Text>
                      </View>
                    )}

                    <WebView
                      ref={webViewRef}
                      source={{ html: getMapHTML(coordinates, task.title, task.address) }}
                      style={styles.map}
                      onLoadEnd={() => setIsMapLoading(false)}
                      onError={(error) => {
                        console.error('WebView error:', error);
                        setIsMapLoading(false);
                      }}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      startInLoadingState={true}
                      scalesPageToFit={true}
                    />
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Информация о создании */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Информация
            </Text>

            {task.created_at && (
              <View style={styles.infoRow}>
                <Text variant="labelSmall" style={styles.infoLabel}>
                  Создана:
                </Text>
                <Text variant="bodySmall" style={styles.infoValue}>
                  {new Date(task.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}

            {task.updated_at && (
              <View style={styles.infoRow}>
                <Text variant="labelSmall" style={styles.infoLabel}>
                  Обновлена:
                </Text>
                <Text variant="bodySmall" style={styles.infoValue}>
                  {new Date(task.updated_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Отдельная кнопка удаления внизу страницы */}
        {(task.status === 'new' || task.status === 'in_progress' || task.status === 'paused') && (
          <Button
            mode="outlined"
            onPress={handleDeleteTask}
            style={styles.deleteButton}
            icon="delete"
            textColor={theme.colors.error}
          >
            Удалить задачу
          </Button>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Диалоговое окно подтверждения изменения статуса */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Icon icon="alert-circle-outline" />
          <Dialog.Title style={{ textAlign: 'center' }}>
            Изменение статуса задачи
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Вы уверены, что хотите изменить статус задачи?
            </Text>
            {pendingStatusChange?.newStatus === 'completed' && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                После выполнения задачи вы сможете создать отчет о проделанной работе.
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Отмена</Button>
            <Button
              mode="contained"
              onPress={confirmStatusChange}
              style={{ marginLeft: 8 }}
              loading={isLoading}
              disabled={isLoading}
            >
              Изменить
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Диалоговое окно для указания причины паузы */}
        <Dialog visible={pauseDialogVisible} onDismiss={() => setPauseDialogVisible(false)}>
          <Dialog.Icon icon="pause-circle" />
          <Dialog.Title style={{ textAlign: 'center' }}>
            Причина постановки на паузу
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              Укажите причину приостановки задачи:
            </Text>
            <TextInput
              value={pauseReason}
              onChangeText={setPauseReason}
              placeholder="Например: Ожидание материалов..."
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPauseDialogVisible(false)}>Отмена</Button>
            <Button
              mode="contained"
              onPress={confirmPauseWithReason}
              style={{ marginLeft: 8 }}
              loading={isLoading}
              disabled={isLoading || !pauseReason.trim()}
            >
              Подтвердить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
}