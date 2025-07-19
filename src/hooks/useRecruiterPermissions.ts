
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

  /**
   * Sauvegarde (insère ou met à jour) les permissions pour un ou plusieurs recruteurs.
   * @param permissions Un tableau d'objets de permission.
   * Chaque objet doit contenir le user_id et les booléens de permission.
   */
  const saveRecruiterPermissions = async (permissions: RecruiterPermission[]) => {
    if (!permissions || permissions.length === 0) {
      console.log("Aucune permission à sauvegarder.");
      return;
    }

    try {
      // Pour chaque permission à mettre à jour
      for (const perm of permissions) {
        const permissionData = {
          user_id: parseInt(perm.recruiterId, 10),
          view_candidates: perm.permissions.includes('view_candidates'),
          create_candidates: perm.permissions.includes('create_candidates'),
          modify_candidates: perm.permissions.includes('edit_candidates'),
          view_interviews: perm.permissions.includes('view_interviews'),
          create_interviews: perm.permissions.includes('create_interviews'),
          modify_interviews: perm.permissions.includes('edit_interviews'),
          modify_statuses: perm.permissions.includes('change_status'),
          modify_stages: perm.permissions.includes('change_stage'),
          updated_at: new Date().toISOString()
        };

        // Vérifier si l'entrée existe déjà en utilisant single()
        const { data: existingData } = await supabase
          .from('recruiter_rights')
          .select()
          .eq('user_id', permissionData.user_id)
          .single();

        const exists = existingData !== null;

        if (exists) {
          // Mise à jour si l'entrée existe
          await supabase
            .from('recruiter_rights')
            .update(permissionData)
            .eq('user_id', permissionData.user_id);
        } else {
          // Insertion si l'entrée n'existe pas
          await supabase
            .from('recruiter_rights')
            .insert([permissionData]);
        }
      }

      // Récupérer les données mises à jour
      const { data } = await supabase
        .from('recruiter_rights')
        .select()
        .order('user_id', { ascending: true });

      console.log('Permissions sauvegardées avec succès :', data);
      
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions ont été mises à jour avec succès",
      });

      // Rafraîchir les données
      await fetchRecruiterPermissions();
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des permissions :', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions",
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
