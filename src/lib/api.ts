import axios from 'axios';
import { getToken } from '@/lib/auth';

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter un intercepteur pour inclure le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gestion des réponses d'erreur
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Gestion des erreurs HTTP
      const { status, data } = error.response;
      
      if (status === 401) {
        // Rediriger vers la page de connexion si non authentifié
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject({
        status,
        message: data?.message || 'Une erreur est survenue',
        ...data,
      });
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      return Promise.reject({
        message: 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.',
      });
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      return Promise.reject({
        message: error.message || 'Une erreur inattendue est survenue',
      });
    }
  }
);

export { api };

export default api;
