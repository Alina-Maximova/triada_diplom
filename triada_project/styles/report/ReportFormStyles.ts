import { StyleSheet, Dimensions } from 'react-native';
import { AppTheme } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export const ReportFormStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Информация о задаче
  taskInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  taskTitle: {
    marginBottom: 8,
  },
  taskCustomer: {
    marginBottom: 4,
  },
  taskAddress: {
    color: theme.colors.onSurfaceVariant,
  },
  
  // Поля ввода
  input: {
    marginBottom: 20,
  },
  
  // Секция медиа
  mediaSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  
  // Кнопки медиа
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  
  // Выбранные медиа
  selectedMediaContainer: {
    marginTop: 8,
  },
  mediaStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  mediaChip: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  mediaItem: {
    width: (screenWidth - 64) / 3, // 3 колонки
    height: (screenWidth - 64) / 3,
    margin: 4,
    position: 'relative',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  
  // Видео
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    color: 'white',
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  videoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Кнопка удаления
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error,
    margin: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  
  // Модальное окно видео
  videoModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 1000,
  },
  videoModalHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  videoPlayer: {
    flex: 1,
    backgroundColor: 'black',
  },
  
  // Действия
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});