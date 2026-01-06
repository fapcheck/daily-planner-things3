import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Task, Project, Area } from '@/types/task';
import { Search, X, Filter, Calendar, FolderOpen, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TaskSearchProps {
  tasks: Task[];
  projects: Project[];
  areas: Area[];
  onSelectTask: (task: Task) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = 'all' | 'today' | 'upcoming' | 'withDueDate' | 'project' | 'area';

export function TaskSearch({ 
  tasks, 
  projects, 
  areas, 
  onSelectTask,
  isOpen,
  onOpenChange,
}: TaskSearchProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setFilter('all');
      setSelectedProjectId(undefined);
      setSelectedAreaId(undefined);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when query or filters change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filter, selectedProjectId, selectedAreaId]);

  const filteredTasks = useMemo(() => {
    let results = tasks.filter(t => !t.completed);

    // Text search
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) ||
        t.notes?.toLowerCase().includes(lowerQuery) ||
        t.subtasks?.some(s => s.title.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    switch (filter) {
      case 'today':
        results = results.filter(t => t.when === 'today');
        break;
      case 'upcoming':
        results = results.filter(t => t.dueDate);
        break;
      case 'withDueDate':
        results = results.filter(t => t.dueDate);
        break;
      case 'project':
        if (selectedProjectId) {
          results = results.filter(t => t.project === selectedProjectId);
        }
        break;
      case 'area':
        if (selectedAreaId) {
          results = results.filter(t => t.area === selectedAreaId);
        }
        break;
    }

    return results.slice(0, 10); // Limit results
  }, [tasks, query, filter, selectedProjectId, selectedAreaId]);

  const handleSelect = useCallback((task: Task) => {
    onSelectTask(task);
    onOpenChange(false);
  }, [onSelectTask, onOpenChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredTasks.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredTasks.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTasks[selectedIndex]) {
          handleSelect(filteredTasks[selectedIndex]);
        }
        break;
    }
  }, [filteredTasks, selectedIndex, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && filteredTasks.length > 0) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredTasks.length]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onOpenChange]);

  const clearFilters = () => {
    setFilter('all');
    setSelectedProjectId(undefined);
    setSelectedAreaId(undefined);
  };

  const hasActiveFilters = filter !== 'all' || selectedProjectId || selectedAreaId;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div 
        className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-xl shadow-hover overflow-hidden animate-fade-up">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tasks..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-0 text-base"
            />
            {query && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Badge 
              variant={filter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer shrink-0"
              onClick={() => { setFilter('all'); clearFilters(); }}
            >
              All
            </Badge>
            <Badge 
              variant={filter === 'today' ? 'default' : 'outline'}
              className="cursor-pointer shrink-0"
              onClick={() => setFilter('today')}
            >
              Today
            </Badge>
            <Badge 
              variant={filter === 'withDueDate' ? 'default' : 'outline'}
              className="cursor-pointer shrink-0"
              onClick={() => setFilter('withDueDate')}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Has Due Date
            </Badge>

            {/* Project Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Badge 
                  variant={filter === 'project' && selectedProjectId ? 'default' : 'outline'}
                  className="cursor-pointer shrink-0"
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {selectedProjectId 
                    ? projects.find(p => p.id === selectedProjectId)?.name 
                    : 'Project'
                  }
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setFilter('project');
                      setSelectedProjectId(p.id);
                      setSelectedAreaId(undefined);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-accent',
                      selectedProjectId === p.id && 'bg-accent'
                    )}
                  >
                    <FolderOpen className="w-4 h-4" style={{ color: p.color }} />
                    {p.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Area Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Badge 
                  variant={filter === 'area' && selectedAreaId ? 'default' : 'outline'}
                  className="cursor-pointer shrink-0"
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  {selectedAreaId 
                    ? areas.find(a => a.id === selectedAreaId)?.name 
                    : 'Area'
                  }
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                {areas.map(a => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setFilter('area');
                      setSelectedAreaId(a.id);
                      setSelectedProjectId(undefined);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-accent',
                      selectedAreaId === a.id && 'bg-accent'
                    )}
                  >
                    <Briefcase className="w-4 h-4" style={{ color: a.color }} />
                    {a.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs shrink-0"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-[300px] overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tasks found</p>
                {query && (
                  <p className="text-xs mt-1">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="py-2">
                {filteredTasks.map((task, index) => {
                  const project = projects.find(p => p.id === task.project);
                  const area = areas.find(a => a.id === task.area);
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <button
                      key={task.id}
                      data-index={index}
                      onClick={() => handleSelect(task)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors",
                        isSelected ? "bg-accent" : "hover:bg-accent/50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors",
                        isSelected ? "border-primary" : "border-muted-foreground/40"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {task.when && (
                            <span className="text-xs text-muted-foreground capitalize">{task.when}</span>
                          )}
                          {project && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FolderOpen className="w-3 h-3" style={{ color: project.color }} />
                              {project.name}
                            </span>
                          )}
                          {area && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Briefcase className="w-3 h-3" style={{ color: area.color }} />
                              {area.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              {task.dueDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              <kbd className="px-1 rounded bg-muted">↑↓</kbd> to navigate · <kbd className="px-1 rounded bg-muted">Enter</kbd> to select · <kbd className="px-1 rounded bg-muted">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
