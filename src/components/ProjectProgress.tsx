import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProjectProgressProps {
  completed: number;
  total: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
  className?: string;
}

export function ProjectProgress({
  completed,
  total,
  color,
  size = 20,
  strokeWidth = 3,
  onClick,
  className,
}: ProjectProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  const progress = total > 0 ? completed / total : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - animatedProgress * circumference;
  
  // Animate progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [progress]);

  // Don't show if no tasks
  if (total === 0) {
    return null;
  }

  const isComplete = completed === total;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center transition-transform hover:scale-110',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ width: size, height: size }}
      title={`${completed} of ${total} tasks completed`}
      aria-label={`${completed} of ${total} tasks completed. Click to view project.`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: isComplete ? `drop-shadow(0 0 4px ${color})` : undefined,
          }}
        />
      </svg>
      
      {/* Completion checkmark - centered inside the circle */}
      {isComplete && (
        <svg
          className="absolute animate-scale-in"
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <path
            d="M6 12l4 4 8-8"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-checkmark-draw"
          />
        </svg>
      )}
    </button>
  );
}
