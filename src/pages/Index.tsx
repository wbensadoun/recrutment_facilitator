import React, { useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, FileText, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthContext } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import CandidateList from '@/components/CandidateList';
import CalendarView from '@/components/CalendarView';
import Pipeline from '@/components/Pipeline';
import AdminDashboard from '@/components/AdminDashboard';
import CandidateDashboard from '@/components/CandidateDashboard';
import MainNavbar from '@/components/MainNavbar';
import BreadcrumbNav from '@/components/BreadcrumbNav';

// Separate components for each user role to avoid conditional hooks
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-lg">Loading...</div>
  </div>
);

const CandidateInterface = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <MainNavbar />
      <Header />
      <BreadcrumbNav />
      <div className="container mx-auto px-4 py-8">
        <CandidateDashboard />
      </div>
    </div>
  );
};

const AdminInterface = ({ currentPath }: { currentPath: string }) => {
  console.log('[AUTH] Rendering admin interface');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <MainNavbar />
      <Header />
      <BreadcrumbNav />
      <div className="container mx-auto px-4 py-8">
        {currentPath === 'admin_dashboard' && <AdminDashboard />}
        {/* Add other admin routes here if needed */}
      </div>
    </div>
  );
};

const RecruiterInterface = ({ path, onTabChange }: { path: string, onTabChange: (value: string) => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <MainNavbar />
      <Header />
      <BreadcrumbNav />
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <Tabs value={path} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Candidates
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            <CandidateList />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <Pipeline />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const MainContent = () => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Map URL paths to tab values
  const pathToTabMap: Record<string, string> = {
    '': 'dashboard',
    'recruiter_dashboard': 'dashboard',
    'candidate_list': 'candidates',
    'recruitment_pipeline': 'pipeline',
    'interview_calendar': 'calendar',
    'admin_dashboard': 'admin',
    'candidate_dashboard': 'candidate'
  };
  
  // Determine active tab based on current path
  const currentPath = location.pathname.split('/')[1] || '';
  const path = pathToTabMap[currentPath] || 'dashboard';
  
  // Simple redirection effect - redirect authenticated users from root to their dashboard
  useEffect(() => {
    if (authContext?.user && currentPath === '') {
      const role = authContext.user.role;
      let redirectPath = '/recruiter_dashboard'; // default
      
      if (role === 'admin') {
        redirectPath = '/admin_dashboard';
      } else if (role === 'candidate') {
        redirectPath = '/candidate_dashboard';
      }
      
      console.log(`[ROUTER] Simple redirect: ${role} → ${redirectPath}`);
      navigate(redirectPath);
      return;
    }
  }, [authContext?.user, currentPath, navigate]); // More specific dependencies

  // Handle tab changes
  const handleTabChange = (value: string) => {
    // Map tab values to URL paths
    const tabToPathMap: Record<string, string> = {
      'dashboard': 'recruiter_dashboard',
      'candidates': 'candidate_list',
      'pipeline': 'recruitment_pipeline',
      'calendar': 'interview_calendar',
      'admin': 'admin_dashboard'
    };
    navigate(`/${tabToPathMap[value] || value}`);
  };

  // Simple rendering logic based on authentication state and current path
  if (!authContext || authContext.loading) {
    return <LoadingScreen />;
  }
  
  if (!authContext.isAuthenticated) {
    return <LoginForm />;
  }
  
  // If authenticated, render based on current path
  if (currentPath === 'admin_dashboard') {
    return <AdminInterface currentPath={currentPath} />;
  }
  
  if (currentPath === 'candidate_dashboard') {
    return <CandidateInterface />;
  }
  
  // Default to recruiter interface (for recruiter_dashboard or any other authenticated route)
  return <RecruiterInterface path={path} onTabChange={handleTabChange} />;
};

const Index = () => {
  return <MainContent />;
};

export default Index;
