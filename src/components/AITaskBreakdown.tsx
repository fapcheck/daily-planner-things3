import { useState } from 'react';
import { Wand2, Loader2, Plus, Clock, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Subtask {
  title: string;
  estimatedMinutes?: number;
}

interface BreakdownResult {
  subtasks: Subtask[];
  tip?: string;
}

interface AITaskBreakdownProps {
  taskTitle: string;
  taskNotes?: string;
  onAddSubtasks: (titles: string[]) => void;
  disabled?: boolean;
}

export function AITaskBreakdown({ taskTitle, taskNotes, onAddSubtasks, disabled }: AITaskBreakdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const fetchBreakdown = async () => {
    if (!taskTitle.trim()) {
      toast({
        title: 'Нужно название задачи',
        description: 'Добавьте название задачи для разбивки',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSelectedSubtasks(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('breakdown-task', {
        body: { taskTitle, taskNotes },
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      // Select all by default
      setSelectedSubtasks(new Set(data.subtasks.map((_: Subtask, i: number) => i)));
    } catch (error) {
      console.error('Error breaking down task:', error);
      toast({
        title: 'Не удалось разбить задачу',
        description: 'Попробуйте позже',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubtask = (index: number) => {
    setSelectedSubtasks(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    if (!result) return;
    
    const titlesToAdd = result.subtasks
      .filter((_, i) => selectedSubtasks.has(i))
      .map(s => s.title);
    
    if (titlesToAdd.length === 0) {
      toast({
        title: 'Выберите подзадачи',
        description: 'Отметьте подзадачи, которые хотите добавить',
      });
      return;
    }

    onAddSubtasks(titlesToAdd);
    setResult(null);
    setSelectedSubtasks(new Set());
    
    toast({
      title: 'Подзадачи добавлены',
      description: `Добавлено ${titlesToAdd.length} подзадач`,
    });
  };

  if (!result) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={fetchBreakdown}
        disabled={disabled || isLoading || !taskTitle.trim()}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Анализ...' : 'Разбить на подзадачи'}</span>
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          Предложенные подзадачи
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setResult(null)}
          className="h-7 text-xs"
        >
          Отмена
        </Button>
      </div>

      <div className="space-y-1.5">
        {result.subtasks.map((subtask, index) => (
          <button
            key={index}
            onClick={() => toggleSubtask(index)}
            className={cn(
              'w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors text-sm',
              selectedSubtasks.has(index)
                ? 'bg-primary/10 border border-primary/30'
                : 'bg-background border border-transparent hover:border-border'
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
              selectedSubtasks.has(index)
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/30'
            )}>
              {selectedSubtasks.has(index) && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="flex-1 truncate">{subtask.title}</span>
            {subtask.estimatedMinutes && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                {subtask.estimatedMinutes} мин
              </span>
            )}
          </button>
        ))}
      </div>

      {result.tip && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 text-sm">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{result.tip}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleAddSelected}
          disabled={selectedSubtasks.size === 0}
          className="flex-1 gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить выбранные ({selectedSubtasks.size})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBreakdown}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
