import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Calendar, Clock, Sparkles, Loader2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface ParsedTask {
  title: string;
  dueDate?: string;
  dueTime?: string;
  when: 'today' | 'anytime' | 'someday' | 'inbox';
  hasParsedDate: boolean;
}

interface SmartTaskInputProps {
  onAdd: (title: string, dueDate?: Date, when?: string) => void;
  placeholder?: string;
  selectedDate?: Date;
}

export function SmartTaskInput({ onAdd, placeholder = 'Новая задача...', selectedDate }: SmartTaskInputProps) {
  const [isActive, setIsActive] = useState(false);
  const [value, setValue] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedTask | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleSpeechResult = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setValue(prev => prev + transcript);
    } else {
      setValue(prev => {
        const baseText = prev.replace(/\s*\[.*?\]\s*$/, '');
        return baseText + (baseText ? ' ' : '') + transcript;
      });
    }
  }, []);

  const { isListening, isSupported, toggleListening } = useSpeechRecognition({
    lang: 'ru-RU',
    onResult: handleSpeechResult,
  });

  const handleMicClick = useCallback(() => {
    setIsActive(true);
    toggleListening();
  }, [toggleListening]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Debounced parsing
  useEffect(() => {
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }

    if (!value.trim() || value.length < 5) {
      setParsedPreview(null);
      return;
    }

    // Check if input might contain date/time hints
    const dateHints = /завтра|послезавтра|понедельник|вторник|сред[ау]|четверг|пятниц[ау]|суббот[ау]|воскресень[ея]|через|в \d|утром|вечером|днём|ночью|\d{1,2}:\d{2}|\d{1,2} час/i;
    
    if (!dateHints.test(value)) {
      setParsedPreview(null);
      return;
    }

    parseTimeoutRef.current = setTimeout(async () => {
      setIsParsing(true);
      try {
        const { data, error } = await supabase.functions.invoke('parse-task', {
          body: { 
            input: value,
            currentDate: format(new Date(), 'yyyy-MM-dd')
          },
        });

        if (error) throw error;
        
        if (data && !data.error && data.hasParsedDate) {
          setParsedPreview(data);
        } else {
          setParsedPreview(null);
        }
      } catch (error) {
        console.error('Parse error:', error);
        setParsedPreview(null);
      } finally {
        setIsParsing(false);
      }
    }, 600);

    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, [value]);

  const handleSubmit = async () => {
    if (!value.trim()) {
      setIsActive(false);
      return;
    }

    // If we have a parsed preview, use it
    if (parsedPreview && parsedPreview.hasParsedDate) {
      let dueDate: Date | undefined;
      
      if (parsedPreview.dueDate) {
        dueDate = new Date(parsedPreview.dueDate);
        if (parsedPreview.dueTime) {
          const [hours, minutes] = parsedPreview.dueTime.split(':').map(Number);
          dueDate.setHours(hours, minutes, 0, 0);
        }
      }

      onAdd(parsedPreview.title, dueDate, parsedPreview.when);
      
      toast({
        title: 'Задача добавлена',
        description: parsedPreview.dueDate 
          ? `${parsedPreview.title} — ${format(new Date(parsedPreview.dueDate), 'd MMM', { locale: ru })}${parsedPreview.dueTime ? ` в ${parsedPreview.dueTime}` : ''}`
          : parsedPreview.title,
      });
    } else {
      // No parsing, just add with selected date if any
      onAdd(value.trim(), selectedDate);
    }

    setValue('');
    setParsedPreview(null);
    setIsActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setValue('');
      setParsedPreview(null);
      setIsActive(false);
    }
  };

  return (
    <div className="space-y-2">
      <div 
        className={cn(
          'quick-add relative',
          isActive && 'bg-card border-primary/30 shadow-soft'
        )}
        onClick={() => setIsActive(true)}
      >
        <div className="w-[22px] h-[22px] rounded-full border-2 border-dashed border-muted-foreground/30 
                        flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 text-muted-foreground/50" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (!value.trim()) {
              setIsActive(false);
              setParsedPreview(null);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-[15px]
                     placeholder:text-muted-foreground/60"
        />
        {isParsing && (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        {!isParsing && parsedPreview && parsedPreview.hasParsedDate && (
          <Sparkles className="w-4 h-4 text-primary" />
        )}
        {selectedDate && !parsedPreview && !isListening && (
          <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
            <Calendar className="w-3 h-3" />
            <span>{format(selectedDate, 'd MMM', { locale: ru })}</span>
          </div>
        )}
        {isSupported && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleMicClick();
            }}
            className={cn(
              'p-1.5 rounded-full transition-all duration-200',
              isListening 
                ? 'bg-destructive text-destructive-foreground animate-pulse' 
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
            title={isListening ? 'Остановить запись' : 'Голосовой ввод'}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Parsed Preview */}
      {parsedPreview && parsedPreview.hasParsedDate && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium truncate">{parsedPreview.title}</span>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {parsedPreview.dueDate && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                <Calendar className="w-3 h-3" />
                {format(new Date(parsedPreview.dueDate), 'd MMM', { locale: ru })}
              </span>
            )}
            {parsedPreview.dueTime && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3" />
                {parsedPreview.dueTime}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
