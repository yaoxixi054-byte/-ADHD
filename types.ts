
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export interface UserProfile {
  age: number;
  gender: Gender;
  isStudent: boolean;
}

export interface Question {
  id: number;
  text: string;
  domain?: string;
}

export interface Scale {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  options: { label: string; value: number }[];
  threshold?: number;
  scoringType?: 'sum' | 'mean' | 'percentile';
}

export interface AssessmentResults {
  profile: UserProfile;
  scores: Record<string, number>;
  domainMeans: Record<string, Record<string, number>>;
  answers: Record<string, Record<number, number>>;
}

export enum AppState {
  START = 'START',
  PROFILING = 'PROFILING',
  ASSESSMENT = 'ASSESSMENT',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT'
}
