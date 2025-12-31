import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { ClassBlockCard } from './ClassBlockCard';
import { GridCell } from './GridCell';
import { EditClassModal } from './EditClassModal';
import { DAYS, TIME_SLOTS } from '@/types/timetable';
import type { ClassBlock, Day, ConflictError } from '@/types/timetable';
import { toast } from '@/hooks/use-toast';

export function TimetableGrid() {
  const { grid, addClassBlock, updateClassBlock, removeClassBlock, moveClassBlock } = useTimetableStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: Day; slotIndex: number } | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ClassBlock | null>(null);

  const handleCellClick = useCallback((day: Day, slotIndex: number) => {
    setSelectedCell({ day, slotIndex });
    setSelectedBlock(null);
    setModalOpen(true);
  }, []);

  const handleBlockClick = useCallback((block: ClassBlock) => {
    setSelectedCell({ day: block.day, slotIndex: block.slotIndex });
    setSelectedBlock(block);
    setModalOpen(true);
  }, []);

  const handleDrop = useCallback(
    (block: ClassBlock, newDay: Day, newSlotIndex: number) => {
      if (block.day === newDay && block.slotIndex === newSlotIndex) return;

      const conflict = moveClassBlock(block.id, newDay, newSlotIndex);
      if (conflict) {
        toast({
          title: 'Conflict Detected',
          description: conflict.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Class Moved',
          description: `${block.subject} moved to ${newDay}, ${TIME_SLOTS[newSlotIndex].label}`,
        });
      }
    },
    [moveClassBlock]
  );

  const handleSave = useCallback(
    (data: Omit<ClassBlock, 'id'>): ConflictError | null => {
      if (selectedBlock) {
        const conflict = updateClassBlock(selectedBlock.id, data);
        if (!conflict) {
          toast({
            title: 'Class Updated',
            description: `${data.subject} has been updated`,
          });
        }
        return conflict;
      } else {
        const conflict = addClassBlock(data);
        if (!conflict) {
          toast({
            title: 'Class Added',
            description: `${data.subject} has been added`,
          });
        }
        return conflict;
      }
    },
    [selectedBlock, updateClassBlock, addClassBlock]
  );

  const handleDelete = useCallback(() => {
    if (selectedBlock) {
      removeClassBlock(selectedBlock.id);
      toast({
        title: 'Class Removed',
        description: `${selectedBlock.subject} has been removed`,
      });
    }
  }, [selectedBlock, removeClassBlock]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header row with days */}
          <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-0.5 mb-0.5">
            <div className="h-12 flex items-center justify-center bg-grid-header rounded-tl-lg">
              <span className="text-xs font-semibold text-grid-header-foreground/60 uppercase tracking-wider">
                Time
              </span>
            </div>
            {DAYS.map((day, index) => (
              <div
                key={day}
                className={`h-12 flex items-center justify-center bg-grid-header ${
                  index === DAYS.length - 1 ? 'rounded-tr-lg' : ''
                }`}
              >
                <span className="text-sm font-semibold text-grid-header-foreground">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {TIME_SLOTS.map((slot, slotIndex) => (
            <div key={slot.label} className="grid grid-cols-[100px_repeat(6,1fr)] gap-0.5 mb-0.5">
              {/* Time label */}
              <div className="min-h-[90px] flex flex-col items-center justify-center bg-grid-header px-2">
                <span className="text-xs font-semibold text-grid-header-foreground">
                  {slot.start}
                </span>
                <span className="text-[10px] text-grid-header-foreground/60">to</span>
                <span className="text-xs font-semibold text-grid-header-foreground">
                  {slot.end}
                </span>
              </div>

              {/* Day cells */}
              {DAYS.map((day, dayIndex) => {
                const cell = grid[slotIndex]?.[dayIndex];
                const block = cell?.classBlock;
                const isOccupied = cell?.isOccupiedByPrevious;

                return (
                  <GridCell
                    key={`${day}-${slotIndex}`}
                    day={day}
                    slotIndex={slotIndex}
                    isOccupiedByPrevious={isOccupied}
                    onDrop={handleDrop}
                    onClick={() => handleCellClick(day, slotIndex)}
                  >
                    {block && (
                      <ClassBlockCard
                        block={block}
                        onClick={() => handleBlockClick(block)}
                      />
                    )}
                  </GridCell>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {selectedCell && (
        <EditClassModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedBlock(null);
            setSelectedCell(null);
          }}
          onSave={handleSave}
          onDelete={selectedBlock ? handleDelete : undefined}
          initialData={selectedBlock}
          day={selectedCell.day}
          slotIndex={selectedCell.slotIndex}
        />
      )}
    </DndProvider>
  );
}
