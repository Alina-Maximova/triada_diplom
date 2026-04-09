// styles/task/TaskListStyles.ts
import { StyleSheet } from 'react-native';

export const TaskListStyles = (theme: any) => StyleSheet.create({
  // Основные стили контейнера
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: 16,
  },

  // Стили для карточки задачи
  taskCard: {
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Стили для заголовка карточки
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  // Стили для строки статусов
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },

  // Стили для кнопок действий
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },

  // Стили для заголовка задачи
  taskTitle: {
    flex: 1,
    marginBottom: 8,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },

  // Стили для чипов - ИСПРАВЛЕНО
  statusChip: {
    height: 40,
    borderWidth: 1,
    justifyContent: 'center',
  },
  overdueChip: {
    height: 40, // Выровнено с statusChip
    borderWidth: 1,
    borderColor: theme.colors.error,
    justifyContent: 'center',
  },
  reportChip: {
    height: 40, // Выровнено с statusChip
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
  },

  chipText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

  // Контент стили для правильного выравнивания
  chipContent: {
    paddingHorizontal: 8,
    paddingVertical: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Стили для информации о задаче
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  phoneText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 6,
    fontSize: 14,
    flex: 1,
    color: theme.colors.onSurfaceVariant,
  },

  // Стили для дат
  datesContainer: {
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    marginLeft: 6,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },

  // Остальные существующие стили...
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  dateChip: {
    height: 40, // Выровнено с statusChip
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
  },
  reminderChip: {
    height: 40, // Выровнено с statusChip
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
  },
  idChip: {
    height: 40, // Выровнено с statusChip
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
  },

  // Стили для FAB
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    fontSize:22,
    backgroundColor: theme.colors.primary,
  },

  // Стили для состояний загрузки и пустого списка
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.6,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },

  // Стили для Bottom Sheet
  sheetBackground: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  sheetTitle: {
    flex: 1,
    marginRight: 8,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  sheetContent: {
    flex: 1,
  },
  sheetSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetSectionTitle: {
    marginBottom: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 18,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.onSurface,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginHorizontal: 16,
    opacity: 0.3,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    gap: 8,
  },
  sheetButton: {
    flex: 1,
  },

  // Стили для карты
  mapContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  map: {
    width: '100%',
    height: 200,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Дополнительные стили для информации
  dateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dateLabel: {
    color: theme.colors.outline,
    marginBottom: 2,
    fontSize: 12,
  },
  descriptionText: {
    lineHeight: 22,
    color: theme.colors.onSurface,
    fontSize: 16,
  },
  coordinatesText: {
    marginTop: 6,
    color: theme.colors.outline,
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    color: theme.colors.outline,
    fontSize: 12,
  },
  infoValue: {
    color: theme.colors.onSurface,
    fontSize: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  mapLoadingText: {
    marginTop: 8,
    color: theme.colors.onSurfaceVariant,
  },

  descriptionBox: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  photoItemLarge: {
    marginRight: 16,
    alignItems: 'center',
  },
  photoLarge: {
    width: 280,
    height: 200,
    borderRadius: 16,
    marginBottom: 8,
  },
  photoNumber: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewPhotoButton: {
    marginTop: 8,
  },
});