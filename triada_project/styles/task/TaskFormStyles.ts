import { StyleSheet } from 'react-native';

export const TaskFormStyles = (theme: any) => StyleSheet.create({
     // Стили для состояний загрузки и пустого списка
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modal: {
    backgroundColor: theme.colors.background,
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  
  },
  scrollView: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.primary,
    fontSize:22,

  },
  input: {
    marginBottom: 8,
    fontSize:22,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
    color: theme.colors.primary,
  },
  error: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: -4,
    marginBottom: 12,
    marginLeft: 8,
  },
  dateError: {
    color: theme.colors.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  phoneInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  phoneHint: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  phoneHintValid: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  phoneValid: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  chip: {
    marginTop: 4,
    width: 'auto',
  },
  errorChip: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.background,
  },
  requiredChip: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: "10%",
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  locationCard: {
    marginBottom: 16,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    color: theme.colors.primary,
  },
  locationAddress: {
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  locationCoords: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  locationButton: {
    flex: 1,
  },
  locationActions: {
    flexDirection: 'row',
  },
  hint: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 8,
  },
  hintValid: {
    color: theme.colors.primary,
  },
  dateTimeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    color: theme.colors.primary,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateTimeField: {
    flex: 1,
  },
  dateTimeChip: {
    width: '100%',
    justifyContent: 'center',
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: theme.colors.surfaceVariant,
  },

});