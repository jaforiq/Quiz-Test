// import axios from 'axios';
import api from "./api";
import { ApiResponse, AssessmentSession, Certificate, Question, StepResult } from '@/type/Question';


// API Service Functions
export const quizApi = {
  // Get questions for a specific step
  getQuestionsByStep: async (step: number): Promise<ApiResponse<{
    step: number;
    levels: string[];
    questions: Question[];
    total: number;
  }>> => {
    const response = await api.get(`/quiz/questions/step/${step}`);
    return response.data;
  },

  // Start new assessment
  startAssessment: async (): Promise<ApiResponse<AssessmentSession>> => {
    const response = await api.post('/quiz/assessment/start');
    return response.data;
  },

  // Submit answer
  submitAnswer: async (payload: {
    sessionId: string;
    questionId: string;
    userAnswer: 'A' | 'B' | 'C' | 'D';
    timeSpent: number;
  }): Promise<ApiResponse<{
    is_correct: boolean;
    correct_answer: 'A' | 'B' | 'C' | 'D';
  }>> => {
    const response = await api.post('/quiz/assessment/answer', payload);
    return response.data;
  },

  // Complete step
  completeStep: async (sessionId: string): Promise<ApiResponse<{
    step_result: StepResult;
    session: AssessmentSession;
    can_proceed: boolean;
  }>> => {
    const response = await api.post('/quiz/assessment/complete-step', { sessionId });
    return response.data;
  },

  // Generate certificate
  generateCertificate: async (sessionId: string): Promise<ApiResponse<Certificate>> => {
    const response = await api.post('/quiz/certificate/generate', { sessionId });
    return response.data;
  }
};