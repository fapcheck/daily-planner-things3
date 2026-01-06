import { useState } from 'react';
import { Project, Area } from '@/types/task';
import { FolderOpen, Briefcase, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TaskProjectPickerProps {
  projectId?: string;
  areaId?: string;
  projects: Project[];
  areas: Area[];
  onProjectChange: (projectId: string | undefined) => void;
  onAreaChange: (areaId: string | undefined) => void;
  compact?: boolean;
}

export function TaskProjectPicker({
  projectId,
  areaId,
  projects,
  areas,
  onProjectChange,
  onAreaChange,
  compact = false,
}: TaskProjectPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedProject = projects.find(p => p.id === projectId);
  const selectedArea = areas.find(a => a.id === areaId);
  const hasSelection = selectedProject || selectedArea;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onProjectChange(undefined);
    onAreaChange(undefined);
    setOpen(false);
  };

  const handleSelectProject = (project: Project) => {
    onProjectChange(project.id);
    onAreaChange(undefined);
    setOpen(false);
  };

  const handleSelectArea = (area: Area) => {
    onAreaChange(area.id);
    onProjectChange(undefined);
    setOpen(false);
  };

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
            !hasSelection && 'text-muted-foreground/60',
            hasSelection && 'text-foreground'
          )}
        >
          {selectedProject ? (
            <>
              <FolderOpen className="w-3.5 h-3.5" style={{ color: selectedProject.color }} />
              <span className="max-w-[80px] truncate">{selectedProject.name}</span>
              <X 
                className="w-3 h-3 opacity-50 hover:opacity-100" 
                onClick={handleClear}
              />
            </>
          ) : selectedArea ? (
            <>
              <Briefcase className="w-3.5 h-3.5" style={{ color: selectedArea.color }} />
              <span className="max-w-[80px] truncate">{selectedArea.name}</span>
              <X 
                className="w-3 h-3 opacity-50 hover:opacity-100" 
                onClick={handleClear}
              />
            </>
          ) : (
            <>
              <FolderOpen className="w-3.5 h-3.5" />
              {!compact && <span>Project</span>}
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-2" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Areas */}
        {areas.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
              Areas
            </div>
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => handleSelectArea(area)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                  'hover:bg-accent text-left transition-colors',
                  selectedArea?.id === area.id && 'bg-accent'
                )}
              >
                <Briefcase className="w-4 h-4" style={{ color: area.color }} />
                <span>{area.name}</span>
              </button>
            ))}
          </>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase mt-1">
              Projects
            </div>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                  'hover:bg-accent text-left transition-colors',
                  selectedProject?.id === project.id && 'bg-accent'
                )}
              >
                <FolderOpen className="w-4 h-4" style={{ color: project.color }} />
                <span>{project.name}</span>
              </button>
            ))}
          </>
        )}

        {hasSelection && (
          <div className="border-t border-border mt-2 pt-2">
            <button
              onClick={handleClear}
              className="w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground
                         hover:bg-accent text-left transition-colors"
            >
              No project
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
