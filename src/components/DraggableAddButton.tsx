import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableAddButtonProps {
  onAddTask: (title: string, position?: number) => void;
  taskListRef?: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

interface DragPosition {
  x: number;
  y: number;
}

interface TrailDot {
  id: number;
  x: number;
  y: number;
}

export function DraggableAddButton({ 
  onAddTask, 
  taskListRef,
  disabled = false 
}: DraggableAddButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startPosRef = useRef<DragPosition>({ x: 0, y: 0 });
  const trailIdRef = useRef(0);

  // Focus input when shown
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  // Add trail dot during drag
  useEffect(() => {
    if (isDragging && dragPosition) {
      const newDot: TrailDot = {
        id: trailIdRef.current++,
        x: dragPosition.x,
        y: dragPosition.y,
      };
      setTrail(prev => [...prev.slice(-8), newDot]);
    }
  }, [isDragging, dragPosition]);

  // Clear trail when not dragging
  useEffect(() => {
    if (!isDragging) {
      const timer = setTimeout(() => setTrail([]), 300);
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  const calculateInsertIndex = useCallback((y: number) => {
    if (!taskListRef?.current) return 0;
    
    const taskRows = taskListRef.current.querySelectorAll('[data-task-row]');
    if (taskRows.length === 0) return 0;

    for (let i = 0; i < taskRows.length; i++) {
      const rect = taskRows[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (y < midpoint) {
        return i;
      }
    }
    return taskRows.length;
  }, [taskListRef]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    
    startPosRef.current = { x: clientX, y: clientY };
    setDragPosition({ x: clientX, y: clientY });
    setIsDragging(true);
    setInsertIndex(calculateInsertIndex(clientY));
  }, [disabled, calculateInsertIndex]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    setDragPosition({ x: clientX, y: clientY });
    setInsertIndex(calculateInsertIndex(clientY));
  }, [isDragging, calculateInsertIndex]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    const finalIndex = insertIndex;
    setIsDragging(false);
    setDragPosition(null);
    
    if (finalIndex !== null) {
      setIsAnimatingIn(true);
      setShowInput(true);
      
      setTimeout(() => setIsAnimatingIn(false), 300);
    }
    
    setInsertIndex(null);
  }, [isDragging, insertIndex]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      onAddTask(taskTitle.trim(), insertIndex ?? undefined);
      setTaskTitle('');
    }
    setShowInput(false);
  };

  const handleClick = () => {
    if (!isDragging && !showInput) {
      setShowInput(true);
    }
  };

  if (disabled) return null;

  return (
    <>
      {/* Trail dots */}
      {trail.map((dot, i) => (
        <div
          key={dot.id}
          className="fixed pointer-events-none z-40 rounded-full bg-primary/30"
          style={{
            left: dot.x - 4,
            top: dot.y - 4,
            width: 8 + i * 0.5,
            height: 8 + i * 0.5,
            opacity: (i + 1) / trail.length * 0.6,
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.3s ease-out',
          }}
        />
      ))}

      {/* Insert position indicator */}
      {isDragging && insertIndex !== null && taskListRef?.current && (
        <div
          className="absolute left-4 right-4 h-1 bg-primary rounded-full z-30 animate-pulse"
          style={{
            top: (() => {
              const taskRows = taskListRef.current?.querySelectorAll('[data-task-row]');
              if (!taskRows || taskRows.length === 0) return 0;
              
              if (insertIndex === 0) {
                const firstRect = taskRows[0].getBoundingClientRect();
                const containerRect = taskListRef.current?.getBoundingClientRect();
                return firstRect.top - (containerRect?.top || 0) - 4;
              }
              
              if (insertIndex >= taskRows.length) {
                const lastRect = taskRows[taskRows.length - 1].getBoundingClientRect();
                const containerRect = taskListRef.current?.getBoundingClientRect();
                return lastRect.bottom - (containerRect?.top || 0) + 4;
              }
              
              const rect = taskRows[insertIndex].getBoundingClientRect();
              const containerRect = taskListRef.current?.getBoundingClientRect();
              return rect.top - (containerRect?.top || 0) - 4;
            })(),
          }}
        />
      )}

      {/* Dragging button */}
      {isDragging && dragPosition && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground 
                          shadow-lg flex items-center justify-center
                          animate-pulse ring-4 ring-primary/30">
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </div>
        </div>
      )}

      {/* Inline task input after drop */}
      {showInput && (
        <div 
          className={cn(
            "fixed inset-x-4 bottom-24 md:bottom-8 md:right-8 md:left-auto md:w-80 z-50",
            isAnimatingIn && "animate-scale-in"
          )}
        >
          <form 
            onSubmit={handleSubmit}
            className="bg-card border border-border shadow-hover rounded-2xl p-3 flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="New task..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              onBlur={() => {
                if (!taskTitle.trim()) {
                  setShowInput(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowInput(false);
                  setTaskTitle('');
                }
              }}
            />
            <button
              type="submit"
              disabled={!taskTitle.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* Main floating button - desktop only */}
      {!isDragging && !showInput && (
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 rounded-full z-40",
            "bg-primary text-primary-foreground",
            "shadow-lg hover:shadow-xl",
            "flex items-center justify-center",
            "transition-all duration-200 ease-out",
            "hover:scale-105 active:scale-95",
            "cursor-grab active:cursor-grabbing",
            "ring-0 hover:ring-4 hover:ring-primary/20",
            "hidden md:flex" // Only show on desktop
          )}
          aria-label="Add new task - drag to position or click"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      )}
    </>
  );
}
