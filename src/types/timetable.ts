export type BatchID = 'E15' | 'E16' | 'E17';

export type ClassType = 'L' | 'P' | 'T';

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimeSlot {
  start: string;
  end: string;
  label: string;
  index: number;
}

export interface ClassBlock {
  id: string;
  subject: string;
  type: ClassType;
  room: string;
  faculty: string;
  duration: 1 | 2;
  day: Day;
  slotIndex: number;
}

export interface GridCell {
  day: Day;
  slotIndex: number;
  classBlock: ClassBlock | null;
  isOccupiedByPrevious?: boolean;
}

export interface TimetableState {
  batch: BatchID;
  grid: GridCell[][];
}

export interface ConflictError {
  type: 'room' | 'faculty' | 'logic';
  message: string;
  conflictingBlock?: ClassBlock;
}

export interface FlutterExportFormat {
  batch: string;
  Monday: FlutterClassEntry[];
  Tuesday: FlutterClassEntry[];
  Wednesday: FlutterClassEntry[];
  Thursday: FlutterClassEntry[];
  Friday: FlutterClassEntry[];
  Saturday: FlutterClassEntry[];
}

export interface FlutterClassEntry {
  time: string;
  subject: string;
  room: string;
  teacher: string;
}

export interface HistoryEntry {
  grid: GridCell[][];
  timestamp: number;
  action: string;
}

export const TIME_SLOTS: TimeSlot[] = [
  { start: '8:00', end: '8:50', label: '8:00 - 8:50', index: 0 },
  { start: '9:00', end: '9:50', label: '9:00 - 9:50', index: 1 },
  { start: '10:00', end: '10:50', label: '10:00 - 10:50', index: 2 },
  { start: '11:00', end: '11:50', label: '11:00 - 11:50', index: 3 },
  { start: '12:00', end: '12:50', label: '12:00 - 12:50', index: 4 },
  { start: '1:00', end: '1:50', label: '1:00 - 1:50', index: 5 },
  { start: '2:00', end: '2:50', label: '2:00 - 2:50', index: 6 },
  { start: '3:00', end: '3:50', label: '3:00 - 3:50', index: 7 },
];

export const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  L: 'Lecture',
  P: 'Lab/Practical',
  T: 'Tutorial',
};
