import { useMemo, useState } from 'react';
import { format, startOfDay, differenceInDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Task } from '@/types/task';
import { DateRange } from './DateRangePicker';
import { Button } from './ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { TrendingUp, TrendingDown, Minus, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogbookChartProps {
  tasks: Task[];
  dateRange: DateRange;
}

type Granularity = 'day' | 'week' | 'month';

export function LogbookChart({ tasks, dateRange }: LogbookChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const chartData = useMemo(() => {
    if (tasks.length === 0) return { data: [], granularity: 'day' as Granularity };
    
    // Determine the effective date range
    const completedDates = tasks
      .filter(t => t.completedAt)
      .map(t => new Date(t.completedAt!));
    
    if (completedDates.length === 0) return { data: [], granularity: 'day' as Granularity };
    
    const minDate = dateRange.from || new Date(Math.min(...completedDates.map(d => d.getTime())));
    const maxDate = dateRange.to || new Date(Math.max(...completedDates.map(d => d.getTime())));
    
    const daysDiff = differenceInDays(maxDate, minDate);
    
    // Determine granularity based on date range
    let granularity: Granularity = 'day';
    if (daysDiff > 90) {
      granularity = 'month';
    } else if (daysDiff > 30) {
      granularity = 'week';
    }
    
    // Generate intervals
    let intervals: Date[];
    if (granularity === 'month') {
      intervals = eachMonthOfInterval({ start: startOfMonth(minDate), end: maxDate });
    } else if (granularity === 'week') {
      intervals = eachWeekOfInterval({ start: minDate, end: maxDate }, { weekStartsOn: 1 });
    } else {
      intervals = eachDayOfInterval({ start: minDate, end: maxDate });
    }
    
    // Count tasks per interval
    const data = intervals.map(intervalStart => {
      let intervalEnd: Date;
      let label: string;
      
      if (granularity === 'month') {
        intervalEnd = endOfMonth(intervalStart);
        label = format(intervalStart, 'MMM yyyy');
      } else if (granularity === 'week') {
        intervalEnd = new Date(intervalStart);
        intervalEnd.setDate(intervalEnd.getDate() + 6);
        label = format(intervalStart, 'MMM d');
      } else {
        intervalEnd = intervalStart;
        label = format(intervalStart, 'MMM d');
      }
      
      const count = tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = startOfDay(new Date(task.completedAt));
        const intervalStartDay = startOfDay(intervalStart);
        const intervalEndDay = startOfDay(intervalEnd);
        return completedDate >= intervalStartDay && completedDate <= intervalEndDay;
      }).length;
      
      return {
        date: intervalStart,
        label,
        count,
      };
    });
    
    return { data, granularity };
  }, [tasks, dateRange]);

  // Calculate trend
  const trend = useMemo(() => {
    const { data } = chartData;
    if (data.length < 2) return { direction: 'neutral' as const, percentage: 0 };
    
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint).reduce((sum, d) => sum + d.count, 0);
    const secondHalf = data.slice(midpoint).reduce((sum, d) => sum + d.count, 0);
    
    if (firstHalf === 0 && secondHalf === 0) return { direction: 'neutral' as const, percentage: 0 };
    if (firstHalf === 0) return { direction: 'up' as const, percentage: 100 };
    
    const percentage = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
    const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral';
    
    return { direction, percentage: Math.abs(percentage) };
  }, [chartData]);

  if (tasks.length === 0) {
    return null;
  }

  const maxCount = Math.max(...chartData.data.map(d => d.count), 1);

  return (
    <div className="mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <BarChart3 className="w-4 h-4" />
        <span>Completion Trends</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {!isExpanded && trend.direction !== 'neutral' && (
          <span className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
            trend.direction === 'up' 
              ? "bg-things-green/10 text-things-green" 
              : "bg-things-red/10 text-things-red"
          )}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.percentage}%
          </span>
        )}
      </button>
      
      {isExpanded && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          {/* Trend summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {trend.direction === 'up' && (
                <>
                  <div className="p-1.5 rounded-full bg-things-green/10">
                    <TrendingUp className="w-4 h-4 text-things-green" />
                  </div>
                  <span className="text-sm">
                    <span className="text-things-green font-medium">+{trend.percentage}%</span>
                    <span className="text-muted-foreground"> more completions recently</span>
                  </span>
                </>
              )}
              {trend.direction === 'down' && (
                <>
                  <div className="p-1.5 rounded-full bg-things-red/10">
                    <TrendingDown className="w-4 h-4 text-things-red" />
                  </div>
                  <span className="text-sm">
                    <span className="text-things-red font-medium">-{trend.percentage}%</span>
                    <span className="text-muted-foreground"> fewer completions recently</span>
                  </span>
                </>
              )}
              {trend.direction === 'neutral' && (
                <>
                  <div className="p-1.5 rounded-full bg-muted">
                    <Minus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Steady completion rate
                  </span>
                </>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Per {chartData.granularity}
            </span>
          </div>
          
          {/* Chart */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  hide 
                  domain={[0, maxCount]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-sm font-medium">{data.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.count} {data.count === 1 ? 'task' : 'tasks'} completed
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                >
                  {chartData.data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                      fillOpacity={0.8 + (entry.count / maxCount) * 0.2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}