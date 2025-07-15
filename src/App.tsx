
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

// Composant pour logger les changements de route
const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('[ROUTER] Current path:', location.pathname);
    console.log('[ROUTER] Current search params:', location.search);
  }, [location]);
  
  return null;
};

// Composant pour les routes publiques qui redirige si déjà connecté
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (isAuthenticated) {
    // Rediriger vers la page précédente ou la page d'accueil
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteLogger />
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/reset-password" element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } />
            
            {/* Routes protégées */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/admin_dashboard" element={<Index />} />
              <Route path="/admin/recruiters" element={<Index />} />
              <Route path="/recruiter_dashboard" element={<Index />} />
              <Route path="/candidate_list" element={<Index />} />
              <Route path="/interview_calendar" element={<Index />} />
              <Route path="/recruitment_pipeline" element={<Index />} />
              <Route path="/user_profile" element={<Index />} />
              <Route path="/system_settings" element={<Index />} />
            </Route>
            
            {/* Route non autorisée */}
            <Route 
              path="/unauthorized" 
              element={
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                  <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Accès non autorisé</h2>
                    <p className="text-gray-600 mb-6">
                      Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        onClick={() => window.history.back()} 
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        Retour
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/'} 
                        className="w-full sm:w-auto"
                      >
                        Page d'accueil
                      </Button>
                    </div>
                  </div>
                </div>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
