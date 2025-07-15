
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X } from 'lucide-react';
import { useCandidates } from '@/hooks/useCandidates';
import { useRecruiters } from '@/hooks/useRecruiters';
import { useCVUpload } from '@/hooks/useCVUpload';
import { StageType, CandidateStatus } from '@/types/enums';
import { CandidateFormData, NewCandidateData } from '@/types/candidates';
import { stageToNumber, statusToString } from '@/types/conversions';
import { useToast } from '@/hooks/use-toast';

interface DynamicAddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DynamicAddCandidateModal = ({ isOpen, onClose }: DynamicAddCandidateModalProps) => {
  const [formData, setFormData] = useState<CandidateFormData>({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    current_stage: StageType.INITIAL_CONTACT,
    status: CandidateStatus.PENDING,
    recruiter_id: null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addCandidate } = useCandidates();
  const { recruiters } = useRecruiters();
  const { uploadCV, uploading } = useCVUpload();
  const { toast } = useToast();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        current_stage: StageType.INITIAL_CONTACT,
        status: CandidateStatus.PENDING,
        recruiter_id: null
      });
      setSelectedFile(null);
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        toast({
          title: "CV Selected",
          description: `${file.name} is ready to be uploaded`,
        });
      } else {
        toast({
          title: "Unsupported Format",
          description: "Please select a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstname || !formData.lastname || !formData.email || !formData.position) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Créer d'abord le candidat
      const newCandidate = await addCandidate({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        experience: formData.experience,
        pipeline_stage_id: stageToNumber(formData.current_stage),
        status: statusToString(formData.status) as any,
        recruiter_id: formData.recruiter_id ? parseInt(formData.recruiter_id) : undefined
      });

      // Si un CV est sélectionné, l'uploader
      if (selectedFile && newCandidate) {
        const cvUrl = await uploadCV(selectedFile, newCandidate.id);
        
        // Mettre à jour le candidat avec l'URL du CV
        if (cvUrl) {
          // Note: Il faudrait ajouter une fonction updateCandidate dans useCandidates
          // Pour l'instant, on log juste l'URL
          console.log('CV URL:', cvUrl);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error adding candidate:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
          <DialogDescription>
            Fill in the candidate information and attach their CV
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstname">First Name *</Label>
              <Input
                id="firstname"
                type="text"
                value={formData.firstname}
                onChange={(e) => handleInputChange('firstname', e.target.value)}
                placeholder="First Name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastname">Last Name *</Label>
              <Input
                id="lastname"
                type="text"
                value={formData.lastname}
                onChange={(e) => handleInputChange('lastname', e.target.value)}
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@exemple.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="React Developer"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Experience</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              placeholder="Describe the candidate's experience..."
              rows={3}
            />
          </div>

          {/* CV Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="cv">CV (PDF)</Label>
            {selectedFile ? (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {selectedFile.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  id="cv"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="cv" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to select a CV (PDF only)
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Initial Stage</Label>
              <Select
                value={formData.current_stage}
                onValueChange={(value) => handleInputChange('current_stage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soft_skills">Soft Skills</SelectItem>
                  <SelectItem value="entretien_technique">Technical Interview</SelectItem>
                  <SelectItem value="rencontre_client">Client Meeting</SelectItem>
                  <SelectItem value="etape_personnalisee">Custom Stage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
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

          {recruiters.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="recruiter">Assigned Recruiter</Label>
              <Select
                value={formData.recruiter_id}
                onValueChange={(value) => handleInputChange('recruiter_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a recruiter" />
                </SelectTrigger>
                <SelectContent>
                  {recruiters.map((recruiter) => (
                    <SelectItem key={recruiter.id} value={String(recruiter.id)}>
                      {`${recruiter.firstname} ${recruiter.lastname}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploading || !formData.firstname || !formData.lastname || !formData.email || !formData.position}
            >
              {isSubmitting || uploading ? 'Adding...' : 'Add Candidate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DynamicAddCandidateModal;
