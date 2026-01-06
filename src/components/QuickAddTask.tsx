import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface QuickAddTaskProps {
  onAdd: (title: string) => void;
  placeholder?: string;
  selectedDate?: Date;
}

export function QuickAddTask({ onAdd, placeholder = 'New To-Do', selectedDate }: QuickAddTaskProps) {
  const [isActive, setIsActive] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleSubmit = useCallback(() => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
    
    // Small delay before deactivating to prevent jumping
    setTimeout(() => {
      setIsActive(false);
      isSubmittingRef.current = false;
    }, 50);
  }, [value, onAdd]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if the new focus target is within the container
    const relatedTarget = e.relatedTarget as Node | null;
    if (containerRef.current?.contains(relatedTarget)) {
      return;
    }
    
    // Delay blur handling to allow click events to fire first
    setTimeout(() => {
      if (!isSubmittingRef.current) {
        handleSubmit();
      }
    }, 100);
  }, [handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setValue('');
      setIsActive(false);
    }
  };

  const handleContainerClick = () => {
    if (!isActive) {
      setIsActive(true);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        'quick-add transition-all duration-200 ease-out',
        isActive && 'bg-card border-primary/30 shadow-soft'
      )}
      onClick={handleContainerClick}
    >
      <div className="w-[22px] h-[22px] rounded-full border-2 border-dashed border-muted-foreground/30 
                      flex items-center justify-center flex-shrink-0">
        <Plus className="w-3.5 h-3.5 text-muted-foreground/50" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[15px]
                   placeholder:text-muted-foreground/60 min-w-0"
      />
      {selectedDate && (
        <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md flex-shrink-0">
          <Calendar className="w-3 h-3" />
          <span>{format(selectedDate, 'MMM d')}</span>
        </div>
      )}
    </div>
  );
}
