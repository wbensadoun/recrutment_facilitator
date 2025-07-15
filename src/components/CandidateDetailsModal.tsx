import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCandidates } from '@/hooks/useCandidates';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { Candidate, StageType, CandidateStatus } from '@/types/database';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, FileText, ExternalLink, Upload } from 'lucide-react';
import CVUploadModal from './CVUploadModal';

interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const CandidateDetailsModal = ({ isOpen, onClose, candidate }: CandidateDetailsModalProps) => {
  const [formData, setFormData] = useState<{
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    position: string;
    experience: string;
    current_stage: number;
    status: CandidateStatus;
  }>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    current_stage: 0,
    status: 'scheduled',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCVUpload, setShowCVUpload] = useState(false);
  const { toast } = useToast();
  const { updateCandidateStatus, updateCandidateStage } = useCandidates();
  const { stages: pipelineStages, loading: stagesLoading } = usePipelineStages();

  useEffect(() => {
    if (candidate && isOpen) {
      setFormData({
        firstname: candidate.firstname || '',
        lastname: candidate.lastname || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        position: candidate.position || '',
        experience: candidate.experience || '',
        current_stage: typeof candidate.current_stage === 'number' ? candidate.current_stage : 0,
        status: candidate.status || 'scheduled',
      });
    }
  }, [candidate, isOpen]);

  const handleStageChange = (candidateId: string | number, newStage: string) => {
    const stageNumber = parseInt(newStage, 10);
    const candidateIdNum = typeof candidateId === 'string' ? parseInt(candidateId, 10) : candidateId;
    
    if (!isNaN(stageNumber) && !isNaN(candidateIdNum)) {
      setFormData(prev => ({
        ...prev,
        current_stage: stageNumber
      }));
      
      // Mettre à jour l'étape du candidat via l'API
      updateCandidateStage(candidateIdNum, stageNumber).catch(error => {
        console.error('Error updating candidate stage:', error);
        toast({
          title: "Error",
          description: "Failed to update candidate stage",
          variant: "destructive",
        });
      });
    } else {
      console.error('Invalid stage or candidate ID:', { newStage, candidateId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidate) return;

    setIsSubmitting(true);
    
    try {
      // Update status and stage if changed
      if (formData.status !== candidate.status) {
        await updateCandidateStatus(candidate.id, formData.status);
      }
      if (formData.current_stage !== candidate.current_stage) {
        handleStageChange(candidate.id.toString(), formData.current_stage.toString());
      }
      
      toast({
        title: "Candidate updated",
        description: `${candidate.firstname} ${candidate.lastname}'s information has been updated`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating candidate:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getStageLabel = (stageId: number) => {
    if (stagesLoading) return 'Loading...';
    
    const stage = pipelineStages.find(s => 
      typeof s.id === 'string' ? parseInt(s.id, 10) === stageId : s.id === stageId
    );
    
    return stage ? stage.name : `Stage ${stageId}`;
  };

  const handleDownloadCV = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!candidate?.cv_url) return;
    
    const link = document.createElement('a');
    link.href = candidate.cv_url;
    link.download = `CV_${candidate.firstname}_${candidate.lastname}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewCV = () => {
    if (!candidate?.cv_url) return;
    window.open(candidate.cv_url, '_blank');
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Candidate profile - {candidate.firstname} {candidate.lastname}
            <Badge className={getStatusColor(candidate.status)}>
              {getStatusLabel(candidate.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View and edit candidate information
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations du candidat */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={formData.firstname + ' ' + formData.lastname}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Textarea
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  rows={3}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage">Current stage</Label>
                  <Select
                    value={formData.current_stage.toString()}
                    onValueChange={(value) => handleStageChange(candidate.id, value)}
                    disabled={stagesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft_skills">Soft Skills</SelectItem>
                      <SelectItem value="technical_interview">Technical Interview</SelectItem>
                      <SelectItem value="client_meeting">Client Meeting</SelectItem>
                      <SelectItem value="custom_stage">Custom Stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as CandidateStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="validated">Validated</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">System Information</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Created on:</strong> {format(new Date(candidate.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                  <p><strong>Last modified:</strong> {format(new Date(candidate.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                  {candidate.last_interview_date && (
                    <p><strong>Last interview:</strong> {format(new Date(candidate.last_interview_date), 'dd/MM/yyyy', { locale: fr })}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          </div>

          {/* Section CV */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Candidate's CV
                </CardTitle>
                <CardDescription>
                  View and update the candidate's CV
                </CardDescription>
              </CardHeader>
              <CardContent>
                {candidate.cv_url ? (
                  <div className="space-y-4">
                    {/* Aperçu du CV */}
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <div className="p-4 border-b bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium">CV_{candidate.firstname}_{candidate.lastname}.pdf</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleViewCV}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadCV}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                      
                      {/* Prévisualisation du PDF intégrée */}
                      <div className="h-96 bg-white">
                        <iframe
                          src={`${candidate.cv_url}#view=FitH`}
                          className="w-full h-full border-0"
                          title={`CV of ${candidate.firstname} ${candidate.lastname}`}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowCVUpload(true)}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Replace CV
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Use the "Open" or "Download" buttons for better viewing
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No CV uploaded</p>
                    <Button
                      onClick={() => setShowCVUpload(true)}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Add a CV
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CV Upload Modal */}
        {showCVUpload && candidate?.id && (
          <CVUploadModal
            isOpen={showCVUpload}
            onClose={() => setShowCVUpload(false)}
            candidateId={candidate.id.toString()}
            candidateName={`${candidate.firstname} ${candidate.lastname}`}
            currentCvUrl={candidate.cv_url || ''}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetailsModal;
