// Fonction pour enregistrer le token dans le localStorage
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

// Fonction pour récupérer le token depuis le localStorage
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Fonction pour supprimer le token du localStorage (déconnexion)
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// Fonction pour vérifier si l'utilisateur est authentifié
export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('auth_token');
  }
  return false;
};
