import { ReactNode } from 'react';
import { Task, RecurrenceType } from '@/types/task';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Check, Copy, Calendar, FolderOpen, Briefcase, Archive, Trash2, Sparkles } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

interface TaskContextMenuProps {
  task: Task;
  children: ReactNode;
  onDuplicate: () => void;
  onMoveToView: (view: 'inbox' | 'today' | 'someday') => void;
  onCopyTitle: () => void;
  onSetDueDate: (date: Date | undefined) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onUpdateProject: (projectId: string | undefined, areaId: string | undefined) => void;
  onUpdateRecurrence: (type: RecurrenceType | undefined, interval: number) => void;
}

export function TaskContextMenu({
  task,
  children,
  onDuplicate,
  onMoveToView,
  onCopyTitle,
  onSetDueDate,
  onToggleComplete,
  onDelete,
  onUpdateProject,
  onUpdateRecurrence,
}: TaskContextMenuProps) {
  const handleSetDueToday = () => {
    onSetDueDate(new Date());
  };

  const handleSetDueTomorrow = () => {
    onSetDueDate(addDays(new Date(), 1));
  };

  const handleSetDueNextWeek = () => {
    const startOfNextWeek = startOfWeek(addDays(new Date(), 7));
    onSetDueDate(startOfNextWeek);
  };

  const handleClearDueDate = () => {
    onSetDueDate(undefined);
  };

  const handleToggleRecurrence = () => {
    if (task.recurrenceType) {
      onUpdateRecurrence(undefined, 1);
    } else {
      onUpdateRecurrence('daily', 1);
    }
  };

  const handleClearProject = () => {
    onUpdateProject(undefined, undefined);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Completion */}
        <ContextMenuItem onClick={onToggleComplete}>
          <Check className="w-4 h-4 mr-2 text-things-green" />
          {task.completed ? 'Mark incomplete' : 'Mark complete'}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Quick Actions */}
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate task
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopyTitle}>
          <Copy className="w-4 h-4 mr-2" />
          Copy title
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Due Date */}
        <ContextMenuItem onClick={handleSetDueToday}>
          <Calendar className="w-4 h-4 mr-2" />
          Due today
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSetDueTomorrow}>
          <Calendar className="w-4 h-4 mr-2" />
          Due tomorrow
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSetDueNextWeek}>
          <Calendar className="w-4 h-4 mr-2" />
          Due next week
        </ContextMenuItem>
        {task.dueDate && (
          <ContextMenuItem onClick={handleClearDueDate}>
            <Calendar className="w-4 h-4 mr-2" />
            Clear due date
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Recurrence */}
        <ContextMenuItem onClick={handleToggleRecurrence}>
          <Sparkles className="w-4 h-4 mr-2" />
          {task.recurrenceType ? 'Remove recurrence' : 'Make recurring (daily)'}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Move to View */}
        <ContextMenuItem onClick={() => onMoveToView('inbox')}>
          <Archive className="w-4 h-4 mr-2 text-things-blue" />
          Move to Inbox
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMoveToView('today')}>
          <Archive className="w-4 h-4 mr-2 text-things-yellow" />
          Move to Today
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMoveToView('someday')}>
          <Archive className="w-4 h-4 mr-2 text-things-orange" />
          Move to Someday
        </ContextMenuItem>

        {/* Project */}
        {task.project && (
          <ContextMenuItem onClick={handleClearProject}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Remove from project
          </ContextMenuItem>
        )}
        {task.area && (
          <ContextMenuItem onClick={handleClearProject}>
            <Briefcase className="w-4 h-4 mr-2" />
            Remove from area
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete task
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

