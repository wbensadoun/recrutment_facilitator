import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PipelineStage {
  id: string;
  name: string;
  description: string;
  stage_order: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export const usePipelineStages = () => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pipeline-stages`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pipeline stages');
      }

      const data = await response.json();
      // Trier les étapes par stage_order
      const sortedStages = data.sort((a: PipelineStage, b: PipelineStage) => 
        a.stage_order - b.stage_order
      );
      setStages(sortedStages);
      setError(null);
    } catch (err) {
      console.error('Error fetching pipeline stages:', err);
      setError('Failed to load pipeline stages');
      toast({
        title: 'Error',
        description: 'Failed to load pipeline stages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  return {
    stages,
    loading,
    error,
    refetch: fetchStages,
  };
};

export type { PipelineStage };
