
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCandidates } from '@/hooks/useCandidates';
import { useRecruiters } from '@/hooks/useRecruiters';
import { useInterviews } from '@/hooks/useInterviews';
import { useToast } from '@/hooks/use-toast';
import type { Recruiter } from '@/types/database';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId?: number | null;
}

const ScheduleInterviewModal = ({ isOpen, onClose, candidateId }: ScheduleInterviewModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(candidateId ? String(candidateId) : '');
  const [selectedRecruiter, setSelectedRecruiter] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('60'); // Durée par défaut 60 min
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { candidates } = useCandidates();
  const { recruiters, loading: recruitersLoading } = useRecruiters();
  const { scheduleInterview } = useInterviews();
  const { toast } = useToast();

  // Pre-select candidate when modal opens
  useEffect(() => {
    if (candidateId && isOpen) {
      setSelectedCandidate(String(candidateId));
    }
  }, [candidateId, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedCandidate(candidateId ? String(candidateId) : '');
      setSelectedRecruiter('');
      setSelectedDuration('60');
    }
  }, [isOpen, candidateId]);
  
  // Format recruiter name for display
  const getRecruiterName = (recruiter: Recruiter) => {
    return `${recruiter.firstname} ${recruiter.lastname}`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !selectedCandidate || !selectedRecruiter || !selectedDuration) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const candidate = candidates.find(c => c.id === Number(selectedCandidate));
      const recruiter = recruiters.find(r => r.id === Number(selectedRecruiter));
      
      if (!candidate || !recruiter) {
        throw new Error('Candidate or recruiter not found');
      }
      
      // Create full date with time
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Format the date for the backend (YYYY-MM-DDTHH:MM:SS)
      const formattedDate = format(scheduledDateTime, "yyyy-MM-dd'T'HH:mm:ss");
      
      await scheduleInterview({
        candidate_id: Number(selectedCandidate),
        recruiter_id: Number(selectedRecruiter),
        scheduled_at: formattedDate,
        duration: Number(selectedDuration), // Use the selected duration
        notes: '' // Empty notes by default
      });
      
      toast({
        title: "Interview Scheduled",
        description: `Interview scheduled for ${candidate.firstname} ${candidate.lastname} with ${getRecruiterName(recruiter)} on ${format(selectedDate, 'MMM dd, yyyy')} at ${selectedTime}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Select interview details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="candidate">Candidate</Label>
            <Select 
              value={selectedCandidate} 
              onValueChange={setSelectedCandidate}
              disabled={!!candidateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a candidate" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={String(candidate.id)}>
                    {`${candidate.firstname} ${candidate.lastname}`} - {candidate.position || 'No position'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recruiter">Recruiter</Label>
            <Select 
              value={selectedRecruiter} 
              onValueChange={setSelectedRecruiter}
              disabled={recruitersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={recruitersLoading ? 'Loading recruiters...' : 'Select a recruiter'} />
              </SelectTrigger>
              <SelectContent>
                {recruiters.map((recruiter) => (
                  <SelectItem key={recruiter.id} value={String(recruiter.id)}>
                    {getRecruiterName(recruiter)} {recruiter.status === 'disabled' ? '(Inactive)' : ''}
                  </SelectItem>
                ))}
                {recruiters.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {recruitersLoading ? 'Loading...' : 'No recruiters available'}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={!selectedCandidate || !selectedRecruiter}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Select 
              value={selectedTime} 
              onValueChange={setSelectedTime}
              disabled={!selectedDate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Champ Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="45">45</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="90">90</SelectItem>
                <SelectItem value="120">120</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedCandidate || !selectedRecruiter || !selectedDate || !selectedTime}
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInterviewModal;
