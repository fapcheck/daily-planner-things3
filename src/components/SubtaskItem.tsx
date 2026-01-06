import { Subtask } from '@/types/task';
import { cn } from '@/lib/utils';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SubtaskItem({ 
  subtask, 
  onToggle, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SubtaskItemProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 group hover:bg-muted/30 rounded-lg transition-colors">
      {/* Move arrows */}
      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className={cn(
            "p-0.5 text-muted-foreground hover:text-foreground transition-colors",
            isFirst && "opacity-30 cursor-not-allowed"
          )}
          aria-label="Move up"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className={cn(
            "p-0.5 text-muted-foreground hover:text-foreground transition-colors",
            isLast && "opacity-30 cursor-not-allowed"
          )}
          aria-label="Move down"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <button
        onClick={onToggle}
        className={cn(
          'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200',
          subtask.completed 
            ? 'bg-primary border-primary' 
            : 'border-muted-foreground/40 hover:border-primary/60'
        )}
        aria-label={subtask.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {subtask.completed && (
          <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      
      <span className={cn(
        'flex-1 text-sm transition-colors',
        subtask.completed && 'line-through text-muted-foreground'
      )}>
        {subtask.title}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 
                   text-muted-foreground hover:text-destructive transition-all"
        aria-label="Delete subtask"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
