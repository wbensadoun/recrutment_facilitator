
import { useState, useEffect } from 'react';
import { Interview, StageType, CandidateStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

export const useInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const data = await api.interviews.getAll();
      setInterviews(data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: "Error",
        description: "Unable to load interviews. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleInterview = async (interviewData: {
    candidate_id: number;
    recruiter_id: number;
    scheduled_at: string;
    duration?: number;
    notes?: string;
    status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  }) => {
    try {
      const newInterview = await api.interviews.add({
        candidate_id: interviewData.candidate_id,
        recruiter_id: interviewData.recruiter_id,
        scheduled_at: interviewData.scheduled_at,
        duration: interviewData.duration,
        notes: interviewData.notes,
        status: interviewData.status || 'scheduled'
      });
      
      // Mettre à jour la liste des entretiens
      await fetchInterviews();
      
      toast({
        title: "Entretien programmé",
        description: "L'entretien a été programmé avec succès.",
      });
      
      return newInterview;
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: "Unable to schedule the interview. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateInterview = async (id: number, data: Partial<Interview>) => {
    try {
      const updatedInterview = await api.interviews.update(id.toString(), data);
      await fetchInterviews();
      
      toast({
        title: "Entretien mis à jour",
        description: "Les informations de l'entretien ont été mises à jour.",
      });
      
      return updatedInterview;
    } catch (error) {
      console.error('Error updating interview:', error);
      toast({
        title: "Error",
        description: "Unable to update the interview. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const cancelInterview = async (id: number) => {
    try {
      await api.interviews.delete(id.toString());
      await fetchInterviews();
      
      toast({
        title: "Entretien annulé",
        description: "L'entretien a été annulé avec succès.",
      });
    } catch (error) {
      console.error('Error cancelling interview:', error);
      toast({
        title: "Error",
        description: "Unable to cancel the interview. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Charger les entretiens au montage du composant
  useEffect(() => {
    fetchInterviews();
  }, []);

  return {
    interviews,
    loading,
    scheduleInterview,
    updateInterview,
    cancelInterview,
    refreshInterviews: fetchInterviews,
  };
};
