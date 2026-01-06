import { useState } from 'react';
import { BarChart3, Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Heart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, endOfWeek, format, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Pattern {
  type: 'positive' | 'negative' | 'neutral';
  observation: string;
}

interface StuckTask {
  taskTitle: string;
  suggestion: string;
}

interface CompletedAnalysis {
  totalCompleted: number;
  verdict: string;
  comment: string;
}

interface WeeklyReviewData {
  summary: string;
  completedAnalysis: CompletedAnalysis;
  patterns: Pattern[];
  stuckTasks?: StuckTask[];
  recommendations: string[];
  energyAdvice?: string;
}

interface WeeklyReviewProps {
  tasks: Task[];
}

export function WeeklyReview({ tasks }: WeeklyReviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState<WeeklyReviewData | null>(null);
  const { toast } = useToast();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const completedThisWeek = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
  });

  const pendingTasks = tasks.filter(t => !t.completed);

  const fetchReview = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-review', {
        body: {
          completedTasks: completedThisWeek.map(t => ({
            title: t.title,
            completedAt: t.completedAt,
          })),
          pendingTasks: pendingTasks.map(t => ({
            title: t.title,
            dueDate: t.dueDate,
            when: t.when,
          })),
          weekStart: format(weekStart, 'd MMM', { locale: ru }),
          weekEnd: format(weekEnd, 'd MMM', { locale: ru }),
        },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setReview(data);
    } catch (error) {
      console.error('Error fetching weekly review:', error);
      toast({
        title: 'Не удалось создать обзор',
        description: 'Попробуйте позже',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !review) {
      fetchReview();
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'отлично': return 'text-green-500 bg-green-500/10';
      case 'нормально': return 'text-blue-500 bg-blue-500/10';
      case 'слабо': return 'text-amber-500 bg-amber-500/10';
      case 'плохо': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20 hover:border-violet-500/40"
        >
          <BarChart3 className="w-4 h-4 text-violet-500" />
          <span className="hidden sm:inline">Обзор недели</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500" />
            Обзор недели
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, 'd MMM', { locale: ru })} — {format(weekEnd, 'd MMM', { locale: ru })}
          </p>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
            <p className="text-sm">Анализирую неделю...</p>
          </div>
        ) : review ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20">
              <p className="text-sm">{review.summary}</p>
            </div>

            {/* Completed Analysis */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{review.completedAnalysis.totalCompleted}</div>
                <div className="text-xs text-muted-foreground">выполнено</div>
              </div>
              <div className="flex-1">
                <span className={cn(
                  'inline-block px-2 py-1 rounded-full text-xs font-medium uppercase',
                  getVerdictColor(review.completedAnalysis.verdict)
                )}>
                  {review.completedAnalysis.verdict}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {review.completedAnalysis.comment}
                </p>
              </div>
            </div>

            {/* Patterns */}
            {review.patterns && review.patterns.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Паттерны</h3>
                <div className="space-y-2">
                  {review.patterns.map((pattern, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      {getPatternIcon(pattern.type)}
                      <span className="text-muted-foreground">{pattern.observation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stuck Tasks */}
            {review.stuckTasks && review.stuckTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Застрявшие задачи
                </h3>
                <div className="space-y-2">
                  {review.stuckTasks.map((task, index) => (
                    <div key={index} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="font-medium text-sm">{task.taskTitle}</div>
                      <div className="text-xs text-muted-foreground mt-1">{task.suggestion}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                На следующую неделю
              </h3>
              <div className="space-y-2">
                {review.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold">{index + 1}.</span>
                    <span className="text-muted-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Energy Advice */}
            {review.energyAdvice && (
              <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Про здоровье</p>
                    <p className="text-sm text-muted-foreground">{review.energyAdvice}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReview}
              disabled={isLoading}
              className="w-full gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить анализ
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">Не удалось загрузить обзор</p>
            <Button variant="outline" size="sm" onClick={fetchReview} className="mt-4">
              Попробовать снова
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
