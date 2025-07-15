import { StageType, CandidateStatus } from './enums';
import { Candidate } from './database';

export const stageToNumber = (stage: StageType): number => {
  switch (stage) {
    case StageType.INITIAL_CONTACT:
      return 1;
    case StageType.SCREENING:
      return 2;
    case StageType.TECHNICAL_INTERVIEW:
      return 3;
    case StageType.HR_INTERVIEW:
      return 4;
    case StageType.FINAL_INTERVIEW:
      return 5;
    case StageType.OFFER:
      return 6;
    case StageType.HIRED:
      return 7;
    case StageType.REJECTED:
      return 8;
    default:
      return 1;
  }
};

export const statusToString = (status: CandidateStatus): string => {
  switch (status) {
    case CandidateStatus.ACTIVE:
      return 'in_progress';
    case CandidateStatus.INACTIVE:
      return 'scheduled';
    case CandidateStatus.HIRED:
      return 'validated';
    case CandidateStatus.REJECTED:
      return 'rejected';
    case CandidateStatus.PENDING:
      return 'scheduled';
    default:
      return 'scheduled';
  }
};
