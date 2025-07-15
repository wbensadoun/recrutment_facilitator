import React, { useEffect, useCallback } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, Location } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
  children?: React.ReactNode;
}

interface LocationState {
  from: Location;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles = [],
  redirectPath = '/login',
  children,
}) => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Vérifier si la session est expirée
  const checkSession = useCallback(() => {
    const lastActivity = localStorage.getItem('last_activity');
    if (!lastActivity) return false;

    const lastActivityTime = new Date(lastActivity).getTime();
    const currentTime = new Date().getTime();
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes

    return (currentTime - lastActivityTime) > sessionTimeout;
  }, []);

  // Vérifier périodiquement si la session est toujours valide
  useEffect(() => {
    if (!isAuthenticated) return;

    const verifySession = () => {
      if (checkSession()) {
        logout();
        navigate('/login', { 
          state: { from: location } as LocationState,
          replace: true 
        });
      }
    };

    // Vérifier immédiatement
    verifySession();
    
    // Puis vérifier toutes les minutes
    const interval = setInterval(verifySession, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location, logout, navigate, checkSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    // Stocker la page actuelle pour rediriger après la connexion
    localStorage.setItem('redirect_after_login', location.pathname + location.search);
    return (
      <Navigate 
        to={redirectPath} 
        state={{ from: location } as LocationState} 
        replace 
      />
    );
  }

  // Vérifier les rôles si nécessaire
  if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ from: location } as LocationState} 
        replace 
      />
    );
  }

  // Si tout est bon, afficher le contenu protégé
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
