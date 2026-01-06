import { useState, useEffect } from 'react';
import { Task, Project, Area, Subtask, Tag } from '@/types/task';
import { Calendar as CalendarIcon, FolderOpen, Briefcase, List, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SubtaskList } from '@/components/SubtaskList';
import { AITaskBreakdown } from '@/components/AITaskBreakdown';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { TaskCheckbox } from '@/components/TaskCheckbox';
import { TagPicker } from '@/components/TagPicker';
import { TagBadge } from '@/components/TagBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskEditPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: {
    title?: string;
    notes?: string;
    dueDate?: Date;
    when?: Task['when'];
    projectId?: string;
    areaId?: string;
  }) => Promise<void>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  projects: Project[];
  areas: Area[];
  // Tag props
  tags?: Tag[];
  onCreateTag?: (name: string, color: string) => Promise<Tag | undefined>;
  onDeleteTag?: (tagId: string) => void;
  onAddTagToTask?: (taskId: string, tagId: string) => void;
  onRemoveTagFromTask?: (taskId: string, tagId: string) => void;
}

const whenOptions: { value: Task['when']; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'evening', label: 'This Evening' },
  { value: 'someday', label: 'Someday' },
];

export function TaskEditPanel({
  task,
  isOpen,
  onClose,
  onUpdate,
  onToggle,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  projects,
  areas,
  tags = [],
  onCreateTag,
  onDeleteTag,
  onAddTagToTask,
  onRemoveTagFromTask,
}: TaskEditPanelProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [when, setWhen] = useState<Task['when']>();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [areaId, setAreaId] = useState<string | undefined>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync state with task prop
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setDueDate(task.dueDate);
      setWhen(task.when);
      setProjectId(task.project);
      setAreaId(task.area);
      setHasChanges(false);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    
    await onUpdate(task.id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate,
      when,
      projectId,
      areaId,
    });
    
    setHasChanges(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      handleSave();
    }
    onClose();
  };

  const handleFieldChange = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setHasChanges(true);
  };

  const handleProjectChange = (value: string) => {
    if (value === 'none') {
      handleFieldChange(setProjectId, undefined);
      handleFieldChange(setAreaId, undefined);
    } else if (value.startsWith('project-')) {
      handleFieldChange(setProjectId, value.replace('project-', ''));
      handleFieldChange(setAreaId, undefined);
    } else if (value.startsWith('area-')) {
      handleFieldChange(setAreaId, value.replace('area-', ''));
      handleFieldChange(setProjectId, undefined);
    }
  };

  const handleDelete = () => {
    if (!task) return;
    onDelete(task.id);
    onClose();
  };

  if (!task) return null;

  const selectedProject = projects.find(p => p.id === projectId);
  const selectedArea = areas.find(a => a.id === areaId);
  
  const currentValue = projectId 
    ? `project-${projectId}` 
    : areaId 
    ? `area-${areaId}` 
    : 'none';

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TaskCheckbox 
                  checked={task.completed} 
                  onChange={() => onToggle(task.id)} 
                />
                <SheetTitle className="text-left">Edit Task</SheetTitle>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <Input
                value={title}
                onChange={(e) => handleFieldChange(setTitle, e.target.value)}
                placeholder="Task title"
                className={cn(
                  "text-lg font-medium border-0 px-0 focus-visible:ring-0",
                  task.completed && "line-through text-muted-foreground"
                )}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => handleFieldChange(setNotes, e.target.value)}
                placeholder="Add notes..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* When */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                When
              </label>
              <Select 
                value={when || 'none'} 
                onValueChange={(v) => handleFieldChange(setWhen, v === 'none' ? undefined : v as Task['when'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select when" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No schedule</SelectItem>
                  {whenOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value || 'none'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Due Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full justify-start",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dueDate ? format(dueDate, 'PPP') : 'Set due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => handleFieldChange(setDueDate, d)}
                    className="pointer-events-auto"
                  />
                  {dueDate && (
                    <div className="p-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleFieldChange(setDueDate, undefined)}
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Project / Area */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Project / Area
              </label>
              <Select value={currentValue} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue>
                    {selectedProject ? (
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" style={{ color: selectedProject.color }} />
                        {selectedProject.name}
                      </div>
                    ) : selectedArea ? (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" style={{ color: selectedArea.color }} />
                        {selectedArea.name}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No project</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {areas.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Areas</div>
                      {areas.map(area => (
                        <SelectItem key={`area-${area.id}`} value={`area-${area.id}`}>
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" style={{ color: area.color }} />
                            {area.name}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {projects.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Projects</div>
                      {projects.map(project => (
                        <SelectItem key={`project-${project.id}`} value={`project-${project.id}`}>
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" style={{ color: project.color }} />
                            {project.name}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            {onCreateTag && onAddTagToTask && onRemoveTagFromTask && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Tags
                </label>
                <div className="space-y-2">
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.map(tag => (
                        <TagBadge
                          key={tag.id}
                          tag={tag}
                          onRemove={() => onRemoveTagFromTask(task.id, tag.id)}
                        />
                      ))}
                    </div>
                  )}
                  <TagPicker
                    selectedTags={task.tags || []}
                    availableTags={tags}
                    onAddTag={(tagId) => onAddTagToTask(task.id, tagId)}
                    onRemoveTag={(tagId) => onRemoveTagFromTask(task.id, tagId)}
                    onCreateTag={onCreateTag}
                    onDeleteTag={onDeleteTag}
                  />
                </div>
              </div>
            )}

            {/* Subtasks */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <List className="w-4 h-4" />
                Checklist
              </label>
              <SubtaskList
                subtasks={task.subtasks || []}
                onToggleSubtask={(subtaskId) => onToggleSubtask(task.id, subtaskId)}
                onDeleteSubtask={(subtaskId) => onDeleteSubtask(task.id, subtaskId)}
                onAddSubtask={(title) => onAddSubtask(task.id, title)}
              />
              <AITaskBreakdown
                taskTitle={title}
                taskNotes={notes}
                onAddSubtasks={(titles) => {
                  titles.forEach(t => onAddSubtask(task.id, t));
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleClose}
              >
                {hasChanges ? 'Save & Close' : 'Close'}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Task"
        itemName={task.title}
      />
    </>
  );
}
