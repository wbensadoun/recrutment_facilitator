import { ErrorCode, AppError } from '@/types/errors';
import { handleApiError } from '@/utils/error-handler';

// Configuration de l'API via variable d'environnement
// Pour changer l'URL, modifiez VITE_API_URL dans le fichier .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Authentification
  auth: {
    login: async (email: string, password: string) => {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new AppError(
              ErrorCode.AUTH_INVALID_CREDENTIALS,
              'Invalid email or password'
            );
          }
          throw new AppError(
            ErrorCode.API_ERROR,
            data.error || 'Login failed'
          );
        }
        
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
  },
  
  // Recruteurs
  recruiters: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_URL}/recruiters`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new AppError(
            ErrorCode.OPERATION_FAILED,
            data.error || 'Failed to retrieve recruiters'
          );
        }
        
        return data;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    
    add: async (recruiterData: { firstname: string; lastname: string; email: string; status?: number }) => {
      console.log('API: Ajout d\'un recruteur - Données reçues:', recruiterData);
      
      // L'ID sera généré côté serveur
      console.log('API: L\'ID sera généré côté serveur');
      
      const requestData = recruiterData;
      console.log('API: Données à envoyer:', requestData);
      
      try {
        console.log(`API: Envoi de la requête POST à ${API_URL}/recruiters`);
        const response = await fetch(`${API_URL}/recruiters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        console.log('API: Statut de la réponse:', response.status);
        console.log('API: Headers de la réponse:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('API: Données reçues:', data);
        
        if (!response.ok) {
          console.error('API: Erreur lors de l\'ajout du recruteur:', data);
          throw new Error(data.error || 'Impossible d\'ajouter le recruteur');
        }
        
        return data;
      } catch (error) {
        console.error('API: Exception lors de l\'ajout du recruteur:', error);
        throw error;
      }
    },
    
    updateStatus: async (id: number, status: string) => {
      try {
        const response = await fetch(`${API_URL}/recruiters/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Unable to update recruiter status');
        }
        
        const data = await response.json();
        console.log('API: Data received after update:', data);
        return data;
      } catch (error) {
        console.error('API: Exception during status update:', error);
        throw error;
      }
    },
    
    delete: async (id: number) => {
      const response = await fetch(`${API_URL}/recruiters/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Impossible de supprimer le recruteur');
      }
      
      return response.json();
    },
  },

  // Candidats
  candidates: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/candidates`);
      if (!response.ok) {
        throw new Error('Impossible de récupérer les candidats');
      }
      return response.json();
    },

    add: async (candidateData: any) => {
      const response = await fetch(`${API_URL}/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible d\'ajouter le candidat');
      }
      return response.json();
    },

    update: async (id: number, data: any) => {
      const response = await fetch(`${API_URL}/candidates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible de mettre à jour le candidat');
      }
      return response.json();
    },

    delete: async (id: number) => {
      const response = await fetch(`${API_URL}/candidates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossible de supprimer le candidat');
      }
      return response.json();
    },
  },

  // Pipeline Stages
  pipelineStages: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/pipeline-stages`);
      
      if (!response.ok) {
        throw new Error('Unable to retrieve pipeline stages');
      }
      
      return response.json();
    },

    add: async (stageData: any) => {
      const response = await fetch(`${API_URL}/pipeline-stages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stageData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to add pipeline stage');
      }
      
      return response.json();
    },

    update: async (id: string, data: any) => {
      const response = await fetch(`${API_URL}/pipeline-stages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to update pipeline stage');
      }
      
      return response.json();
    },

    updateStatus: async (id: string, is_active: boolean) => {
      try {
        const response = await fetch(`${API_URL}/pipeline-stages/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Unable to update pipeline stage status');
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('API Error updating pipeline stage status:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_URL}/pipeline-stages/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to delete pipeline stage');
      }
      
      return response.json();
    },
  },

  // Interviews
  interviews: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/interviews`);
      
      if (!response.ok) {
        throw new Error('Unable to retrieve interviews');
      }
      
      return response.json();
    },

    getForCandidate: async (candidateId: string) => {
      const response = await fetch(`${API_URL}/interviews/candidate/${candidateId}`);
      
      if (!response.ok) {
        throw new Error('Unable to retrieve candidate interviews');
      }
      
      return response.json();
    },

    add: async (interviewData: any) => {
      const response = await fetch(`${API_URL}/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interviewData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to add interview');
      }
      
      return response.json();
    },

    update: async (id: string, data: any) => {
      const response = await fetch(`${API_URL}/interviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to update interview');
      }
      
      return response.json();
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_URL}/interviews/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unable to delete interview');
      }
      
      return response.json();
    },
  },

  recruiterRights: {
    update: async (user_id: string, rights: {
      view_candidates: boolean,
      create_candidates: boolean,
      modify_candidates: boolean,
      view_interviews: boolean,
      create_interviews: boolean,
      modify_interviews: boolean,
      modify_statuses: boolean,
      modify_stages: boolean
    }) => {
      try {
        console.log(`API: Envoi de la requête PUT à ${API_URL}/recruiter-rights/${user_id}`);
        console.log('API: Données à envoyer:', rights);
        const response = await fetch(`${API_URL}/recruiter-rights/${user_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rights),
        });
        console.log('API: Statut de la réponse:', response.status);
        const data = await response.json();
        console.log('API: Données reçues:', data);
        if (!response.ok) {
          console.error('API: Erreur lors de la mise à jour des droits:', data);
          throw new Error(data.error || 'Impossible de mettre à jour les droits du recruteur');
        }
        return data;
      } catch (error) {
        console.error('API: Exception lors de la mise à jour des droits:', error);
        throw error;
      }
    },
    getAll: async () => {
      try {
        console.log(`API: Envoi de la requête GET à ${API_URL}/recruiter-rights`);
        const response = await fetch(`${API_URL}/recruiter-rights`);
        const data = await response.json();
        console.log('API: Données reçues:', data);
        if (!response.ok) {
          throw new Error(data.error || 'Impossible de récupérer les droits des recruteurs');
        }
        return data;
      } catch (error) {
        console.error('API: Exception lors de la récupération des droits:', error);
        throw error;
      }
    },
  },

  candidateStatus: {
    update: async (id: string, data: { name: string, is_active: boolean }) => {
      try {
        console.log(`[API] candidateStatus.update - id:`, id, 'data:', data);
        console.log(`API: Envoi de la requête PUT à ${API_URL}/candidate-status/${id}`);
        console.log('API: Données à envoyer:', data);
        const response = await fetch(`${API_URL}/candidate-status/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        const resData = await response.json();
        console.log('[API] candidateStatus.update - Réponse reçue:', resData);
        if (!response.ok) {
          console.error('[API] candidateStatus.update - Erreur HTTP:', resData);
          throw new Error(resData.error || 'Unable to update candidate status');
        }
        return resData;
      } catch (error) {
        console.error('[API] candidateStatus.update - Exception:', error);
        throw error;
      }
    },
    getAll: async () => {
      try {
        console.log(`API: Envoi de la requête GET à ${API_URL}/candidate-status`);
        const response = await fetch(`${API_URL}/candidate-status`);
        const data = await response.json();
        console.log('[API] candidateStatus.getAll - Données reçues:', data);
        if (!response.ok) {
          throw new Error(data.error || 'Unable to fetch candidate statuses');
        }
        return data;
      } catch (error) {
        console.error('[API] candidateStatus.getAll - Exception:', error);
        throw error;
      }
    },
  },
};
