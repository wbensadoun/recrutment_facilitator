
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRecruiters } from '@/hooks/useRecruiters';
import { useRecruiterPermissions } from '@/hooks/useRecruiterPermissions';
import { format } from 'date-fns';

const RecruiterPermissionsConfig = () => {
  const { recruiters } = useRecruiters();
  const { 
    recruiterPermissions, 
    permissions, 
    loading, 
    hasPermission, 
    updateRecruiterPermissions, 
    setAllPermissions, 
    saveRecruiterPermissions 
  } = useRecruiterPermissions();

  // Initialize permissions for new recruiters
  useEffect(() => {
    const activeRecruiters = recruiters.filter(r => r.status === 'active');
    const existingPermissions = recruiterPermissions.map(rp => rp.recruiterId);
    
    const newRecruiters = activeRecruiters.filter(r => !existingPermissions.includes(String(r.id)));
    
    if (newRecruiters.length > 0) {
      newRecruiters.forEach(recruiter => {
        setAllPermissions(String(recruiter.id), false); // No permissions by default
      });
    }
  }, [recruiters, recruiterPermissions, setAllPermissions]);

  const handleTogglePermission = (recruiterId: string, permissionId: string) => {
    const currentlyHas = hasPermission(recruiterId, permissionId);
    updateRecruiterPermissions(recruiterId, permissionId, !currentlyHas);
  };

  const handleSavePermissions = () => {
    saveRecruiterPermissions(recruiterPermissions);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Recruiter Rights</h3>
          <p className="text-sm text-gray-600">Manage permissions granted to each recruiter</p>
        </div>
        
        <Button onClick={handleSavePermissions}>
          Save Permissions
        </Button>
      </div>

      <div className="space-y-6">
        {recruiters.filter(r => r.status === 'active').map((recruiter) => {
          const recruiterPerm = recruiterPermissions.find(rp => rp.recruiterId === String(recruiter.id));
          const allPermissionsEnabled = permissions.every(p => hasPermission(String(recruiter.id), p.id));
          
          return (
            <Card key={recruiter.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{`${recruiter.firstname} ${recruiter.lastname}`}</CardTitle>
                    <p className="text-sm text-gray-600">{recruiter.email}</p>
                    <p className="text-xs text-gray-500">
                      Registered on: {format(new Date(recruiter.created_at), 'MM/dd/yyyy')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`all-permissions-${recruiter.id}`}
                        checked={allPermissionsEnabled}
                        onCheckedChange={(checked) => setAllPermissions(String(recruiter.id), checked)}
                      />
                      <Label htmlFor={`all-permissions-${recruiter.id}`} className="text-sm">
                        All rights
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{permission.name}</div>
                        <div className="text-xs text-gray-600">{permission.description}</div>
                      </div>
                      <Switch
                        id={`${recruiter.id}-${permission.id}`}
                        checked={hasPermission(String(recruiter.id), permission.id)}
                        onCheckedChange={() => handleTogglePermission(String(recruiter.id), permission.id)}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Active permissions: {recruiterPerm?.permissions.length || 0} / {permissions.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recruiters.filter(r => r.status === 'active').length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No active recruiters to configure permissions</p>
        </div>
      )}
    </div>
  );
};

export default RecruiterPermissionsConfig;
