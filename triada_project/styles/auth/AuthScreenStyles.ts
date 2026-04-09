import { StyleSheet } from 'react-native';

export const AuthScreenStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  demoCard: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  input: {
    marginBottom: 16,
    fontSize: 22,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonLabel: {
    fontSize: 18, // Стиль для текста кнопки
    fontWeight: '600',
  },
});