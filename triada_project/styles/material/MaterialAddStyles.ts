import { StyleSheet } from 'react-native';
import { AppTheme } from '@/constants/theme';

export const MaterialAddStyles = (theme: AppTheme) => StyleSheet.create({
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
  
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  
  errorSubtext: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  
  backButton: {
    marginTop: 16,
  },
  
  infoCard: {
    margin: 16,
    marginBottom: 8,
  },
  
  sectionTitle: {
    marginBottom: 16,
    color: theme.colors.primary,
  },
  
  taskInfo: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  
  formCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  
  modeButton: {
    flex: 1,
  },
  
  materialSelectButton: {
    marginBottom: 16,
    height: 56,
    justifyContent: 'center',
  },
  
  materialSelectContent: {
    height: '100%',
  },
  
  materialMenu: {
    maxHeight: 400,
    width: '80%',
    marginTop: 50,
  },
  
  materialMenuScroll: {
    maxHeight: 350,
  },
  
  menuSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  
  menuSearchInput: {
    marginBottom: 0,
  },
  
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  
  selectedMenuItem: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  
  menuChip: {
    marginLeft: 8,
    height: 24,
  },
  
  menuChipText: {
    fontSize: 12,
  },
  
  menuNoResults: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  menuNoResultsText: {
    marginTop: 8,
    color: theme.colors.onSurfaceVariant,
  },
  
  selectedMaterialInfo: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  
  selectedMaterialContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  selectedMaterialName: {
    fontWeight: '600',
  },
  
  selectedMaterialDesc: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  
  selectedMaterialChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  
  clearSelectionButton: {
    alignSelf: 'flex-end',
  },
  
  input: {
    marginBottom: 16,
  },
  
  unitSection: {
    marginBottom: 16,
  },
  
  label: {
    marginBottom: 8,
    color: theme.colors.onSurfaceVariant,
  },
  
  unitChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  
  unitChip: {
    marginRight: 8,
  },
  
  unitChipText: {
    fontSize: 12,
  },
  
  addToDbButton: {
    marginBottom: 16,
  },
  
  quantityContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  
  quantityInput: {
    marginBottom: 4,
  },
  
  materialUnitHint: {
    position: 'absolute',
    right: 12,
    top: 12,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  
  addButton: {
    marginTop: 8,
  },
  
  materialsCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  
  taskMaterialItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  materialActions: {
    flexDirection: 'row',
  },
  
  materialNote: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 2,
  },
  
  customMaterialTag: {
    color: theme.colors.tertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  
  noMaterialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  
  noMaterialsTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  
  noMaterialsText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  
  retryButton: {
    marginTop: 12,
  },
  
  loader: {
    paddingVertical: 20,
  },
  
  editMaterialName: {
    marginBottom: 16,
    fontWeight: '500',
  },
  
  spacer: {
    height: 20,
  },
});