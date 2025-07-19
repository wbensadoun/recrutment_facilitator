
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { useEffect } from 'react';

interface CandidateStatus {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  isDefault: boolean;
}

const CandidateStatusConfig = () => {
  const [statuses, setStatuses] = useState<CandidateStatus[]>([
    { id: '1', name: 'En cours', color: 'blue', isActive: true, isDefault: true },
    { id: '2', name: 'Planifié', color: 'yellow', isActive: true, isDefault: true },
    { id: '3', name: 'Validé', color: 'green', isActive: true, isDefault: true },
    { id: '4', name: 'Refusé', color: 'red', isActive: true, isDefault: true },
    { id: '5', name: 'À recontacter', color: 'purple', isActive: true, isDefault: false },
    { id: '6', name: 'Blacklisté', color: 'gray', isActive: true, isDefault: false }
  ]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<CandidateStatus | null>(null);
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: 'blue'
  });

  const colorOptions = [
    { value: 'blue', label: 'Bleu', class: 'bg-blue-100 text-blue-800' },
    { value: 'green', label: 'Vert', class: 'bg-green-100 text-green-800' },
    { value: 'red', label: 'Rouge', class: 'bg-red-100 text-red-800' },
    { value: 'yellow', label: 'Jaune', class: 'bg-yellow-100 text-yellow-800' },
    { value: 'purple', label: 'Violet', class: 'bg-purple-100 text-purple-800' },
    { value: 'gray', label: 'Gris', class: 'bg-gray-100 text-gray-800' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-800' }
  ];

  const getColorClass = (color: string) => {
    const colorOption = colorOptions.find(option => option.value === color);
    return colorOption?.class || 'bg-gray-100 text-gray-800';
  };

  const handleAddStatus = () => {
    if (!newStatus.name) return;
    
    const status: CandidateStatus = {
      id: Date.now().toString(),
      name: newStatus.name,
      color: newStatus.color,
      isActive: true,
      isDefault: false
    };
    
    setStatuses([...statuses, status]);
    setNewStatus({ name: '', color: 'blue' });
    setIsAddModalOpen(false);
  };

  const handleEditStatus = (status: CandidateStatus) => {
    setEditingStatus(status);
    setNewStatus({ name: status.name, color: status.color });
  };

  const fetchStatuses = async () => {
    try {
      const data = await api.candidateStatus.getAll();
      setStatuses(data);
    } catch (error) {
      console.error('[FRONT] fetchStatuses - Erreur:', error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleUpdateStatus = async () => {
    if (!editingStatus || !newStatus.name) return;
    try {
      console.log('[FRONT] handleUpdateStatus - id:', editingStatus.id, 'nouveau nom:', newStatus.name);
      await api.candidateStatus.update(editingStatus.id, { name: newStatus.name, is_active: editingStatus.isActive });
      await fetchStatuses();
      setEditingStatus(null);
      setNewStatus({ name: '', color: 'blue' });
    } catch (error) {
      console.error('[FRONT] handleUpdateStatus - Erreur:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteStatus = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    if (status?.isDefault) {
      alert('Impossible de supprimer un statut par défaut');
      return;
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce statut ?')) {
      setStatuses(statuses.filter(status => status.id !== statusId));
    }
  };

  const toggleStatusActive = async (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return;
    try {
      console.log('[FRONT] toggleStatusActive - id:', statusId, 'état actuel:', status.isActive);
      await api.candidateStatus.update(statusId, { name: status.name, is_active: !status.isActive });
      await fetchStatuses();
    } catch (error) {
      console.error('[FRONT] toggleStatusActive - Erreur:', error);
      alert('Erreur lors du changement d\'activation du statut');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Statuts des candidats</h3>
          <p className="text-sm text-gray-600">Gérez les différents statuts possibles pour les candidats</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau statut</DialogTitle>
              <DialogDescription>
                Créez un nouveau statut pour les candidats
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status-name">Nom du statut</Label>
                <Input
                  id="status-name"
                  value={newStatus.name}
                  onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: À recontacter"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-color">Couleur</Label>
                <Select value={newStatus.color} onValueChange={(value) => setNewStatus(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.class.split(' ')[0]}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddStatus}>
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {statuses.map((status) => (
          <Card key={status.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getColorClass(status.color)}>
                    {status.name}
                  </Badge>
                  {status.isDefault && (
                    <Badge variant="outline">Default</Badge>
                  )}
                  {!status.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatusActive(status.id)}
                  >
                    {status.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditStatus(status)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteStatus(status.id)}
                    className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                    disabled={status.isDefault}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de modification */}
      <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le statut</DialogTitle>
            <DialogDescription>
              Modifiez les informations du statut
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status-name">Nom du statut</Label>
              <Input
                id="edit-status-name"
                value={newStatus.name}
                onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-status-color">Couleur</Label>
              <Select value={newStatus.color} onValueChange={(value) => setNewStatus(prev => ({ ...prev, color: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.class.split(' ')[0]}`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditingStatus(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateStatus}>
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateStatusConfig;
