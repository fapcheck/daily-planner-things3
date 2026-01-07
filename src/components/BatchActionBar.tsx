import { Check, X, Trash2, Archive, Move, ListChecks } from 'lucide-react';
import { ViewType } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface BatchActionBarProps {
  selectedCount: number;
  onCompleteSelected: () => void;
  onDeleteSelected: () => void;
  onMoveSelected: (view: 'inbox' | 'today' | 'someday') => void;
  onClearSelection: () => void;
  className?: string;
}

const viewOptions = [
  { value: 'inbox' as const, label: 'Inbox', icon: Archive, color: 'text-things-blue' },
  { value: 'today' as const, label: 'Today', icon: Check, color: 'text-things-yellow' },
  { value: 'someday' as const, label: 'Someday', icon: ListChecks, color: 'text-things-orange' },
];

export function BatchActionBar({
  selectedCount,
  onCompleteSelected,
  onDeleteSelected,
  onMoveSelected,
  onClearSelection,
  className,
}: BatchActionBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40',
        'animate-slide-up',
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full shadow-card">
        {/* Selected count */}
        <span className="text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Complete all */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCompleteSelected}
          className="h-8 px-2 text-things-green hover:text-things-green hover:bg-things-green/10"
          title="Complete all selected"
        >
          <Check className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Complete</span>
        </Button>

        {/* Move dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              title="Move to view"
            >
              <Move className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Move</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top">
            {viewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onMoveSelected(option.value)}
                  className="cursor-pointer"
                >
                  <Icon className={cn('w-4 h-4 mr-2', option.color)} />
                  Move to {option.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete all */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteSelected}
          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Delete all selected"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Delete</span>
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Clear selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}


