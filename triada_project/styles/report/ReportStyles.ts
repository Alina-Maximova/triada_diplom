import { StyleSheet } from 'react-native';

export const ReportStyles = (theme: any) => StyleSheet.create({
  // Основные стили контейнера
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Стили для поиска
  search: {
    margin: 16,
    marginTop: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },

  // Стили для состояний загрузки и пустого состояния
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
    flexWrap: 'wrap', // Для переноса текста
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.outline,
    textAlign: 'center',
    lineHeight: 20,
    flexWrap: 'wrap', // Для переноса текста
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    flexWrap: 'wrap', // Для переноса текста
  },

  // Стили для списка
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },

  // Стили карточки отчета
  reportCard: {
    marginBottom: 12,
    marginHorizontal: 8,
  },
  
  // Первая строка: дата и действия
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    flexWrap: 'wrap', // Для переноса текста
  },
  menuButton: {
    margin: 0,
  },
  
  // Вторая строка: заголовок задачи
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportIcon: {
    marginRight: 8,
  },
  reportTitle: {
    flex: 1,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 16,
    flexWrap: 'wrap', // Для переноса текста
  },
  
  // Третья строка: краткая информация
  previewInfo: {
    marginBottom: 8,
  },
  previewText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    flexWrap: 'wrap', // Для переноса текста
  },
  
  // Четвертая строка: ссылка на полный отчет
  viewReportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  viewReportText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
    flexWrap: 'wrap', // Для переноса текста
  },
  
  // Индикатор загрузки при удалении
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  deletingText: {
    color: 'white',
    fontWeight: 'bold',
    flexWrap: 'wrap', // Для переноса текста
  },
});