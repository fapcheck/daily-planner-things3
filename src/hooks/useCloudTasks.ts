import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Task, ViewType, Subtask, Project, Area, Tag } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { COMPLETION_DELAY_MS } from '@/lib/constants';
import { logSupabaseError, formatErrorMessage } from '@/lib/supabase-utils';
import { sanitizeTaskTitle, sanitizeTaskNotes, sanitizeName, sanitizeColor } from '@/lib/sanitize';

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

export function useCloudTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToQueue, processQueue, getPendingCount } = useOfflineSync();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  const [recentlyCompletedTasks, setRecentlyCompletedTasks] = useState<Set<string>>(new Set());
  const completionTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup completion timers on unmount
  useEffect(() => {
    return () => {
      completionTimersRef.current.forEach(timer => clearTimeout(timer));
      completionTimersRef.current.clear();
    };
  }, []);

  const setTaskLoading = useCallback((taskId: string, isLoading: boolean) => {
    setLoadingTasks(prev => {
      const next = new Set(prev);
      if (isLoading) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

  const isTaskLoading = useCallback((taskId: string) => {
    return loadingTasks.has(taskId);
  }, [loadingTasks]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setProjects([]);
      setAreas([]);
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch areas
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .order('created_at', { ascending: true });

      if (areasError) throw areasError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (projectsError) throw projectsError;

      // Fetch tasks with subtasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, subtasks(*)')
        .order('position', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: true });

      if (tagsError) throw tagsError;

      // Fetch task_tags to map tags to tasks
      const { data: taskTagsData, error: taskTagsError } = await supabase
        .from('task_tags')
        .select('task_id, tag_id');

      if (taskTagsError) throw taskTagsError;

      // Create a map of task_id to tag_ids
      const taskTagMap = new Map<string, string[]>();
      taskTagsData?.forEach(tt => {
        const existing = taskTagMap.get(tt.task_id) || [];
        existing.push(tt.tag_id);
        taskTagMap.set(tt.task_id, existing);
      });

      // Create a map of tag_id to tag
      const tagMap = new Map<string, Tag>();
      tagsData?.forEach(t => {
        tagMap.set(t.id, { id: t.id, name: t.name, color: t.color });
      });

      setTags(tagsData?.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
      })) || []);

      setAreas(areasData?.map(a => ({
        id: a.id,
        name: a.name,
        color: a.color,
      })) || []);

      setProjects(projectsData?.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        areaId: p.area_id || undefined,
      })) || []);

      setTasks(tasksData?.map(t => {
        const tagIds = taskTagMap.get(t.id) || [];
        const taskTags = tagIds.map(id => tagMap.get(id)).filter(Boolean) as Tag[];

        return {
          id: t.id,
          title: t.title,
          notes: t.notes || undefined,
          completed: t.completed,
          completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
          createdAt: new Date(t.created_at),
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
          area: t.area_id || undefined,
          project: t.project_id || undefined,
          when: t.when as Task['when'],
          recurrenceType: t.recurrence_type as Task['recurrenceType'],
          recurrenceInterval: t.recurrence_interval || undefined,
          tags: taskTags,
          subtasks: t.subtasks
            ?.sort((a: any, b: any) => a.position - b.position)
            .map((s: any) => ({
              id: s.id,
              title: s.title,
              completed: s.completed,
            })) || [],
        };
      }) || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Task operations
  const addTask = useCallback(async (title: string, view: ViewType, dueDate?: Date, projectId?: string, areaId?: string) => {
    if (!user) return;

    // Sanitize input
    const sanitizedTitle = sanitizeTaskTitle(title);
    if (!sanitizedTitle) {
      toast({ title: 'Invalid task title', variant: 'destructive' });
      return;
    }

    const when = view === 'inbox' ? null :
      view === 'today' ? 'today' :
        view === 'someday' ? 'someday' : null;

    // Optimistic update with temp ID
    const tempId = `temp-${generateUUID()}`;
    const tempTask: Task = {
      id: tempId,
      title: sanitizedTitle,
      completed: false,
      createdAt: new Date(),
      dueDate,
      project: projectId,
      area: areaId,
      when: when as Task['when'],
      subtasks: [],
    };

    setTasks(prev => [tempTask, ...prev]);

    // If offline, queue the operation
    if (!navigator.onLine) {
      addToQueue({
        type: 'task',
        action: 'create',
        payload: { tempId, title: sanitizedTitle, dueDate: dueDate?.toISOString(), projectId, areaId, when },
      });
      toast({ title: 'Task saved offline', description: 'Will sync when back online' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: sanitizedTitle,
          due_date: dueDate?.toISOString(),
          project_id: projectId || null,
          area_id: areaId || null,
          when,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp task with real one
      setTasks(prev => prev.map(t =>
        t.id === tempId ? {
          id: data.id,
          title: data.title,
          completed: data.completed,
          createdAt: new Date(data.created_at),
          dueDate: data.due_date ? new Date(data.due_date) : undefined,
          project: data.project_id || undefined,
          area: data.area_id || undefined,
          when: data.when as Task['when'],
          subtasks: [],
        } : t
      ));
    } catch (error: any) {
      console.error('Error adding task:', error);
      // Revert optimistic update
      setTasks(prev => prev.filter(t => t.id !== tempId));
      toast({
        title: 'Error adding task',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [user, toast, addToQueue]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !user) return;

    const isCompleting = !task.completed;
    const originalCompletedAt = task.completedAt; // Store original for proper revert

    // Set loading state
    setTaskLoading(id, true);

    // If completing, add to recently completed set for delayed disappearance
    if (isCompleting) {
      setRecentlyCompletedTasks(prev => new Set(prev).add(id));

      // Clear any existing timer for this task
      const existingTimer = completionTimersRef.current.get(id);
      if (existingTimer) clearTimeout(existingTimer);

      // Set timer to remove from recently completed after 1 second
      const timer = setTimeout(() => {
        // Check if task still exists before updating state (prevents memory leak)
        setTasks(currentTasks => {
          const taskExists = currentTasks.some(t => t.id === id);
          if (taskExists) {
            setRecentlyCompletedTasks(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
          return currentTasks;
        });
        completionTimersRef.current.delete(id);
      }, COMPLETION_DELAY_MS);

      completionTimersRef.current.set(id, timer);
    } else {
      // If uncompleting, remove from recently completed immediately
      setRecentlyCompletedTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const existingTimer = completionTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        completionTimersRef.current.delete(id);
      }
    }

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, completed: isCompleting, completedAt: isCompleting ? new Date() : undefined }
        : t
    ));

    // If offline, queue the operation
    if (!navigator.onLine) {
      addToQueue({
        type: 'task',
        action: 'toggle',
        payload: { id, isCompleting },
      });
      setTaskLoading(id, false);
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          completed: isCompleting,
          completed_at: isCompleting ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;

      // If completing a recurring task, create the next occurrence
      if (isCompleting && task.recurrenceType) {
        const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrenceType, task.recurrenceInterval || 1);

        const { data: newTaskData, error: createError } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: task.title,
            notes: task.notes,
            due_date: nextDueDate.toISOString(),
            project_id: task.project || null,
            area_id: task.area || null,
            when: task.when,
            recurrence_type: task.recurrenceType,
            recurrence_interval: task.recurrenceInterval || 1,
          })
          .select()
          .single();

        if (createError) throw createError;

        const newTask: Task = {
          id: newTaskData.id,
          title: newTaskData.title,
          notes: newTaskData.notes || undefined,
          completed: false,
          createdAt: new Date(newTaskData.created_at),
          dueDate: new Date(newTaskData.due_date),
          project: newTaskData.project_id || undefined,
          area: newTaskData.area_id || undefined,
          when: newTaskData.when as Task['when'],
          recurrenceType: newTaskData.recurrence_type as Task['recurrenceType'],
          recurrenceInterval: newTaskData.recurrence_interval || undefined,
          subtasks: [],
        };

        setTasks(prev => [newTask, ...prev]);

        toast({
          title: 'Recurring task completed',
          description: `Next occurrence scheduled for ${nextDueDate.toLocaleDateString()}`,
        });
      }
    } catch (error: any) {
      console.error('Error toggling task:', error);
      // Revert optimistic update with original completedAt value
      setTasks(prev => prev.map(t =>
        t.id === id
          ? { ...t, completed: !isCompleting, completedAt: originalCompletedAt }
          : t
      ));
    } finally {
      setTaskLoading(id, false);
    }
  }, [tasks, user, toast, addToQueue, setTaskLoading]);

  // Helper function to calculate next due date for recurring tasks
  const calculateNextDueDate = (currentDueDate: Date | undefined, type: string, interval: number): Date => {
    const baseDate = currentDueDate || new Date();
    const nextDate = new Date(baseDate);

    switch (type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
    }

    return nextDate;
  };

  const deleteTask = useCallback(async (id: string) => {
    // Clear any pending completion timer for this task to prevent memory leak
    const existingTimer = completionTimersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      completionTimersRef.current.delete(id);
    }
    setRecentlyCompletedTasks(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id));

    // If offline, queue the operation
    if (!navigator.onLine) {
      addToQueue({
        type: 'task',
        action: 'delete',
        payload: { id },
      });
      toast({ title: 'Task deleted offline', description: 'Will sync when back online' });
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error deleting task',
        description: error.message,
        variant: 'destructive',
      });
      // Re-fetch to restore state
      fetchData();
    }
  }, [toast, addToQueue, fetchData]);

  const moveTask = useCallback(async (taskId: string, targetView: ViewType) => {
    try {
      const when = targetView === 'inbox' ? null :
        targetView === 'today' ? 'today' :
          targetView === 'someday' ? 'someday' : null;

      const { error } = await supabase
        .from('tasks')
        .update({ when })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, when: when as Task['when'] } : t
      ));
    } catch (error: any) {
      console.error('Error moving task:', error);
      toast({
        title: 'Error moving task',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const updateTaskDueDate = useCallback(async (id: string, dueDate: Date | undefined) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ due_date: dueDate?.toISOString() || null })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, dueDate } : t
      ));
    } catch (error: any) {
      console.error('Error updating due date:', error);
      toast({
        title: 'Error updating due date',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, []);

  const updateTaskProject = useCallback(async (id: string, projectId: string | undefined, areaId: string | undefined) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          project_id: projectId || null,
          area_id: areaId || null,
        })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, project: projectId, area: areaId } : t
      ));
    } catch (error: any) {
      console.error('Error updating task project:', error);
      toast({
        title: 'Error updating task project',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, []);

  const reorderTasks = useCallback((activeId: string, overId: string, view: ViewType) => {
    // Local reorder only for now
    setTasks(prev => {
      const viewTasks = prev.filter(t => {
        if (view === 'inbox') return !t.completed && !t.when;
        if (view === 'today') return !t.completed && t.when === 'today';
        if (view === 'someday') return !t.completed && t.when === 'someday';
        if (view === 'logbook') return t.completed;
        return false;
      });

      const oldIndex = viewTasks.findIndex(t => t.id === activeId);
      const newIndex = viewTasks.findIndex(t => t.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prev;

      const [removed] = viewTasks.splice(oldIndex, 1);
      viewTasks.splice(newIndex, 0, removed);

      const result: Task[] = [];
      let viewTaskIndex = 0;

      for (const task of prev) {
        const isViewTask = view === 'inbox' ? (!task.completed && !task.when) :
          view === 'today' ? (!task.completed && task.when === 'today') :
            view === 'someday' ? (!task.completed && task.when === 'someday') :
              view === 'logbook' ? task.completed : false;

        if (isViewTask) {
          if (viewTaskIndex < viewTasks.length) {
            result.push(viewTasks[viewTaskIndex]);
            viewTaskIndex++;
          }
        } else {
          result.push(task);
        }
      }

      return result;
    });
  }, []);

  // Subtask operations
  const addSubtask = useCallback(async (taskId: string, title: string) => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: taskId,
          title,
        })
        .select()
        .single();

      if (error) throw error;

      const newSubtask: Subtask = {
        id: data.id,
        title: data.title,
        completed: data.completed,
      };

      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
          : t
      ));
    } catch (error: any) {
      console.error('Error adding subtask:', error);
      toast({
        title: 'Error adding subtask',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    // Use functional pattern to get fresh state and avoid stale closure
    let originalCompleted: boolean | undefined;
    let newCompletedState: boolean;

    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      const subtaskToToggle = task?.subtasks?.find(s => s.id === subtaskId);

      if (!subtaskToToggle) return prev;

      originalCompleted = subtaskToToggle.completed;
      newCompletedState = !originalCompleted;

      // Optimistic update
      return prev.map(t =>
        t.id === taskId
          ? {
            ...t,
            subtasks: t.subtasks?.map(s =>
              s.id === subtaskId ? { ...s, completed: newCompletedState } : s
            )
          }
          : t
      );
    });

    // If subtask wasn't found, originalCompleted will be undefined
    if (originalCompleted === undefined) return;


    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: newCompletedState })
        .eq('id', subtaskId);

      if (error) throw error;
    } catch (error: any) {
      // Revert optimistic update on error using captured original state
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? {
            ...t,
            subtasks: t.subtasks?.map(s =>
              s.id === subtaskId ? { ...s, completed: originalCompleted! } : s
            )
          }
          : t
      ));
      console.error('Error toggling subtask:', error);
      toast({
        title: 'Error toggling subtask',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]); // Removed tasks dependency - now uses functional state update

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks?.filter(s => s.id !== subtaskId) }
          : t
      ));
    } catch (error: any) {
      console.error('Error deleting subtask:', error);
      toast({
        title: 'Error deleting subtask',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const reorderSubtasks = useCallback(async (taskId: string, activeId: string, overId: string) => {
    // Optimistic update
    let reorderedSubtasks: { id: string; position: number }[] = [];

    setTasks(prev => prev.map(task => {
      if (task.id !== taskId || !task.subtasks) return task;

      const subtasks = [...task.subtasks];
      const oldIndex = subtasks.findIndex(s => s.id === activeId);
      const newIndex = subtasks.findIndex(s => s.id === overId);

      if (oldIndex === -1 || newIndex === -1) return task;

      const [removed] = subtasks.splice(oldIndex, 1);
      subtasks.splice(newIndex, 0, removed);

      // Store reordered subtasks with new positions
      reorderedSubtasks = subtasks.map((s, index) => ({ id: s.id, position: index }));

      return { ...task, subtasks };
    }));

    // Persist to database
    if (reorderedSubtasks.length > 0) {
      try {
        // Update each subtask's position
        const updates = reorderedSubtasks.map(({ id, position }) =>
          supabase
            .from('subtasks')
            .update({ position })
            .eq('id', id)
        );

        await Promise.all(updates);
      } catch (error: any) {
        console.error('Error persisting subtask order:', error);
        toast({
          title: 'Error reordering subtasks',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  }, [toast]);
  const addProject = useCallback(async (name: string, color?: string, areaId?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          color: color || 'hsl(211, 100%, 50%)',
          area_id: areaId || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: Project = {
        id: data.id,
        name: data.name,
        color: data.color,
        areaId: data.area_id || undefined,
      };

      setProjects(prev => [...prev, newProject]);
    } catch (error: any) {
      console.error('Error adding project:', error);
      toast({
        title: 'Error adding project',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [user]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error deleting project',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Area operations
  const addArea = useCallback(async (name: string, color?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('areas')
        .insert({
          user_id: user.id,
          name,
          color: color || 'hsl(211, 100%, 50%)',
        })
        .select()
        .single();

      if (error) throw error;

      const newArea: Area = {
        id: data.id,
        name: data.name,
        color: data.color,
      };

      setAreas(prev => [...prev, newArea]);
    } catch (error: any) {
      console.error('Error adding area:', error);
      toast({
        title: 'Error adding area',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [user]);

  const deleteArea = useCallback(async (id: string) => {
    try {
      // Also update projects that reference this area
      await supabase
        .from('projects')
        .update({ area_id: null })
        .eq('area_id', id);

      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(p =>
        p.areaId === id ? { ...p, areaId: undefined } : p
      ));
      setAreas(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      console.error('Error deleting area:', error);
      toast({
        title: 'Error deleting area',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Tag operations
  const createTag = useCallback(async (name: string, color: string): Promise<Tag | undefined> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name,
          color,
        })
        .select()
        .single();

      if (error) throw error;

      const newTag: Tag = {
        id: data.id,
        name: data.name,
        color: data.color,
      };

      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error creating tag',
        description: error.message,
        variant: 'destructive',
      });
      return undefined;
    }
  }, [user, toast]);

  const deleteTag = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTags(prev => prev.filter(t => t.id !== id));
      // Also remove from tasks
      setTasks(prev => prev.map(task => ({
        ...task,
        tags: task.tags?.filter(t => t.id !== id),
      })));
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Error deleting tag',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const addTagToTask = useCallback(async (taskId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('task_tags')
        .insert({ task_id: taskId, tag_id: tagId });

      if (error) throw error;

      const tag = tags.find(t => t.id === tagId);
      if (tag) {
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? { ...task, tags: [...(task.tags || []), tag] }
            : task
        ));
      }
    } catch (error: any) {
      console.error('Error adding tag to task:', error);
      toast({
        title: 'Error adding tag to task',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [tags, toast]);

  const removeTagFromTask = useCallback(async (taskId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('task_tags')
        .delete()
        .match({ task_id: taskId, tag_id: tagId });

      if (error) throw error;

      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, tags: task.tags?.filter(t => t.id !== tagId) }
          : task
      ));
    } catch (error: any) {
      console.error('Error removing tag from task:', error);
      toast({
        title: 'Error removing tag from task',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // View helpers - include recently completed tasks so they stay visible for 1 second
  const getTasksForView = useCallback((view: ViewType): Task[] => {
    switch (view) {
      case 'inbox':
        return tasks.filter(t => (!t.completed || recentlyCompletedTasks.has(t.id)) && !t.when);
      case 'today':
        return tasks.filter(t => (!t.completed || recentlyCompletedTasks.has(t.id)) && t.when === 'today');
      case 'upcoming':
        return tasks.filter(t => (!t.completed || recentlyCompletedTasks.has(t.id)) && t.dueDate);
      case 'someday':
        return tasks.filter(t => (!t.completed || recentlyCompletedTasks.has(t.id)) && t.when === 'someday');
      case 'logbook':
        return tasks.filter(t => t.completed);
      default:
        return tasks;
    }
  }, [tasks, recentlyCompletedTasks]);

  const getTasksForProject = useCallback((projectId: string): Task[] => {
    return tasks.filter(t => (!t.completed || recentlyCompletedTasks.has(t.id)) && t.project === projectId);
  }, [tasks, recentlyCompletedTasks]);

  const getTasksForArea = useCallback((areaId: string): Task[] => {
    return tasks.filter(t => (!t.completed || recentlyCompletedTasks.has(t.id)) && t.area === areaId);
  }, [tasks, recentlyCompletedTasks]);

  const getTaskCount = useCallback((view: ViewType): number => {
    return getTasksForView(view).length;
  }, [getTasksForView]);

  const getProjectsForArea = useCallback((areaId: string) => {
    return projects.filter(p => p.areaId === areaId);
  }, [projects]);

  const getOrphanProjects = useCallback(() => {
    return projects.filter(p => !p.areaId);
  }, [projects]);

  const updateTaskRecurrence = useCallback(async (id: string, recurrenceType: Task['recurrenceType'], recurrenceInterval: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          recurrence_type: recurrenceType || null,
          recurrence_interval: recurrenceInterval,
        })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, recurrenceType, recurrenceInterval } : t
      ));
    } catch (error: any) {
      console.error('Error updating task recurrence:', error);
    }
  }, []);

  const updateTask = useCallback(async (
    id: string,
    updates: {
      title?: string;
      notes?: string;
      dueDate?: Date;
      when?: Task['when'];
      projectId?: string;
      areaId?: string;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          notes: updates.notes || null,
          due_date: updates.dueDate?.toISOString() || null,
          when: updates.when || null,
          project_id: updates.projectId || null,
          area_id: updates.areaId || null,
        })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(t =>
        t.id === id
          ? {
            ...t,
            title: updates.title ?? t.title,
            notes: updates.notes ?? t.notes,
            dueDate: updates.dueDate ?? t.dueDate,
            when: updates.when ?? t.when,
            project: updates.projectId ?? t.project,
            area: updates.areaId ?? t.area,
          }
          : t
      ));

      toast({ title: 'Task updated' });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error updating task',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Sync offline changes when back online
  const syncOfflineChanges = useCallback(async () => {
    if (!user) return;

    await processQueue({
      onTaskToggle: async (payload) => {
        await supabase
          .from('tasks')
          .update({
            completed: payload.isCompleting,
            completed_at: payload.isCompleting ? new Date().toISOString() : null,
          })
          .eq('id', payload.id);
      },
      onTaskCreate: async (payload) => {
        await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: payload.title,
            due_date: payload.dueDate || null,
            project_id: payload.projectId || null,
            area_id: payload.areaId || null,
            when: payload.when,
          });
      },
      onTaskDelete: async (payload) => {
        await supabase
          .from('tasks')
          .delete()
          .eq('id', payload.id);
      },
      onSubtaskCreate: async (payload) => {
        await supabase
          .from('subtasks')
          .insert({
            task_id: payload.taskId,
            title: payload.title,
          });
      },
      onSubtaskToggle: async (payload) => {
        await supabase
          .from('subtasks')
          .update({ completed: payload.completed })
          .eq('id', payload.subtaskId);
      },
      onSubtaskDelete: async (payload) => {
        await supabase
          .from('subtasks')
          .delete()
          .eq('id', payload.subtaskId);
      },
    });

    // Refresh data after sync
    await fetchData();
  }, [user, processQueue, fetchData]);

  // Clear all completed tasks (logbook)
  const clearLogbook = useCallback(async () => {
    if (!user) return;

    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => !t.completed));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('completed', true);

      if (error) throw error;

      toast({
        title: 'Logbook cleared',
        description: `${completedTasks.length} completed tasks deleted`,
      });
    } catch (error) {
      console.error('Error clearing logbook:', error);
      // Revert on error
      setTasks(prev => [...prev, ...completedTasks]);
      toast({
        title: 'Error',
        description: 'Failed to clear logbook',
        variant: 'destructive',
      });
    }
  }, [user, tasks, toast]);

  return {
    tasks,
    projects,
    areas,
    tags,
    loading,
    isTaskLoading,
    addTask,
    toggleTask,
    deleteTask,
    moveTask,
    reorderTasks,
    updateTask,
    updateTaskDueDate,
    updateTaskProject,
    updateTaskRecurrence,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderSubtasks,
    addProject,
    deleteProject,
    addArea,
    deleteArea,
    createTag,
    deleteTag,
    addTagToTask,
    removeTagFromTask,
    getTasksForView,
    getTasksForProject,
    getTasksForArea,
    getTaskCount,
    getProjectsForArea,
    getOrphanProjects,
    syncOfflineChanges,
    getPendingCount,
    clearLogbook,
  };
}
