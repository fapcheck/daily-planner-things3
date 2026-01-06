import { createContext, useContext, useCallback, useRef, ReactNode } from 'react';

type SyncCallback = () => Promise<void>;

interface OfflineSyncContextType {
  registerSyncHandler: (handler: SyncCallback) => void;
  triggerSync: () => void;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | null>(null);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const syncHandlerRef = useRef<SyncCallback | null>(null);

  const registerSyncHandler = useCallback((handler: SyncCallback) => {
    syncHandlerRef.current = handler;
  }, []);

  const triggerSync = useCallback(() => {
    syncHandlerRef.current?.();
  }, []);

  return (
    <OfflineSyncContext.Provider value={{ registerSyncHandler, triggerSync }}>
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSyncContext() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSyncContext must be used within OfflineSyncProvider');
  }
  return context;
}
