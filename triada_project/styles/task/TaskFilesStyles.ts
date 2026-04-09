import { StyleSheet } from 'react-native';

export const TaskFilesStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    color: theme.colors.onSurfaceVariant,
  },
  addButton: {
    marginTop: 8,
  },
  addPanel: {
    padding: 16,
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: 8,
  },
  input: {
    marginVertical: 8,
  },
  mediaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  mediaButton: {
    flex: 1,
    minWidth: 100,
  },
  selectedMediaContainer: {
    marginTop: 8,
  },
  mediaStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  mediaChip: {
    margin: 2,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    padding: 4,
    margin: 2,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetName: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  assetSize: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  removeMediaButton: {
    margin: 0,
    backgroundColor: theme.colors.error,
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  fileItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  fileLeft: {
    width: 50,
    height: 50,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceVariant,
  },
  videoThumbContainer: {
    position: 'relative',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
  },
  fileIcon: {
    width: 50,
    textAlign: 'center',
  },
  fileMiddle: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileMeta: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
});