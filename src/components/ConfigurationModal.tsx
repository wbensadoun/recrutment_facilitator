
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, FileText, Shield } from 'lucide-react';
import InterviewStagesConfig from './config/InterviewStagesConfig';
import CandidateStatusConfig from './config/CandidateStatusConfig';
import RecruiterPermissionsConfig from './config/RecruiterPermissionsConfig';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigurationModal = ({ isOpen, onClose }: ConfigurationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Configuration
          </DialogTitle>
          <DialogDescription>
            Manage interview stages, candidate status and recruiter permissions
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="stages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stages" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Interview Stages
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              candidate status
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Recruiter Rights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="mt-6">
            <InterviewStagesConfig />
          </TabsContent>

          <TabsContent value="status" className="mt-6">
            <CandidateStatusConfig />
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <RecruiterPermissionsConfig />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationModal;
