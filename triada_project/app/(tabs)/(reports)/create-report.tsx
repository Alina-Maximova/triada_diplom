import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Appbar,
  Text,
  TextInput,
  Button,
  useTheme,
  IconButton,
  Snackbar,
  Chip,
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import VideoPlayer from 'react-native-video';
import { useReports } from '@/hooks/useReports';
import { Task } from '@/types';
import { ReportFormStyles } from '@/styles/report/ReportFormStyles';
import { fileService } from '@/services/file';

// ============================================================
// Вспомогательные функции
// ============================================================

// Определение MIME-типа по расширению файла (fallback)
const getMimeTypeFromFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    rtf: 'application/rtf',
  };
  return mimeMap[ext] || 'application/octet-stream';
};

// Дедупликация файлов по id
const deduplicateAssets = (newAssets: MediaAsset[], existingAssets: MediaAsset[]): MediaAsset[] => {
  return newAssets.filter(
    (newItem) => !existingAssets.some((existing) => existing.id === newItem.id)
  );
};

interface MediaAsset {
  uri: string;
  id: string;
  fileName?: string;
  type: 'image' | 'video' | 'document';
  size?: number;
  duration?: number;
  width?: number;
  height?: number;
  mimeType?: string; // сохраняем MIME-тип для корректной загрузки
}

export default function CreateReportScreen() {
  const theme = useTheme();
  const styles = ReportFormStyles(theme);
  const { task: taskParam } = useLocalSearchParams();
  const taskData = taskParam ? (JSON.parse(taskParam as string) as Task) : null;

  const { createReport, deleteReport } = useReports();

  const [description, setDescription] = useState('');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const videoRef = useRef<VideoPlayer>(null);

  // Запрос разрешений
  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  // ========== Обработка выбранных файлов (с MIME-типами) ==========
  const handleSelectedAssets = async (assets: any[]) => {
    const newAssets: MediaAsset[] = assets.map((asset) => {
      let type: 'image' | 'video' | 'document' = asset.type;
      let fileName = asset.fileName || `media-${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`;
      let mimeType = asset.mimeType;

      // Для документов из DocumentPicker
      if (asset.type === 'document') {
        type = 'document';
        fileName = asset.name;
        mimeType = asset.mimeType;
      }

      // Если mimeType отсутствует, определяем по расширению
      if (!mimeType) {
        mimeType = getMimeTypeFromFileName(fileName);
      }

      return {
        uri: asset.uri,
        id: asset.assetId || `media-${Date.now()}-${Math.random()}`,
        fileName: fileName,
        type: type,
        size: asset.size,
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        mimeType: mimeType,
      };
    });

    const uniqueNewAssets = deduplicateAssets(newAssets, mediaAssets);
    if (uniqueNewAssets.length > 0) {
      setMediaAssets((prev) => [...prev, ...uniqueNewAssets]);
      setSnackbarMessage(`Добавлено ${uniqueNewAssets.length} файлов`);
    } else {
      setSnackbarMessage('Эти файлы уже добавлены');
    }
  };

  // Выбор из галереи (фото/видео)
  const pickFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Доступ к медиатеке', 'Необходимо разрешение');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets) {
      await handleSelectedAssets(result.assets);
    }
  };

  // Сделать фото
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Доступ к камере', 'Необходимо разрешение');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets) {
      await handleSelectedAssets(result.assets);
    }
  };

  // Записать видео
  const recordVideo = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Доступ к камере', 'Необходимо разрешение');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
      videoMaxDuration: 60,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets) {
      await handleSelectedAssets(result.assets);
    }
  };

  // Выбор документов (PDF, DOC и т.д.)
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        const docs = result.assets.map((asset) => ({
          uri: asset.uri,
          id: `doc-${Date.now()}-${Math.random()}`,
          name: asset.name,
          type: 'document',
          size: asset.size,
          mimeType: asset.mimeType, // DocumentPicker возвращает mimeType
        }));
        await handleSelectedAssets(docs);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать документ');
    }
  };

  // Удаление выбранного файла перед загрузкой
  const removeMedia = (index: number) => {
    setMediaAssets((prev) => prev.filter((_, i) => i !== index));
  };

  // Воспроизведение видео
  const playVideo = (media: MediaAsset) => {
    if (media.type === 'video') {
      setSelectedMedia(media);
      setVideoModalVisible(true);
    }
  };

  const closeVideoPlayer = () => {
    setVideoModalVisible(false);
    setSelectedMedia(null);
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  // Форматирование длительности видео
  const formatVideoDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ========== Пакетная загрузка файлов ==========
  const uploadReportFiles = async (reportId: number) => {
    if (mediaAssets.length === 0) return;

    const filesToUpload = mediaAssets.map((asset) => {
      // Используем сохранённый mimeType или fallback
      const mimeType =
        asset.mimeType || getMimeTypeFromFileName(asset.fileName || 'file');
      return {
        uri: asset.uri,
        name: asset.fileName || `file-${Date.now()}`,
        type: mimeType,
      };
    });

    const descriptions = mediaAssets.map(() => description.trim() || null);

    await fileService.uploadMultipleFiles(
      filesToUpload,
      taskData!.id,
      'report',        // entityType = 'report'
      reportId,        // entityId = id созданного отчёта
      descriptions
    );
  };

  // ========== Отправка отчёта ==========
  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Внимание', 'Добавьте описание работ');
      return;
    }
    if (!taskData) {
      Alert.alert('Ошибка', 'Задача не найдена');
      return;
    }

    let createdReportId: number | null = null;

    try {
      setIsSubmitting(true);

      // 1. Создаём отчёт (без файлов)
      const reportResult = await createReport({
        task_id: taskData.id,
        description: description.trim(),
      });
      createdReportId = reportResult.report.id; // предполагаем, что сервер возвращает объект с id

      // 2. Загружаем медиафайлы, если есть
      if (mediaAssets.length > 0) {
        setSnackbarMessage(`Загружаем ${mediaAssets.length} файлов...`);
        await uploadReportFiles(createdReportId);
      }

      setSnackbarMessage('Отчет успешно создан');
      setDescription('');
      setMediaAssets([]);
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      console.error('Error submitting report:', error);

      // Если отчёт был создан, но файлы не загрузились – удаляем его
      if (createdReportId) {
        try {
          await deleteReport(createdReportId);
          console.log('Отчет удален из-за ошибки загрузки файлов');
        } catch (deleteError) {
          console.error('Не удалось удалить отчет после ошибки:', deleteError);
        }
      }

      setSnackbarMessage(error.message || 'Не удалось создать отчет');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => router.back();

  if (!taskData) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleCancel} />
          <Appbar.Content title="Ошибка" />
        </Appbar.Header>
        <View style={styles.center}>
          <Text>Задача не найдена</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content title="Создание отчета" />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.taskInfo}>
          <Text variant="titleMedium" style={styles.taskTitle}>
            Задача: {taskData.title}
          </Text>
          <Text variant="bodyMedium" style={styles.taskCustomer}>
            Заказчик: {taskData.customer}
          </Text>
          {taskData.address && (
            <Text variant="bodySmall" style={styles.taskAddress}>
              Адрес: {taskData.address}
            </Text>
          )}
        </View>

        <TextInput
          label="Описание выполненных работ *"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={4}
          maxLength={1000}
          placeholder="Опишите выполненные работы..."
        />

        <View style={styles.mediaSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Медиафайлы ({mediaAssets.length})
          </Text>

          <View style={styles.mediaButtons}>
            <Button
              mode="outlined"
              onPress={pickFromGallery}
              icon="image-multiple"
              style={styles.mediaButton}
              disabled={isSubmitting}
            >
              Галерея
            </Button>
            <Button
              mode="outlined"
              onPress={takePhoto}
              icon="camera"
              style={styles.mediaButton}
              disabled={isSubmitting}
            >
              Фото
            </Button>
            <Button
              mode="outlined"
              onPress={recordVideo}
              icon="video"
              style={styles.mediaButton}
              disabled={isSubmitting}
            >
              Видео
            </Button>
            <Button
              mode="outlined"
              onPress={pickDocument}
              icon="file-document"
              style={styles.mediaButton}
              disabled={isSubmitting}
            >
              Документы
            </Button>
          </View>

          {mediaAssets.length > 0 && (
            <View style={styles.selectedMediaContainer}>
              <View style={styles.mediaStats}>
                <Chip icon="image" style={styles.mediaChip}>
                  Фото: {mediaAssets.filter((m) => m.type === 'image').length}
                </Chip>
                <Chip icon="video" style={styles.mediaChip}>
                  Видео: {mediaAssets.filter((m) => m.type === 'video').length}
                </Chip>
                <Chip icon="file-document" style={styles.mediaChip}>
                  Документы:{' '}
                  {mediaAssets.filter((m) => m.type === 'document').length}
                </Chip>
              </View>
              <View style={styles.mediaContainer}>
                {mediaAssets.map((media, index) => (
                  <View key={media.id} style={styles.mediaItem}>
                    <TouchableOpacity
                      onPress={() =>
                        media.type === 'video' ? playVideo(media) : null
                      }
                    >
                      {media.type === 'image' ? (
                        <Image
                          source={{ uri: media.uri }}
                          style={styles.mediaThumbnail}
                        />
                      ) : media.type === 'video' ? (
                        <View style={styles.videoContainer}>
                          <Image
                            source={{ uri: media.uri }}
                            style={styles.videoThumbnail}
                          />
                          <View style={styles.videoOverlay}>
                            <MaterialIcons
                              name="play-circle-filled"
                              size={40}
                              color="white"
                            />
                            {media.duration && (
                              <Text style={styles.videoDuration}>
                                {formatVideoDuration(media.duration)}
                              </Text>
                            )}
                          </View>
                        </View>
                      ) : (
                        <View style={styles.documentContainer}>
                          <MaterialIcons
                            name="insert-drive-file"
                            size={40}
                            color={theme.colors.primary}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                    <IconButton
                      icon="close"
                      size={14}
                      style={styles.removeMediaButton}
                      onPress={() => removeMedia(index)}
                      iconColor="white"
                    />
                    {media.type === 'video' && (
                      <View style={styles.videoBadge}>
                        <MaterialIcons name="videocam" size={12} color="white" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.button}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={isSubmitting}
            disabled={isSubmitting || !description.trim()}
          >
            {mediaAssets.length > 0
              ? `Создать отчет (${mediaAssets.length})`
              : 'Создать отчет'}
          </Button>
        </View>
      </ScrollView>

      <Modal
        visible={videoModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVideoPlayer}
      >
        <View style={styles.videoModal}>
          <Appbar.Header style={styles.videoModalHeader}>
            <Appbar.BackAction onPress={closeVideoPlayer} iconColor="white" />
            <Appbar.Content
              title="Просмотр видео"
              titleStyle={{ color: 'white' }}
            />
          </Appbar.Header>
          {selectedMedia && (
            <VideoPlayer
              ref={videoRef}
              source={{ uri: selectedMedia.uri }}
              style={styles.videoPlayer}
              controls={true}
              resizeMode="contain"
              paused={false}
            />
          )}
        </View>
      </Modal>

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}