import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, MessageSquare, Calendar } from 'lucide-react';
import { useCandidates } from '@/hooks/useCandidates';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useToast } from '@/hooks/use-toast';
import { StageType } from '@/types/database';
import { CandidateStatus } from '@/types/enums';
import { useState } from 'react';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import CandidateCommentsModal from './CandidateCommentsModal';

const Pipeline = () => {
  const { toast } = useToast();
  const { candidates, updateCandidateStatus, updateCandidateStage } = useCandidates();
  const { stages: pipelineStages, loading: stagesLoading } = usePipelineStages();
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCandidateForSchedule, setSelectedCandidateForSchedule] = useState<number | null>(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCandidateForComments, setSelectedCandidateForComments] = useState<any>(null);

  // Afficher un indicateur de chargement pendant le chargement des étapes
  if (stagesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Convertir les étapes du pipeline au format attendu par le composant
  const stages = pipelineStages.map((stage, index) => {
    // S'assurer que l'ID est un nombre
    const stageId = typeof stage.id === 'string' ? parseInt(stage.id, 10) : stage.id;
    const nextStageId = index < pipelineStages.length - 1 
      ? (typeof pipelineStages[index + 1]?.id === 'string' 
          ? parseInt(pipelineStages[index + 1].id, 10) 
          : pipelineStages[index + 1]?.id)
      : null;
      
    return {
      id: stageId,
      title: stage.name,
      description: stage.description,
      nextStage: nextStageId
    };
  });

  const getCandidatesForStage = (stageId: number) => {
    return candidates.filter(candidate => 
      Number(candidate.current_stage) === stageId && candidate.status !== 'rejected'
    );
  };

  const getRejectedCandidates = () => {
    return candidates.filter(candidate => candidate.status === 'rejected');
  };

  const handleGoDecision = async (candidateId: number, candidateName: string, currentStage: number) => {
    try {
      const stage = stages.find(s => s.id === currentStage);
      
      if (stage?.nextStage) {
        // S'assurer que nextStage est un nombre
        const nextStage = typeof stage.nextStage === 'string' 
          ? parseInt(stage.nextStage, 10) 
          : stage.nextStage;
          
        if (isNaN(nextStage)) {
          throw new Error('Invalid stage ID');
        }
        
        // Mettre à jour l'étape du candidat
        await updateCandidateStage(candidateId, nextStage);
        await updateCandidateStatus(candidateId, CandidateStatus.IN_PROGRESS);
        
        toast({
          title: "Candidate approved",
          description: `${candidateName} moves to the next stage`,
        });
      } else {
        // Dernière étape, marquer comme validé
        await updateCandidateStatus(candidateId, CandidateStatus.VALIDATED);
        toast({
          title: "Candidate approved",
          description: `${candidateName} has successfully completed the process`,
        });
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
    }
  };

  const handleNoGoDecision = async (candidateId: number, candidateName: string) => {
    try {
      await updateCandidateStatus(candidateId, CandidateStatus.REJECTED);
      toast({
        title: "Candidate rejected",
        description: `${candidateName} has been rejected`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error rejecting candidate:', error);
    }
  };

  const handleScheduleInterview = (candidateId: number) => {
    setSelectedCandidateForSchedule(candidateId);
    setScheduleModalOpen(true);
  };

  const handleAddComment = (candidate: any) => {
    setSelectedCandidateForComments(candidate);
    setCommentsModalOpen(true);
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

  const rejectedCandidates = getRejectedCandidates();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recruitment Pipeline</h2>
        <p className="text-gray-600">Track your candidates' progress through the different stages</p>
      </div>

      {/* Pipeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {stages.map((stage, index) => {
          const stageCandidates = getCandidatesForStage(stage.id);
          
          return (
            <Card key={stage.id} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-purple-500' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stageCandidates.length} candidate{stageCandidates.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{stage.title}</CardTitle>
                <CardDescription className="text-sm">
                  {stage.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {stageCandidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No candidates in this stage</p>
                  </div>
                ) : (
                  stageCandidates.map((candidate) => (
                    <div key={candidate.id} className="p-3 bg-gray-50 rounded-lg border hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{`${candidate.firstname} ${candidate.lastname}`}</h4>
                          <p className="text-xs text-gray-600">{candidate.position}</p>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(candidate.status)}`}>
                          {getStatusLabel(candidate.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleGoDecision(candidate.id, `${candidate.firstname} ${candidate.lastname}`, candidate.pipeline_stage_id)}
                          >
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleNoGoDecision(candidate.id, `${candidate.firstname} ${candidate.lastname}`)}
                          >
                            <XCircle className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleScheduleInterview(candidate.id)}
                          >
                            <Calendar className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 w-7 p-0"
                            onClick={() => handleAddComment(candidate)}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rejected Candidates Section */}
      {rejectedCandidates.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-red-500">
                <XCircle className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-xs border-red-300">
                {rejectedCandidates.length} candidate{rejectedCandidates.length !== 1 ? 's' : ''} rejected
              </Badge>
            </div>
            <CardTitle className="text-lg text-red-900">Rejected Candidates</CardTitle>
            <CardDescription className="text-red-700">
              Candidates who were not selected
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rejectedCandidates.map((candidate) => (
                <div key={candidate.id} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{`${candidate.firstname} ${candidate.lastname}`}</h4>
                      <p className="text-xs text-gray-600">{candidate.position}</p>
                    </div>
                    <Badge className="text-xs bg-red-100 text-red-800">
                      Rejected
                    </Badge>
                  </div>
                  
                  <div className="flex justify-end gap-1 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => handleAddComment(candidate)}
                    >
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Action Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Approve (Go)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Reject (No Go)</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Schedule interview</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Add comment</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ScheduleInterviewModal 
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSelectedCandidateForSchedule(null);
        }}
        candidateId={selectedCandidateForSchedule}
      />
      
      <CandidateCommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        candidate={selectedCandidateForComments}
      />
    </div>
  );
};

export default Pipeline;
