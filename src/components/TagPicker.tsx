import { useState } from 'react';
import { Plus, Tag as TagIcon, Check, Trash2 } from 'lucide-react';
import { Tag } from '@/types/task';
import { TagBadge } from './TagBadge';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const TAG_COLORS = [
  'hsl(211, 100%, 50%)', // Blue
  'hsl(142, 71%, 45%)',  // Green
  'hsl(45, 100%, 51%)',  // Yellow
  'hsl(0, 72%, 51%)',    // Red
  'hsl(270, 70%, 60%)',  // Purple
  'hsl(25, 95%, 53%)',   // Orange
  'hsl(180, 70%, 45%)',  // Cyan
  'hsl(330, 80%, 60%)',  // Pink
];

interface TagPickerProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => Promise<Tag | undefined>;
  onDeleteTag?: (tagId: string) => void;
  trigger?: React.ReactNode;
}

export function TagPicker({
  selectedTags,
  availableTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  onDeleteTag,
  trigger,
}: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const selectedTagIds = new Set(selectedTags.map(t => t.id));

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsCreating(true);
    const newTag = await onCreateTag(newTagName.trim(), selectedColor);
    if (newTag) {
      onAddTag(newTag.id);
    }
    setNewTagName('');
    setIsCreating(false);
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.has(tagId)) {
      onRemoveTag(tagId);
    } else {
      onAddTag(tagId);
    }
  };

  const handleDeleteTag = (e: React.MouseEvent, tag: Tag) => {
    e.stopPropagation();
    setTagToDelete(tag);
  };

  const confirmDeleteTag = () => {
    if (tagToDelete && onDeleteTag) {
      onDeleteTag(tagToDelete.id);
      setTagToDelete(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5">
            <TagIcon className="w-3.5 h-3.5" />
            <span className="text-xs">Tags</span>
            {selectedTags.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs">
                {selectedTags.length}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium text-foreground">Tags</p>
        </div>
        
        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="p-2 border-b flex flex-wrap gap-1.5">
            {selectedTags.map(tag => (
              <TagBadge
                key={tag.id}
                tag={tag}
                onRemove={() => onRemoveTag(tag.id)}
              />
            ))}
          </div>
        )}

        {/* Available tags */}
        <ScrollArea className="max-h-48">
          <div className="p-2 space-y-1">
            {availableTags.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No tags yet. Create one below.
              </p>
            ) : (
              availableTags.map(tag => (
                <div
                  key={tag.id}
                  className={cn(
                    "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                    "hover:bg-muted transition-colors",
                    selectedTagIds.has(tag.id) && "bg-muted"
                  )}
                >
                  <button
                    onClick={() => handleToggleTag(tag.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 truncate">{tag.name}</span>
                    {selectedTagIds.has(tag.id) && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                  {onDeleteTag && (
                    <button
                      onClick={(e) => handleDeleteTag(e, tag)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 
                                 text-muted-foreground hover:text-destructive transition-all"
                      aria-label={`Delete ${tag.name} tag`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Create new tag */}
        <div className="p-2 border-t space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
            />
            <Button
              size="sm"
              className="h-8 px-2"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isCreating}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Color picker */}
          <div className="flex gap-1.5 justify-center">
            {TAG_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "w-5 h-5 rounded-full transition-transform",
                  selectedColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>

      <DeleteConfirmDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
        onConfirm={confirmDeleteTag}
        title="Delete Tag"
        itemName={tagToDelete?.name || ''}
        description="This will remove the tag from all tasks. This action cannot be undone."
      />
    </Popover>
  );
}