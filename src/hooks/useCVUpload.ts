
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useCVUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadCV = async (file: File, candidateId: string): Promise<string | null> => {
    setUploading(true);
    try {
      console.log('[CV UPLOAD] Début upload pour candidat:', candidateId);
      console.log('[CV UPLOAD] Fichier:', file.name, 'Taille:', file.size);

      const formData = new FormData();
      formData.append('cv', file);
      formData.append('candidateId', candidateId);

      const response = await fetch(`${API_URL}/candidates/${candidateId}/cv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload du CV');
      }

      const data = await response.json();
      console.log('[CV UPLOAD] Upload réussi:', data);
      
      toast({
        title: "CV uploadé",
        description: "Le CV a été uploadé avec succès",
      });

      return data.cv_url;
    } catch (error) {
      console.error('[CV UPLOAD] Erreur:', error);
      toast({
        title: "Erreur d'upload",
        description: error.message || "Impossible d'uploader le CV",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteCV = async (cvUrl: string) => {
    try {
      const response = await fetch(`${API_URL}/candidates/cv`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ cv_url: cvUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du CV');
      }

      toast({
        title: "CV supprimé",
        description: "Le CV a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le CV",
        variant: "destructive",
      });
    }
  };

  return {
    uploadCV,
    deleteCV,
    uploading
  };
};
