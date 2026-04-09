import { StyleSheet } from 'react-native';

export const TaskScreenStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  search: {
    margin: 16,
    marginTop: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
  },
    taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    marginBottom: 8,
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  
});