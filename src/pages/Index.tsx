import { TopBar } from '@/components/timetable/TopBar';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FlaskConical, 
  GraduationCap,
  Info
} from 'lucide-react';

const Index = () => {
  const { batch, getAllClassBlocks } = useTimetableStore();
  const blocks = getAllClassBlocks();
  
  const stats = {
    lectures: blocks.filter(b => b.type === 'L').length,
    labs: blocks.filter(b => b.type === 'P').length,
    tutorials: blocks.filter(b => b.type === 'T').length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      
      <main className="flex-1 container py-6">
        {/* Stats bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              Batch {batch}
            </h2>
            <Badge variant="outline" className="text-xs">
              Weekly Schedule
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lecture-bg text-lecture">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="font-medium">{stats.lectures}</span>
                <span className="text-xs opacity-70">Lectures</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lab-bg text-lab">
                <FlaskConical className="h-3.5 w-3.5" />
                <span className="font-medium">{stats.labs}</span>
                <span className="text-xs opacity-70">Labs</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tutorial-bg text-tutorial">
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="font-medium">{stats.tutorials}</span>
                <span className="text-xs opacity-70">Tutorials</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex items-start gap-2 p-3 mb-6 rounded-lg bg-muted/50 border border-border">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Quick Tips:</strong> Click any empty cell to add a class. 
            Drag class blocks to move them. Click an existing class to edit or delete. 
            The system will automatically detect conflicts.
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="bg-card rounded-lg border shadow-block overflow-hidden">
          <TimetableGrid />
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 bg-lecture-bg border-lecture-border" />
            <span>Lecture (L)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 bg-lab-bg border-lab-border" />
            <span>Lab/Practical (P)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 bg-tutorial-bg border-tutorial-border" />
            <span>Tutorial (T)</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <span>StudySync Admin • Timetable Editor v1.0</span>
          <span>Drag & drop enabled • Auto-conflict detection</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
