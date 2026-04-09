import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Modal, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native';
import {
  Appbar,
  Text,
  IconButton,
  useTheme,
  Divider,
  ActivityIndicator,
  Snackbar,
  Chip,
  Button,
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import VideoPlayer from 'react-native-video';
import { Report } from '@/types/index';
import { useReports } from '@/hooks/useReports';
import { ReportDetailStyles } from '@/styles/report/ReportDetailStyles';
import { fileService } from '@/services/file';

export default function ReportDetailPage() {
  const theme = useTheme();
  const styles = ReportDetailStyles(theme);
  const { report: reportParam } = useLocalSearchParams();
  const reportData = reportParam ? JSON.parse(reportParam as string) as Report : null;
  
  const { getReportByTaskId, isLoading: isReportLoading } = useReports();
  
  const [report, setReport] = useState<Report | null>(reportData);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    if (!reportData) return;
    try {
      setIsLoading(true);
      let freshReport: Report | null = null;
      if (reportData.task_id) {
        freshReport = await getReportByTaskId(reportData.task_id);
      }
      if (freshReport) {
        setReport(freshReport);
      } else {
        setSnackbarMessage('Отчет не найден');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setSnackbarMessage('Ошибка загрузки отчета: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  const openMedia = (file: any) => {
    const isImage = file.mimetype?.startsWith('image/');
    const isVideo = file.mimetype?.startsWith('video/');
    if (isImage || isVideo) {
      setSelectedMedia(file);
      setMediaType(isImage ? 'image' : 'video');
      setMediaModalVisible(true);
    } else {
      // Для документов предлагаем открыть через браузер
      Alert.alert('Открытие файла', 'Открыть файл во внешнем приложении?', [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Открыть', 
          onPress: () => {
            const url = fileService.getFileUrl('report', file.filename);
            Linking.openURL(url).catch(() => 
              Alert.alert('Ошибка', 'Не удалось открыть файл')
            );
          }
        }
      ]);
    }
  };

  const closeMediaModal = () => {
    setMediaModalVisible(false);
    setSelectedMedia(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture-as-pdf';
    if (mimeType?.startsWith('video/')) return 'videocam';
    return 'insert-drive-file';
  };

  const renderMediaGrid = () => {
    if (!report?.files || report.files.length === 0) {
      return (
        <View style={styles.noMediaContainer}>
          <MaterialIcons name="photo" size={48} color={theme.colors.outline} />
          <Text variant="bodyMedium" style={styles.noMediaText}>Нет файлов</Text>
        </View>
      );
    }

    const images = report.files.filter(f => f.mimetype?.startsWith('image/'));
    const videos = report.files.filter(f => f.mimetype?.startsWith('video/'));
    const documents = report.files.filter(f => !f.mimetype?.startsWith('image/') && !f.mimetype?.startsWith('video/'));

    return (
      <View style={styles.mediaSection}>
        {(images.length > 0 || videos.length > 0 || documents.length > 0) && (
          <View style={styles.mediaStats}>
            {images.length > 0 && <Chip icon="image" style={styles.mediaChip}>Фото: {images.length}</Chip>}
            {videos.length > 0 && <Chip icon="video" style={styles.mediaChip}>Видео: {videos.length}</Chip>}
            {documents.length > 0 && <Chip icon="file-document" style={styles.mediaChip}>Документы: {documents.length}</Chip>}
          </View>
        )}
        <Text variant="titleLarge" style={styles.sectionTitle}>Файлы ({report.files.length})</Text>
        <View style={styles.mediaGrid}>
          {report.files.map((file, index) => {
            const isImage = file.mimetype?.startsWith('image/');
            const isVideo = file.mimetype?.startsWith('video/');
            const fileUrl = fileService.getFileUrl('report', file.filename);
            return (
              <TouchableOpacity key={file.id} style={styles.mediaGridItem} onPress={() => openMedia(file)}>
                {isImage ? (
                  <View style={styles.mediaContainer}>
                    <Image source={{ uri: fileUrl }} style={styles.mediaThumbnail} resizeMode="cover" />
                    <View style={styles.mediaNumber}><Text style={styles.mediaNumberText}>{index + 1}</Text></View>
                  </View>
                ) : isVideo ? (
                  <View style={styles.videoContainer}>
                    <Image source={{ uri: fileUrl }} style={styles.videoThumbnail} resizeMode="cover" />
                    <View style={styles.videoOverlay}>
                      <MaterialIcons name="play-circle-filled" size={40} color="white" />
                    </View>
                    <View style={styles.mediaNumber}><Text style={styles.mediaNumberText}>{index + 1}</Text></View>
                    <View style={styles.videoBadge}><MaterialIcons name="videocam" size={12} color="white" /></View>
                  </View>
                ) : (
                  <View style={styles.documentContainer}>
                    <MaterialIcons name={getFileIcon(file.mimetype)} size={40} color={theme.colors.primary} />
                    <Text style={styles.documentName} numberOfLines={2}>{file.originalname}</Text>
                    <Text style={styles.documentSize}>{formatFileSize(file.size)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const handleViewTask = () => {
    if (report?.task_id) {
      const minimalTask = {
        id: report.task_id,
        title: report.task_title || 'Задача',
        description: report.task_description || '',
        customer: report.customer || '',
        address: report.address || '',
        phone: report.phone || '',
        status: report.task_status || 'completed',
        start_date: report.start_date || '',
        due_date: report.due_date || '',
        created_at: report.created_at || '',
        updated_at: report.updated_at || ''
      };
      router.push({ pathname: '/(tabs)/(1tasks)/detail', params: { task: JSON.stringify(minimalTask) } });
    } else {
      setSnackbarMessage('Информация о задаче не найдена');
    }
  };

  if (isLoading || isReportLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Загрузка..." />
        </Appbar.Header>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16 }}>Загружаем информацию об отчете...</Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Ошибка" />
        </Appbar.Header>
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
          <Text style={{ marginTop: 16 }}>Отчет не найден</Text>
          <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 16 }}>Назад</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Детали отчета" />
        <Appbar.Action icon="refresh" onPress={onRefresh} disabled={refreshing} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        <View style={styles.headerCard}>
          <Text variant="headlineSmall" style={styles.reportTitle}>Отчет по задаче</Text>
          <View style={styles.taskTitleRow}>
            <MaterialIcons name="assignment" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.taskTitle}>{report.task_title || 'Название задачи не указано'}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Button mode="outlined" onPress={handleViewTask} style={styles.actionButton} icon="format-list-bulleted">
            Перейти к задаче
          </Button>
        </View>

        <Divider style={styles.divider} />

        {report.task_description && (
          <>
            <View style={styles.sectionCard}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Описание задачи</Text>
              <Text variant="bodyLarge" style={styles.descriptionText}>{report.task_description}</Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {report.description && (
          <>
            <View style={styles.sectionCard}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Описание выполненной работы</Text>
              <Text variant="bodyLarge" style={styles.descriptionText}>{report.description}</Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        <View style={styles.sectionCard}>
          {renderMediaGrid()}
        </View>

        <View style={styles.sectionCard}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Информация об отчете</Text>
          {report.created_at && (
            <View style={styles.infoRow}>
              <MaterialIcons name="create" size={18} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelMedium" style={styles.infoLabel}>Создан:</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{formatDate(report.created_at)}</Text>
            </View>
          )}
          {report.updated_at && (
            <View style={styles.infoRow}>
              <MaterialIcons name="update" size={18} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelMedium" style={styles.infoLabel}>Обновлен:</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{formatDate(report.updated_at)}</Text>
            </View>
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <Modal visible={mediaModalVisible} transparent={true} animationType="fade" onRequestClose={closeMediaModal}>
        <View style={styles.mediaModal}>
          <Appbar.Header style={styles.mediaModalHeader}>
            <Appbar.BackAction onPress={closeMediaModal} iconColor="white" />
            <Appbar.Content title={selectedMedia?.type === 'image' ? 'Просмотр фото' : 'Просмотр видео'} titleStyle={{ color: 'white' }} />
          </Appbar.Header>
          {selectedMedia && (
            <View style={styles.mediaContent}>
              {selectedMedia.mimetype?.startsWith('image/') ? (
                <Image
                  source={{ uri: fileService.getFileUrl('report', selectedMedia.filename) }}
                  style={styles.mediaFullscreen}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.videoPlayerContainer}>
                  <VideoPlayer
                    source={{ uri: fileService.getFileUrl('report', selectedMedia.filename) }}
                    style={styles.videoPlayer}
                    controls={true}
                    resizeMode="contain"
                    paused={false}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage('')} duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}