
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useCandidates } from '@/hooks/useCandidates';
import { CandidateStatus } from '@/types/database';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ManageRejectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageRejectionsModal = ({ isOpen, onClose }: ManageRejectionsModalProps) => {
  const { candidates, updateCandidateStatus } = useCandidates();

  // Filtrer uniquement les candidats refusés
  const rejectedCandidates = candidates.filter(candidate => candidate.status === 'rejected');

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: CandidateStatus) => {
    switch (status) {
      case 'validated': return 'Validated';
      case 'in_progress': return 'In Progress';
      case 'scheduled': return 'Scheduled';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const handleStatusChange = async (candidateId: number, newStatus: CandidateStatus) => {
    await updateCandidateStatus(candidateId, newStatus);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage refusals</DialogTitle>
          <DialogDescription>
          List of rejected candidates with the possibility to modify their status
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {rejectedCandidates.length > 0 ? (
            rejectedCandidates.map((candidate) => (
              <Card key={candidate.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{`${candidate.firstname} ${candidate.lastname}`}</h4>
                      <p className="text-sm text-gray-600">{candidate.position}</p>
                      <p className="text-sm text-gray-500">{candidate.email}</p>
                      <p className="text-xs text-gray-400">
                        Refusé le: {format(new Date(candidate.updated_at), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(candidate.status)}>
                        {getStatusLabel(candidate.status)}
                      </Badge>

                      <div className="min-w-[150px]">
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nouveau statut:</label>
                        <Select
                          value={candidate.status}
                          onValueChange={(value) => handleStatusChange(Number(candidate.id), value as CandidateStatus)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="validated">Validated</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun candidat refusé pour le moment</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageRejectionsModal;
