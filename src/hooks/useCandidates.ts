
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Candidate, CandidateStatus, StageType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

    const fetchCandidates = async () => {
    try {
      const data = await api.candidates.getAll();
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: "Error",
        description: "Unable to load candidates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

    const addCandidate = async (candidateData: Omit<Candidate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const newCandidate = await api.candidates.add(candidateData);
      toast({
        title: "Candidate added",
        description: `${candidateData.firstname} ${candidateData.lastname} has been successfully added`,
      });
      fetchCandidates();
      return newCandidate;
    } catch (error) {
      console.error('Error adding candidate:', error);
      toast({
        title: "Error",
        description: "Failed to add candidate",
        variant: "destructive",
      });
      throw error;
    }
  };

    const updateCandidate = async (candidateId: number, updates: Partial<Candidate>) => {
    try {
      await api.candidates.update(candidateId, updates);
      toast({
        title: "Candidat mis à jour",
        description: "Les informations du candidat ont été mises à jour",
      });
      fetchCandidates();
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le candidat",
        variant: "destructive",
      });
    }
  };

    const updateCandidateStatus = async (candidateId: number, status: CandidateStatus) => {
    // Récupérer d'abord les informations complètes du candidat
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) {
      throw new Error('Candidat non trouvé');
    }
    
    // Mettre à jour avec les informations requises
    await updateCandidate(candidateId, { 
      firstname: candidate.firstname,
      lastname: candidate.lastname,
      email: candidate.email,
      position: candidate.position || 'Non spécifié',
      current_stage: candidate.current_stage,
      status: status
    });
  };

    const updateCandidateStage = async (candidateId: number, stageId: number) => {
    try {
      // Trouver le candidat pour garder les autres propriétés
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) {
        throw new Error('Candidat non trouvé');
      }

      // Mettre à jour le candidat avec le nouveau current_stage
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/candidates/${candidateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...candidate,
          pipeline_stage_id: stageId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible de mettre à jour le stage du candidat');
      }
      
      // Mettre à jour le cache local
      setCandidates(prevCandidates => 
        prevCandidates.map(c => 
          c.id === candidateId 
            ? { 
                ...c, 
                pipeline_stage_id: stageId,
                status: 'in_progress',
                // Mettre à jour le nom de l'étape si disponible dans la réponse
                ...(c.stage_name && { stage_name: `Stage ${stageId}` }) // À remplacer par le vrai nom de l'étape si disponible
              } 
            : c
        )
      );
      
      toast({
        title: "Stage mis à jour",
        description: "Le stage du candidat a été mis à jour avec succès",
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error updating candidate stage:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le stage du candidat",
        variant: "destructive",
      });
      throw error;
    }
  };

    const deleteCandidate = async (candidateId: number) => {
    try {
      await api.candidates.delete(candidateId);
      toast({
        title: "Candidat supprimé",
        description: "Le candidat a été supprimé avec succès",
      });
      fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le candidat",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadCandidates = async () => {
      try {
        const data = await api.candidates.getAll();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setCandidates(data || []);
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
        if (isMounted) {
          toast({
            title: "Erreur",
            description: "Impossible de charger les candidats",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadCandidates();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    candidates,
    loading,
    addCandidate,
    updateCandidate,
    updateCandidateStatus,
    updateCandidateStage,
    deleteCandidate,
    refetch: fetchCandidates
  };
};
