import axios, { AxiosInstance, AxiosError } from 'axios';
import type { BatchID, FlutterExportFormat, GridCell, ClassBlock } from '@/types/timetable';
import { DAYS as DaysList, TIME_SLOTS as TimeSlotsList } from '@/types/timetable';

const API_URL = 'https://timetable-api-9xsz.onrender.com';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = error.response?.data
      ? (error.response.data as { error?: string }).error || 'An error occurred'
      : error.message;
    console.error(`[API Error] ${message}`);
    return Promise.reject(new Error(message));
  }
);

export interface TimetableEntry {
  time: string;
  subject: string;
  room: string;
  teacher: string;
}

export interface TimetableData {
  batch: string;
  Monday?: TimetableEntry[];
  Tuesday?: TimetableEntry[];
  Wednesday?: TimetableEntry[];
  Thursday?: TimetableEntry[];
  Friday?: TimetableEntry[];
  Saturday?: TimetableEntry[];
}

// Raw API response structure: array containing object with numeric keys
type ApiResponse = Record<string, TimetableData>[];

// Parse the nested API response into flat array of batches
export const parseApiResponse = (response: ApiResponse): TimetableData[] => {
  if (!response || !response[0]) return [];
  // Extract all batch objects from the numeric keys
  return Object.values(response[0]);
};

// Convert API data to grid format for a specific batch
export const convertApiToGrid = (
  data: TimetableData[],
  targetBatch?: BatchID
): { batch: BatchID; grid: GridCell[][]; allBatches: TimetableData[] } => {
  // Find the target batch or default to first
  const batchData = targetBatch 
    ? data.find(b => b.batch === targetBatch) || data[0]
    : data[0];
  const batch = (batchData?.batch || 'E16') as BatchID;
  
  // Create empty grid
  const grid: GridCell[][] = TimeSlotsList.map((_, slotIndex) =>
    DaysList.map((day) => ({
      day,
      slotIndex,
      classBlock: null,
      isOccupiedByPrevious: false,
    }))
  );

  if (!batchData) return { batch, grid, allBatches: data };

  // Parse each day
  for (const day of DaysList) {
    const dayData = batchData[day] || [];
    const dayIndex = DaysList.indexOf(day);

    for (const entry of dayData) {
      // Parse time to find slot index
      const timeMatch = entry.time.match(/^(\d{1,2}):(\d{2})/);
      if (!timeMatch) continue;

      const hour = parseInt(timeMatch[1]);
      const slotIndex = TimeSlotsList.findIndex((slot) => {
        const slotHour = parseInt(slot.start.split(':')[0]);
        return slotHour === hour;
      });

      if (slotIndex === -1) continue;

      // Determine type from subject prefix
      let type: 'L' | 'P' | 'T' = 'L';
      let subject = entry.subject;
      
      if (subject.startsWith('P-')) {
        type = 'P';
        subject = subject.substring(2);
      } else if (subject.startsWith('L-')) {
        type = 'L';
        subject = subject.substring(2);
      } else if (subject.startsWith('T-')) {
        type = 'T';
        subject = subject.substring(2);
      }

      // Labs (P) default to 2 slots, otherwise calculate from time range
      let duration: 1 | 2 = type === 'P' ? 2 : 1;
      
      // Override with time range if provided
      const timeEndMatch = entry.time.match(/-(\d{1,2}):(\d{2})/);
      if (timeEndMatch) {
        const endHour = parseInt(timeEndMatch[1]);
        // Convert to 24-hour for comparison
        const startHour24 = hour < 8 ? hour + 12 : hour;
        const endHour24 = endHour < 8 ? endHour + 12 : endHour;
        const diff = endHour24 - startHour24;
        duration = diff >= 2 ? 2 : 1;
      }

      const block: ClassBlock = {
        id: `${day}-${slotIndex}-${Date.now()}-${Math.random()}`,
        subject: `${type}-${subject}`,
        type,
        room: entry.room,
        faculty: entry.teacher,
        duration,
        day,
        slotIndex,
      };

      grid[slotIndex][dayIndex].classBlock = block;

      // Mark next slot as occupied for labs
      if (duration === 2 && slotIndex < 7) {
        grid[slotIndex + 1][dayIndex].isOccupiedByPrevious = true;
      }
    }
  }

  return { batch, grid, allBatches: data };
};

export const timetableApi = {
  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/api/timetable');
      return response.status === 200;
    } catch {
      return false;
    }
  },

  /**
   * Fetch all timetable data (public, no auth required)
   */
  async fetchTimetable(): Promise<TimetableData[]> {
    const response = await apiClient.get<ApiResponse>('/api/timetable');
    return parseApiResponse(response.data);
  },

  /**
   * Export timetable for Flutter (client-side conversion)
   */
  exportForFlutter(batch: BatchID, grid: GridCell[][]): FlutterExportFormat {
    const result: FlutterExportFormat = {
      batch,
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    for (const row of grid) {
      for (const cell of row) {
        if (!cell.classBlock) continue;

        const block = cell.classBlock;
        const startSlot = TimeSlotsList[block.slotIndex];
        const endSlot = TimeSlotsList[block.slotIndex + block.duration - 1];

        result[block.day].push({
          time: `${startSlot.start}-${endSlot.end}`,
          subject: block.subject,
          room: block.room,
          teacher: block.faculty,
        });
      }
    }

    // Sort by time
    for (const day of DaysList) {
      result[day].sort((a, b) => {
        const aHour = parseInt(a.time.split(':')[0]);
        const bHour = parseInt(b.time.split(':')[0]);
        return aHour - bHour;
      });
    }

    return result;
  },
};

export default apiClient;