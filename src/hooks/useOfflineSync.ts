import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  STORAGE_KEYS,
  OFFLINE_SYNC_MAX_RETRIES,
  OFFLINE_SYNC_BASE_DELAY_MS
} from '@/lib/constants';

// Helper for browser-compatible UUID generation
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export type QueuedOperation = {
  id: string;
  type: 'task' | 'subtask' | 'project' | 'area';
  action: 'create' | 'update' | 'delete' | 'toggle';
  payload: Record<string, any>;
  timestamp: number;
  retryCount?: number; // Track retry attempts
};


// Helper for exponential backoff delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useOfflineSync() {
  const { toast } = useToast();
  const isProcessing = useRef(false);

  const getQueue = useCallback((): QueuedOperation[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const saveQueue = useCallback((queue: QueuedOperation[]) => {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, JSON.stringify(queue));
  }, []);

  const addToQueue = useCallback((operation: Omit<QueuedOperation, 'id' | 'timestamp'>) => {
    const queue = getQueue();
    const newOp: QueuedOperation = {
      ...operation,
      id: generateUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newOp);
    saveQueue(queue);
    return newOp.id;
  }, [getQueue, saveQueue]);

  const removeFromQueue = useCallback((id: string) => {
    const queue = getQueue();
    saveQueue(queue.filter(op => op.id !== id));
  }, [getQueue, saveQueue]);

  const updateOperationRetryCount = useCallback((id: string, retryCount: number) => {
    const queue = getQueue();
    const updatedQueue = queue.map(op =>
      op.id === id ? { ...op, retryCount } : op
    );
    saveQueue(updatedQueue);
  }, [getQueue, saveQueue]);

  const clearQueue = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
  }, []);

  const getPendingCount = useCallback(() => {
    return getQueue().length;
  }, [getQueue]);

  const processQueue = useCallback(async (
    handlers: {
      onTaskCreate?: (payload: any) => Promise<void>;
      onTaskUpdate?: (payload: any) => Promise<void>;
      onTaskDelete?: (payload: any) => Promise<void>;
      onTaskToggle?: (payload: any) => Promise<void>;
      onSubtaskCreate?: (payload: any) => Promise<void>;
      onSubtaskToggle?: (payload: any) => Promise<void>;
      onSubtaskDelete?: (payload: any) => Promise<void>;
    }
  ) => {
    if (isProcessing.current || !navigator.onLine) return;

    // Clone queue at start to prevent concurrent modification issues
    const queueSnapshot = [...getQueue()];
    if (queueSnapshot.length === 0) return;

    isProcessing.current = true;
    let successCount = 0;
    let failCount = 0;
    let permanentFailCount = 0;

    for (const op of queueSnapshot) {
      const currentRetryCount = op.retryCount || 0;

      try {
        if (op.type === 'task') {
          if (op.action === 'create' && handlers.onTaskCreate) {
            await handlers.onTaskCreate(op.payload);
          } else if (op.action === 'update' && handlers.onTaskUpdate) {
            await handlers.onTaskUpdate(op.payload);
          } else if (op.action === 'delete' && handlers.onTaskDelete) {
            await handlers.onTaskDelete(op.payload);
          } else if (op.action === 'toggle' && handlers.onTaskToggle) {
            await handlers.onTaskToggle(op.payload);
          }
        } else if (op.type === 'subtask') {
          if (op.action === 'create' && handlers.onSubtaskCreate) {
            await handlers.onSubtaskCreate(op.payload);
          } else if (op.action === 'toggle' && handlers.onSubtaskToggle) {
            await handlers.onSubtaskToggle(op.payload);
          } else if (op.action === 'delete' && handlers.onSubtaskDelete) {
            await handlers.onSubtaskDelete(op.payload);
          }
        }
        removeFromQueue(op.id);
        successCount++;
      } catch (error) {
        console.error('Failed to sync operation:', op, error);

        if (currentRetryCount >= OFFLINE_SYNC_MAX_RETRIES) {
          // Max retries exceeded - remove from queue and count as permanent failure
          console.error(`Operation ${op.id} exceeded max retries, removing from queue`);
          removeFromQueue(op.id);
          permanentFailCount++;
        } else {
          // Increment retry count and apply exponential backoff delay
          const newRetryCount = currentRetryCount + 1;
          updateOperationRetryCount(op.id, newRetryCount);

          // Exponential backoff: 1s, 2s, 4s
          const backoffDelay = OFFLINE_SYNC_BASE_DELAY_MS * Math.pow(2, currentRetryCount);
          await delay(backoffDelay);

          failCount++;
        }
      }
    }

    isProcessing.current = false;

    if (successCount > 0) {
      toast({
        title: 'Synced offline changes',
        description: `${successCount} change${successCount > 1 ? 's' : ''} synced successfully`,
      });
    }

    if (failCount > 0) {
      toast({
        title: 'Some changes failed to sync',
        description: `${failCount} change${failCount > 1 ? 's' : ''} will retry later`,
        variant: 'destructive',
      });
    }

    if (permanentFailCount > 0) {
      toast({
        title: 'Changes could not be synced',
        description: `${permanentFailCount} change${permanentFailCount > 1 ? 's' : ''} failed after multiple retries`,
        variant: 'destructive',
      });
    }
  }, [getQueue, removeFromQueue, updateOperationRetryCount, toast]);

  return {
    addToQueue,
    removeFromQueue,
    clearQueue,
    getQueue,
    getPendingCount,
    processQueue,
  };
}
