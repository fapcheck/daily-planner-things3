import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Task } from '@/types/task';
import { Debt } from '@/types/finance';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface UpcomingCalendarProps {
  tasks: Task[];
  debts?: Debt[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export function UpcomingCalendar({ tasks, debts = [], selectedDate, onSelectDate }: UpcomingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Get all dates that have tasks with due dates
  const taskDates = useMemo(() => {
    const dates = new Map<string, number>();
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        dates.set(dateKey, (dates.get(dateKey) || 0) + 1);
      }
    });
    return dates;
  }, [tasks]);

  // Get all dates that have debt payments due
  const debtDates = useMemo(() => {
    const dates = new Map<string, number>();
    debts.forEach(debt => {
      if (debt.dueDate && !debt.isSettled) {
        const dateKey = format(new Date(debt.dueDate), 'yyyy-MM-dd');
        dates.set(dateKey, (dates.get(dateKey) || 0) + 1);
      }
    });
    return dates;
  }, [debts]);

  // Custom day content to show task and debt indicators
  const modifiers = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    const hasTaskDays = daysInMonth.filter(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return taskDates.has(dateKey);
    });

    const hasDebtDays = daysInMonth.filter(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return debtDates.has(dateKey);
    });

    // Days with both tasks and debts
    const hasBothDays = daysInMonth.filter(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return taskDates.has(dateKey) && debtDates.has(dateKey);
    });

    return {
      hasTask: hasTaskDays.filter(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        return !debtDates.has(dateKey);
      }),
      hasDebt: hasDebtDays.filter(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        return !taskDates.has(dateKey);
      }),
      hasBoth: hasBothDays,
    };
  }, [currentMonth, taskDates, debtDates]);

  const modifiersClassNames = {
    hasTask: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full',
    hasDebt: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-things-red after:rounded-full',
    hasBoth: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-2.5 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-primary after:to-things-red',
  };

  return (
    <div className="mb-6 border border-border rounded-xl bg-card/50 p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        onMonthChange={setCurrentMonth}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="pointer-events-auto mx-auto"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4 w-full",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border rounded-md hover:bg-muted transition-colors inline-flex items-center justify-center"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex justify-between",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
          row: "flex w-full mt-2 justify-between",
          cell: "h-9 w-9 text-center text-sm p-0 relative flex-1 flex items-center justify-center",
          day: cn(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-muted transition-colors inline-flex items-center justify-center"
          ),
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_hidden: "invisible",
        }}
      />
      
      {/* Selected date label */}
      {selectedDate && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Showing tasks for {format(selectedDate, 'MMM d, yyyy')}
          </p>
          <button
            onClick={() => onSelectDate(undefined)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear date filter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
