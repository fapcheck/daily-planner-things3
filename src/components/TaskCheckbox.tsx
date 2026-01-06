import { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
  isLoading?: boolean;
}

export function TaskCheckbox({ checked, onChange, className, isLoading }: TaskCheckboxProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const prevCheckedRef = useRef(checked);

  // Trigger haptic feedback on mobile
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Short 10ms vibration
    }
  };

  useEffect(() => {
    // Detect when task changes from incomplete to complete
    if (checked && !prevCheckedRef.current) {
      setJustCompleted(true);
      setShowEffects(true);
      triggerHaptic();
      
      // Clear justCompleted after animation
      const timer = setTimeout(() => {
        setJustCompleted(false);
      }, 600);

      // Clear effects after animation completes
      const effectsTimer = setTimeout(() => {
        setShowEffects(false);
      }, 700);

      prevCheckedRef.current = checked;
      
      return () => {
        clearTimeout(timer);
        clearTimeout(effectsTimer);
      };
    }
    prevCheckedRef.current = checked;
  }, [checked]);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!isLoading) onChange();
      }}
      disabled={isLoading}
      className={cn(
        'task-checkbox', 
        checked && 'checked', 
        justCompleted && 'just-completed',
        isLoading && 'animate-pulse-ring', 
        className
      )}
      aria-label={checked ? 'Mark as incomplete' : 'Mark as complete'}
    >
      {/* Success ripple effect */}
      {showEffects && <span className="ripple" />}
      
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 text-things-green animate-spin" />
      ) : (
        <Check 
          className={cn(
            'checkmark w-3.5 h-3.5 text-primary-foreground stroke-[3]',
            checked ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          )} 
        />
      )}
    </button>
  );
}
