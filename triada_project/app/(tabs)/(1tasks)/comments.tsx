import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {
  Appbar,
  Text,
  TextInput,
  Button,
  IconButton,
  Card,
  ActivityIndicator,
  Divider,
  useTheme,
  Snackbar,
  Chip,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import VideoPlayer from 'react-native-video';
import { Task, Comment } from '@/types/index';
import { useComments } from '@/hooks/useComments';
import { useTasks } from '@/hooks/useTasks';
import { fileService } from '@/services/file';
import { CacheService } from '@/services/cacheService';
import { STORAGE_KEYS } from '@/constants';
import { CommentPageStyles } from '@/styles/comment/CommentPageStyles';

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
const deduplicateAssets = (newAssets: any[], existingAssets: MediaAsset[]): any[] => {
  return newAssets.filter(newItem => !existingAssets.some(existing => existing.id === newItem.id));
};

interface MediaAsset {
  uri: string;
  id: string;
  fileName?: string;
  type: 'image' | 'video' | 'document';
  size?: number;
  mimeType?: string; // сохраняем MIME-тип из picker
}

// ============================================================
// Компонент отображения файлов комментария
// ============================================================
const CommentFiles = ({ commentId, onMediaPress }: { commentId: number; onMediaPress: (file: any) => void }) => {
  const theme = useTheme();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      setAuthToken(token);
    };
    loadToken();
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const commentFiles = await fileService.getEntityFiles('comment', commentId);
      setFiles(commentFiles);
    } catch (error) {
      if (error?.message?.includes('Network Error') || error?.code === 'ERR_NETWORK') {
        // игнорируем ошибки сети
      } else {
        console.error('Error loading comment files:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture-as-pdf';
    if (mimeType.startsWith('video/')) return 'videocam';
    return 'insert-drive-file';
  };

  if (loading) return <ActivityIndicator size="small" style={{ margin: 8 }} />;
  if (files.length === 0) return null;

  return (
    <View style={{ marginTop: 8 }}>
      <Divider style={{ marginVertical: 8 }} />
      <Text variant="labelSmall" style={{ marginBottom: 4 }}>Прикреплённые файлы:</Text>
      {files.map(file => {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        const fileUrl = fileService.getFileUrl('comment', file.filename);
        const mediaSource = authToken ? {
          uri: fileUrl,
          headers: { Authorization: `Bearer ${authToken}` },
        } : { uri: fileUrl };

        return (
          <TouchableOpacity
            key={file.id}
            onPress={() => onMediaPress(file)}
            style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}
          >
            {isImage ? (
              <Image source={mediaSource} style={{ width: 100, height: 100, borderRadius: 4, marginRight: 8 }} />
            ) : isVideo ? (
              <View style={{ position: 'relative', width: 40, height: 40, marginRight: 8 }}>
                <Image source={mediaSource} style={{ width: 40, height: 40, borderRadius: 4 }} />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                  <MaterialIcons name="play-circle-filled" size={24} color="white" />
                </View>
              </View>
            ) : (
              <MaterialIcons name={getFileIcon(file.mimetype)} size={24} color={theme.colors.primary} style={{ marginRight: 8 }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============================================================
// Основной компонент CommentsPage
// ============================================================
export default function CommentsPage() {
  const theme = useTheme();
  const styles = CommentPageStyles(theme);
  const { task: taskParam } = useLocalSearchParams();
  const taskData = taskParam ? JSON.parse(taskParam as string) as Task : null;
  
  const { task, loadTask } = useTasks();
  const { comments, isLoading, error, refreshComments, addComment, deleteComment } = useComments();
  
  const [newComment, setNewComment] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState<any | null>(null);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);

  useEffect(() => {
    loadTaskData();
  }, []);

  useEffect(() => {
    if (task) loadComments();
  }, [task]);

  const loadTaskData = async () => {
    if (!taskData) return;
    try {
      await loadTask(taskData.id);
    } catch (error) {
      console.error('Error loading task:', error);
      setSnackbarMessage('Ошибка загрузки данных задачи');
    }
  };

  const loadComments = async () => {
    if (!task) return;
    try {
      await refreshComments(task.id);
    } catch (error) {
      console.error('Error loading comments:', error);
      setSnackbarMessage('Ошибка загрузки комментариев');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTaskData(), loadComments()]);
    setRefreshing(false);
  }, [task]);

  // ========== Обработка выбора файлов с оптимизацией и правильным MIME ==========
  const handleSelectedAssets = async (assets: any[]) => {
    const newAssets: MediaAsset[] = assets.map(asset => {
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
        mimeType: mimeType,
      };
    });

    const uniqueNewAssets = deduplicateAssets(newAssets, selectedAssets);
    if (uniqueNewAssets.length > 0) {
      setSelectedAssets(prev => [...prev, ...uniqueNewAssets]);
      setSnackbarMessage(`Добавлено ${uniqueNewAssets.length} файлов`);
    } else {
      setSnackbarMessage('Эти файлы уже добавлены');
    }
  };

  // Выбор из галереи
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
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

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        const docs = result.assets.map(asset => ({
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

  const removeSelectedAsset = (index: number) => {
    setSelectedAssets(prev => prev.filter((_, i) => i !== index));
  };

  // ========== Загрузка файлов на сервер (пакетная) ==========
  const uploadSelectedFiles = async (commentId: number) => {
    if (selectedAssets.length === 0) return;

    const filesToUpload = selectedAssets.map(asset => {
      // Используем сохранённый mimeType, если есть, иначе fallback
      const mimeType = asset.mimeType || getMimeTypeFromFileName(asset.fileName || 'file');
      return {
        uri: asset.uri,
        name: asset.fileName || `file-${Date.now()}`,
        type: mimeType,
      };
    });

    const descriptions = selectedAssets.map(() => newComment.trim() || null);

    await fileService.uploadMultipleFiles(
      filesToUpload,
      task!.id,
      'comment',
      commentId,
      descriptions
    );
  };

  // ========== Добавление комментария ==========
  const handleSubmitComment = async () => {
    if (!task || (!newComment.trim() && selectedAssets.length === 0)) {
      Alert.alert('Ошибка', 'Введите комментарий или выберите файлы');
      return;
    }

    let createdCommentId: number | null = null;

    try {
      setIsSubmitting(true);
      const isConnected = await CacheService.isConnected();

      const commentResult = await addComment({
        task_id: task.id,
        content: newComment.trim() || '(вложения)'
      });

      createdCommentId = commentResult.id;

      if (selectedAssets.length > 0) {
        await uploadSelectedFiles(createdCommentId);
        setSelectedAssets([]);
      }

      setNewComment('');
      setSnackbarMessage('Комментарий добавлен');

      if (isConnected) {
        await refreshComments(task.id);
      } else {
        setSnackbarMessage('Комментарий сохранён локально и будет отправлен при появлении интернета');
      }
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Error adding comment or files:', error);
      if (createdCommentId) {
        try {
          await deleteComment(createdCommentId);
          console.log('Комментарий удалён из-за ошибки загрузки файлов');
        } catch (deleteError) {
          console.error('Не удалось удалить комментарий после ошибки:', deleteError);
        }
      }
      setSnackbarMessage('Ошибка добавления комментария');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== Форматирование даты ==========
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Сегодня в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Вчера в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // ========== Открытие медиа ==========
  const handleMediaPress = (file: any) => {
    const isImage = file.mimetype?.startsWith('image/');
    const isVideo = file.mimetype?.startsWith('video/');
    if (isImage || isVideo) {
      setSelectedMediaFile(file);
      setMediaModalVisible(true);
    } else {
      Alert.alert('Открытие файла', 'Открыть файл во внешнем приложении?', [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Открыть',
          onPress: () => {
            const url = fileService.getFileUrl('comment', file.filename);
            Linking.openURL(url).catch(() => Alert.alert('Ошибка', 'Не удалось открыть файл'));
          }
        }
      ]);
    }
  };

  const closeMediaModal = () => {
    setMediaModalVisible(false);
    setSelectedMediaFile(null);
  };

  // ========== Рендер комментария ==========
  const renderComment = (comment: Comment, index: number) => (
    <Card key={comment.id} style={styles.commentCard}>
      <Card.Content>
        <View style={styles.commentHeader}>
          <View style={styles.commentUserInfo}>
            {comment.user_name && (
              <Text variant="titleSmall" style={styles.commentAuthor}>
                {comment.user_name}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.commentDate}>
              {formatDate(comment.created_at)}
            </Text>
          </View>
        </View>
        <Text variant="bodyMedium" style={styles.commentContent}>
          {comment.content}
        </Text>
        <CommentFiles commentId={comment.id} onMediaPress={handleMediaPress} />
      </Card.Content>
      {index < comments.length - 1 && <Divider style={styles.commentDivider} />}
    </Card>
  );

  const renderTaskInfo = () => (
    <Card style={styles.taskCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.taskTitle} numberOfLines={2}>
          {task?.title}
        </Text>
        <View style={styles.taskDetails}>
          <View style={styles.taskDetailRow}>
            <Text variant="bodySmall" style={styles.taskDetailLabel}>Заказчик:</Text>
            <Text variant="bodyMedium" style={styles.taskDetailValue}>{task?.customer}</Text>
          </View>
          <View style={styles.taskDetailRow}>
            <Text variant="bodySmall" style={styles.taskDetailLabel}>Статус:</Text>
            <Text variant="bodyMedium" style={[styles.taskDetailValue]}>
              {task?.status === 'new' ? 'Новая' :
               task?.status === 'in_progress' ? 'В работе' :
               task?.status === 'completed' ? 'Выполнена' :
               task?.status === 'paused' ? 'На паузе' :
               task?.status === 'report_added' ? 'Добавлен отчет' :
               task?.status === 'accepted_by_customer' ? 'Принято заказчиком' :
               task?.status === 'rejected' ? 'Отклонено заказчиком' : task?.status}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="chat-outline" size={48} iconColor={theme.colors.outline} disabled />
      <Text variant="titleMedium" style={styles.emptyTitle}>Нет комментариев</Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Будьте первым, кто оставит комментарий к этой задаче
      </Text>
    </View>
  );

  const renderFilePickerPanel = () => (
    <View style={{ padding: 16, backgroundColor: theme.colors.surfaceVariant }}>
      <Text variant="titleMedium">Прикрепить файлы</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
        <Button mode="outlined" onPress={pickFromGallery} icon="image-multiple" compact>Галерея</Button>
        <Button mode="outlined" onPress={takePhoto} icon="camera" compact>Фото</Button>
        <Button mode="outlined" onPress={recordVideo} icon="video" compact>Видео</Button>
        <Button mode="outlined" onPress={pickDocument} icon="file-document" compact>Документы</Button>
      </View>

      {selectedAssets.length > 0 && (
        <View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <Chip icon="image"> {selectedAssets.filter(a => a.type === 'image').length}</Chip>
            <Chip icon="video"> {selectedAssets.filter(a => a.type === 'video').length}</Chip>
            <Chip icon="file-document"> {selectedAssets.filter(a => a.type === 'document').length}</Chip>
          </View>

          {selectedAssets.map((asset, idx) => (
            <View key={asset.id} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
              <MaterialIcons name={
                asset.type === 'image' ? 'image' :
                asset.type === 'video' ? 'videocam' : 'insert-drive-file'
              } size={16} color={theme.colors.primary} />
              <Text style={{ flex: 1, marginLeft: 4 }} numberOfLines={1}>{asset.fileName || 'Файл'}</Text>
              <IconButton icon="close" size={14} onPress={() => removeSelectedAsset(idx)} />
            </View>
          ))}
        </View>
      )}

      <Button onPress={() => setShowFilePicker(false)}>Готово</Button>
    </View>
  );

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Комментарии" />
          <Appbar.Action icon="refresh" onPress={onRefresh} disabled={refreshing} />
        </Appbar.Header>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {renderTaskInfo()}

          <View style={styles.commentsHeader}>
            <Text variant="titleMedium" style={styles.commentsTitle}>
              Комментарии ({comments.length})
            </Text>
          </View>

          {isLoading && !refreshing ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button mode="outlined" onPress={loadComments} style={styles.retryButton}>
                Повторить
              </Button>
            </View>
          ) : comments.length > 0 ? (
            <View style={styles.commentsList}>
              {comments.map((comment, index) => renderComment(comment, index))}
            </View>
          ) : (
            renderEmptyState()
          )}
          
          <View style={{ height: 80 }} />
        </ScrollView>

        <View style={{ backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
          <View style={{ padding: 8 }}>
            <TextInput
              label="Новый комментарий"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={3}
              maxLength={500}
              mode="outlined"
              placeholder="Введите ваш комментарий..."
              disabled={isSubmitting}
              style={{ marginBottom: 8 }}
            />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button
                mode="text"
                onPress={() => setShowFilePicker(!showFilePicker)}
                icon="paperclip"
                disabled={isSubmitting}
              >
                {selectedAssets.length > 0 ? `Файлы (${selectedAssets.length})` : ''}
              </Button>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {newComment.length}/500
              </Text>
              <Button
                mode="contained"
                onPress={handleSubmitComment}
                loading={isSubmitting}
                disabled={(!newComment.trim() && selectedAssets.length === 0) || isSubmitting}
                icon="send"
              >
                Отправить
              </Button>
            </View>

            {showFilePicker && renderFilePickerPanel()}
          </View>
        </View>

        <Snackbar
          visible={!!snackbarMessage}
          onDismiss={() => setSnackbarMessage('')}
          duration={3000}
          action={{ label: 'OK', onPress: () => setSnackbarMessage('') }}
        >
          {snackbarMessage}
        </Snackbar>

        <Modal
          visible={mediaModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeMediaModal}
        >
          <View style={{ flex: 1, backgroundColor: 'black' }}>
            <Appbar.Header style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <Appbar.BackAction onPress={closeMediaModal} iconColor="white" />
              <Appbar.Content
                title={selectedMediaFile?.mimetype?.startsWith('image/') ? 'Просмотр фото' : 'Просмотр видео'}
                titleStyle={{ color: 'white' }}
              />
            </Appbar.Header>
            {selectedMediaFile && (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {selectedMediaFile.mimetype?.startsWith('image/') ? (
                  <Image
                    source={{ uri: fileService.getFileUrl('comment', selectedMediaFile.filename) }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                ) : (
                  <VideoPlayer
                    source={{ uri: fileService.getFileUrl('comment', selectedMediaFile.filename) }}
                    style={{ width: '100%', height: '100%' }}
                    controls={true}
                    resizeMode="contain"
                    paused={false}
                  />
                )}
              </View>
            )}
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}