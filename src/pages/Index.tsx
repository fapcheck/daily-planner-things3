import { useState, useMemo, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TaskList } from '@/components/TaskList';
import { MobileNav } from '@/components/MobileNav';
import { TaskSearch } from '@/components/TaskSearch';
import { TaskEditPanel } from '@/components/TaskEditPanel';
import { FinanceSection } from '@/components/finance/FinanceSection';
import { useAuth } from '@/hooks/useAuth';
import { useCloudTasks } from '@/hooks/useCloudTasks';
import { useFinance } from '@/hooks/useFinance';
import { useOfflineSyncContext } from '@/contexts/OfflineSyncContext';
import { useUndoDelete } from '@/hooks/useUndoDelete';
import { useToast } from '@/hooks/use-toast';
import { ViewType, Task } from '@/types/task';
import { Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToastAction } from '@/components/ui/toast';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false);
  const [mobileTaskTitle, setMobileTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    tasks,
    projects,
    areas,
    tags,
    loading: dataLoading,
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
    clearLogbook,
  } = useCloudTasks();

  const {
    transactions,
    debts,
    budgets,
    categories,
  } = useFinance();

  const { registerSyncHandler } = useOfflineSyncContext();
  const { toast } = useToast();

  // Undo delete functionality - task restoration is handled via hiddenTaskIds
  const restoreTask = useCallback((_task: Task) => {
    // No-op: restoration is handled by removing from hiddenTaskIds in handleDeleteWithUndo
  }, []);

  const confirmDeleteTask = useCallback(async (id: string) => {
    await deleteTask(id);
  }, [deleteTask]);

  const { scheduleDelete, handleUndo, isPendingDelete } = useUndoDelete(
    confirmDeleteTask,
    restoreTask
  );

  // Track locally hidden tasks (pending delete)
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());

  const handleDeleteWithUndo = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Hide task immediately (optimistic)
    setHiddenTaskIds(prev => new Set([...prev, id]));

    // Show toast with undo option
    toast({
      title: "Task deleted",
      description: `"${task.title.slice(0, 30)}${task.title.length > 30 ? '...' : ''}"`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          // Restore: unhide the task
          setHiddenTaskIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          handleUndo(id);
          toast({
            title: "Task restored",
            duration: 2000,
          });
        }}>
          Undo
        </ToastAction>
      ),
      duration: 5000,
    });

    // Schedule actual deletion
    scheduleDelete(task);
  }, [tasks, toast, scheduleDelete, handleUndo]);

  // Register sync handler for offline changes
  useEffect(() => {
    registerSyncHandler(syncOfflineChanges);
  }, [registerSyncHandler, syncOfflineChanges]);

  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      // Count incomplete tasks only
      counts[p.id] = getTasksForProject(p.id).filter(t => !t.completed).length;
    });
    return counts;
  }, [projects, getTasksForProject]);

  const projectCompletedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      // Count completed tasks directly from tasks array
      counts[p.id] = tasks.filter(t => t.completed && t.project === p.id).length;
    });
    return counts;
  }, [projects, tasks]);

  const areaTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    areas.forEach(a => {
      counts[a.id] = getTasksForArea(a.id).length;
    });
    return counts;
  }, [areas, getTasksForArea]);

  // Get tasks based on current selection - MUST be before any early returns
  // Filter out hidden (pending delete) tasks
  const displayedTasks = useMemo(() => {
    let taskList: Task[];
    if (selectedProjectId) {
      taskList = getTasksForProject(selectedProjectId);
    } else if (selectedAreaId) {
      taskList = getTasksForArea(selectedAreaId);
    } else {
      taskList = getTasksForView(currentView);
    }
    // Filter out tasks pending deletion
    return taskList.filter(t => !hiddenTaskIds.has(t.id));
  }, [selectedProjectId, selectedAreaId, currentView, getTasksForProject, getTasksForArea, getTasksForView, hiddenTaskIds]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const taskCounts: Record<ViewType, number> = {
    inbox: getTaskCount('inbox'),
    today: getTaskCount('today'),
    upcoming: getTaskCount('upcoming'),
    someday: getTaskCount('someday'),
    logbook: getTaskCount('logbook'),
  };

  // Get selected project/area objects
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedArea = areas.find(a => a.id === selectedAreaId);

  const handleAddTask = (title: string, dueDate?: Date) => {
    addTask(title, currentView, dueDate, selectedProjectId, selectedAreaId);
  };

  const handleMobileAddTask = () => {
    if (!mobileTaskTitle.trim()) return;
    addTask(mobileTaskTitle.trim(), currentView, undefined, selectedProjectId, selectedAreaId);
    setMobileTaskTitle('');
    setIsMobileAddOpen(false);
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setSelectedProjectId(undefined);
    setSelectedAreaId(undefined);
    setShowFinance(false);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedAreaId(undefined);
    setShowFinance(false);
  };

  const handleSelectArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    setSelectedProjectId(undefined);
    setShowFinance(false);
  };

  const handleFinanceClick = () => {
    setShowFinance(true);
    setSelectedProjectId(undefined);
    setSelectedAreaId(undefined);
  };

  const handleSelectTask = (task: Task) => {
    // Navigate to the task's view
    if (task.project) {
      setSelectedProjectId(task.project);
      setSelectedAreaId(undefined);
    } else if (task.area) {
      setSelectedAreaId(task.area);
      setSelectedProjectId(undefined);
    } else if (task.when) {
      // Handle 'evening' by treating it as 'today', other values are valid ViewTypes
      const viewMap: Record<string, ViewType> = {
        inbox: 'inbox',
        today: 'today',
        evening: 'today', // 'evening' maps to 'today'
        upcoming: 'upcoming',
        someday: 'someday',
      };
      setCurrentView(viewMap[task.when] || 'inbox');
      setSelectedProjectId(undefined);
      setSelectedAreaId(undefined);
    } else {
      setCurrentView('inbox');
      setSelectedProjectId(undefined);
      setSelectedAreaId(undefined);
    }
  };

  const sidebarProps = {
    currentView,
    onViewChange: handleViewChange,
    taskCounts,
    projects,
    areas,
    selectedProjectId,
    selectedAreaId,
    onSelectProject: handleSelectProject,
    onSelectArea: handleSelectArea,
    onAddProject: addProject,
    onDeleteProject: deleteProject,
    onAddArea: addArea,
    onDeleteArea: deleteArea,
    getProjectsForArea,
    getOrphanProjects,
    projectTaskCounts,
    projectCompletedCounts,
    areaTaskCounts,
    onSearchClick: () => setIsSearchOpen(true),
    onSignOut: signOut,
    userEmail: user.email,
    showFinance,
    onFinanceClick: handleFinanceClick,
    // Export data
    tasks,
    transactions,
    debts,
    budgets,
    categories,
  };

  const getViewTitle = () => {
    if (selectedProject) return selectedProject.name;
    if (selectedArea) return selectedArea.name;
    return currentView.charAt(0).toUpperCase() + currentView.slice(1);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div 
            className="w-72 h-full animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar 
              {...sidebarProps}
              onViewChange={(view) => {
                handleViewChange(view);
                setShowMobileSidebar(false);
              }}
              onSelectProject={(id) => {
                handleSelectProject(id);
                setShowMobileSidebar(false);
              }}
              onSelectArea={(id) => {
                handleSelectArea(id);
                setShowMobileSidebar(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      {showFinance ? (
        <FinanceSection />
      ) : (
        <TaskList
          view={currentView}
          tasks={displayedTasks}
          debts={debts}
          onAddTask={handleAddTask}
          onToggleTask={toggleTask}
          onDeleteTask={handleDeleteWithUndo}
          onMoveTask={moveTask}
          onReorderTasks={(activeId, overId) => reorderTasks(activeId, overId, currentView)}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
          onReorderSubtasks={reorderSubtasks}
          onUpdateTaskDueDate={updateTaskDueDate}
          onUpdateTaskProject={updateTaskProject}
          onUpdateTaskRecurrence={updateTaskRecurrence}
          onEditTask={setEditingTask}
          isTaskLoading={isTaskLoading}
          projects={projects}
          areas={areas}
          tags={tags}
          selectedProject={selectedProject}
          selectedArea={selectedArea}
          loading={dataLoading}
          onNavigateToFinance={handleFinanceClick}
          onClearLogbook={clearLogbook}
          onMobileAddClick={() => setIsMobileAddOpen(true)}
        />
      )}

      {/* Mobile Navigation */}
      <MobileNav
        currentView={currentView}
        onViewChange={handleViewChange}
        onMenuClick={() => setShowMobileSidebar(true)}
        showFinance={showFinance}
        onFinanceClick={handleFinanceClick}
      />

      {/* Mobile FAB */}
      {currentView !== 'logbook' && !showFinance && (
        <button
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground
                     shadow-lg shadow-primary/25 flex items-center justify-center md:hidden z-40
                     active:scale-95 transition-transform"
          onClick={() => setIsMobileAddOpen(true)}
          aria-label="Add new task"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Add Task Sheet */}
      <Dialog open={isMobileAddOpen} onOpenChange={setIsMobileAddOpen}>
        <DialogContent className="sm:max-w-md rounded-t-2xl rounded-b-none fixed bottom-0 top-auto translate-y-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom border-t border-x border-b-0">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">New task</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleMobileAddTask();
            }}
            className="space-y-4"
          >
            <Input
              placeholder="What needs to be done?"
              value={mobileTaskTitle}
              onChange={(e) => setMobileTaskTitle(e.target.value)}
              autoFocus
              className="text-base h-12"
            />
            <div className="flex gap-3 pb-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="flex-1 h-11"
                onClick={() => setIsMobileAddOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-11"
                disabled={!mobileTaskTitle.trim()}
              >
                Add
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Search */}
      <TaskSearch
        tasks={tasks}
        projects={projects}
        areas={areas}
        onSelectTask={handleSelectTask}
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />

      {/* Task Edit Panel */}
      <TaskEditPanel
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onUpdate={updateTask}
        onToggle={toggleTask}
        onDelete={(id) => {
          handleDeleteWithUndo(id);
          setEditingTask(null);
        }}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
        projects={projects}
        areas={areas}
        tags={tags}
        onCreateTag={createTag}
        onDeleteTag={deleteTag}
        onAddTagToTask={addTagToTask}
        onRemoveTagFromTask={removeTagFromTask}
      />
    </div>
  );
};

export default Index;
