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
import { useCVUpload } from '@/hooks/useCVUpload';
import { useRecruiters } from '@/hooks/useRecruiters';
import { Candidate } from '@/types/database';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, FileText, ExternalLink, Upload } from 'lucide-react';
import CVUploadModal from './CVUploadModal';
import { CandidateStatus } from '@/types/enums';

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
    current_stage: string;
    status: Candidate['status'];
    salary_expectation: string;
    recruiter_id: string;
    last_interview_date: string;
  }>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    current_stage: '1',
    status: CandidateStatus.SCHEDULED,
    salary_expectation: '',
    recruiter_id: '',
    last_interview_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCVUpload, setShowCVUpload] = useState(false);
  const [selectedCVFile, setSelectedCVFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();
  const { updateCandidateStatus, updateCandidateStage, updateCandidate } = useCandidates();
  const { stages: pipelineStages, loading: stagesLoading } = usePipelineStages();
  const { uploadCV } = useCVUpload();
  const { recruiters } = useRecruiters();

  useEffect(() => {
    if (candidate) {
      setFormData({
        firstname: candidate.firstname || '',
        lastname: candidate.lastname || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        position: candidate.position || '',
        experience: candidate.experience || '',
        current_stage: candidate.current_stage || '1',
        status: candidate.status || CandidateStatus.SCHEDULED,
        salary_expectation: candidate.salary_expectation ? String(candidate.salary_expectation) : '',
        recruiter_id: candidate.recruiter_id ? String(candidate.recruiter_id) : '',
        last_interview_date: candidate.last_interview_date || '',
      });
    }
  }, [candidate]);

  const handleStageChange = (candidateId: string | number, newStage: string) => {
    const candidateIdNum = typeof candidateId === 'string' ? parseInt(candidateId, 10) : candidateId;
    const stageNumber = parseInt(newStage, 10);
    
    if (!isNaN(candidateIdNum) && !isNaN(stageNumber)) {
      setFormData(prev => ({
        ...prev,
        current_stage: newStage
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
    setSubmitError(null);
    
    try {
      // Préparer les données à mettre à jour
      const updates: any = {};
      
      // Vérifier et ajouter les champs modifiés
      if (formData.phone !== candidate.phone) {
        updates.phone = formData.phone;
      }
      if (formData.position !== candidate.position) {
        updates.position = formData.position;
      }
      if (formData.experience !== candidate.experience) {
        updates.experience = formData.experience;
      }
      if (formData.status !== candidate.status) {
        updates.status = formData.status as Candidate['status'];
      }
      if (formData.current_stage !== candidate.current_stage) {
        updates.current_stage = formData.current_stage;
      }
      if (formData.salary_expectation !== (candidate.salary_expectation ? String(candidate.salary_expectation) : '')) {
        updates.salary_expectation = formData.salary_expectation;
      }
      if (formData.recruiter_id !== (candidate.recruiter_id ? String(candidate.recruiter_id) : '')) {
        updates.recruiter_id = formData.recruiter_id ? parseInt(formData.recruiter_id, 10) : undefined;
      }
      if (formData.last_interview_date !== (candidate.last_interview_date || '')) {
        updates.last_interview_date = formData.last_interview_date;
      }

      // Mettre à jour via l'API si des changements ont été détectés
      if (Object.keys(updates).length > 0) {
        await updateCandidate(candidate.id, updates);
      }
      
      // Si un fichier CV a été sélectionné, l'uploader maintenant
      if (selectedCVFile) {
        try {
          const cvUrl = await uploadCV(selectedCVFile, String(candidate.id));
          if (cvUrl) {
            toast({
              title: "CV uploadé",
              description: `Le CV de ${candidate.firstname} ${candidate.lastname} a été mis à jour`,
            });
          }
          setSelectedCVFile(null);
        } catch (error: any) {
          if (error?.message?.includes('already used')) {
            setSubmitError('This CV file is already used by another candidate. Please select a different file.');
            return; // Ne ferme pas le modal
          } else {
            setSubmitError('An error occurred while uploading the CV.');
            return;
          }
        }
      }

      toast({
        title: "Candidate updated",
        description: `${candidate.firstname} ${candidate.lastname}'s information has been updated`,
      });
      
      onClose();
    } catch (error) {
      setSubmitError('An error occurred while updating the candidate.');
      console.error('Error updating candidate:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.VALIDATED: return 'bg-green-100 text-green-800';
      case CandidateStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case CandidateStatus.SCHEDULED: return 'bg-yellow-100 text-yellow-800';
      case CandidateStatus.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.VALIDATED: return 'Validated';
      case CandidateStatus.IN_PROGRESS: return 'In Progress';
      case CandidateStatus.SCHEDULED: return 'Scheduled';
      case CandidateStatus.REJECTED: return 'Rejected';
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
    const fileName = candidate.cv_url.split('/').pop() || 'cv.pdf';
    const link = document.createElement('a');
    link.href = candidate.cv_url;
    link.download = fileName;
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    readOnly
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_expectation">Salary Expectation (€)</Label>
                  <Input
                    id="salary_expectation"
                    type="number"
                    value={formData.salary_expectation}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_expectation: e.target.value }))}
                    placeholder="45000"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Current stage</Label>
                  <Select
                    value={formData.current_stage}
                    onValueChange={(value) => handleStageChange(candidate.id, value)}
                    disabled={stagesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Initial Contact</SelectItem>
                      <SelectItem value="2">Screening</SelectItem>
                      <SelectItem value="3">Technical Interview</SelectItem>
                      <SelectItem value="4">HR Interview</SelectItem>
                      <SelectItem value="5">Final Interview</SelectItem>
                      <SelectItem value="6">Offer</SelectItem>
                      <SelectItem value="7">Hired</SelectItem>
                      <SelectItem value="8">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      <SelectItem value={CandidateStatus.SCHEDULED}>Scheduled</SelectItem>
                      <SelectItem value={CandidateStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={CandidateStatus.VALIDATED}>Validated</SelectItem>
                      <SelectItem value={CandidateStatus.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              <div className="space-y-2">
                <Label htmlFor="recruiter_id">Recruiter</Label>
                <Select
                  value={formData.recruiter_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recruiter_id: value }))}
                  disabled={recruiters.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recruiter" />
                  </SelectTrigger>
                  <SelectContent>
                    {recruiters.filter(r => r.status === 'active').map((recruiter) => (
                      <SelectItem key={recruiter.id} value={String(recruiter.id)}>
                        {recruiter.firstname} {recruiter.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* SUPPRIMER LE BLOC SYSTEM INFORMATION ICI */}
              {/* <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                <div><strong>Created on:</strong> {format(new Date(candidate.created_at), 'dd/MM/yyyy HH:mm')}</div>
                <div><strong>Last modified:</strong> {format(new Date(candidate.updated_at), 'dd/MM/yyyy HH:mm')}</div>
              </div> */}
              <div className="flex justify-end gap-3 pt-4">
                {submitError && (
                  <div className="w-full text-center text-red-600 text-sm mb-2">{submitError}</div>
                )}
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Update
                </Button>
              </div>
            </form>
          </div>
          {/* Colonne droite : CV + Last Interview Date */}
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
                    {/* Affichage du nom du CV et bouton Download uniquement */}
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <div className="p-4 border-b bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium">{candidate.cv_url.split('/').pop()}</span>
                        </div>
                        <div className="flex gap-2">
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
                      Use the "Download" button to get the CV
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
            {/* Champ Last Interview Date déplacé ici */}
            <div className="space-y-2">
              <Label htmlFor="last_interview_date">Last Interview Date</Label>
              <Input
                id="last_interview_date"
                type="date"
                value={formData.last_interview_date ? formData.last_interview_date.slice(0, 10) : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, last_interview_date: e.target.value }))}
                placeholder="YYYY-MM-DD"
              />
            </div>
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
            onSelect={(file) => setSelectedCVFile(file)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CandidateDetailsModal;
