import { CandidateStatus } from './enums';

export interface CandidateFormData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  current_stage: string;
  status: CandidateStatus;
  recruiter_id: string;
  last_interview_date: string;
  salary_expectation?: string | number;
}

export interface NewCandidateData extends CandidateFormData {
  // autres champs spécifiques si besoin
}
