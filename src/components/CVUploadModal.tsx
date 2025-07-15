
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCVUpload } from '@/hooks/useCVUpload';
import { Upload, FileText } from 'lucide-react';

interface CVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  currentCvUrl?: string | null;
}

const CVUploadModal = ({ isOpen, onClose, candidateId, candidateName, currentCvUrl }: CVUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadCV, uploading } = useCVUpload();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Format non supporté",
          description: "Seuls les fichiers PDF sont acceptés",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Fichier trop volumineux",
          description: "Le fichier ne doit pas dépasser 10 MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const cvUrl = await uploadCV(selectedFile, candidateId);
      if (cvUrl) {
        toast({
          title: "CV uploadé",
          description: `Le CV de ${candidateName} a été mis à jour`,
        });
        onClose();
        // Refresh the page to show the new CV
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading CV:', error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentCvUrl ? 'Remplacer le CV' : 'Ajouter un CV'} - {candidateName}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier PDF pour {currentCvUrl ? 'remplacer' : 'ajouter'} le CV
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {currentCvUrl && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>CV actuel disponible</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cv-file">Sélectionner un fichier PDF</Label>
            <Input
              id="cv-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <FileText className="w-4 h-4" />
                <span>{selectedFile.name}</span>
                <span className="text-xs">({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Upload en cours...' : 'Uploader'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CVUploadModal;
