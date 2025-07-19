
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface InterviewStage {
  id: string;
  name: string;
  description: string;
  stage_order: number;
  is_active: boolean;
  created_at?: string;
}

const InterviewStagesConfig = () => {
  const [stages, setStages] = useState<InterviewStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<InterviewStage | null>(null);
  const [newStage, setNewStage] = useState({
    name: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    setIsLoading(true);
    try {
      const response = await api.pipelineStages.getAll();
      setStages(response);
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interview stages',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStage = async () => {
    if (!newStage.name) return;
    try {
      // Calculer le prochain stage_order
      const nextOrder = stages.length > 0 ? Math.max(...stages.map(s => s.stage_order)) + 1 : 1;
      const stageData = {
        name: newStage.name,
        description: newStage.description,
        stage_order: nextOrder,
        is_active: true
      };
      // Ne pas inclure de champ id ici !
      const response = await api.pipelineStages.add(stageData);
      setStages([...stages, response]);
      setNewStage({ name: '', description: '' });
      setIsAddModalOpen(false);
      toast({
        title: 'Success',
        description: 'Interview stage added successfully'
      });
    } catch (error) {
      console.error('Error adding stage:', error);
      toast({
        title: 'Error',
        description: 'Failed to add interview stage',
        variant: 'destructive'
      });
    }
  };

  const handleEditStage = (stage: InterviewStage) => {
    setEditingStage(stage);
    setNewStage({ name: stage.name, description: stage.description });
  };

  const handleUpdateStage = async () => {
    if (!editingStage || !newStage.name) return;
    
    try {
      const updatedStage = {
        name: newStage.name,
        description: newStage.description,
        stage_order: editingStage.stage_order,
        is_active: editingStage.is_active
      };
      
      const response = await api.pipelineStages.update(editingStage.id, updatedStage);
      
      setStages(stages.map(stage => 
        stage.id === editingStage.id ? response : stage
      ));
      
      setEditingStage(null);
      setNewStage({ name: '', description: '' });
      
      toast({
        title: 'Success',
        description: 'Interview stage updated successfully'
      });
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: 'Error',
        description: 'Failed to update interview stage',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (window.confirm('Are you sure you want to delete this stage?')) {
      try {
        await api.pipelineStages.delete(stageId);
        
        setStages(stages.filter(stage => stage.id !== stageId));
        
        toast({
          title: 'Success',
          description: 'Interview stage deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting stage:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete interview stage',
          variant: 'destructive'
        });
      }
    }
  };

  const toggleStageStatus = async (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    try {
      const newStatus = !stage.is_active;
      
      const response = await api.pipelineStages.updateStatus(stageId, newStatus);
      
      setStages(stages.map(s => 
        s.id === stageId ? response : s
      ));
      
      toast({
        title: 'Success',
        description: `Stage ${newStatus ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('Error toggling stage status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stage status',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Interview Stages</h3>
          <p className="text-sm text-gray-600">Configure the different stages of the recruitment process</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Stage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Stage</DialogTitle>
              <DialogDescription>
                Create a new stage for the interview process
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stage-name">Stage Name</Label>
                <Input
                  id="stage-name"
                  value={newStage.name}
                  onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: HR Interview"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stage-description">Description</Label>
                <Textarea
                  id="stage-description"
                  value={newStage.description}
                  onChange={(e) => setNewStage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Stage description..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStage}>
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading stages...</p>
        </div>
      ) : stages.length === 0 ? (
        <div className="flex justify-center py-8">
          <p>No interview stages found. Add your first stage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage) => (
            <Card key={stage.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{stage.name}</h4>
                        <Badge variant={stage.is_active ? "default" : "secondary"}>
                          {stage.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{stage.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStageStatus(stage.id)}
                    >
                      {stage.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStage(stage)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStage(stage.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
            <DialogDescription>
              Modify the interview stage information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-stage-name">Stage Name</Label>
              <Input
                id="edit-stage-name"
                value={newStage.name}
                onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-stage-description">Description</Label>
              <Textarea
                id="edit-stage-description"
                value={newStage.description}
                onChange={(e) => setNewStage(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditingStage(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStage}>
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewStagesConfig;
