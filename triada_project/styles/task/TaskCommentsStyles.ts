// styles/task/TaskCommentsStyles.ts
import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const TaskCommentsStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // Стили для шторки комментариев
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
  sheetTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  sheetTitle: {
    flex: 1,
    marginRight: 8,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  sheetSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  sheetContent: {
    flex: 1,
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

  // Стили для списка комментариев
  commentsListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  commentsHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  commentsCount: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  commentItem: {
    paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  commentDate: {
    color: theme.colors.onSurfaceVariant,
  },
  commentText: {
    color: theme.colors.onBackground,
    lineHeight: 20,
  },
  pauseReasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 4,
    backgroundColor: `${theme.colors.error}15`,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pauseReasonText: {
    color: theme.colors.error,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  commentDivider: {
    marginTop: 12,
    backgroundColor: theme.colors.outline,
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCommentsTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyCommentsText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});