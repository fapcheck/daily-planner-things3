import { useState, forwardRef } from 'react';
import { Subtask } from '@/types/task';
import { SubtaskItem } from './SubtaskItem';
import { Plus } from 'lucide-react';

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onAddSubtask: (title: string) => void;
  onReorderSubtasks?: (activeId: string, overId: string) => void;
}

export const SubtaskList = forwardRef<HTMLDivElement, SubtaskListProps>(function SubtaskList({ 
  subtasks, 
  onToggleSubtask, 
  onDeleteSubtask, 
  onAddSubtask,
  onReorderSubtasks,
}, ref) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddSubtask(newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0 && onReorderSubtasks) {
      onReorderSubtasks(subtasks[index].id, subtasks[index - 1].id);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < subtasks.length - 1 && onReorderSubtasks) {
      onReorderSubtasks(subtasks[index].id, subtasks[index + 1].id);
    }
  };

  const completedCount = subtasks.filter(s => s.completed).length;

  return (
    <div ref={ref} className="mt-3 ml-8 border-l-2 border-border pl-3">
      {/* Progress indicator */}
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(completedCount / subtasks.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{subtasks.length}
          </span>
        </div>
      )}

      {/* Subtask items */}
      <div className="space-y-0.5">
        {subtasks.map((subtask, index) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onToggle={() => onToggleSubtask(subtask.id)}
            onDelete={() => onDeleteSubtask(subtask.id)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            isFirst={index === 0}
            isLast={index === subtasks.length - 1}
          />
        ))}
      </div>

      {/* Add subtask input */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className="mt-2 px-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a step..."
            className="w-full text-sm bg-transparent border-b border-primary/30 
                       focus:border-primary outline-none py-1 placeholder:text-muted-foreground/50"
            autoFocus
            onBlur={() => {
              if (!newTitle.trim()) setIsAdding(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setNewTitle('');
                setIsAdding(false);
              }
            }}
          />
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground 
                     hover:text-primary mt-2 px-2 py-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add checklist item</span>
        </button>
      )}
    </div>
  );
});
