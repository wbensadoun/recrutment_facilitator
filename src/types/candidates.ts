import { StageType, CandidateStatus } from './enums';

export type CandidateFormData = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  current_stage: StageType;
  status: CandidateStatus;
  recruiter_id: string | null;
};

export type NewCandidateData = {
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  position: string;
  experience?: string;
  current_stage: StageType;
  status: CandidateStatus;
  recruiter_id?: string;
  cv_url?: string;
  last_interview_date?: string;
};
