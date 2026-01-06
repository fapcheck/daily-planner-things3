import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { TaskCheckbox } from './TaskCheckbox';
import { TagBadge } from './TagBadge';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  style?: React.CSSProperties;
}

export function TaskRow({ task, onToggle, onDelete, style }: TaskRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevCompletedRef = useRef(task.completed);

  useEffect(() => {
    // Detect when task changes from incomplete to complete
    if (task.completed && !prevCompletedRef.current) {
      setJustCompleted(true);
      
      // Clear after animation
      const timer = setTimeout(() => {
        setJustCompleted(false);
      }, 500);

      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = task.completed;
  }, [task.completed]);

  return (
    <>
      <div 
        className={cn(
          'task-row group', 
          task.completed && 'completed',
          justCompleted && 'just-completed'
        )}
        style={style}
      >
        <TaskCheckbox checked={task.completed} onChange={onToggle} />
        <div className="flex-1 min-w-0">
          <p className={cn(
            'task-title text-[15px] leading-relaxed transition-colors duration-200',
            task.completed && 'text-muted-foreground'
          )}>
            {task.title}
          </p>
          {task.notes && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {task.notes}
            </p>
          )}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.tags.slice(0, 3).map(tag => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-muted-foreground px-1.5">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg 
                     hover:bg-destructive/10 text-muted-foreground hover:text-destructive
                     transition-all duration-150"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={onDelete}
        title="Delete Task"
        itemName={task.title}
      />
    </>
  );
}
