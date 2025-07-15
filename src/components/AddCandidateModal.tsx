
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCandidateModal = ({ isOpen, onClose }: AddCandidateModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    salary_expectation: '',
    cv: null as File | null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, cv: file }));
      toast({
        title: "CV uploaded",
        description: `${file.name} has been successfully added`,
      });
    } else {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.position) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Simulate candidate addition
    console.log('New candidate:', formData);
    
    toast({
      title: "Candidate added",
      description: `${formData.name} has been successfully added to the pipeline`,
    });

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      experience: '',
      cv: null
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add a new candidate</DialogTitle>
          <DialogDescription>
            Fill in the candidate's information and upload their CV
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="col-span-3"
                placeholder="Jean Dupont"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="col-span-3"
                placeholder="jean.dupont@email.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Téléphone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="col-span-3"
                placeholder="06 12 34 56 78"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Poste recherché
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="col-span-3"
                placeholder="Développeur React Senior"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="experience" className="text-right">
                Expérience (années)
              </Label>
              <Select onValueChange={(value) => handleInputChange('experience', value)} className="col-span-3">
                <SelectTrigger>
                  <SelectValue placeholder="Années d'expérience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1">0-1 an</SelectItem>
                  <SelectItem value="2-3">2-3 ans</SelectItem>
                  <SelectItem value="4-5">4-5 ans</SelectItem>
                  <SelectItem value="6-10">6-10 ans</SelectItem>
                  <SelectItem value="10+">10+ ans</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salary_expectation" className="text-right">
                Salary Expectation (€)
              </Label>
              <Input
                id="salary_expectation"
                type="number"
                value={formData.salary_expectation}
                onChange={(e) => handleInputChange('salary_expectation', e.target.value)}
                className="col-span-3"
                placeholder="45000"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cv">CV (PDF)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                id="cv"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="cv" className="cursor-pointer">
                {formData.cv ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <FileText className="w-6 h-6" />
                    <span>{formData.cv.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Cliquez pour uploader le CV (PDF uniquement)
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Ajouter le candidat
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCandidateModal;
