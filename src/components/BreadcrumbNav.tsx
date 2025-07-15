import { useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

const BreadcrumbNav = () => {
  const location = useLocation();
  
  // Get current path
  const currentPath = location.pathname.substring(1) || 'dashboard';
  
  // Map path names to display names
  const pathDisplayNames: Record<string, string> = {
    '': 'Home',
    'recruiter_dashboard': 'Dashboard',
    'candidate_list': 'Candidates',
    'interview_calendar': 'Calendar',
    'recruitment_pipeline': 'Pipeline',
    'admin_dashboard': 'Administration',
    'user_profile': 'Profile',
    'system_settings': 'Settings',
    'admin': 'Administration',
  };
  
  // Get current path segments
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // If we're at the root, show dashboard
  const segments = pathSegments.length === 0 ? ['dashboard'] : pathSegments;

  return (
    <div className="container mx-auto px-4 py-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const displayName = pathDisplayNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
            
            return (
              <BreadcrumbItem key={segment}>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink href={`/${segments.slice(0, index + 1).join('/')}`}>
                      {displayName}
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default BreadcrumbNav;
