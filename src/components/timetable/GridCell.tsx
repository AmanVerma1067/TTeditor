import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import type { ClassBlock, Day } from '@/types/timetable';

interface GridCellProps {
  day: Day;
  slotIndex: number;
  isOccupiedByPrevious?: boolean;
  children?: React.ReactNode;
  onDrop: (block: ClassBlock, day: Day, slotIndex: number) => void;
  onClick: () => void;
}

export function GridCell({
  day,
  slotIndex,
  isOccupiedByPrevious,
  children,
  onDrop,
  onClick,
}: GridCellProps) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: 'CLASS_BLOCK',
      canDrop: () => !isOccupiedByPrevious && !children,
      drop: (item: { id: string; block: ClassBlock }) => {
        onDrop(item.block, day, slotIndex);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [day, slotIndex, isOccupiedByPrevious, children, onDrop]
  );

  const isEmpty = !children && !isOccupiedByPrevious;

  return (
    <div
      ref={drop}
      onClick={isEmpty ? onClick : undefined}
      className={cn(
        'relative min-h-[90px] border border-grid-border bg-grid-cell p-1.5 transition-all duration-150',
        isEmpty && 'cursor-pointer group',
        isEmpty && 'hover:bg-grid-cell-hover',
        isOver && canDrop && 'bg-primary/5 border-primary/30 border-dashed',
        isOver && !canDrop && 'bg-destructive/5 border-destructive/30',
        isOccupiedByPrevious && 'bg-muted/50'
      )}
    >
      {children}
      
      {/* Empty cell add button */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Occupied by previous indicator */}
      {isOccupiedByPrevious && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-muted-foreground/20" />
        </div>
      )}
    </div>
  );
}
