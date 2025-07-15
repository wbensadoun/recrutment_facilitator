
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/postgres/client';
import { useToast } from '@/hooks/use-toast';

// Types pour les données de la table recruiter_permissions
interface RecruiterPermissionDB {
  id: string;
  recruiter_id: string;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RecruiterPermission {
  recruiterId: string;
  permissions: string[];
}

export const useRecruiterPermissions = () => {
  const [recruiterPermissions, setRecruiterPermissions] = useState<RecruiterPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const permissions: Permission[] = [
    { id: 'view_candidates', name: 'View candidates', description: 'View the list of candidates' },
    { id: 'create_candidates', name: 'Create candidates', description: 'Add new candidates' },
    { id: 'edit_candidates', name: 'Edit candidates', description: 'Modify candidate information' },
    { id: 'view_interviews', name: 'View interviews', description: 'View scheduled interviews' },
    { id: 'create_interviews', name: 'Create interviews', description: 'Schedule new interviews' },
    { id: 'edit_interviews', name: 'Edit interviews', description: 'Modify existing interviews' },
    { id: 'change_status', name: 'Change statuses', description: 'Change candidate statuses' },
    { id: 'change_stage', name: 'Change stages', description: 'Change candidate stages' }
  ];

  const fetchRecruiterPermissions = async () => {
    try {
      // Récupérer les données directement depuis le client personnalisé
      const response = await supabase
        .from('recruiter_permissions')
        .select('*');
      
      // Vérifier si la réponse est valide
      if (!response) {
        throw new Error('No response from database');
      }
      
      // S'assurer que nous avons un tableau
      const responseData = Array.isArray(response) ? response : [response];
      
      // Type guard pour vérifier la structure des données
      const isValidPermission = (item: any): item is RecruiterPermissionDB => {
        return (
          item &&
          typeof item === 'object' &&
          'recruiter_id' in item &&
          'permissions' in item
        );
      };
      
      // Transformer les données avec un type sûr
      const transformedData = responseData
        .filter(isValidPermission)
        .map(item => ({
          recruiterId: String(item.recruiter_id),
          permissions: Array.isArray(item.permissions) 
            ? item.permissions.map(String) 
            : []
        }));

      setRecruiterPermissions(transformedData);
    } catch (error) {
      console.error('Error fetching recruiter permissions:', error);
      toast({
        title: "Error",
        description: "Unable to load recruiter permissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRecruiterPermissions = async (permissions: RecruiterPermission[]) => {
    try {
      // Récupérer tous les enregistrements existants
      const existingItems = await supabase
        .from('recruiter_permissions')
        .select('*');
      
      // Vérifier si la réponse est valide
      if (!existingItems) {
        throw new Error('Failed to fetch existing permissions');
      }
      
      // Type guard pour vérifier la structure des données
      const isValidItem = (item: any): item is { id: string } => {
        return item && typeof item === 'object' && 'id' in item;
      };
      
      // Convertir en tableau et filtrer les éléments invalides
      const itemsToProcess = (Array.isArray(existingItems) 
        ? existingItems 
        : [existingItems])
        .filter(isValidItem);
      
      // Supprimer les éléments un par un (sauf l'ID spécial)
      for (const item of itemsToProcess) {
        if (item.id !== '00000000-0000-0000-0000-000000000000') {
          await supabase
            .from('recruiter_permissions')
            .delete()
            .eq('id', item.id);
        }
      }

      // Insérer les nouvelles permissions
      const dataToInsert = permissions.map(perm => ({
        recruiter_id: perm.recruiterId,
        permissions: perm.permissions
      }));

      if (dataToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('recruiter_permissions')
          .insert(dataToInsert)
          .select()
          .single();

        if (insertError) throw insertError;
      }

      toast({
        title: "Permissions updated",
        description: "Permissions have been successfully updated",
      });

      await fetchRecruiterPermissions();
    } catch (error) {
      console.error('Error saving recruiter permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const hasPermission = (recruiterId: string, permissionId: string) => {
    const recruiterPerm = recruiterPermissions.find(rp => rp.recruiterId === recruiterId);
    return recruiterPerm?.permissions.includes(permissionId) || false;
  };

  const updateRecruiterPermissions = (recruiterId: string, permissionId: string, enabled: boolean) => {
    setRecruiterPermissions(prev => {
      // Vérifier si le recruteur existe déjà dans la liste
      const existingIndex = prev.findIndex(rp => rp.recruiterId === recruiterId);
      
      if (existingIndex >= 0) {
        // Mettre à jour le recruteur existant
        return prev.map(rp => {
          if (rp.recruiterId === recruiterId) {
            const currentPermissions = rp.permissions || [];
            return {
              ...rp,
              permissions: enabled 
                ? [...currentPermissions.filter(p => p !== permissionId), permissionId]
                : currentPermissions.filter(p => p !== permissionId)
            };
          }
          return rp;
        });
      } else {
        // Ajouter un nouveau recruteur
        return [...prev, {
          recruiterId,
          permissions: enabled ? [permissionId] : []
        }];
      }
    });
  };

  const setAllPermissions = (recruiterId: string, enable: boolean) => {
    setRecruiterPermissions(prev => {
      const existingIndex = prev.findIndex(rp => rp.recruiterId === recruiterId);
      
      if (existingIndex >= 0) {
        // Mettre à jour le recruteur existant
        return prev.map(rp => 
          rp.recruiterId === recruiterId 
            ? { ...rp, permissions: enable ? permissions.map(p => p.id) : [] }
            : rp
        );
      } else {
        // Ajouter un nouveau recruteur
        return [...prev, {
          recruiterId,
          permissions: enable ? permissions.map(p => p.id) : []
        }];
      }
    });
  };

  useEffect(() => {
    fetchRecruiterPermissions();
  }, []);

  return {
    recruiterPermissions,
    permissions,
    loading,
    hasPermission,
    updateRecruiterPermissions,
    setAllPermissions,
    saveRecruiterPermissions
  };
};
