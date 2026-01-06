import { useState, useMemo, useRef } from 'react';
import { isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Task, ViewType, Project, Area, RecurrenceType, Tag } from '@/types/task';
import { Debt } from '@/types/finance';
import { formatCurrency } from '@/hooks/useFinance';
import { DraggableTaskRow } from './DraggableTaskRow';
import { MoveToViewDropZone } from './MoveToViewDropZone';
import { SmartTaskInput } from './SmartTaskInput';
import { DailyPlanner } from './DailyPlanner';
import { WeeklyReview } from './WeeklyReview';
import { UpcomingCalendar } from './UpcomingCalendar';
import { DebtReminder } from './DebtReminder';
import { TagFilter } from './TagFilter';
import { TaskRowSkeleton } from './TaskRowSkeleton';
import { DraggableAddButton } from './DraggableAddButton';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { LogbookChart } from './LogbookChart';
import { Button } from './ui/button';
import {
  Inbox,
  Star,
  Calendar,
  Archive,
  Clock,
  FolderOpen,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface TaskListProps {
  view: ViewType;
  tasks: Task[];
  debts?: Debt[];
  onAddTask: (title: string, dueDate?: Date) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (taskId: string, targetView: ViewType) => void;
  onReorderTasks: (activeId: string, overId: string, view: ViewType) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onReorderSubtasks?: (taskId: string, activeId: string, overId: string) => void;
  onUpdateTaskDueDate: (taskId: string, dueDate: Date | undefined) => void;
  onUpdateTaskProject: (taskId: string, projectId: string | undefined, areaId: string | undefined) => void;
  onUpdateTaskRecurrence: (taskId: string, type: RecurrenceType | undefined, interval: number) => void;
  onEditTask: (task: Task) => void;
  isTaskLoading?: (taskId: string) => boolean;
  projects: Project[];
  areas: Area[];
  tags?: Tag[];
  selectedProject?: Project;
  selectedArea?: Area;
  loading?: boolean;
  onClearLogbook?: () => void;
  onNavigateToFinance?: () => void;
}

const viewConfig: Record<ViewType, {
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = {
  inbox: {
    title: 'Inbox',
    icon: Inbox,
    color: 'text-things-blue',
    description: 'Capture your thoughts'
  },
  today: {
    title: 'Today',
    icon: Star,
    color: 'text-things-yellow',
    description: 'Focus on what matters'
  },
  upcoming: {
    title: 'Upcoming',
    icon: Calendar,
    color: 'text-things-red',
    description: 'Plan ahead'
  },
  someday: {
    title: 'Someday',
    icon: Clock,
    color: 'text-things-orange',
    description: 'Maybe later'
  },
  logbook: {
    title: 'Logbook',
    icon: Archive,
    color: 'text-things-gray',
    description: 'Completed tasks'
  },
};

const moveableViews: ViewType[] = ['inbox', 'today', 'someday'];

export function TaskList({
  view,
  tasks,
  debts = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onMoveTask,
  onReorderTasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
  onUpdateTaskDueDate,
  onUpdateTaskProject,
  onUpdateTaskRecurrence,
  onEditTask,
  isTaskLoading,
  projects,
  areas,
  tags = [],
  selectedProject,
  selectedArea,
  loading = false,
  onNavigateToFinance,
  onClearLogbook,
}: TaskListProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [logbookDateRange, setLogbookDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const taskListRef = useRef<HTMLDivElement>(null);

  const handleToggleTagFilter = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearTagFilter = () => {
    setSelectedTagIds([]);
  };

  // Filter tasks by selected calendar date, tags, and logbook date range
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by calendar date in upcoming view
    if (view === 'upcoming' && selectedCalendarDate && !selectedProject && !selectedArea) {
      result = result.filter(task =>
        task.dueDate && isSameDay(new Date(task.dueDate), selectedCalendarDate)
      );
    }

    // Filter by date range in logbook view
    if (view === 'logbook' && (logbookDateRange.from || logbookDateRange.to)) {
      result = result.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);

        if (logbookDateRange.from && logbookDateRange.to) {
          return isWithinInterval(completedDate, {
            start: startOfDay(logbookDateRange.from),
            end: endOfDay(logbookDateRange.to),
          });
        }

        if (logbookDateRange.from) {
          return completedDate >= startOfDay(logbookDateRange.from);
        }

        if (logbookDateRange.to) {
          return completedDate <= endOfDay(logbookDateRange.to);
        }

        return true;
      });
    }

    // Filter by selected tags
    if (selectedTagIds.length > 0) {
      result = result.filter(task =>
        task.tags?.some(tag => selectedTagIds.includes(tag.id))
      );
    }

    return result;
  }, [tasks, view, selectedCalendarDate, selectedProject, selectedArea, selectedTagIds, logbookDateRange]);

  // Filter debts by selected calendar date for upcoming view
  const filteredDebts = useMemo(() => {
    if (view !== 'upcoming' || !selectedCalendarDate || selectedProject || selectedArea) {
      return [];
    }

    return debts.filter(debt =>
      debt.dueDate && !debt.isSettled && isSameDay(new Date(debt.dueDate), selectedCalendarDate)
    );
  }, [debts, view, selectedCalendarDate, selectedProject, selectedArea]);

  const config = viewConfig[view];
  const Icon = config.icon;
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    // Check if dropped on a view drop zone
    if (over.id.toString().startsWith('dropzone-')) {
      const targetView = over.id.toString().replace('dropzone-', '') as ViewType;
      onMoveTask(active.id.toString(), targetView);
      return;
    }

    // Reorder within the same view
    if (active.id !== over.id) {
      onReorderTasks(active.id.toString(), over.id.toString(), view);
    }
  };

  const isDragging = activeTask !== null;
  const canMove = view !== 'logbook' && view !== 'upcoming';

  // Custom header for project/area view
  const getHeaderConfig = () => {
    if (selectedProject) {
      return {
        title: selectedProject.name,
        icon: FolderOpen,
        color: '',
        description: 'Tasks in this project',
        iconStyle: { color: selectedProject.color }
      };
    }
    if (selectedArea) {
      return {
        title: selectedArea.name,
        icon: Briefcase,
        color: '',
        description: 'Tasks in this area',
        iconStyle: { color: selectedArea.color }
      };
    }
    return {
      title: config.title,
      icon: Icon,
      color: config.color,
      description: config.description,
      iconStyle: undefined
    };
  };

  const headerConfig = getHeaderConfig();
  const HeaderIcon = headerConfig.icon;

  return (
    <main className="flex-1 h-full overflow-auto bg-background">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-8 pb-36 md:pb-8">
        {/* Header - compact on mobile */}
        <header className="mb-6 md:mb-8 animate-fade-up">
          <div className="flex items-center gap-2.5 md:gap-3 mb-1">
            <HeaderIcon
              className={cn('w-6 h-6 md:w-7 md:h-7', headerConfig.color)}
              style={headerConfig.iconStyle}
            />
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
              {headerConfig.title}
            </h1>
            {view === 'logbook' && tasks.length > 0 && onClearLogbook && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="ml-auto text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            )}
          </div>
          {view === 'today' && !selectedProject && !selectedArea && (
            <p className="text-muted-foreground text-xs md:text-sm ml-[34px] md:ml-10">
              {dateString}
            </p>
          )}
          {view === 'logbook' && !selectedProject && !selectedArea && (
            <div className="mt-3 ml-[34px] md:ml-10 space-y-3">
              <DateRangePicker
                dateRange={logbookDateRange}
                onDateRangeChange={setLogbookDateRange}
              />
              {/* Logbook Statistics */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Showing:</span>
                  <span className="font-semibold text-foreground">{filteredTasks.length}</span>
                  <span className="text-muted-foreground">
                    {filteredTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                {(logbookDateRange.from || logbookDateRange.to) && filteredTasks.length !== tasks.length && (
                  <div className="text-muted-foreground text-xs">
                    of {tasks.length} total completed
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Logbook Chart */}
        {view === 'logbook' && !selectedProject && !selectedArea && tasks.length > 0 && (
          <LogbookChart tasks={filteredTasks} dateRange={logbookDateRange} />
        )}

        {/* Quick Add - Desktop only shows full input, mobile simplified */}
        {view !== 'logbook' && (
          <div className="mb-6 animate-fade-up space-y-3" style={{ animationDelay: '50ms' }}>
            {/* Desktop: Full input with AI buttons */}
            <div className="hidden md:flex items-start gap-3">
              <div className="flex-1">
                <SmartTaskInput
                  onAdd={(title, dueDate, when) => {
                    if (dueDate) {
                      onAddTask(title, dueDate);
                    } else if (view === 'upcoming' && selectedCalendarDate) {
                      onAddTask(title, selectedCalendarDate);
                    } else {
                      onAddTask(title);
                    }
                  }}
                  placeholder={
                    view === 'upcoming' && selectedCalendarDate
                      ? `Добавить задачу на выбранную дату`
                      : `Добавить в ${config.title.toLowerCase()}`
                  }
                  selectedDate={view === 'upcoming' ? selectedCalendarDate : undefined}
                />
              </div>
              <DailyPlanner
                tasks={tasks}
                onFocusTask={onEditTask}
              />
              <WeeklyReview tasks={tasks} />
            </div>

            {/* Mobile: Clean minimal input */}
            <div className="md:hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-muted-foreground"
                onClick={() => {
                  // This will be handled by FAB on mobile
                }}
              >
                <Plus className="w-5 h-5" />
                <span className="text-[15px]">
                  {view === 'upcoming' && selectedCalendarDate
                    ? `Add task for selected date`
                    : `Add to ${config.title.toLowerCase()}`
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Debt Reminders for Today view */}
        {view === 'today' && !selectedProject && !selectedArea && (
          <DebtReminder
            debts={debts}
            onNavigateToFinance={onNavigateToFinance}
          />
        )}

        {/* Upcoming Calendar */}
        {view === 'upcoming' && !selectedProject && !selectedArea && (
          <div className="animate-fade-up" style={{ animationDelay: '75ms' }}>
            <UpcomingCalendar
              tasks={tasks}
              debts={debts}
              selectedDate={selectedCalendarDate}
              onSelectDate={setSelectedCalendarDate}
            />
          </div>
        )}

        {/* Tag Filter */}
        {tags.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <TagFilter
              tags={tags}
              selectedTagIds={selectedTagIds}
              onToggleTag={handleToggleTagFilter}
              onClearAll={handleClearTagFilter}
            />
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Drop zones for moving to other views */}
          {canMove && (
            <div className={cn(
              'grid gap-2 mb-4 transition-all duration-200',
              isDragging ? 'grid-cols-3 opacity-100' : 'grid-cols-1'
            )}>
              {moveableViews.map(v => (
                <MoveToViewDropZone
                  key={v}
                  view={v}
                  isActive={isDragging}
                  currentView={view}
                />
              ))}
            </div>
          )}

          {/* Task List */}
          <div ref={taskListRef} className="space-y-1 relative">
            {loading ? (
              <TaskRowSkeleton count={5} />
            ) : filteredTasks.length === 0 && filteredDebts.length === 0 ? (
              <div className="text-center py-16 animate-fade-up" style={{ animationDelay: '100ms' }}>
                <Icon className={cn('w-12 h-12 mx-auto mb-4 opacity-20', config.color)} />
                <p className="text-muted-foreground">
                  {view === 'logbook'
                    ? 'No completed tasks yet'
                    : selectedCalendarDate && view === 'upcoming'
                      ? 'Nothing due on this date'
                      : `Your ${config.title.toLowerCase()} is clear`
                  }
                </p>
                {selectedCalendarDate && view === 'upcoming' ? (
                  <button
                    onClick={() => setSelectedCalendarDate(undefined)}
                    className="text-sm text-primary hover:underline mt-2"
                  >
                    Show all upcoming
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    {config.description}
                  </p>
                )}
              </div>
            ) : (
              <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {filteredTasks.map((task) => (
                  <div key={task.id} data-task-row>
                    <DraggableTaskRow
                      task={task}
                      onToggle={() => onToggleTask(task.id)}
                      onDelete={() => onDeleteTask(task.id)}
                      onEdit={() => onEditTask(task)}
                      onAddSubtask={(title) => onAddSubtask(task.id, title)}
                      onToggleSubtask={(subtaskId) => onToggleSubtask(task.id, subtaskId)}
                      onDeleteSubtask={(subtaskId) => onDeleteSubtask(task.id, subtaskId)}
                      onReorderSubtasks={onReorderSubtasks ? (activeId, overId) => onReorderSubtasks(task.id, activeId, overId) : undefined}
                      onUpdateDueDate={(date) => onUpdateTaskDueDate(task.id, date)}
                      onUpdateProject={(projectId, areaId) => onUpdateTaskProject(task.id, projectId, areaId)}
                      onUpdateRecurrence={(type, interval) => onUpdateTaskRecurrence(task.id, type, interval)}
                      isLoading={isTaskLoading?.(task.id)}
                      projects={projects}
                      areas={areas}
                    />
                  </div>
                ))}
              </SortableContext>
            )}

            {/* Debts due on selected date */}
            {filteredDebts.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 px-1">
                  Debts due
                </p>
                {filteredDebts.map(debt => (
                  <div
                    key={debt.id}
                    className="task-row bg-card hover:bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <div className={cn(
                      "w-[22px] h-[22px] rounded-full flex items-center justify-center",
                      debt.type === 'owed_to_me'
                        ? "bg-things-green/20 text-things-green"
                        : "bg-things-red/20 text-things-red"
                    )}>
                      {debt.type === 'owed_to_me'
                        ? <ArrowDownLeft className="w-3 h-3" />
                        : <ArrowUpRight className="w-3 h-3" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] leading-relaxed text-foreground">
                        {debt.type === 'owed_to_me' ? `${debt.personName} owes you` : `You owe ${debt.personName}`}
                      </p>
                      {debt.description && (
                        <p className="text-xs text-muted-foreground truncate">{debt.description}</p>
                      )}
                    </div>
                    <div className={cn(
                      "text-sm font-semibold",
                      debt.type === 'owed_to_me' ? "text-things-green" : "text-things-red"
                    )}>
                      {formatCurrency(debt.remainingAmount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="task-row bg-card shadow-hover ring-2 ring-primary/20 rounded-xl">
                <div className="w-[22px] h-[22px] rounded-full border-2 border-muted-foreground/40" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] leading-relaxed">{activeTask.title}</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Item Count */}
        {(filteredTasks.length > 0 || filteredDebts.length > 0) && (
          <div className="mt-8 pt-4 border-t border-border animate-fade-up">
            <p className="text-sm text-muted-foreground text-center">
              {filteredTasks.length > 0 && (
                <span>{filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}</span>
              )}
              {filteredTasks.length > 0 && filteredDebts.length > 0 && <span>, </span>}
              {filteredDebts.length > 0 && (
                <span>{filteredDebts.length} {filteredDebts.length === 1 ? 'debt' : 'debts'}</span>
              )}
              {selectedCalendarDate && view === 'upcoming' && (
                <button
                  onClick={() => setSelectedCalendarDate(undefined)}
                  className="block text-xs mt-1 text-primary hover:underline mx-auto"
                >
                  Show all upcoming
                </button>
              )}
              {canMove && !isDragging && !selectedCalendarDate && (
                <span className="block text-xs mt-1 text-muted-foreground/60">
                  Drag tasks to reorder or move to other views
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Draggable Add Button - only show on desktop and non-logbook views */}
      {view !== 'logbook' && (
        <DraggableAddButton
          onAddTask={(title) => {
            if (view === 'upcoming' && selectedCalendarDate) {
              onAddTask(title, selectedCalendarDate);
            } else {
              onAddTask(title);
            }
          }}
          taskListRef={taskListRef}
          disabled={loading}
        />
      )}

      {/* Clear Logbook Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        onConfirm={() => {
          onClearLogbook?.();
          setShowClearDialog(false);
        }}
        title="Clear Logbook"
        description={`This will permanently delete all ${tasks.length} completed tasks from your logbook. This action cannot be undone.`}
      />
    </main>
  );
}
