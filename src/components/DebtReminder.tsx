import { useMemo } from 'react';
import { Debt } from '@/types/finance';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { AlertCircle, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebtReminderProps {
  debts: Debt[];
  onNavigateToFinance?: () => void;
}

export function DebtReminder({ debts, onNavigateToFinance }: DebtReminderProps) {
  const { overdueDebts, dueTodayDebts } = useMemo(() => {
    const today = startOfDay(new Date());
    
    const overdue: Debt[] = [];
    const dueToday: Debt[] = [];
    
    debts.forEach(debt => {
      if (debt.isSettled || !debt.dueDate) return;
      
      const dueDate = new Date(debt.dueDate);
      
      if (isToday(dueDate)) {
        dueToday.push(debt);
      } else if (isBefore(dueDate, today)) {
        overdue.push(debt);
      }
    });
    
    return { overdueDebts: overdue, dueTodayDebts: dueToday };
  }, [debts]);

  if (overdueDebts.length === 0 && dueTodayDebts.length === 0) {
    return null;
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
      <div className="border border-border rounded-xl bg-card/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-things-red" />
            <span className="text-sm font-medium text-foreground">Debt Reminders</span>
          </div>
          {onNavigateToFinance && (
            <button 
              onClick={onNavigateToFinance}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          )}
        </div>

        {/* Debt items */}
        <div className="divide-y divide-border">
          {/* Overdue debts */}
          {overdueDebts.map(debt => (
            <div 
              key={debt.id} 
              className="px-4 py-3 flex items-center gap-3 bg-destructive/5"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                debt.type === 'owed_to_me' 
                  ? "bg-things-green/10 text-things-green" 
                  : "bg-things-red/10 text-things-red"
              )}>
                {debt.type === 'owed_to_me' 
                  ? <ArrowDownLeft className="w-4 h-4" /> 
                  : <ArrowUpRight className="w-4 h-4" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {debt.personName}
                </p>
                <p className="text-xs text-destructive flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Overdue: {format(new Date(debt.dueDate!), 'MMM d')}
                </p>
              </div>
              <div className={cn(
                "text-sm font-semibold",
                debt.type === 'owed_to_me' ? "text-things-green" : "text-things-red"
              )}>
                {debt.type === 'owed_to_me' ? '+' : '-'}{formatAmount(debt.remainingAmount)}
              </div>
            </div>
          ))}

          {/* Due today */}
          {dueTodayDebts.map(debt => (
            <div 
              key={debt.id} 
              className="px-4 py-3 flex items-center gap-3"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                debt.type === 'owed_to_me' 
                  ? "bg-things-green/10 text-things-green" 
                  : "bg-things-red/10 text-things-red"
              )}>
                {debt.type === 'owed_to_me' 
                  ? <ArrowDownLeft className="w-4 h-4" /> 
                  : <ArrowUpRight className="w-4 h-4" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {debt.personName}
                </p>
                <p className="text-xs text-things-yellow flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due today
                </p>
              </div>
              <div className={cn(
                "text-sm font-semibold",
                debt.type === 'owed_to_me' ? "text-things-green" : "text-things-red"
              )}>
                {debt.type === 'owed_to_me' ? '+' : '-'}{formatAmount(debt.remainingAmount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
