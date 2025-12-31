import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trash2 } from 'lucide-react';
import type { ClassBlock, ClassType, Day, ConflictError } from '@/types/timetable';
import { DAYS, TIME_SLOTS, CLASS_TYPE_LABELS } from '@/types/timetable';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ClassBlock, 'id'>) => ConflictError | null;
  onDelete?: () => void;
  initialData?: ClassBlock | null;
  day: Day;
  slotIndex: number;
}

export function EditClassModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  day,
  slotIndex,
}: EditClassModalProps) {
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<ClassType>('L');
  const [room, setRoom] = useState('');
  const [faculty, setFaculty] = useState('');
  const [duration, setDuration] = useState<1 | 2>(1);
  const [error, setError] = useState<ConflictError | null>(null);

  const isEditing = !!initialData;
  const timeSlot = TIME_SLOTS[slotIndex];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSubject(initialData.subject);
        setType(initialData.type);
        setRoom(initialData.room);
        setFaculty(initialData.faculty);
        setDuration(initialData.duration);
      } else {
        setSubject('');
        setType('L');
        setRoom('');
        setFaculty('');
        setDuration(1);
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleTypeChange = (newType: ClassType) => {
    setType(newType);
    if (newType === 'P') {
      setDuration(2);
    } else {
      setDuration(1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim() || !room.trim() || !faculty.trim()) {
      setError({ type: 'logic', message: 'Please fill in all required fields' });
      return;
    }

    const data: Omit<ClassBlock, 'id'> = {
      subject: subject.trim(),
      type,
      room: room.trim(),
      faculty: faculty.trim().toUpperCase(),
      duration,
      day,
      slotIndex,
    };

    const conflict = onSave(data);
    if (conflict) {
      setError(conflict);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? 'Edit Class' : 'Add New Class'}
            </DialogTitle>
            <DialogDescription>
              {day}, {timeSlot?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="subject">Subject Code</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., L-CNS, P-VLSI LAB"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => handleTypeChange(v as ClassType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="L">{CLASS_TYPE_LABELS.L}</SelectItem>
                    <SelectItem value="P">{CLASS_TYPE_LABELS.P}</SelectItem>
                    <SelectItem value="T">{CLASS_TYPE_LABELS.T}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Select 
                  value={String(duration)} 
                  onValueChange={(v) => setDuration(Number(v) as 1 | 2)}
                  disabled={type !== 'P'}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="1">1 Slot (50 min)</SelectItem>
                    <SelectItem value="2">2 Slots (Lab)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="room">Room Number</Label>
                <Input
                  id="room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g., 201"
                  className="font-mono"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="faculty">Faculty Initials</Label>
                <Input
                  id="faculty"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value.toUpperCase())}
                  placeholder="e.g., ABK"
                  className="font-mono uppercase"
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Add Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
