import { useState, useEffect, useRef } from 'react';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { timetableApi, convertApiToGrid } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Download, 
  Undo2, 
  Redo2, 
  CalendarDays,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { BatchID, Day, ClassBlock, FlutterExportFormat } from '@/types/timetable';
import { TIME_SLOTS as TimeSlotsList, DAYS as DaysList } from '@/types/timetable';
import { v4 as uuidv4 } from 'uuid';

export function TopBar() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    batch,
    setBatch,
    hasUnsavedChanges,
    isLoading,
    error,
    undo,
    redo,
    canUndo,
    canRedo,
    exportToFlutterFormat,
    setLoading,
    setError,
  } = useTimetableStore();

  // Check API status and auto-load timetable on mount
  useEffect(() => {
    const initializeApp = async () => {
      const isOnline = await timetableApi.checkHealth();
      setApiStatus(isOnline ? 'online' : 'offline');
      
      // Auto-load timetable if API is online
      if (isOnline) {
        await handleLoadTimetable();
      }
    };
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBatchChange = async (value: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to switch batches?'
      );
      if (!confirmed) return;
    }
    
    const newBatch = value as BatchID;
    setBatch(newBatch);
    
    // Reload data for new batch
    await handleLoadTimetable(newBatch);
  };

  const handleLoadTimetable = async (targetBatch?: BatchID) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await timetableApi.fetchTimetable();
      const { grid: loadedGrid, batch: loadedBatch } = convertApiToGrid(data, targetBatch || batch);
      
      // Update store with loaded data
      useTimetableStore.setState({ 
        grid: loadedGrid, 
        batch: loadedBatch,
        hasUnsavedChanges: false 
      });
      
      toast({
        title: 'Timetable Loaded',
        description: `Successfully loaded timetable for batch ${loadedBatch}.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load timetable';
      setError(message);
      toast({
        title: 'Load Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = exportToFlutterFormat();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${batch}-flutter.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `Timetable exported as timetable-${batch}-flutter.json`,
    });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as FlutterExportFormat;
        
        // Validate structure
        if (!data.batch || !DaysList.some(day => Array.isArray(data[day]))) {
          throw new Error('Invalid timetable format');
        }

        // Convert imported data to grid format
        const grid = TimeSlotsList.map((_, slotIndex) =>
          DaysList.map((day) => ({
            day,
            slotIndex,
            classBlock: null as ClassBlock | null,
            isOccupiedByPrevious: false,
          }))
        );

        // Parse each day's classes
        for (const day of DaysList) {
          const dayData = data[day] || [];
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

            // Labs default to 2 slots
            let duration: 1 | 2 = type === 'P' ? 2 : 1;
            
            // Override with time range if provided
            const timeEndMatch = entry.time.match(/-(\d{1,2}):(\d{2})/);
            if (timeEndMatch) {
              const endHour = parseInt(timeEndMatch[1]);
              const startHour24 = hour < 8 ? hour + 12 : hour;
              const endHour24 = endHour < 8 ? endHour + 12 : endHour;
              const diff = endHour24 - startHour24;
              duration = diff >= 2 ? 2 : 1;
            }

            const block: ClassBlock = {
              id: uuidv4(),
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

        // Update store
        useTimetableStore.setState({ 
          grid, 
          batch: data.batch as BatchID,
          hasUnsavedChanges: true 
        });
        
        toast({
          title: 'Import Successful',
          description: `Loaded timetable for batch ${data.batch}`,
        });
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'Invalid JSON file',
          variant: 'destructive',
        });
      }
    };
    
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Left section - Logo & Batch selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold leading-none">Timetable Editor</h1>
              <p className="text-xs text-muted-foreground">Public Editor</p>
            </div>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          {/* API Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs">
            {apiStatus === 'checking' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Checking API...</span>
              </>
            )}
            {apiStatus === 'online' && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-green-500">API Online</span>
              </>
            )}
            {apiStatus === 'offline' && (
              <>
                <XCircle className="h-3 w-3 text-destructive" />
                <span className="text-destructive">API Offline</span>
              </>
            )}
          </div>

          <div className="h-8 w-px bg-border hidden md:block" />

          <div className="flex items-center gap-2">
            <Select value={batch} onValueChange={handleBatchChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Batch" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="E15">E15</SelectItem>
                <SelectItem value="E16">E16</SelectItem>
                <SelectItem value="E17">E17</SelectItem>
              </SelectContent>
            </Select>

            {hasUnsavedChanges && (
              <Badge variant="secondary" className="animate-fade-in">
                Modified
              </Badge>
            )}
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          {/* Error indicator */}
          {error && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Error</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{error}</TooltipContent>
            </Tooltip>
          )}

          {/* Load from server */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleLoadTimetable()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load timetable from server</TooltipContent>
          </Tooltip>

          {/* Undo/Redo */}
          <div className="flex items-center border rounded-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo()}
                  className="rounded-r-none"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            <div className="h-4 w-px bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo()}
                  className="rounded-l-none"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>

          {/* Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import JSON from file</TooltipContent>
          </Tooltip>

          {/* Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export for Flutter app</TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}