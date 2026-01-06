import { useState } from 'react';
import { Sun, Moon, Sunrise, Sparkles, Loader2, X, Clock, Zap, Lightbulb, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

interface PriorityTask {
  taskId: string;
  reason: string;
  suggestedTime: string;
}

interface QuickWin {
  taskId: string;
  estimatedMinutes: number;
  reason?: string;
}

interface DailyPlan {
  greeting: string;
  focusMessage: string;
  priorityTasks: PriorityTask[];
  quickWins?: QuickWin[];
  tip: string;
}

interface DailyPlannerProps {
  tasks: Task[];
  onFocusTask: (task: Task) => void;
}

export function DailyPlanner({ tasks, onFocusTask }: DailyPlannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const { toast } = useToast();

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return Sunrise;
    if (hour < 18) return Sun;
    return Moon;
  };

  const TimeIcon = getTimeIcon();

  const completedToday = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  }).length;

  const fetchPlan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-planner', {
        body: {
          tasks: tasks.filter(t => !t.completed),
          completedToday,
        },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setPlan(data);
    } catch (error) {
      console.error('Error fetching daily plan:', error);
      toast({
        title: 'Failed to create plan',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !plan) {
      fetchPlan();
    }
  };

  const getTaskById = (taskId: string) => tasks.find(t => t.id === taskId);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40"
        >
          <TimeIcon className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">Daily Plan</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Your Daily Plan
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
            <p className="text-sm">Creating your personalized plan...</p>
          </div>
        ) : plan ? (
          <div className="space-y-6">
            {/* Greeting */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
              <p className="text-lg font-medium mb-1">{plan.greeting}</p>
              <p className="text-sm text-muted-foreground">{plan.focusMessage}</p>
            </div>

            {/* Completed Today Badge */}
            {completedToday > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Zap className="w-4 h-4" />
                <span>You've completed {completedToday} task{completedToday > 1 ? 's' : ''} today!</span>
              </div>
            )}

            {/* Priority Tasks */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Priority Tasks
              </h3>
              <div className="space-y-2">
                {plan.priorityTasks.map((pt, index) => {
                  const task = getTaskById(pt.taskId);
                  if (!task) return null;
                  return (
                    <button
                      key={pt.taskId}
                      onClick={() => {
                        onFocusTask(task);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{task.title}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{pt.reason}</p>
                          <span className="text-xs text-primary/70 mt-1 inline-block">
                            {pt.suggestedTime}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Wins */}
            {plan.quickWins && plan.quickWins.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Быстрые победы
                </h3>
                <div className="space-y-2">
                  {plan.quickWins.map((qw) => {
                    const task = getTaskById(qw.taskId);
                    if (!task) return null;
                    return (
                      <button
                        key={qw.taskId}
                        onClick={() => {
                          onFocusTask(task);
                          setIsOpen(false);
                        }}
                        className="w-full text-left p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-sm text-amber-700 dark:text-amber-400">{task.title}</span>
                          <span className="text-xs text-amber-600/70 dark:text-amber-400/70 shrink-0">~{qw.estimatedMinutes} мин</span>
                        </div>
                        {qw.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{qw.reason}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Совет дня</p>
                  <p className="text-sm text-muted-foreground">{plan.tip}</p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPlan}
              disabled={isLoading}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Обновить план
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">Failed to load plan. Try again.</p>
            <Button variant="outline" size="sm" onClick={fetchPlan} className="mt-4">
              Retry
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
