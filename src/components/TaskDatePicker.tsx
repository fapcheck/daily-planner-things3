import { useState } from 'react';
import { format, isToday, isTomorrow, isThisWeek, isPast, startOfDay } from 'date-fns';
import { Calendar, Sun, Moon, CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TaskDatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  compact?: boolean;
}

export function TaskDatePicker({ date, onDateChange, compact = false }: TaskDatePickerProps) {
  const [open, setOpen] = useState(false);

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const handleQuickDate = (days: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    newDate.setHours(0, 0, 0, 0);
    onDateChange(newDate);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange(undefined);
    setOpen(false);
  };

  const isOverdue = date && isPast(startOfDay(date)) && !isToday(date);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'h-7 gap-1.5 text-xs font-normal',
            compact && 'px-1.5',
            !date && 'text-muted-foreground/60',
            date && 'text-primary',
            isOverdue && 'text-destructive'
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          {date ? (
            <>
              <span>{formatDateLabel(date)}</span>
              <X 
                className="w-3 h-3 opacity-50 hover:opacity-100" 
                onClick={handleClear}
              />
            </>
          ) : (
            !compact && <span>When</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b border-border space-y-1">
          <button
            onClick={() => handleQuickDate(0)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm
                       hover:bg-accent text-left transition-colors"
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Today</span>
            <span className="ml-auto text-muted-foreground text-xs">
              {format(new Date(), 'EEE')}
            </span>
          </button>
          <button
            onClick={() => handleQuickDate(1)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm
                       hover:bg-accent text-left transition-colors"
          >
            <Moon className="w-4 h-4 text-amber-600" />
            <span>Tomorrow</span>
            <span className="ml-auto text-muted-foreground text-xs">
              {format(new Date(Date.now() + 86400000), 'EEE')}
            </span>
          </button>
          <button
            onClick={() => {
              const date = new Date();
              const daysUntilSaturday = (6 - date.getDay() + 7) % 7 || 7;
              handleQuickDate(daysUntilSaturday);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm
                       hover:bg-accent text-left transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-primary" />
            <span>This Weekend</span>
            <span className="ml-auto text-muted-foreground text-xs">Sat</span>
          </button>
        </div>
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={(date) => {
            onDateChange(date);
            setOpen(false);
          }}
          disabled={(date) => date < startOfDay(new Date())}
          initialFocus
          className="p-3 pointer-events-auto"
        />
        {date && (
          <div className="p-2 border-t border-border">
            <button
              onClick={handleClear}
              className="w-full px-3 py-2 rounded-md text-sm text-muted-foreground
                         hover:bg-accent text-left transition-colors"
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
