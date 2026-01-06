import { Tag } from '@/types/task';
import { TagBadge } from './TagBadge';
import { Tag as TagIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TagFilterProps {
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onClearAll: () => void;
}

export function TagFilter({ tags, selectedTagIds, onToggleTag, onClearAll }: TagFilterProps) {
  if (tags.length === 0) return null;

  const hasSelection = selectedTagIds.length > 0;

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        <TagIcon className="w-4 h-4" />
        <span className="text-xs font-medium">Filter:</span>
      </div>
      
      <ScrollArea className="flex-1 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {tags.map(tag => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onToggleTag(tag.id)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  "border hover:scale-105",
                  isSelected
                    ? "border-transparent"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
                style={isSelected ? {
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: tag.color,
                } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {hasSelection && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs shrink-0"
          onClick={onClearAll}
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
