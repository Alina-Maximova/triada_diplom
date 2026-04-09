import { StyleSheet } from 'react-native';

export const YandexMapPickerStyles = (theme: any) => StyleSheet.create({
  modal: {
    backgroundColor: theme.colors.background,
    margin: 10,
    borderRadius: 12,
    maxHeight: '95%',
    padding: 0,
    overflow: 'hidden',
  },
  title: {
    textAlign: 'center',
    margin: 16,
    marginBottom: 12,
    color: theme.colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  currentLocationButton: {
    justifyContent: 'center',
  },
  mapContainer: {
    height: 350,
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    color: theme.colors.onSurfaceVariant,
  },
  locationInfo: {
    margin: 16,
    marginTop: 12,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  locationTitle: {
    color: theme.colors.primary,
    marginBottom: 8,
  },
  address: {
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  coords: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  buttons: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    gap: 8,
  },
  button: {
    flex: 1,
  },
});