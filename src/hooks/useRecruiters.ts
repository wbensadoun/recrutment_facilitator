
import { useState, useEffect } from 'react';
import { Recruiter } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

export const useRecruiters = () => {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const data = await api.recruiters.getAll();
      setRecruiters(data || []);
    } catch (error) {
      console.error('Error fetching recruiters:', error);
      toast({
        title: "Error",
        description: "Unable to load recruiters",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecruiter = async (recruiterData: { firstname: string; lastname: string; email: string }) => {
    try {
      const data = await api.recruiters.add({ 
        ...recruiterData, 
        status: 1 
      });

      toast({
        title: "Recruiter added",
        description: `${recruiterData.firstname} ${recruiterData.lastname} has been successfully added`,
      });

      fetchRecruiters();
      return data;
    } catch (error) {
      console.error('Error adding recruiter:', error);
      toast({
        title: "Error",
        description: "Failed to add recruiter",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateRecruiterStatus = async (recruiterId: number, status: 'active' | 'disabled') => {
    try {
      console.log(`Updating recruiter ${recruiterId} status to ${status}`);
      await api.recruiters.updateStatus(recruiterId, status);

      toast({
        title: "Status updated",
        description: "Recruiter status has been changed",
      });

      fetchRecruiters();
    } catch (error) {
      console.error('Error updating recruiter status:', error);
      toast({
        title: "Error",
        description: "Unable to update status",
        variant: "destructive",
      });
    }
  };

  const deleteRecruiter = async (recruiterId: number) => {
    try {
      await api.recruiters.delete(recruiterId);

      toast({
        title: "Recruiter deleted",
        description: "Recruiter has been successfully deleted",
      });

      fetchRecruiters();
    } catch (error) {
      console.error('Error deleting recruiter:', error);
      toast({
        title: "Error",
        description: "Failed to delete recruiter",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadRecruiters = async () => {
      try {
        setLoading(true);
        const data = await api.recruiters.getAll();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setRecruiters(data || []);
        }
      } catch (error) {
        console.error('Error fetching recruiters:', error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Unable to load recruiters",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadRecruiters();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    recruiters,
    loading,
    addRecruiter,
    updateRecruiterStatus,
    deleteRecruiter,
    refetch: fetchRecruiters
  };
};
