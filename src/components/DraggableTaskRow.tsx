import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Project, Area, RecurrenceType } from '@/types/task';
import { TaskCheckbox } from './TaskCheckbox';
import { SubtaskList } from './SubtaskList';
import { TaskDatePicker } from './TaskDatePicker';
import { TaskProjectPicker } from './TaskProjectPicker';
import { TaskRecurrencePicker } from './TaskRecurrencePicker';
import { cn } from '@/lib/utils';
import { Trash2, GripVertical, ChevronRight, ListChecks, Repeat, Pencil, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';

interface DraggableTaskRowProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onReorderSubtasks?: (activeId: string, overId: string) => void;
  onUpdateDueDate: (date: Date | undefined) => void;
  onUpdateProject: (projectId: string | undefined, areaId: string | undefined) => void;
  onUpdateRecurrence: (type: RecurrenceType | undefined, interval: number) => void;
  isLoading?: boolean;
  projects: Project[];
  areas: Area[];
}

export function DraggableTaskRow({
  task,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
  onUpdateDueDate,
  onUpdateProject,
  onUpdateRecurrence,
  isLoading,
  projects,
  areas,
}: DraggableTaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevCompletedRef = useRef(task.completed);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Track completion state changes
  useEffect(() => {
    if (task.completed && !prevCompletedRef.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 500);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = task.completed;
  }, [task.completed]);

  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const hasSubtasks = subtaskCount > 0;

  // Format date for mobile badge
  const formatMobileDate = (date: Date | undefined) => {
    if (!date) return null;
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const mobileDate = formatMobileDate(task.dueDate);
  const isOverdue = task.dueDate && isPast(startOfDay(task.dueDate)) && !isToday(task.dueDate) && !task.completed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'animate-fade-up',
        isDragging && 'z-50'
      )}
    >
      <div
        className={cn(
          'task-row group',
          task.completed && 'completed',
          justCompleted && 'just-completed',
          isDragging && 'shadow-hover bg-card ring-2 ring-primary/20',
          isExpanded && 'bg-muted/30'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Drag Handle - hidden on mobile */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="hidden md:flex opacity-0 group-hover:opacity-100 p-1 -ml-2 mr-0.5 cursor-grab active:cursor-grabbing
                     text-muted-foreground/50 hover:text-muted-foreground transition-opacity
                     items-center justify-center"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Expand indicator */}
        <ChevronRight
          className={cn(
            'w-4 h-4 text-muted-foreground/40 transition-transform duration-200 -ml-1 mr-1 shrink-0',
            isExpanded && 'rotate-90'
          )}
        />

        <div onClick={(e) => e.stopPropagation()} className="touch-manipulation">
          <TaskCheckbox checked={task.completed} onChange={onToggle} isLoading={isLoading} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'task-title text-[15px] leading-relaxed transition-colors duration-200',
            task.completed && 'text-muted-foreground'
          )}>
            {task.title}
          </p>
          {task.notes && !isExpanded && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {task.notes}
            </p>
          )}
        </div>

        {/* Project picker - hidden on mobile */}
        <div onClick={(e) => e.stopPropagation()} className="hidden md:block">
          <TaskProjectPicker
            projectId={task.project}
            areaId={task.area}
            projects={projects}
            areas={areas}
            onProjectChange={(projectId) => onUpdateProject(projectId, undefined)}
            onAreaChange={(areaId) => onUpdateProject(undefined, areaId)}
            compact
          />
        </div>

        {/* Recurrence picker - hidden on mobile */}
        <div onClick={(e) => e.stopPropagation()} className="hidden md:block">
          <TaskRecurrencePicker
            recurrenceType={task.recurrenceType}
            recurrenceInterval={task.recurrenceInterval}
            onRecurrenceChange={onUpdateRecurrence}
            compact
          />
        </div>

        {/* Date picker - hidden on mobile */}
        <div onClick={(e) => e.stopPropagation()} className="hidden md:block">
          <TaskDatePicker
            date={task.dueDate}
            onDateChange={onUpdateDueDate}
            compact
          />
        </div>

        {/* Mobile badges for project, date and recurrence */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {(() => {
            const project = projects.find(p => p.id === task.project);
            const area = areas.find(a => a.id === task.area);
            const item = project || area;
            if (!item) return null;
            return (
              <span
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground max-w-[80px]"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
            );
          })()}
          {mobileDate && (
            <span className={cn(
              'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full',
              isOverdue
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground'
            )}>
              <Calendar className="w-2.5 h-2.5" />
              {mobileDate}
            </span>
          )}
          {task.recurrenceType && (
            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              <Repeat className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Recurrence indicator - desktop only */}
        {task.recurrenceType && !isExpanded && (
          <div className="hidden md:block text-primary" title={`Repeats ${task.recurrenceType}`}>
            <Repeat className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Subtask indicator */}
        {hasSubtasks && !isExpanded && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ListChecks className="w-3.5 h-3.5" />
            <span>{completedSubtasks}/{subtaskCount}</span>
          </div>
        )}

        {/* Edit button - hidden on mobile, tap row to edit */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="hidden md:flex opacity-0 group-hover:opacity-100 p-1.5 rounded-lg 
                     hover:bg-primary/10 text-muted-foreground hover:text-primary
                     transition-all duration-150 items-center justify-center"
          aria-label="Edit task"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Delete button - hidden on mobile */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="hidden md:flex opacity-0 group-hover:opacity-100 p-1.5 rounded-lg 
                     hover:bg-destructive/10 text-muted-foreground hover:text-destructive
                     transition-all duration-150 items-center justify-center"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded content with subtasks */}
      {isExpanded && (
        <div className="pb-3 animate-fade-up">
          {task.notes && (
            <p className="text-sm text-muted-foreground ml-14 mb-2">
              {task.notes}
            </p>
          )}
          <SubtaskList
            subtasks={task.subtasks || []}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onAddSubtask={onAddSubtask}
            onReorderSubtasks={onReorderSubtasks}
          />
        </div>
      )}
    </div>
  );
}
