
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

export type UserRole = 'admin' | 'recruiter' | 'candidate';

export interface AuthUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes en millisecondes
  let logoutTimer: NodeJS.Timeout;

  const startLogoutTimer = () => {
    // Effacer tout timer existant
    if (logoutTimer) clearTimeout(logoutTimer);
    
    // Démarrer un nouveau timer
    logoutTimer = setTimeout(() => {
      console.log('[AUTH] Session expired due to inactivity');
      logout();
      toast({
        title: 'Session expirée',
        description: 'Votre session a expiré en raison d\'une inactivité prolongée',
        variant: 'destructive',
      });
    }, SESSION_TIMEOUT);
  };

  const resetLogoutTimer = () => {
    if (user) {
      startLogoutTimer();
    }
  };

  // Gestion des événements utilisateur pour réinitialiser le timer
  useEffect(() => {
    if (!user) return;
    
    const events = ['mousedown', 'keydown', 'mousemove', 'scroll', 'click'];
    
    // Démarrer le timer initial
    startLogoutTimer();
    
    // Ajouter les écouteurs d'événements
    events.forEach(event => {
      window.addEventListener(event, resetLogoutTimer);
    });
    
    // Nettoyage
    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetLogoutTimer);
      });
    };
  }, [user]);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté dans localStorage
    const storedUser = localStorage.getItem('auth_user');
    const lastActivity = localStorage.getItem('last_activity');
    
    console.log('[AUTH] Checking stored user:', storedUser ? 'Found' : 'Not found');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Vérifier si la session a expiré
        if (lastActivity) {
          const lastActivityTime = new Date(lastActivity).getTime();
          const currentTime = new Date().getTime();
          const timeElapsed = currentTime - lastActivityTime;
          
          if (timeElapsed >= SESSION_TIMEOUT) {
            console.log('[AUTH] Session expired');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('last_activity');
            setLoading(false);
            return;
          }
        }
        
        console.log('[AUTH] Parsed user:', parsedUser);
        console.log('[AUTH] User role:', parsedUser.role);
        setUser(parsedUser);
        
        // Mettre à jour le timestamp de dernière activité
        localStorage.setItem('last_activity', new Date().toISOString());
      } catch (error) {
        console.error('[AUTH] Error parsing stored user:', error);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('last_activity');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('[AUTH] Login attempt for:', email);
      console.log('[AUTH] Password provided:', password ? '********' : 'empty');
      
      // Utiliser l'API pour l'authentification
      console.log('[AUTH] Calling api.auth.login...');
      const response = await api.auth.login(email, password);
      console.log('[AUTH] API response:', JSON.stringify(response, null, 2));

      if (response.user) {
        const authUser: AuthUser = {
          id: response.user.id,
          email: response.user.email,
          firstname: response.user.firstname,
          lastname: response.user.lastname,
          role: response.user.role as UserRole
        };

        console.log('[AUTH] User authenticated successfully:', authUser);
        console.log('[AUTH] User role:', authUser.role);
        setUser(authUser);
        
        // Stocker l'utilisateur dans localStorage pour la persistance
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        // Enregistrer l'heure de connexion
        localStorage.setItem('last_activity', new Date().toISOString());
        console.log('[AUTH] User stored in localStorage');
        
        // Démarrer le timer de déconnexion automatique
        startLogoutTimer();
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${response.user.firstname} ${response.user.lastname}`,
        });
        
        return true;
      }

      toast({
        title: "Login error",
        description: "Incorrect username or password",
        variant: "destructive",
      });
      return false;
    } catch (error: any) {
      console.error('Exception lors de la connexion:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    // Effacer le timer
    if (logoutTimer) clearTimeout(logoutTimer);
    
    // Nettoyer le stockage local
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('last_activity');
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
