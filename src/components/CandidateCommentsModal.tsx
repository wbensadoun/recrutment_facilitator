
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Candidate } from '@/types/database';

interface CandidateCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

const CandidateCommentsModal = ({ isOpen, onClose, candidate }: CandidateCommentsModalProps) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (candidate && isOpen) {
      // Pour l'instant, on utilise l'expérience comme commentaire
      setComment(candidate.experience || '');
    }
  }, [candidate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidate) return;

    setIsSubmitting(true);
    
    try {
      // Ici, on pourrait sauvegarder le commentaire en base
      toast({
        title: "Commentaire sauvegardé",
        description: `Commentaire mis à jour pour ${candidate.name}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Commentaires - {candidate.name}</DialogTitle>
          <DialogDescription>
            Ajoutez ou modifiez vos commentaires sur ce candidat
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaires du recruteur</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Vos commentaires sur le candidat..."
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateCommentsModal;
