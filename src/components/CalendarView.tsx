
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import { useInterviews } from '@/hooks/useInterviews';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CalendarView = () => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { interviews, loading, updateInterview } = useInterviews();

  const getStageColor = (stage: number | undefined) => {
    if (stage === undefined) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (stage) {
      case 1: return 'bg-purple-100 text-purple-800 border-purple-200';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      case 4: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStageLabel = (stage: number | undefined) => {
    if (stage === undefined) return 'Non défini';
    
    switch (stage) {
      case 1: return 'Soft Skills';
      case 2: return 'Entretien Technique';
      case 3: return 'Rencontre Client';
      case 4: return 'Étape Personnalisée';
      default: return `Étape ${stage}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const todayInterviews = interviews.filter(interview => {
    const interviewDate = new Date(interview.scheduled_date).toISOString().split('T')[0];
    return interviewDate === today;
  });

  const upcomingInterviews = interviews.filter(interview => {
    const interviewDate = new Date(interview.scheduled_date).toISOString().split('T')[0];
    return interviewDate > today;
  });

  const handleCancelInterview = async (interviewId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cet entretien ?')) {
      // await deleteInterview(interviewId); // This line was removed as per the edit hint.
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading interviews...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interview Schedule</h2>
          <p className="text-gray-600 mt-1">Manage your interviews and availability</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowScheduleModal(true)}
        >
          New Interview
        </Button>
      </div>

      {/* Today's Interviews */}
      {todayInterviews.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="w-5 h-5" />
              Entretiens d'aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayInterviews.map((interview) => (
                <div key={interview.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{interview.candidate_firstname} {interview.candidate_lastname}</h4>
                      <p className="text-sm text-gray-600">Recruteur ID: {String(interview.recruiter_id)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStageColor(interview.stage)}>
                          {getStageLabel(interview.stage)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatTime(interview.scheduled_date)}
                        </span>
                      </div>
                      {interview.salary_expectation && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">Salaire attendu: </span>
                          <span className="text-sm text-gray-700">{interview.salary_expectation} €</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p><strong>Recruteur:</strong> {interview.recruiter_firstname} {interview.recruiter_lastname}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Upcoming interviews ({upcomingInterviews.length})
            </CardTitle>
            <CardDescription>
              Next interviews Planned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{interview.candidate_firstname} {interview.candidate_lastname}</h4>
                        <p className="text-sm text-gray-600">Recruteur: {interview.recruiter_firstname} {interview.recruiter_lastname}</p>
                      </div>
                      <Badge className={getStageColor(interview.stage)}>
                        {getStageLabel(interview.stage)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Date:</strong> {formatDate(interview.scheduled_date)}</p>
                      <p><strong>Heure:</strong> {formatTime(interview.scheduled_date)}</p>
                      {interview.salary_expectation && (
                        <p><strong>Salaire attendu:</strong> {interview.salary_expectation} €</p>
                      )}
                      <p><strong>Recruteur:</strong> {interview.recruiter_firstname} {interview.recruiter_lastname}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelInterview(String(interview.id))}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Aucun entretien planifié</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Interviewers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Statistics
            </CardTitle>
            <CardDescription>
              Résumé des entretiens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Interviews today</h4>
                    <p className="text-sm text-gray-600">Scheduled for today</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{todayInterviews.length}</Badge>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Upcoming interviews</h4>
                    <p className="text-sm text-gray-600">Scheduled</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{upcomingInterviews.length}</Badge>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Total entretiens</h4>
                    <p className="text-sm text-gray-600">Planned</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">{interviews.length}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
      />
    </div>
  );
};

export default CalendarView;
