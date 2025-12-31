import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  BatchID,
  ClassBlock,
  ClassType,
  ConflictError,
  Day,
  GridCell,
  HistoryEntry,
  DAYS,
  TIME_SLOTS,
  FlutterExportFormat,
  FlutterClassEntry,
} from '@/types/timetable';
import { DAYS as DaysList, TIME_SLOTS as TimeSlotsList } from '@/types/timetable';

interface TimetableStore {
  // State
  batch: BatchID;
  grid: GridCell[][];
  history: HistoryEntry[];
  historyIndex: number;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // Actions
  setBatch: (batch: BatchID) => void;
  initializeGrid: () => void;
  addClassBlock: (block: Omit<ClassBlock, 'id'>) => ConflictError | null;
  updateClassBlock: (id: string, updates: Partial<ClassBlock>) => ConflictError | null;
  removeClassBlock: (id: string) => void;
  moveClassBlock: (id: string, newDay: Day, newSlotIndex: number) => ConflictError | null;
  
  // Conflict detection
  checkConflicts: (block: ClassBlock, excludeId?: string) => ConflictError | null;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: (action: string) => void;
  
  // Loading/Status
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  markAsSaved: () => void;
  
  // Export
  exportToFlutterFormat: () => FlutterExportFormat;
  
  // Helpers
  getClassBlockAt: (day: Day, slotIndex: number) => ClassBlock | null;
  getAllClassBlocks: () => ClassBlock[];
}

const createEmptyGrid = (): GridCell[][] => {
  return TimeSlotsList.map((_, slotIndex) =>
    DaysList.map((day) => ({
      day,
      slotIndex,
      classBlock: null,
      isOccupiedByPrevious: false,
    }))
  );
};

// Sample data for demo
const createSampleData = (): GridCell[][] => {
  const grid = createEmptyGrid();
  
  const sampleClasses: Omit<ClassBlock, 'id'>[] = [
    { subject: 'L-CNS', type: 'L', room: '201', faculty: 'ABK', duration: 1, day: 'Monday', slotIndex: 0 },
    { subject: 'L-DBMS', type: 'L', room: '202', faculty: 'PRS', duration: 1, day: 'Monday', slotIndex: 2 },
    { subject: 'P-VLSI LAB', type: 'P', room: '142', faculty: 'KRM', duration: 2, day: 'Tuesday', slotIndex: 2 },
    { subject: 'T-OS', type: 'T', room: '105', faculty: 'SRK', duration: 1, day: 'Wednesday', slotIndex: 1 },
    { subject: 'L-AI', type: 'L', room: '301', faculty: 'MNP', duration: 1, day: 'Thursday', slotIndex: 0 },
    { subject: 'P-ML LAB', type: 'P', room: '143', faculty: 'ABK', duration: 2, day: 'Friday', slotIndex: 4 },
    { subject: 'L-SE', type: 'L', room: '203', faculty: 'VSR', duration: 1, day: 'Saturday', slotIndex: 0 },
  ];

  sampleClasses.forEach((classData) => {
    const dayIndex = DaysList.indexOf(classData.day);
    const block: ClassBlock = { ...classData, id: uuidv4() };
    grid[classData.slotIndex][dayIndex].classBlock = block;
    
    if (classData.duration === 2 && classData.slotIndex < 7) {
      grid[classData.slotIndex + 1][dayIndex].isOccupiedByPrevious = true;
    }
  });

  return grid;
};

export const useTimetableStore = create<TimetableStore>((set, get) => ({
  batch: 'E16',
  grid: createSampleData(),
  history: [],
  historyIndex: -1,
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,

  setBatch: (batch) => {
    set({ batch, hasUnsavedChanges: false });
    get().initializeGrid();
  },

  initializeGrid: () => {
    set({ grid: createSampleData() });
  },

  addClassBlock: (blockData) => {
    const block: ClassBlock = { ...blockData, id: uuidv4() };
    const conflict = get().checkConflicts(block);
    
    if (conflict) {
      return conflict;
    }

    get().pushHistory(`Added ${block.subject}`);
    
    set((state) => {
      const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
      const dayIndex = DaysList.indexOf(block.day);
      
      newGrid[block.slotIndex][dayIndex].classBlock = block;
      
      if (block.duration === 2 && block.slotIndex < 7) {
        newGrid[block.slotIndex + 1][dayIndex].isOccupiedByPrevious = true;
      }
      
      return { grid: newGrid, hasUnsavedChanges: true };
    });
    
    return null;
  },

  updateClassBlock: (id, updates) => {
    const allBlocks = get().getAllClassBlocks();
    const existingBlock = allBlocks.find((b) => b.id === id);
    
    if (!existingBlock) {
      return { type: 'logic', message: 'Class block not found' };
    }

    const updatedBlock: ClassBlock = { ...existingBlock, ...updates };
    const conflict = get().checkConflicts(updatedBlock, id);
    
    if (conflict) {
      return conflict;
    }

    get().pushHistory(`Updated ${updatedBlock.subject}`);
    
    set((state) => {
      const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
      
      // Clear old position
      const oldDayIndex = DaysList.indexOf(existingBlock.day);
      newGrid[existingBlock.slotIndex][oldDayIndex].classBlock = null;
      if (existingBlock.duration === 2 && existingBlock.slotIndex < 7) {
        newGrid[existingBlock.slotIndex + 1][oldDayIndex].isOccupiedByPrevious = false;
      }
      
      // Set new position
      const newDayIndex = DaysList.indexOf(updatedBlock.day);
      newGrid[updatedBlock.slotIndex][newDayIndex].classBlock = updatedBlock;
      if (updatedBlock.duration === 2 && updatedBlock.slotIndex < 7) {
        newGrid[updatedBlock.slotIndex + 1][newDayIndex].isOccupiedByPrevious = true;
      }
      
      return { grid: newGrid, hasUnsavedChanges: true };
    });
    
    return null;
  },

  removeClassBlock: (id) => {
    const allBlocks = get().getAllClassBlocks();
    const block = allBlocks.find((b) => b.id === id);
    
    if (!block) return;

    get().pushHistory(`Removed ${block.subject}`);
    
    set((state) => {
      const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
      const dayIndex = DaysList.indexOf(block.day);
      
      newGrid[block.slotIndex][dayIndex].classBlock = null;
      if (block.duration === 2 && block.slotIndex < 7) {
        newGrid[block.slotIndex + 1][dayIndex].isOccupiedByPrevious = false;
      }
      
      return { grid: newGrid, hasUnsavedChanges: true };
    });
  },

  moveClassBlock: (id, newDay, newSlotIndex) => {
    const allBlocks = get().getAllClassBlocks();
    const block = allBlocks.find((b) => b.id === id);
    
    if (!block) {
      return { type: 'logic', message: 'Class block not found' };
    }

    const movedBlock: ClassBlock = { ...block, day: newDay, slotIndex: newSlotIndex };
    return get().updateClassBlock(id, { day: newDay, slotIndex: newSlotIndex });
  },

  checkConflicts: (block, excludeId) => {
    const allBlocks = get().getAllClassBlocks().filter((b) => b.id !== excludeId);
    const slotsToCheck = block.duration === 2 
      ? [block.slotIndex, block.slotIndex + 1] 
      : [block.slotIndex];

    // Check bounds
    if (block.duration === 2 && block.slotIndex >= 7) {
      return { type: 'logic', message: 'Lab sessions cannot extend beyond the last slot' };
    }

    for (const existingBlock of allBlocks) {
      if (existingBlock.day !== block.day) continue;

      const existingSlotsToCheck = existingBlock.duration === 2 
        ? [existingBlock.slotIndex, existingBlock.slotIndex + 1] 
        : [existingBlock.slotIndex];

      const hasOverlap = slotsToCheck.some((slot) => existingSlotsToCheck.includes(slot));
      
      if (!hasOverlap) continue;

      // Room conflict
      if (existingBlock.room === block.room) {
        return {
          type: 'room',
          message: `Room ${block.room} is already booked at this time`,
          conflictingBlock: existingBlock,
        };
      }

      // Faculty conflict
      if (existingBlock.faculty === block.faculty) {
        return {
          type: 'faculty',
          message: `Faculty ${block.faculty} is already scheduled at this time`,
          conflictingBlock: existingBlock,
        };
      }

      // Logic conflict: Labs cannot overlap with Lectures
      if (
        (block.type === 'P' && existingBlock.type === 'L') ||
        (block.type === 'L' && existingBlock.type === 'P')
      ) {
        return {
          type: 'logic',
          message: 'Labs cannot overlap with Lectures in the same time slot',
          conflictingBlock: existingBlock,
        };
      }
    }

    // Check if target cell is occupied
    const dayIndex = DaysList.indexOf(block.day);
    for (const slotIdx of slotsToCheck) {
      const cell = get().grid[slotIdx]?.[dayIndex];
      if (cell?.classBlock && cell.classBlock.id !== excludeId) {
        return {
          type: 'logic',
          message: 'This slot is already occupied',
          conflictingBlock: cell.classBlock,
        };
      }
      if (cell?.isOccupiedByPrevious) {
        return {
          type: 'logic',
          message: 'This slot is occupied by a lab session from the previous slot',
        };
      }
    }

    return null;
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;
    
    set({
      grid: history[historyIndex].grid,
      historyIndex: historyIndex - 1,
      hasUnsavedChanges: true,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    
    const nextIndex = historyIndex + 1;
    set({
      grid: history[nextIndex].grid,
      historyIndex: nextIndex,
      hasUnsavedChanges: true,
    });
  },

  canUndo: () => get().historyIndex >= 0,

  canRedo: () => get().historyIndex < get().history.length - 1,

  pushHistory: (action) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        grid: state.grid.map((row) => row.map((cell) => ({ ...cell }))),
        timestamp: Date.now(),
        action,
      });
      
      // Keep only last 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setSaving: (saving) => set({ isSaving: saving }),

  setError: (error) => set({ error }),

  markAsSaved: () => set({ hasUnsavedChanges: false }),

  exportToFlutterFormat: () => {
    const { batch, grid } = get();
    const result: FlutterExportFormat = {
      batch,
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    const allBlocks = get().getAllClassBlocks();
    
    for (const block of allBlocks) {
      const startSlot = TimeSlotsList[block.slotIndex];
      const endSlot = TimeSlotsList[block.slotIndex + block.duration - 1];
      
      const entry: FlutterClassEntry = {
        time: `${startSlot.start}-${endSlot.end}`,
        subject: `${block.type}-${block.subject.replace(/^[LPT]-/, '')}`,
        room: block.room,
        teacher: block.faculty,
      };
      
      result[block.day].push(entry);
    }

    // Sort by time
    for (const day of DaysList) {
      result[day].sort((a, b) => {
        const aTime = parseInt(a.time.split(':')[0]);
        const bTime = parseInt(b.time.split(':')[0]);
        return aTime - bTime;
      });
    }

    return result;
  },

  getClassBlockAt: (day, slotIndex) => {
    const dayIndex = DaysList.indexOf(day);
    return get().grid[slotIndex]?.[dayIndex]?.classBlock ?? null;
  },

  getAllClassBlocks: () => {
    const blocks: ClassBlock[] = [];
    const { grid } = get();
    
    for (const row of grid) {
      for (const cell of row) {
        if (cell.classBlock) {
          blocks.push(cell.classBlock);
        }
      }
    }
    
    return blocks;
  },
}));
