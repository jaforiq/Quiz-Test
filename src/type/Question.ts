// Types and Interfaces
export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: number;
  competency_id: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  question_text: string;
  options: QuestionOption[];
  correct_answer: 'A' | 'B' | 'C' | 'D';
}

export interface UserAnswers {
  [key: string]: 'A' | 'B' | 'C' | 'D';
}

export interface QuestionsData {
  step1: Question[];
  step2: Question[];
  step3: Question[];
}

export type CertificationType = 
  | 'FAIL' 
  | 'A1' 
  | 'A2' 
  | 'A2_ADVANCE' 
  | 'B1' 
  | 'B2' 
  | 'B2_ADVANCE' 
  | 'C1' 
  | 'C2' 
  | 'REMAIN_A2' 
  | 'REMAIN_B2' 
  | 'FAILED';

export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'loading';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Question {
  _id: string;
  question_id: number;
  competency_id: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  question_text: string;
  options: {
    label: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
}

export interface AssessmentSession {
  _id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  current_step: 1 | 2 | 3;
  status: 'in_progress' | 'completed' | 'failed';
  final_certification?: string;
  step_results: StepResult[];
}

export interface StepResult {
  step: number;
  levels_tested: string[];
  questions_attempted: string[];
  score_percentage: number;
  certification_achieved: string;
  step_start: string;
  step_end: string;
  time_taken: number;
}

export interface Certificate {
  _id: string;
  user_id: string;
  session_id: string;
  certificate_level: string;
  certificate_number: string;
  issued_date: string;
  competencies_assessed: number[];
  overall_score: number;
  step_scores: {
    step: number;
    score_percentage: number;
    levels_covered: string[];
  }[];
}