import { useState } from 'react';
import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecurrenceType } from '@/types/task';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface TaskRecurrencePickerProps {
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  onRecurrenceChange: (type: RecurrenceType | undefined, interval: number) => void;
  compact?: boolean;
}

const recurrenceOptions: { type: RecurrenceType; label: string }[] = [
  { type: 'daily', label: 'Daily' },
  { type: 'weekly', label: 'Weekly' },
  { type: 'monthly', label: 'Monthly' },
];

export function TaskRecurrencePicker({
  recurrenceType,
  recurrenceInterval = 1,
  onRecurrenceChange,
  compact = false,
}: TaskRecurrencePickerProps) {
  const [open, setOpen] = useState(false);
  const [interval, setInterval] = useState(recurrenceInterval);

  const handleSelect = (type: RecurrenceType) => {
    onRecurrenceChange(type, interval);
    setOpen(false);
  };

  const handleClear = () => {
    onRecurrenceChange(undefined, 1);
    setOpen(false);
  };

  const getLabel = () => {
    if (!recurrenceType) return null;
    const option = recurrenceOptions.find(o => o.type === recurrenceType);
    if (!option) return null;
    if (recurrenceInterval === 1) return option.label;
    return `Every ${recurrenceInterval} ${recurrenceType.replace('ly', 's').replace('dai', 'day')}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors rounded-md',
            compact 
              ? 'p-1.5 hover:bg-muted' 
              : 'px-2 py-1 hover:bg-muted',
            recurrenceType 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Repeat className="w-4 h-4" />
          {!compact && (
            <span className="text-xs">
              {getLabel() || 'Repeat'}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">
            Repeat
          </p>
          
          {/* Interval selector */}
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-sm text-muted-foreground">Every</span>
            <input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 px-2 py-1 text-sm border rounded-md bg-background text-center"
            />
          </div>

          <div className="border-t border-border my-1" />

          {recurrenceOptions.map((option) => (
            <Button
              key={option.type}
              variant={recurrenceType === option.type ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleSelect(option.type)}
            >
              {interval === 1 ? option.label : `${option.label.replace('ly', 's').replace('Dai', 'Day')}`}
            </Button>
          ))}

          {recurrenceType && (
            <>
              <div className="border-t border-border my-1" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={handleClear}
              >
                Remove recurrence
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}