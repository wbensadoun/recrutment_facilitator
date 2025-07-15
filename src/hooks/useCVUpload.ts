
import { useState } from 'react';
import { supabase } from '@/integrations/postgres/client';
import { useToast } from '@/hooks/use-toast';

export const useCVUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadCV = async (file: File, candidateId: string): Promise<string | null> => {
    try {
      setUploading(true);

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${candidateId}-${Date.now()}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      // Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);

      toast({
        title: "CV uploaded",
        description: "The CV has been successfully uploaded",
      });

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading CV:', error);
      toast({
        title: "Upload error",
        description: "Failed to upload CV",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteCV = async (cvUrl: string) => {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = cvUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `cvs/${fileName}`;

      const { error } = await supabase.storage
        .from('cvs')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      toast({
        title: "CV supprimé",
        description: "Le CV a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast({
        title: "Error",
        description: "Failed to delete CV",
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
