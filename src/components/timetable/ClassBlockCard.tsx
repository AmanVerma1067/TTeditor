import { useDrag } from 'react-dnd';
import { cn } from '@/lib/utils';
import type { ClassBlock, ClassType } from '@/types/timetable';
import { GripVertical, Clock, MapPin, User } from 'lucide-react';

interface ClassBlockCardProps {
  block: ClassBlock;
  onClick?: () => void;
}

const typeStyles: Record<ClassType, { bg: string; border: string; text: string; badge: string }> = {
  L: {
    bg: 'bg-lecture-bg',
    border: 'border-lecture-border',
    text: 'text-lecture',
    badge: 'bg-lecture text-primary-foreground',
  },
  P: {
    bg: 'bg-lab-bg',
    border: 'border-lab-border',
    text: 'text-lab',
    badge: 'bg-lab text-primary-foreground',
  },
  T: {
    bg: 'bg-tutorial-bg',
    border: 'border-tutorial-border',
    text: 'text-tutorial',
    badge: 'bg-tutorial text-primary-foreground',
  },
};

const typeLabels: Record<ClassType, string> = {
  L: 'Lecture',
  P: 'Lab',
  T: 'Tutorial',
};

export function ClassBlockCard({ block, onClick }: ClassBlockCardProps) {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'CLASS_BLOCK',
      item: { id: block.id, block },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [block]
  );

  const styles = typeStyles[block.type];
  const isLab = block.duration === 2;

  return (
    <div
      ref={preview}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-lg border-2 p-2.5 cursor-pointer transition-all duration-200',
        'hover:shadow-elevated hover:scale-[1.02]',
        'active:scale-[0.98]',
        styles.bg,
        styles.border,
        isDragging && 'opacity-50 scale-95',
        isLab && 'min-h-[120px]'
      )}
    >
      {/* Drag handle */}
      <div
        ref={drag}
        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-foreground/5"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Type badge */}
      <div className={cn('self-start px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide', styles.badge)}>
        {block.type}
      </div>

      {/* Subject */}
      <div className={cn('mt-1.5 font-semibold text-sm leading-tight', styles.text)}>
        {block.subject}
      </div>

      {/* Details */}
      <div className="mt-auto pt-2 space-y-0.5">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="font-mono">{block.room}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="font-medium">{block.faculty}</span>
        </div>
      </div>

      {/* Duration indicator for labs */}
      {isLab && (
        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>2 slots</span>
        </div>
      )}
    </div>
  );
}
