export type CandidateStatus = 'in_progress' | 'scheduled' | 'validated' | 'rejected';
export type StageType = number; // L'ID de l'étape dans la base de données

export type AuditAction = 'created' | 'updated' | 'deleted' | 'status_changed' | 'stage_changed';

export interface Recruiter {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
  name?: string; // Propriété calculée pour la compatibilité
}

export interface Candidate {
  id: number;
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  position: string;
  experience?: string;
  pipeline_stage_id: number; // Correspond à l'ID de la table pipeline_stages
  status: CandidateStatus;
  cv_url?: string;
  recruiter_id?: number;
  last_interview_date?: string;
  created_at: string;
  updated_at: string;
  recruiter?: Recruiter;
  // Champs supplémentaires pour les jointures
  recruiter_firstname?: string;
  recruiter_lastname?: string;
  recruiter_email?: string;
  stage_name?: string; // Nom de l'étape du pipeline (remplace current_stage)
}

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  stage_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Interview {
  id: number;
  candidate_id: number;
  recruiter_id: number;
  scheduled_at: string;
  duration?: number;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  created_at: string;
  updated_at: string;
  // Champs pour les jointures
  candidate_firstname?: string;
  candidate_lastname?: string;
  recruiter_firstname?: string;
  recruiter_lastname?: string;
  // Champs pour la rétrocompatibilité
  scheduled_date?: string;
  stage?: StageType;
  // Informations du candidat
  salary_expectation?: string;
}

export interface CandidateComment {
  id: number;
  candidate_id: number;
  recruiter_id?: number;
  comment: string;
  stage?: StageType;
  created_at: string;
  recruiter?: Recruiter;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_data?: any;
  new_data?: any;
  changed_by?: string;
  created_at: string;
}
