import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { CandidateStatus, StageType } from '@/types/database';
import { useCandidates } from '@/hooks/useCandidates';
import { useRecruiters } from '@/hooks/useRecruiters';
import { useState } from 'react';
import { format } from 'date-fns';
import DynamicAddCandidateModal from './DynamicAddCandidateModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import ValidateCandidatesModal from './ValidateCandidatesModal';
import ManageRejectionsModal from './ManageRejectionsModal';

const Dashboard = () => {
  const { candidates } = useCandidates();
  const { recruiters } = useRecruiters();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRejectionsModal, setShowRejectionsModal] = useState(false);

  // Calcul des Statistics en temps réel
  const activeCandidates = candidates.filter(c => c.status === 'in_progress').length;
  const todayInterviews = candidates.filter(c => 
    c.last_interview_date === format(new Date(), 'yyyy-MM-dd')
  ).length;
  
  const successRate = candidates.length > 0 
    ? Math.round((candidates.filter(c => c.status === 'validated').length / candidates.length) * 100)
    : 0;

  const stats = [
    {
      title: "Active Candidates",
      value: activeCandidates.toString(),
      description: "In process",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Interviews Today",
      value: todayInterviews.toString(),
      description: "Scheduled",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      description: "This month",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Active Recruiters",
      value: recruiters.filter(r => r.status === 'active').length.toString(),
      description: "In the team",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  // Get the 3 most recent candidates
  const recentCandidates = candidates.slice(0, 3);

  const getStatusColor = (status: CandidateStatus) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageLabel = (stage: StageType) => {
    switch (stage) {
      case 'soft_skills': return 'Soft Skills';
      case 'technical_interview': return 'Technical Interview';
      case 'client_meeting': return 'Client Meeting';
      case 'custom_stage': return 'Custom Step';
      default: return stage;
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

  const handleViewAllCandidates = () => {
    // Navigate to candidates tab
    const candidatesTab = document.querySelector('[value="candidates"]') as HTMLElement;
    if (candidatesTab) {
      candidatesTab.click();
    }
  };

  const handleScheduleInterview = () => {
    setShowScheduleModal(true);
  };

  const handleValidateCandidates = () => {
    setShowValidateModal(true);
  };

  const handleManageRejections = () => {
    setShowRejectionsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recruitment Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your recruitment pipeline</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest added candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCandidates.length > 0 ? (
                recentCandidates.map((candidate) => (
                  <div key={candidate.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{candidate.firstname} {candidate.lastname}</h4>
                      <p className="text-sm text-gray-600">{candidate.position}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(candidate.created_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(candidate.status)}>
                        {getStatusLabel(candidate.status)}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {getStageLabel(candidate.current_stage)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No candidates yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcuts to main functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleViewAllCandidates}
            >
              <Users className="w-4 h-4 mr-2" />
              View all candidates ({candidates.length})
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setShowAddModal(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              Add a candidate
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleScheduleInterview}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule an interview
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleValidateCandidates}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validate applications
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleManageRejections}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Manage rejections
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Candidate Modal */}
      <DynamicAddCandidateModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)} 
      />

      {/* Validate Candidates Modal */}
      <ValidateCandidatesModal 
        isOpen={showValidateModal} 
        onClose={() => setShowValidateModal(false)} 
      />

      {/* Manage Rejections Modal */}
      <ManageRejectionsModal 
        isOpen={showRejectionsModal} 
        onClose={() => setShowRejectionsModal(false)} 
      />
    </div>
  );
};

export default Dashboard;
