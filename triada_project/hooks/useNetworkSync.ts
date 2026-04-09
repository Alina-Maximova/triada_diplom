import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { SyncQueueService } from '@/services/syncQueueService';

export const useNetworkSync = (onAfterSync?: () => void) => {
  const syncInProgress = useRef(false);

  useEffect(() => {
    const sync = async () => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      try {
        await SyncQueueService.processQueue();
        onAfterSync?.();
      } finally {
        syncInProgress.current = false;
      }
    };

    // Первичный вызов
    sync();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        sync();
      }
    });

    return unsubscribe;
  }, [onAfterSync]);
};