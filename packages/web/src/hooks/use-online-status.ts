import { onlineManager } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';

function subscribeToOnlineStatus(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);

  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  useEffect(() => {
    onlineManager.setOnline(isOnline);
  }, [isOnline]);

  return isOnline;
}

export { useOnlineStatus };
