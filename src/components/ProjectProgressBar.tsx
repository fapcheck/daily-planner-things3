import { cn } from '@/lib/utils';

interface ProjectProgressBarProps {
  completed: number;
  total: number;
  color: string;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProjectProgressBar({
  completed,
  total,
  color,
  className,
  showPercentage = true,
  size = 'md',
}: ProjectProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = percentage === 100;

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 bg-muted rounded-full overflow-hidden", sizeStyles[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isComplete && "animate-progress-complete"
          )}
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showPercentage && (
        <span
          className={cn(
            "text-xs font-medium tabular-nums transition-colors",
            isComplete ? "text-things-green" : "text-muted-foreground"
          )}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
}

