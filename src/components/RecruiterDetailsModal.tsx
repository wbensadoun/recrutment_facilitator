import { useState } from 'react';
import { Recruiter } from '../types/database';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, User, Mail, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface RecruiterDetailsModalProps {
  recruiter: Recruiter | null;
  isOpen: boolean;
  onClose: () => void;
  onPasswordUpdate: (recruiterId: number, newPassword: string) => Promise<void>;
}

const RecruiterDetailsModal = ({ recruiter, isOpen, onClose, onPasswordUpdate }: RecruiterDetailsModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recruiter || !newPassword.trim()) {
      return;
    }

    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await onPasswordUpdate(recruiter.id, newPassword);
      setNewPassword('');
      alert('Mot de passe mis à jour avec succès');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setShowPassword(false);
    onClose();
  };

  if (!recruiter) return null;

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Détails du Recruteur
          </DialogTitle>
          <DialogDescription>
            Informations détaillées et gestion du mot de passe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recruiter Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {recruiter.firstname ? `${recruiter.firstname} ${recruiter.lastname}` : 'Nom non disponible'}
                </h3>
                <Badge className={getStatusColor(recruiter.status)}>
                  {recruiter.status === 'active' ? 'Actif' : 'Désactivé'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{recruiter.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Inscrit le:</span>
                <span className="font-medium">
                  {format(new Date(recruiter.created_at), 'dd/MM/yyyy à HH:mm')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">ID:</span>
                <span className="font-medium">#{recruiter.id}</span>
              </div>
            </div>
          </div>

          {/* Password Update Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Mise à jour du mot de passe
            </h4>
            
            <form onSubmit={handlePasswordUpdate} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Entrez le nouveau mot de passe"
                    className="pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isUpdatingPassword}
                >
                  Fermer
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!newPassword.trim() || isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecruiterDetailsModal;
