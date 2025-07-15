
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Calendar, FileText, MessageSquare, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CandidateDashboard = () => {
  const { toast } = useToast();

  // Simulated data for the logged-in candidate
  const candidateData = {
    name: "Pierre Martin",
    position: "UX/UI Designer",
    currentStage: "Technical Interview",
    progress: 60,
    applicationDate: "2024-05-20"
  };

  const stages = [
    { 
      name: "Soft Skills", 
      status: "completed", 
      date: "2024-05-25",
      feedback: "Excellent profile, good interpersonal skills"
    },
    { 
      name: "Technical Interview", 
      status: "current", 
      date: "2024-06-07 14:00",
      feedback: null
    },
    { 
      name: "Client Meeting", 
      status: "pending", 
      date: null,
      feedback: null
    },
    { 
      name: "Final Decision", 
      status: "pending", 
      date: null,
      feedback: null
    }
  ];

  const documents = [
    { name: "Resume", type: "PDF", uploadDate: "2024-05-20" },
    { name: "Cover Letter", type: "PDF", uploadDate: "2024-05-20" },
    { name: "Portfolio", type: "Link", uploadDate: "2024-05-22" }
  ];

  const interviews = [
    {
      stage: "Technical Interview",
      date: "2024-06-07",
      time: "14:00",
      interviewer: "Tech Lead",
      status: "Confirmed"
    }
  ];

  const handleDownloadDocument = (docName: string) => {
    toast({
      title: "Download",
      description: `${docName} downloaded successfully`,
    });
  };

  const handleConfirmInterview = (interviewDate: string) => {
    toast({
      title: "Interview Confirmed",
      description: `Your attendance is confirmed for ${interviewDate}`,
    });
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current': return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'current': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Hello {candidateData.name}</h1>
        <p className="text-gray-600 mt-2">Track your application progress for the {candidateData.position} position</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">Application from {new Date(candidateData.applicationDate).toLocaleDateString('en-US')}</span>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {candidateData.currentStage}
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Application Progress
          </CardTitle>
          <CardDescription>
            {candidateData.progress}% completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Current Stage: {candidateData.currentStage}</span>
              <span>{candidateData.progress}% completed</span>
            </div>
            <Progress value={candidateData.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Stages Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Stages</CardTitle>
          <CardDescription>Your application journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div 
                key={index} 
                className={`p-4 border rounded-lg ${getStageColor(stage.status)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getStageIcon(stage.status)}
                    <div>
                      <h4 className="font-medium">{stage.name}</h4>
                      {stage.date && (
                        <p className="text-sm text-gray-500">
                          {new Date(stage.date).toLocaleDateString('en-US', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: stage.date.includes(':') ? '2-digit' : undefined,
                            minute: stage.date.includes(':') ? '2-digit' : undefined
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${stage.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 
                               stage.status === 'current' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                               'bg-gray-100 text-gray-800 border-gray-200'}`}
                  >
                    {stage.status === 'completed' ? 'Completed' : 
                     stage.status === 'current' ? 'In Progress' : 'Pending'}
                  </Badge>
                </div>
                {stage.feedback && (
                  <div className="mt-3 p-3 bg-white/50 rounded text-sm">
                    <strong>Feedback:</strong> {stage.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Interviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Interviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interviews.length > 0 ? (
            <div className="space-y-4">
              {interviews.map((interview, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{interview.stage}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Date:</strong> {interview.date} at {interview.time}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Interviewer:</strong> {interview.interviewer}
                      </p>

                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {interview.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => handleConfirmInterview(interview.date)}
                    >
                      Confirm Attendance
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No upcoming interviews</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            My Documents
          </CardTitle>
          <CardDescription>
            Download or update your application documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{doc.name}</h4>
                  <p className="text-sm text-gray-500">{doc.type} • {new Date(doc.uploadDate).toLocaleDateString('en-US')}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDownloadDocument(doc.name)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateDashboard;
