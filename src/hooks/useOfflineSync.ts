import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  STORAGE_KEYS,
  OFFLINE_SYNC_MAX_RETRIES,
  OFFLINE_SYNC_BASE_DELAY_MS
} from '@/lib/constants';
import { encryptData, decryptData, isEncrypted } from '@/lib/encryption';

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

  const getQueue = useCallback(async (): Promise<QueuedOperation[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
      if (!stored) return [];

      // Check if data is encrypted and decrypt if needed
      const decrypted = isEncrypted(stored) ? await decryptData(stored) : stored;
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      return [];
    }
  }, []);

  const saveQueue = useCallback(async (queue: QueuedOperation[]) => {
    try {
      const serialized = JSON.stringify(queue);
      const encrypted = await encryptData(serialized);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, encrypted);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, []);

  const addToQueue = useCallback(async (operation: Omit<QueuedOperation, 'id' | 'timestamp'>) => {
    const queue = await getQueue();
    const newOp: QueuedOperation = {
      ...operation,
      id: generateUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newOp);
    await saveQueue(queue);
    return newOp.id;
  }, [getQueue, saveQueue]);

  const removeFromQueue = useCallback(async (id: string) => {
    const queue = await getQueue();
    await saveQueue(queue.filter(op => op.id !== id));
  }, [getQueue, saveQueue]);

  const updateOperationRetryCount = useCallback(async (id: string, retryCount: number) => {
    const queue = await getQueue();
    const updatedQueue = queue.map(op =>
      op.id === id ? { ...op, retryCount } : op
    );
    await saveQueue(updatedQueue);
  }, [getQueue, saveQueue]);

  const clearQueue = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
  }, []);

  const getPendingCount = useCallback(async () => {
    const queue = await getQueue();
    return queue.length;
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

    isProcessing.current = true;

    try {
      // Read queue once at the start
      const queueSnapshot = [...await getQueue()];
      if (queueSnapshot.length === 0) {
        isProcessing.current = false;
        return;
      }

      let successCount = 0;
      let failCount = 0;
      let permanentFailCount = 0;

      // Track which operations to remove
      const opsToRemove: string[] = [];
      const opsToRetry: { id: string; retryCount: number }[] = [];

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

          // Mark for removal
          opsToRemove.push(op.id);
          successCount++;
        } catch (error) {
          console.error('Failed to sync operation:', op, error);

          if (currentRetryCount >= OFFLINE_SYNC_MAX_RETRIES) {
            // Max retries exceeded - remove from queue
            console.error(`Operation ${op.id} exceeded max retries, removing from queue`);
            opsToRemove.push(op.id);
            permanentFailCount++;
          } else {
            // Mark for retry with incremented count
            const newRetryCount = currentRetryCount + 1;
            opsToRetry.push({ id: op.id, retryCount: newRetryCount });

            // Exponential backoff: 1s, 2s, 4s
            const backoffDelay = OFFLINE_SYNC_BASE_DELAY_MS * Math.pow(2, currentRetryCount);
            await delay(backoffDelay);

            failCount++;
          }
        }
      }

      // Atomically update the queue - read once, write once
      if (opsToRemove.length > 0 || opsToRetry.length > 0) {
        const currentQueue = await getQueue();
        let updatedQueue = currentQueue.filter(op => !opsToRemove.includes(op.id));

        // Update retry counts
        updatedQueue = updatedQueue.map(op => {
          const retryUpdate = opsToRetry.find(r => r.id === op.id);
          return retryUpdate ? { ...op, retryCount: retryUpdate.retryCount } : op;
        });

        await saveQueue(updatedQueue);
      }

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
    } finally {
      isProcessing.current = false;
    }
  }, [getQueue, saveQueue, toast]);

  return {
    addToQueue,
    removeFromQueue,
    clearQueue,
    getQueue,
    getPendingCount,
    processQueue,
  };
}
