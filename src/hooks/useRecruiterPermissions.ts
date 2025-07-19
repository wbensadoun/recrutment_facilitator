import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

// Interface pour l'état local
export interface RecruiterPermissionState {
  recruiterId: string;
  permissions: string[];
}

export const useRecruiterPermissions = () => {
  // Définition de toutes les permissions possibles.
  // Les IDs ici correspondent aux noms des colonnes dans la table `recruiter_rights`.
  const permissionDefinitions = [
    { id: 'view_candidates', name: 'View candidates', description: 'View the list of candidates' },
    { id: 'create_candidates', name: 'Create candidates', description: 'Add new candidates' },
    { id: 'modify_candidates', name: 'Edit candidates', description: 'Modify candidate information' },
    { id: 'view_interviews', name: 'View interviews', description: 'View scheduled interviews' },
    { id: 'create_interviews', name: 'Create interviews', description: 'Schedule new interviews' },
    { id: 'modify_interviews', name: 'Edit interviews', description: 'Modify existing interviews' },
    { id: 'modify_statuses', name: 'Change statuses', description: 'Change candidate statuses' },
    { id: 'modify_stages', name: 'Change stages', description: 'Change candidate stages' }
  ];

  const [recruiterPermissions, setRecruiterPermissions] = useState<RecruiterPermissionState[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecruiterPermissions = async () => {
    setLoading(true);
    try {
      console.log('HOOK: Appel api.recruiterRights.getAll');
      const data = await api.recruiterRights.getAll();
      // data doit être un tableau d'objets { user_id, view_candidates, ... }
      const transformedData = data.map((row: any) => {
        const activePermissions: string[] = [];
        for (const perm of permissionDefinitions) {
          if (row[perm.id] === true) {
            activePermissions.push(perm.id);
          }
        }
        return {
          recruiterId: row.user_id.toString(),
          permissions: activePermissions
        };
      });
      setRecruiterPermissions(transformedData);
    } catch (error) {
      console.error('Error fetching recruiter permissions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les permissions des recruteurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRecruiterPermissions = async (permissionsToSave: RecruiterPermissionState[]) => {
    try {
      for (const recruiterState of permissionsToSave) {
        const rights = {
          view_candidates: recruiterState.permissions.includes('view_candidates'),
          create_candidates: recruiterState.permissions.includes('create_candidates'),
          modify_candidates: recruiterState.permissions.includes('modify_candidates'),
          view_interviews: recruiterState.permissions.includes('view_interviews'),
          create_interviews: recruiterState.permissions.includes('create_interviews'),
          modify_interviews: recruiterState.permissions.includes('modify_interviews'),
          modify_statuses: recruiterState.permissions.includes('modify_statuses'),
          modify_stages: recruiterState.permissions.includes('modify_stages'),
        };
        console.log('HOOK: Appel api.recruiterRights.update pour', recruiterState.recruiterId, rights);
        await api.recruiterRights.update(recruiterState.recruiterId, rights);
      }
      toast({
        title: "Succès",
        description: "Les permissions ont été sauvegardées avec succès.",
      });
      // Optionnel: re-fetch si besoin
      await fetchRecruiterPermissions();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des permissions :', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions.",
        variant: "destructive",
      });
    }
  };
  
  const updateRecruiterPermissions = (recruiterId: string, permissions: string[]) => {
    setRecruiterPermissions(prev => {
      const existingIndex = prev.findIndex(p => p.recruiterId === recruiterId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], permissions };
        return updated;
      }
      return [...prev, { recruiterId, permissions }];
    });
  };

  const setAllPermissions = (recruiterId: string, hasPermission: boolean) => {
    const allPermissionIds = permissionDefinitions.map(p => p.id);
    updateRecruiterPermissions(
      recruiterId,
      hasPermission ? allPermissionIds : []
    );
  };

  useEffect(() => {
    fetchRecruiterPermissions();
  }, []);

  return {
    recruiterPermissions,
    permissions: permissionDefinitions,
    loading,
    fetchRecruiterPermissions,
    saveRecruiterPermissions,
    updateRecruiterPermissions,
    setAllPermissions,
  };
};
