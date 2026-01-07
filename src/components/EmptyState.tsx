import { Inbox, Star, Calendar, Clock, Archive, Plus, Sparkles, Lightbulb, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface EmptyStateProps {
  view: 'inbox' | 'today' | 'upcoming' | 'someday' | 'logbook';
  onAction?: () => void;
  hasDateSelected?: boolean;
  className?: string;
}

const getEmptyStateConfig = (hasDateSelected: boolean) => ({
  inbox: {
    icon: Inbox,
    title: "Your mind is clear!",
    description: "No tasks in your inbox. Capture your thoughts and ideas.",
    actionLabel: "Add a thought",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-things-blue",
    illustration: (
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
          <Inbox className="w-10 h-10 text-things-blue" />
        </div>
      </div>
    ),
  },
  today: {
    icon: Star,
    title: "You're all caught up!",
    description: "No tasks for today. Enjoy your productivity!",
    actionLabel: "Add a task",
    gradient: "from-yellow-500/10 to-orange-500/10",
    iconColor: "text-things-yellow",
    illustration: (
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex items-center justify-center">
          <Star className="w-10 h-10 text-things-yellow fill-current" />
        </div>
      </div>
    ),
  },
  upcoming: {
    icon: Calendar,
    title: "No upcoming tasks",
    description: hasDateSelected ? "Nothing scheduled for this date." : "Your calendar is clear. Plan ahead!",
    actionLabel: "Schedule something",
    gradient: "from-red-500/10 to-pink-500/10",
    iconColor: "text-things-red",
    illustration: (
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-500/10 to-pink-500/10 flex items-center justify-center">
          <Calendar className="w-10 h-10 text-things-red" />
        </div>
      </div>
    ),
  },
  someday: {
    icon: Coffee,
    title: "No future plans",
    description: "Nothing in your backlog. Dream big!",
    actionLabel: "Add a someday task",
    gradient: "from-orange-500/10 to-amber-500/10",
    iconColor: "text-things-orange",
    illustration: (
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center">
          <Coffee className="w-10 h-10 text-things-orange" />
        </div>
      </div>
    ),
  },
  logbook: {
    icon: Archive,
    title: "No completed tasks",
    description: "Start completing tasks to build your history!",
    actionLabel: null,
    gradient: "from-gray-500/10 to-slate-500/10",
    iconColor: "text-things-gray",
    illustration: (
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-500/20 to-slate-500/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-500/10 to-slate-500/10 flex items-center justify-center">
          <Archive className="w-10 h-10 text-things-gray" />
        </div>
      </div>
    ),
  },
});

export function EmptyState({ view, onAction, hasDateSelected = false, className }: EmptyStateProps) {
  const config = getEmptyStateConfig(hasDateSelected)[view];
  const Icon = config.icon;

  return (
    <div className={cn(
      "text-center py-12 md:py-16 animate-fade-up",
      className
    )}>
      <div className={cn(
        "bg-gradient-to-br rounded-2xl p-6 md:p-8 border border-border/50 max-w-sm mx-auto",
        config.gradient
      )}>
        {config.illustration}
        <div className="mb-2 flex items-center justify-center gap-2">
          <Icon className={cn("w-5 h-5", config.iconColor)} />
          <h3 className="text-lg font-semibold text-foreground">
            {config.title}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {view === 'upcoming' && hasDateSelected
            ? "Nothing scheduled for this date. Try selecting another date."
            : config.description
          }
        </p>
        {onAction && config.actionLabel && (
          <Button
            onClick={onAction}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            {config.actionLabel}
          </Button>
        )}
        {view === 'logbook' && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 mt-4">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground mb-1">Pro Tip</p>
              <p className="text-xs text-muted-foreground">
                Completed tasks are stored in your logbook. Use it to review your progress and celebrate your achievements!
              </p>
            </div>
          </div>
        )}
        {view === 'today' && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 mt-4">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground mb-1">Nice work!</p>
              <p className="text-xs text-muted-foreground">
                Use the "Daily Plan" button to get AI-powered suggestions for your tasks, or enjoy your free time!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

