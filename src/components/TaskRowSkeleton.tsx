import { Skeleton } from '@/components/ui/skeleton';

interface TaskRowSkeletonProps {
  count?: number;
}

export function TaskRowSkeleton({ count = 5 }: TaskRowSkeletonProps) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="task-row animate-fade-up"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Checkbox skeleton */}
          <Skeleton className="w-[22px] h-[22px] rounded-full shrink-0" />
          
          {/* Content skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}