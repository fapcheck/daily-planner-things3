import { useState } from 'react';
import { Project, Area } from '@/types/task';
import { 
  FolderOpen, 
  Briefcase, 
  Plus, 
  Trash2, 
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { ProjectProgress } from '@/components/ProjectProgress';

const colorOptions = [
  'hsl(211, 100%, 50%)',  // blue
  'hsl(142, 71%, 45%)',   // green
  'hsl(270, 70%, 60%)',   // purple
  'hsl(0, 72%, 51%)',     // red
  'hsl(25, 95%, 53%)',    // orange
  'hsl(45, 100%, 51%)',   // yellow
];

interface ProjectAreaManagerProps {
  projects: Project[];
  areas: Area[];
  selectedProjectId?: string;
  selectedAreaId?: string;
  onSelectProject: (projectId: string) => void;
  onSelectArea: (areaId: string) => void;
  onAddProject: (name: string, color?: string, areaId?: string) => void;
  onDeleteProject: (id: string) => void;
  onAddArea: (name: string, color?: string) => void;
  onDeleteArea: (id: string) => void;
  getProjectsForArea: (areaId: string) => Project[];
  getOrphanProjects: () => Project[];
  projectTaskCounts: Record<string, number>;
  projectCompletedCounts: Record<string, number>;
  areaTaskCounts: Record<string, number>;
}

type DeleteTarget = { type: 'project' | 'area'; id: string; name: string } | null;

function AddItemDialog({ 
  type, 
  onAdd, 
  areaId 
}: { 
  type: 'project' | 'area'; 
  onAdd: (name: string, color: string, areaId?: string) => void;
  areaId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(colorOptions[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), color, areaId);
      setName('');
      setColor(colorOptions[0]);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground 
                          hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add {type}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>New {type === 'project' ? 'Project' : 'Area'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            placeholder={type === 'project' ? 'Project name' : 'Area name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            {colorOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'w-8 h-8 rounded-full transition-transform',
                  color === c && 'ring-2 ring-offset-2 ring-primary scale-110'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectAreaManager({
  projects,
  areas,
  selectedProjectId,
  selectedAreaId,
  onSelectProject,
  onSelectArea,
  onAddProject,
  onDeleteProject,
  onAddArea,
  onDeleteArea,
  getProjectsForArea,
  getOrphanProjects,
  projectTaskCounts,
  projectCompletedCounts,
  areaTaskCounts,
}: ProjectAreaManagerProps) {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set(areas.map(a => a.id)));
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'project') {
      onDeleteProject(deleteTarget.id);
    } else {
      onDeleteArea(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const orphanProjects = getOrphanProjects();

  return (
    <div className="space-y-1">
      {/* Areas Section */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Areas
        </span>
        <AddItemDialog 
          type="area" 
          onAdd={(name, color) => onAddArea(name, color)} 
        />
      </div>

      {areas.map((area) => {
        const areaProjects = getProjectsForArea(area.id);
        const isExpanded = expandedAreas.has(area.id);
        const taskCount = areaTaskCounts[area.id] || 0;
        
        return (
          <div key={area.id}>
            <div
              className={cn(
                'nav-item w-full group',
                selectedAreaId === area.id && 'active'
              )}
            >
              <button
                onClick={() => toggleArea(area.id)}
                className="p-0.5 -ml-1 mr-1"
              >
                <ChevronRight 
                  className={cn(
                    'w-4 h-4 text-muted-foreground/50 transition-transform',
                    isExpanded && 'rotate-90'
                  )} 
                />
              </button>
              <span 
                className="nav-item-icon"
                style={{ color: area.color }}
              >
                <Briefcase className="w-5 h-5" />
              </span>
              <button 
                className="flex-1 text-left text-[15px]"
                onClick={() => onSelectArea(area.id)}
              >
                {area.name}
              </button>
              {taskCount > 0 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {taskCount}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setDeleteTarget({ type: 'area', id: area.id, name: area.name })}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Area
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Projects under this area */}
            {isExpanded && (
              <div className="ml-4 space-y-0.5">
                {areaProjects.map((project) => {
                  const projectTotal = projectTaskCounts[project.id] || 0;
                  const projectCompleted = projectCompletedCounts[project.id] || 0;
                  return (
                    <div
                      key={project.id}
                      className={cn(
                        'nav-item w-full group pl-6',
                        selectedProjectId === project.id && 'active'
                      )}
                    >
                      <ProjectProgress
                        completed={projectCompleted}
                        total={projectTotal + projectCompleted}
                        color={project.color}
                        size={18}
                        strokeWidth={2.5}
                        onClick={() => onSelectProject(project.id)}
                      />
                      <button 
                        className="flex-1 text-left text-[14px] ml-2"
                        onClick={() => onSelectProject(project.id)}
                      >
                        {project.name}
                      </button>
                      {projectTotal > 0 && (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          {projectTotal}
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted">
                            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setDeleteTarget({ type: 'project', id: project.id, name: project.name })}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                <AddItemDialog 
                  type="project" 
                  onAdd={(name, color) => onAddProject(name, color, area.id)}
                  areaId={area.id}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Standalone Projects Section */}
      {orphanProjects.length > 0 && (
        <>
          <div className="px-3 py-2 flex items-center justify-between mt-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Projects
            </span>
            <AddItemDialog 
              type="project" 
              onAdd={(name, color) => onAddProject(name, color)} 
            />
          </div>

          {orphanProjects.map((project) => {
            const projectTotal = projectTaskCounts[project.id] || 0;
            const projectCompleted = projectCompletedCounts[project.id] || 0;
            return (
              <div
                key={project.id}
                className={cn(
                  'nav-item w-full group',
                  selectedProjectId === project.id && 'active'
                )}
              >
                <ProjectProgress
                  completed={projectCompleted}
                  total={projectTotal + projectCompleted}
                  color={project.color}
                  size={20}
                  strokeWidth={3}
                  onClick={() => onSelectProject(project.id)}
                />
                <button 
                  className="flex-1 text-left text-[15px] ml-2"
                  onClick={() => onSelectProject(project.id)}
                >
                  {project.name}
                </button>
                {projectTotal > 0 && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {projectTotal}
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setDeleteTarget({ type: 'project', id: project.id, name: project.name })}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </>
      )}

      {orphanProjects.length === 0 && (
        <div className="px-3 py-2 flex items-center justify-between mt-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Projects
          </span>
          <AddItemDialog 
            type="project" 
            onAdd={(name, color) => onAddProject(name, color)} 
          />
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget?.type === 'area' ? 'Delete Area' : 'Delete Project'}
        itemName={deleteTarget?.name}
        description={
          deleteTarget?.type === 'area'
            ? `Are you sure you want to delete "${deleteTarget.name}"? Projects within this area will become standalone projects.`
            : undefined
        }
      />
    </div>
  );
}
