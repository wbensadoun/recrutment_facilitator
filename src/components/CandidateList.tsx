import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Search, Eye, FileText, Calendar, Trash2, Download } from 'lucide-react';
import DynamicAddCandidateModal from './DynamicAddCandidateModal';
import CandidateDetailsModal from './CandidateDetailsModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import { useCandidates } from '@/hooks/useCandidates';
import { useCVUpload } from '@/hooks/useCVUpload';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Candidate, StageType, CandidateStatus } from '@/types/database';

const CandidateList = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedCandidateForSchedule, setSelectedCandidateForSchedule] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { candidates, loading, refetch, deleteCandidate, updateCandidateStage, updateCandidate } = useCandidates();
  const { deleteCV } = useCVUpload();
  const { stages: pipelineStages, loading: stagesLoading } = usePipelineStages();

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageInfo = (stageId: number) => {
    if (stagesLoading || !pipelineStages.length) {
      return { label: `Stage ${stageId}`, color: 'bg-gray-100 text-gray-800' };
    }
    
    const stage = pipelineStages.find(s => 
      typeof s.id === 'string' ? parseInt(s.id, 10) === stageId : s.id === stageId
    );
    
    if (!stage) {
      return { label: `Stage ${stageId}`, color: 'bg-gray-100 text-gray-800' };
    }
    
    // Générer une couleur cohérente basée sur l'ID de l'étape
    const colors = [
      'bg-purple-100 text-purple-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    
    const stageIdNum = typeof stage.id === 'string' ? parseInt(stage.id, 10) : stage.id;
    const colorIndex = stageIdNum % colors.length;
    
    return {
      label: stage.name,
      color: colors[colorIndex] || 'bg-gray-100 text-gray-800'
    };
  };
  
  const getStageLabel = (stageId: number) => {
    return getStageInfo(stageId).label;
  };
  
  const getStageColor = (stageId: number) => {
    return getStageInfo(stageId).color;
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

  const filteredCandidates = candidates.filter(candidate => {
    if (!candidate || !candidate.firstname || !candidate.lastname) return false;
    
    const fullName = `${candidate.firstname} ${candidate.lastname}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) ||
           (candidate.position?.toLowerCase() || '').includes(search) ||
           (candidate.email?.toLowerCase() || '').includes(search);
  });

  const handleDeleteCandidate = async (candidate: { id: number; cv_url?: string | null }) => {
    if (!candidate || !candidate.id) return;
    
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        // Supprimer le CV s'il existe
        if (candidate.cv_url) {
          await deleteCV(candidate.cv_url);
        }
        await deleteCandidate(candidate.id);
      } catch (error) {
        console.error('Error deleting candidate:', error);
        alert('An error occurred while deleting the candidate');
      }
    }
  };

    const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowDetailsModal(true);
  };

    const handleScheduleInterview = (candidateId: number) => {
    setSelectedCandidateForSchedule(candidateId);
    setShowScheduleModal(true);
  };

    const handleStageChange = async (candidateId: number, newStage: string) => {
    const stageNumber = parseInt(newStage, 10);
    if (!isNaN(stageNumber)) {
      await updateCandidateStage(candidateId, stageNumber);
    } else {
      console.error('Invalid stage value:', newStage);
    }
  };

  const handleDownloadCV = (cvUrl: string | null | undefined) => {
    if (!cvUrl) {
      console.error('No CV URL provided');
      return;
    }

    try {
      const fileName = cvUrl.split('/').pop() || 'cv.pdf';
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
      const fullUrl = `${API_URL}${cvUrl}`;
      
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CV:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <div className="text-lg">Loading candidates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Find a candidate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="w-4 h-4" />
          Add Candidate
        </Button>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{`${candidate.firstname} ${candidate.lastname}`}</CardTitle>
                    <CardDescription className="mt-1">{candidate.position}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewCandidate(candidate)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCandidate(candidate)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {candidate.email}
                  </p>
                  {candidate.phone && (
                    <p className="text-sm text-gray-600">
                      <strong>Phone:</strong> {candidate.phone}
                    </p>
                  )}
                  {candidate.recruiter_firstname && candidate.recruiter_lastname && (
                    <p className="text-sm text-gray-600">
                      <strong>Recruiter:</strong> {candidate.recruiter_firstname} {candidate.recruiter_lastname}
                    </p>
                  )}
                  {candidate.experience && (
                    <p className="text-sm text-gray-600">
                      <strong>Experience:</strong> {candidate.experience}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Added: {format(new Date(candidate.created_at), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <Badge className={getStageColor(Number(candidate.current_stage))}>
                      {getStageLabel(Number(candidate.current_stage))}
                    </Badge>
                    <Badge className={getStatusColor(candidate.status)}>
                      {getStatusLabel(candidate.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    {candidate.cv_url ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadCV(candidate.cv_url)}
                        title="Download CV"
                        aria-label="Download CV"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled
                        title="No CV available"
                        aria-label="No CV available"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleScheduleInterview(candidate.id)}
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No candidates match your search' : 'No candidates at the moment'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <DynamicAddCandidateModal 
        isOpen={showAddModal} 
        onClose={() => {
        setShowAddModal(false);
        refetch();
      }} 
      />
      
      <CandidateDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        candidate={selectedCandidate}
        onUpdate={refetch}
      />

      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedCandidateForSchedule(null);
        }}
        candidateId={selectedCandidateForSchedule!}
      />
    </div>
  );
};

export default CandidateList;
