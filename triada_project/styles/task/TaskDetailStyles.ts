import { StyleSheet } from 'react-native';
import { AppTheme } from '@/constants/theme';

export const TaskDetailStyles = (theme: AppTheme) => StyleSheet.create({
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
  
  // Заголовок
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  
  // Заголовок задачи - УВЕЛИЧЕН
  taskTitle: {
    fontSize: 28, // Было 24
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 34,
  },
  
  // Строка заголовка (заголовок + статус)
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  // Строка статуса - отдельная строка под заголовком
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  
  // Чип статуса - увеличен
  statusChip: {
    height: 36, // Было 32
    minHeight: 36,
    paddingHorizontal: 14, // Было 12
    marginRight: 8,
  },
  
  // Текст в чипе статуса - увеличен
  chipText: {
    fontSize: 14, // Было 12
    fontWeight: '600', // Было '500'
  },
  
  // Быстрые действия - иконки в ряд
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    gap: 12,
  },

  // Контейнер для иконки с бейджем
  iconButtonContainer: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Иконка быстрого действия
  iconButton: {
    margin: 0,
    width: 40,
    height: 40,
  },
  
  // Бейдж на иконке
  iconBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
  },
  
  // Кнопка быстрого действия (альтернативный вариант)
  quickActionButton: {
    flex: 1,
    minWidth: 0,
  },
  
  // Бейдж для кнопки (альтернативный вариант)
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.primary,
  },
  
  // Карточки с информацией
  infoCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  
  // Заголовок секции - УВЕЛИЧЕН
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20, // Добавлено
    fontWeight: '600', // Добавлено
    color: theme.colors.primary, // Добавлено для выделения
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  // Текст информации - УВЕЛИЧЕН
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16, // Добавлено
    lineHeight: 22, // Добавлено
  },
  
  actionIcon: {
    margin: 0,
    marginLeft: 8,
  },
  
  // Описание - УВЕЛИЧЕН
  descriptionText: {
    lineHeight: 24, // Было 22
    fontSize: 16, // Добавлено
  },
  
  // Даты
  dateInfo: {
    flex: 1,
    marginLeft: 8,
  },
  
  // Метка даты - УВЕЛИЧЕНА
  dateLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 15, // Добавлено
  },
  
  // Координаты и карта
  coordinatesText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: 12,
    fontSize: 15, // Добавлено
  },
  
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Текст загрузки карты - УВЕЛИЧЕН
  mapLoadingText: {
    marginTop: 8,
    color: theme.colors.onSurfaceVariant,
    fontSize: 16, // Добавлено
  },
  
  // Информация о создании - УВЕЛИЧЕНА
  infoLabel: {
    color: theme.colors.onSurfaceVariant,
    width: 100, // Было 80
    fontSize: 15, // Добавлено
  },
  
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15, // Добавлено
  },
  
  // Кнопка удаления
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderColor: theme.colors.error,
  },
  
  // Отступ
  spacer: {
    height: 20,
  },
  
  // Стили для кнопки с бейджем (альтернативный вариант)
  buttonWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  
  buttonBadge: {
    position: 'absolute',
    right: 8,
    top: -8,
    backgroundColor: theme.colors.primary,
    height: 24,
    minWidth: 24,
  },
  
  buttonBadgeText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Контейнер для строки с кнопками действий
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  
  // Кнопка в строке действий
  actionButton: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  
  // Дополнительные стили для увеличения текста в кнопках
  buttonLabel: {
    fontSize: 16, // Увеличенный шрифт для кнопок
    fontWeight: '600',
  },
  
  // Увеличенный текст для важной информации
  importantText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  
  // Увеличенный текст для подписей
  captionText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});