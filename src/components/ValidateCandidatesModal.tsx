
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useCandidates } from '@/hooks/useCandidates';
import { CandidateStatus, StageType } from '@/types/database';

interface ValidateCandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ValidateCandidatesModal = ({ isOpen, onClose }: ValidateCandidatesModalProps) => {
  const { candidates, updateCandidateStatus, updateCandidateStage } = useCandidates();

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'soft_skills': return 'bg-purple-100 text-purple-800';
      case 'technical_interview': return 'bg-blue-100 text-blue-800';
      case 'client_meeting': return 'bg-green-100 text-green-800';
      case 'custom_stage': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'soft_skills': return 'Soft Skills';
      case 'technical_interview': return 'Technical Interview';
      case 'client_meeting': return 'Client Meeting';
      case 'custom_stage': return 'Custom Stage';
      default: return stage;
    }
  };

  const getStatusLabel = (status: string) => {
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

  const handleStageChange = async (candidateId: number, newStage: StageType) => {
    await updateCandidateStage(candidateId, newStage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Valider les candidatures</DialogTitle>
          <DialogDescription>
            Gérez les statuts et étapes de vos candidats
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{`${candidate.firstname} ${candidate.lastname}`}</h4>
                    <p className="text-sm text-gray-600">{candidate.position}</p>
                    <p className="text-sm text-gray-500">{candidate.email}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStageColor(candidate.current_stage)}>
                      {getStageLabel(candidate.current_stage)}
                    </Badge>
                    <Badge className={getStatusColor(candidate.status)}>
                      {getStatusLabel(candidate.status)}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 min-w-0 sm:min-w-[300px]">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700 block mb-1">Étape:</label>
                      <Select
                        value={candidate.current_stage}
                        onValueChange={(value) => handleStageChange(Number(candidate.id), value as StageType)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soft_skills">Soft Skills</SelectItem>
                          <SelectItem value="entretien_technique">Entretien Technique</SelectItem>
                          <SelectItem value="rencontre_client">Rencontre Client</SelectItem>
                          <SelectItem value="etape_personnalisee">Étape Personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-700 block mb-1">Statut:</label>
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
          ))}
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

export default ValidateCandidatesModal;
