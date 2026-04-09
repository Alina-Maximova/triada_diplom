import { StyleSheet } from 'react-native';

export const CommentPageStyles = (theme: any) => StyleSheet.create({
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
  
  // Карточка задачи
  taskCard: {
    margin: 16,
    marginBottom: 8,
  },
  taskTitle: {
    marginBottom: 12,
  },
  taskDetails: {
    gap: 4,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDetailLabel: {
    color: theme.colors.onSurfaceVariant,
    marginRight: 8,
    width: 80,
  },
  taskDetailValue: {
    flex: 1,
  },
  
  // Статусы
  statusNew: {
    color: theme.colors.status.new,
  },
  statusInProgress: {
    color: theme.colors.status.inProgress,
  },
  statusCompleted: {
    color: theme.colors.status.completed,
  },
  statusOther: {
    color: theme.colors.onSurfaceVariant,
  },
    statusError: {
    color: theme.colors.status.paused,
  },
  
  // Заголовок комментариев
  commentsHeader: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  commentsTitle: {
    fontWeight: '600',
  },
  
  // Список комментариев
  commentsList: {
    paddingHorizontal: 16,
  },
  commentCard: {
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: '600',
  },
  commentDate: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  commentContent: {
    lineHeight: 20,
  },
  commentDivider: {
    marginVertical: 8,
  },
  
  // Состояние загрузки
  loader: {
    marginTop: 40,
  },
  
  // Ошибка
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  
  // Пустое состояние
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.onSurfaceVariant,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  
  // Ввод комментария
  inputContainer: {
    padding: 16,
    paddingTop: 20,
  },
  commentInput: {
    marginBottom: 12,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    color: theme.colors.onSurfaceVariant,
  },
  submitButton: {
    minWidth: 120,
  },
  
  // Отступ
  spacer: {
    height: 20,
  },
});