import { ViewType } from '@/types/task';
import { cn } from '@/lib/utils';
import { Inbox, Star, Clock } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

interface MoveToViewDropZoneProps {
  view: ViewType;
  isActive: boolean;
  currentView: ViewType;
}

const dropZoneConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  inbox: { icon: Inbox, color: 'text-things-blue bg-things-blue/10 border-things-blue/30', label: 'Inbox' },
  today: { icon: Star, color: 'text-things-yellow bg-things-yellow/10 border-things-yellow/30', label: 'Today' },
  someday: { icon: Clock, color: 'text-things-orange bg-things-orange/10 border-things-orange/30', label: 'Someday' },
};

export function MoveToViewDropZone({ view, isActive, currentView }: MoveToViewDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone-${view}`,
    data: { type: 'view', view },
  });

  if (view === currentView || !dropZoneConfig[view]) return null;

  const config = dropZoneConfig[view];
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200',
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 py-0 overflow-hidden',
        isOver 
          ? config.color + ' scale-105'
          : 'border-border bg-muted/30 text-muted-foreground'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">Move to {config.label}</span>
    </div>
  );
}
