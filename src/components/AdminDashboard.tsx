import { useState } from 'react';
import { Recruiter } from '../types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Settings, Trash2, Edit } from 'lucide-react';
import { useRecruiters } from '@/hooks/useRecruiters';
import { format } from 'date-fns';
import ConfigurationModal from './ConfigurationModal';

const AdminDashboard = () => {

  const { recruiters, loading, addRecruiter, updateRecruiterStatus, deleteRecruiter } = useRecruiters();
  
  const [newRecruiter, setNewRecruiter] = useState({
    firstname: '',
    lastname: '',
    email: ''
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRecruiter.firstname || !newRecruiter.lastname || !newRecruiter.email) {
      return;
    }

    setSubmitting(true);
    try {
      await addRecruiter(newRecruiter);
      setNewRecruiter({ firstname: '', lastname: '', email: '' });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding recruiter:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (recruiter: Recruiter) => {
    try {
      const newStatus = recruiter.status === 'active' ? 'disabled' : 'active';

      await updateRecruiterStatus(recruiter.id, newStatus);
    } catch (error) {
      console.error("Error updating recruiter status:", error);
    }
  };

  const handleDeleteRecruiter = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this recruiter?')) {
      await deleteRecruiter(id);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">Recruiter management and system settings</p>

        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Recruiter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Recruiter</DialogTitle>
              <DialogDescription>
                Create an account for a new member of the recruitment team
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddRecruiter} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    value={newRecruiter.firstname}
                    onChange={(e) => setNewRecruiter(prev => ({ ...prev, firstname: e.target.value }))}
                    placeholder="Jean"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    value={newRecruiter.lastname}
                    onChange={(e) => setNewRecruiter(prev => ({ ...prev, lastname: e.target.value }))}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newRecruiter.email}
                  onChange={(e) => setNewRecruiter(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jean.dupont@company.com"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recruiters</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recruiters.filter(r => r.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recruiters</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruiters.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsConfigModalOpen(true)}
            >
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recruiters List */}
      <Card>
        <CardHeader>
          <CardTitle>Recruiters List</CardTitle>
          <CardDescription>
            Manage recruiter accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recruiters.length > 0 ? (
              recruiters.map((recruiter) => (
                <div key={recruiter.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{recruiter.firstname ? `${recruiter.firstname} ${recruiter.lastname}` : 'Name not available'}</h4>
                    <p className="text-sm text-gray-600">{recruiter.email}</p>
                    <p className="text-xs text-gray-500">
                      Registered on: {format(new Date(recruiter.created_at), 'MM/dd/yyyy')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(recruiter.status)}>
                      {recruiter.status === 'active' ? 'Active' : 'Disabled'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleStatus(recruiter)}
                      >
                        {recruiter.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteRecruiter(recruiter.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No recruiters at the moment
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Modal */}
      <ConfigurationModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
