import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Modal,
} from 'react-native';
import {
  Appbar,
  Text,
  Button,
  IconButton,
  useTheme,
  Snackbar,
  Chip,
  TextInput,
  Divider,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import VideoPlayer from 'react-native-video';
import { useLocalSearchParams, router } from 'expo-router';
import { Task } from '@/types';
import { fileService } from '@/services/file';
import { TaskFilesStyles } from '@/styles/task/TaskFilesStyles';

interface FileItem {
  id: number;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  description?: string;
  created_at: string;
  entity_type: string;
}

interface MediaAsset {
  uri: string;
  id: string;
  fileName?: string;
  type: 'image' | 'video' | 'document';
  size?: number;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
}

// Вспомогательная функция для определения MIME-типа по расширению (fallback)
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

// Дедупликация
const deduplicateAssets = (newAssets: MediaAsset[], existingAssets: MediaAsset[]): MediaAsset[] => {
  return newAssets.filter(newItem => !existingAssets.some(existing => existing.id === newItem.id));
};

export default function TaskFilesScreen() {
  const theme = useTheme();
  const styles = TaskFilesStyles(theme);
  const { task: taskParam } = useLocalSearchParams();
  const taskData = taskParam ? JSON.parse(taskParam as string) as Task : null;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [newFileDescription, setNewFileDescription] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  
  const [selectedMedia, setSelectedMedia] = useState<FileItem | null>(null);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);

  useEffect(() => {
    if (taskData) loadFiles();
  }, []);

  const loadFiles = async () => {
    if (!taskData) return;
    try {
      setIsLoading(true);
      const taskFiles = await fileService.getTaskFiles(taskData.id);
      setFiles(taskFiles);
    } catch (error) {
      console.error('Error loading task files:', error);
      setSnackbarMessage('Не удалось загрузить файлы');
    } finally {
      setIsLoading(false);
    }
  };

  // Запрос разрешений
  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  // Выбор из галереи
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
      handleSelectedAssets(result.assets);
    }
  };

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
      handleSelectedAssets(result.assets);
    }
  };

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
      handleSelectedAssets(result.assets);
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
          type: 'document' as const,
          size: asset.size,
          mimeType: asset.mimeType,
        }));
        handleSelectedAssets(docs);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать документ');
    }
  };

  const handleSelectedAssets = (assets: any[]) => {
    const newAssets: MediaAsset[] = assets.map(asset => {
      let type: 'image' | 'video' | 'document' = asset.type;
      let fileName = asset.fileName || `media-${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`;
      let mimeType = asset.mimeType;

      if (asset.type === 'document') {
        type = 'document';
        fileName = asset.name;
        mimeType = asset.mimeType;
      }

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
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
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

  const removeSelectedAsset = (index: number) => {
    setSelectedAssets(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!taskData || selectedAssets.length === 0) return;

    setIsUploading(true);
    try {
      const filesToUpload = selectedAssets.map(asset => {
        const mimeType = asset.mimeType || getMimeTypeFromFileName(asset.fileName || 'file');
        return {
          uri: asset.uri,
          name: asset.fileName,
          type: mimeType,
        };
      });

      const descriptions = selectedAssets.map(() => newFileDescription || null);

      const uploaded = await fileService.uploadMultipleFiles(
        filesToUpload,
        taskData.id,
        'info',
        taskData.id,
        descriptions
      );

      setFiles(prev => [...uploaded, ...prev]);
      setSelectedAssets([]);
      setNewFileDescription('');
      setShowAddPanel(false);
      setSnackbarMessage(`Загружено ${uploaded.length} файлов`);
    } catch (error) {
      console.error('Error uploading files:', error);
      setSnackbarMessage('Ошибка загрузки файлов');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelAdd = () => {
    setSelectedAssets([]);
    setNewFileDescription('');
    setShowAddPanel(false);
  };

  const handleDeleteFile = (fileId: number) => {
    Alert.alert(
      'Удаление файла',
      'Вы уверены, что хотите удалить этот файл?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await fileService.deleteFile(fileId);
              setFiles(prev => prev.filter(f => f.id !== fileId));
              setSnackbarMessage('Файл удалён');
            } catch (error) {
              console.error('Error deleting file:', error);
              setSnackbarMessage('Ошибка удаления файла');
            }
          },
        },
      ]
    );
  };

  const openFile = (file: FileItem) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (isImage || isVideo) {
      setSelectedMedia(file);
      setMediaModalVisible(true);
    } else {
      Alert.alert('Открытие файла', 'Открыть файл во внешнем приложении?', [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Открыть',
          onPress: async () => {
            const url = fileService.getFileUrl(file.entity_type, file.filename);
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) Linking.openURL(url);
            else Alert.alert('Ошибка', 'Не удалось открыть файл');
          },
        },
      ]);
    }
  };

  const closeMediaModal = () => {
    setMediaModalVisible(false);
    setSelectedMedia(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getAssetIcon = (type: string) => {
    if (type === 'image') return 'image';
    if (type === 'video') return 'videocam';
    return 'insert-drive-file';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture-as-pdf';
    if (mimeType.startsWith('video/')) return 'videocam';
    return 'insert-drive-file';
  };

  const renderFileItem = ({ item }: { item: FileItem }) => {
    const isImage = item.mimetype.startsWith('image/');
    const isVideo = item.mimetype.startsWith('video/');

    return (
      <TouchableOpacity onPress={() => openFile(item)}>
        <View style={styles.fileItemContainer}>
          <View style={styles.fileLeft}>
            {isImage ? (
              <Image
                source={{ uri: fileService.getFileUrl(item.entity_type, item.filename) }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : isVideo ? (
              <View style={styles.videoThumbContainer}>
                <Image
                  source={{ uri: fileService.getFileUrl(item.entity_type, item.filename) }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.playOverlay}>
                  <MaterialIcons name="play-circle-filled" size={24} color="white" />
                </View>
              </View>
            ) : (
              <MaterialIcons
                name={getFileIcon(item.mimetype)}
                size={32}
                color={theme.colors.primary}
                style={styles.fileIcon}
              />
            )}
          </View>
          <View style={styles.fileMiddle}>
            <Text numberOfLines={1} style={styles.fileName}>
              {item.originalname}
            </Text>
            <Text style={styles.fileMeta}>
              {formatFileSize(item.size)}
              {item.description ? ` • ${item.description}` : ''}
            </Text>
          </View>
          <IconButton icon="delete" size={20} onPress={() => handleDeleteFile(item.id)} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddPanel = () => (
    <View style={styles.addPanel}>
      <Text variant="titleMedium">Добавление файлов</Text>
      <TextInput
        label="Описание (необязательно)"
        value={newFileDescription}
        onChangeText={setNewFileDescription}
        mode="outlined"
        style={styles.input}
      />

      <View style={styles.mediaButtons}>
        <Button mode="outlined" onPress={pickFromGallery} icon="image-multiple" style={styles.mediaButton} disabled={isUploading}>Галерея</Button>
        <Button mode="outlined" onPress={takePhoto} icon="camera" style={styles.mediaButton} disabled={isUploading}>Фото</Button>
        <Button mode="outlined" onPress={recordVideo} icon="video" style={styles.mediaButton} disabled={isUploading}>Видео</Button>
        <Button mode="outlined" onPress={pickDocument} icon="file-document" style={styles.mediaButton} disabled={isUploading}>Документы</Button>
      </View>

      {selectedAssets.length > 0 && (
        <View style={styles.selectedMediaContainer}>
          <View style={styles.mediaStats}>
            <Chip icon="image" style={styles.mediaChip}>Фото: {selectedAssets.filter(a => a.type === 'image').length}</Chip>
            <Chip icon="video" style={styles.mediaChip}>Видео: {selectedAssets.filter(a => a.type === 'video').length}</Chip>
            <Chip icon="file-document" style={styles.mediaChip}>Документы: {selectedAssets.filter(a => a.type === 'document').length}</Chip>
          </View>

          <View style={styles.mediaContainer}>
            {selectedAssets.map((asset, index) => (
              <View key={asset.id} style={styles.mediaItem}>
                <View style={styles.assetInfo}>
                  <MaterialIcons name={getAssetIcon(asset.type)} size={16} color={theme.colors.primary} />
                  <Text style={styles.assetName} numberOfLines={1}>{asset.fileName || 'Файл'}</Text>
                  {asset.size && <Text style={styles.assetSize}> ({(asset.size / 1024).toFixed(1)} KB)</Text>}
                </View>
                <IconButton icon="close" size={14} style={styles.removeMediaButton} onPress={() => removeSelectedAsset(index)} iconColor="white" />
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.addActions}>
        <Button onPress={cancelAdd} disabled={isUploading}>Отмена</Button>
        <Button mode="contained" onPress={uploadFiles} loading={isUploading} disabled={isUploading || selectedAssets.length === 0}>Загрузить</Button>
      </View>
    </View>
  );

  if (!taskData) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
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
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={`Файлы задачи: ${taskData.title}`} />
        <Appbar.Action icon="plus" onPress={() => setShowAddPanel(true)} disabled={isUploading} />
      </Appbar.Header>

      <FlatList
        data={files}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFileItem}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          !showAddPanel ? (
            <View style={styles.center}>
              <MaterialIcons name="attach-file" size={64} color={theme.colors.outline} />
              <Text variant="bodyLarge" style={styles.emptyText}>Нет прикреплённых файлов</Text>
              <Button mode="contained" onPress={() => setShowAddPanel(true)} style={styles.addButton}>Добавить файл</Button>
            </View>
          ) : null
        }
        ListHeaderComponent={showAddPanel ? renderAddPanel() : null}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={loadFiles}
      />

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
              title={selectedMedia?.mimetype?.startsWith('image/') ? 'Просмотр фото' : 'Просмотр видео'}
              titleStyle={{ color: 'white' }}
            />
          </Appbar.Header>
          {selectedMedia && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {selectedMedia.mimetype?.startsWith('image/') ? (
                <Image
                  source={{ uri: fileService.getFileUrl(selectedMedia.entity_type, selectedMedia.filename) }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              ) : (
                <VideoPlayer
                  source={{ uri: fileService.getFileUrl(selectedMedia.entity_type, selectedMedia.filename) }}
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