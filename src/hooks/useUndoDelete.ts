import { useState, useCallback, useRef } from 'react';
import { Task } from '@/types/task';

interface DeletedItem {
  task: Task;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface UseUndoDeleteReturn {
  pendingDeletes: Map<string, DeletedItem>;
  scheduleDelete: (task: Task) => void;
  handleUndo: (taskId: string) => void;
  isPendingDelete: (taskId: string) => boolean;
  cancelAllPending: () => void;
}

export function useUndoDelete(
  onConfirmDelete: (id: string) => Promise<void>,
  onRestore: (task: Task) => void
): UseUndoDeleteReturn {
  const [pendingDeletes, setPendingDeletes] = useState<Map<string, DeletedItem>>(new Map());
  const pendingRef = useRef<Map<string, DeletedItem>>(new Map());

  // Keep ref in sync with state
  pendingRef.current = pendingDeletes;

  const scheduleDelete = useCallback((task: Task) => {
    // Clear any existing timeout for this task
    const existing = pendingRef.current.get(task.id);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }

    // Create a new timeout - delete after 5 seconds if not undone
    const timeoutId = setTimeout(async () => {
      setPendingDeletes(prev => {
        const next = new Map(prev);
        next.delete(task.id);
        return next;
      });
      await onConfirmDelete(task.id);
    }, 5000);

    setPendingDeletes(prev => {
      const next = new Map(prev);
      next.set(task.id, { task, timeoutId });
      return next;
    });
  }, [onConfirmDelete]);

  const handleUndo = useCallback((taskId: string) => {
    const item = pendingRef.current.get(taskId);
    if (item) {
      clearTimeout(item.timeoutId);
      onRestore(item.task);
      setPendingDeletes(prev => {
        const next = new Map(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [onRestore]);

  const isPendingDelete = useCallback((taskId: string) => {
    return pendingRef.current.has(taskId);
  }, []);

  const cancelAllPending = useCallback(() => {
    pendingRef.current.forEach(item => {
      clearTimeout(item.timeoutId);
    });
    setPendingDeletes(new Map());
  }, []);

  return {
    pendingDeletes,
    scheduleDelete,
    handleUndo,
    isPendingDelete,
    cancelAllPending,
  };
}
