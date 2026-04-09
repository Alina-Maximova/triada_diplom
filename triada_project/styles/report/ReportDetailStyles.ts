import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const ReportDetailStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spacer: {
    height: 20,
  },
  divider: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  
  // Заголовок
  headerCard: {
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  reportTitle: {
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    flex: 1,
    marginLeft: 8,
  },
  
  // Кнопки действий
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
  },
  
  // Секции
  sectionCard: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  
  // Информационные строки
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
  
  // Описание
  descriptionText: {
    lineHeight: 22,
  },
  
  // Медиа файлы
  mediaSection: {
    marginTop: 16,
  },
  mediaStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  mediaChip: {
    marginRight: 8,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  mediaGridItem: {
    width: (screenWidth - 40) / 3,
    height: (screenWidth - 40) / 3,
    position: 'relative',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant,
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    padding: 2,
  },
  mediaNumber: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoTypeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,59,48,0.9)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  videoTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noMediaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noMediaText: {
    marginTop: 12,
    color: theme.colors.outline,
    textAlign: 'center',
  },
  
  // Модальное окно для медиа
  mediaModal: {
    flex: 1,
    backgroundColor: 'black',
  },
  mediaModalHeader: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  mediaContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  mediaFullscreen: {
    width: '100%',
    height: '100%',
  },
  videoPlayerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  statusContainer:{
    width: '100%',

  }
});