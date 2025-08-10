
import toast from 'react-hot-toast';
import {quizApi} from '../services/quizApi'
import React, { useState, useEffect, useRef } from 'react';
import { AssessmentStatus, UserAnswers } from '@/type/Question';
import { Question, AssessmentSession, StepResult, Certificate } from '../type/Question';
import { Clock, Award, CheckCircle, XCircle, AlertCircle, Download, User, Calendar, Loader, X } from 'lucide-react';


const QuizAssessmentSystem: React.FC = () => {
  // State Management
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const lastLoadedStepRef = useRef<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [finalCertification, setFinalCertification] = useState<string>('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentStepStartTime, setCurrentStepStartTime] = useState<Date | null>(null);
  const [currentSession, setCurrentSession] = useState<AssessmentSession | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus>('not_started');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
  if (assessmentStatus !== 'in_progress') return;

  if (timeLeft <= 0) {
    handleAutoSubmit();
    return;
  }

  const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
  return () => clearTimeout(id);
  }, [assessmentStatus, timeLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
  if (!currentSession) return;
  if (lastLoadedStepRef.current === currentStep) return;
  lastLoadedStepRef.current = currentStep;
  loadQuestionsForStep(currentStep);
  }, [currentStep, currentSession?._id]);

  // API Functions
  const loadQuestionsForStep = async (step: number) => {
    try {
      setAssessmentStatus('loading');
      const response = await quizApi.getQuestionsByStep(step);
      
      if (response.success && response.data) {
        setQuestions(response.data.questions);
        setCurrentQuestionIndex(0);
        setTimeLeft(60);
        setCurrentStepStartTime(new Date());
        setAssessmentStatus('in_progress');
      } else {
        toast.error('Failed to load questions');
        setAssessmentStatus('failed');
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error loading questions');
      setAssessmentStatus('failed');
    }
  };

  const startAssessment = async () => {
  try {
    setAssessmentStatus('loading');
    const response = await quizApi.startAssessment();

    if (response.success && response.data) {
      setCurrentSession(response.data);
      setCurrentStep(response.data.current_step as 1 | 2 | 3);
      setStepResults(response.data.step_results || []);
      // do NOT call loadQuestionsForStep here
      setAssessmentStatus('in_progress'); // effect will fetch for this step
      toast.success(response.message || 'Assessment started successfully');
    } else {
      toast.error('Failed to start assessment');
      setAssessmentStatus('not_started');
    }
  } catch (error) {
    console.error('Error starting assessment:', error);
    toast.error('Error starting assessment');
    setAssessmentStatus('not_started');
    }
  };

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    
    const questionKey = `step${currentStep}_q${currentQuestion._id}`;
    setUserAnswers(prev => ({
      ...prev,
      [questionKey]: answer
    }));
  };

  const submitCurrentAnswer = async () => {
    if (!currentQuestion || !currentSession || !currentStepStartTime) return;
    
    const questionKey = `step${currentStep}_q${currentQuestion._id}`;
    const userAnswer = userAnswers[questionKey];
    
    if (!userAnswer) return;

    try {
      const timeSpent = Math.floor((new Date().getTime() - currentStepStartTime.getTime()) / 1000);
      
      const response = await quizApi.submitAnswer({
        sessionId: currentSession._id,
        questionId: currentQuestion._id,
        userAnswer,
        timeSpent
      });

      if (!response.success) {
        toast.error('Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Error submitting answer');
    }
  };

  const handleAutoSubmit = async () => {
    await submitCurrentAnswer();
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(60);
    } else {
      await handleStepComplete();
    }
  };

  const handleNextQuestion = async () => {
    await submitCurrentAnswer();
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(60);
    } else {
      await handleStepComplete();
    }
  };

  const handleStepComplete = async () => {
    if (!currentSession) return;

    try {
      setAssessmentStatus('loading');
      const response = await quizApi.completeStep(currentSession._id);
      
      if (response.success && response.data) {
        const { step_result, session, can_proceed } = response.data;
        
        setStepResults(prev => [...prev, step_result]);
        setCurrentSession(session);
        
        if (can_proceed) {
          // Proceed to next step
          setCurrentStep(session.current_step as 1 | 2 | 3);
          setUserAnswers({});
          toast.success(`Step ${step_result.step} completed! Advancing to Step ${session.current_step}`);
        } else {
          // Assessment complete
          setAssessmentStatus(session.status as AssessmentStatus);
          setFinalCertification(session.final_certification || '');
          
          if (session.status === 'completed') {
            toast.success('Assessment completed successfully!');
          } else {
            toast.error('Assessment failed');
          }
        }
      } else {
        toast.error('Failed to complete step');
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Error completing step');
    }
  };

  const generateCertificate = async () => {
    if (!currentSession) return;

    try {
      const response = await quizApi.generateCertificate(currentSession._id);
      
      if (response.success && response.data) {
        setCertificate(response.data);
        setShowCertificate(true);
        toast.success('Certificate generated successfully!');
      } else {
        toast.error('Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Error generating certificate');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCertificationColor = (cert: string): string => {
    const colors: Record<string, string> = {
      'A1': 'bg-green-100 text-green-800',
      'A2': 'bg-blue-100 text-blue-800',
      'B1': 'bg-purple-100 text-purple-800',
      'B2': 'bg-indigo-100 text-indigo-800',
      'C1': 'bg-orange-100 text-orange-800',
      'C2': 'bg-red-100 text-red-800',
      'FAILED': 'bg-gray-100 text-gray-800'
    };
    return colors[cert] || 'bg-gray-100 text-gray-800';
  };

  const resetAssessment = () => {
    setShowCertificate(false);
    setCertificate(null);
    setCurrentStep(1);
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setUserAnswers({});
    setStepResults([]);
    setFinalCertification('');
    setAssessmentStatus('not_started');
    setCurrentSession(null);
    setTimeLeft(60);
    setCurrentStepStartTime(null);
  };

  // Loading State
  if (assessmentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we prepare your assessment</p>
        </div>
      </div>
    );
  }

  // Certificate View
  if (showCertificate && certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl p-8 border-t-8 border-indigo-600">
            <div className="text-center">
              <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">CERTIFICATE OF ACHIEVEMENT</h1>
              <div className="w-24 h-1 bg-indigo-600 mx-auto mb-6"></div>
              
              <p className="text-lg text-gray-600 mb-4">This certifies that</p>
              <h2 className="text-2xl font-bold text-indigo-900 mb-4">Student Name</h2>
              <p className="text-lg text-gray-600 mb-2">has successfully completed the</p>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">3-Step Assessment Platform</h3>
              
              <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold mb-6 ${getCertificationColor(certificate.certificate_level)}`}>
                <Award className="w-5 h-5 mr-2" />
                Level {certificate.certificate_level} Certified
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                  <span>Issued: {new Date(certificate.issued_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-center">
                  <User className="w-4 h-4 mr-2 text-gray-600" />
                  <span>Certificate #: {certificate.certificate_number}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Assessment Results:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Overall Score:</span>
                    <span className="font-semibold">{certificate.overall_score.toFixed(1)}%</span>
                  </div>
                  {certificate.step_scores.map((score, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>Step {score.step} ({score.levels_covered.join(', ')}):</span>
                      <span className="font-semibold">{score.score_percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  This certificate verifies completion of the standardized language proficiency assessment
                </p>
              </div>
              
              <button 
                onClick={() => window.print()}
                className="mt-6 inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                type="button"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Certificate
              </button>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <button 
              onClick={resetAssessment}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              type="button"
            >
              Start New Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assessment Complete View
  if (assessmentStatus === 'completed' || assessmentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 relative">
            <button
            onClick={resetAssessment}
            aria-label="Close"
            className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:text-gray-600
                      focus:outline-none focus:ring-2 focus:ring-indigo-500"
            type="button"
            >
            <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                finalCertification === 'FAILED' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {finalCertification === 'FAILED' ? 
                  <XCircle className="w-12 h-12 text-red-600" /> : 
                  <CheckCircle className="w-12 h-12 text-green-600" />
                }
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
              {finalCertification !== 'FAILED' && (
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getCertificationColor(finalCertification)}`}>
                  <Award className="w-5 h-5 mr-2" />
                  {finalCertification} Certified
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Results Summary</h3>
                <div className="space-y-4">
                  {stepResults.map((result, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">
                          Step {result.step} - {result.levels_tested.join(' & ')}
                        </h4>
                        <span className="text-lg font-bold text-indigo-600">
                          {result.score_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Certification: {result.certification_achieved.replace('_', ' ')}</span>
                        <span>Time: {Math.floor(result.time_taken / 60)}m {result.time_taken % 60}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {finalCertification !== 'FAILED' && (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={generateCertificate}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    type="button"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Generate Certificate
                  </button>
                </div>
              )}

              {finalCertification === 'FAILED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-800">
                      Unfortunately, you scored below 25% on Step 1. No retake is allowed according to assessment rules.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Start Screen
  if (assessmentStatus === 'not_started') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-12 h-12 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">3-Step Assessment Platform</h1>
              <p className="text-gray-600">Comprehensive proficiency evaluation system</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Assessment Structure</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-800 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Step 1: A1 & A2 Levels</h4>
                      <p className="text-sm text-gray-600">Basic proficiency assessment (44 questions)</p>
                      <p className="text-xs text-gray-500">≥75% required to advance to Step 2</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-800 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Step 2: B1 & B2 Levels</h4>
                      <p className="text-sm text-gray-600">Intermediate proficiency assessment (44 questions)</p>
                      <p className="text-xs text-gray-500">≥75% required to advance to Step 3</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-800 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Step 3: C1 & C2 Levels</h4>
                      <p className="text-sm text-gray-600">Advanced proficiency assessment (44 questions)</p>
                      <p className="text-xs text-gray-500">Final certification level</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Timer Rules</h4>
                    <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                      <li>• 1 minute per question (configurable)</li>
                      <li>• Auto-submit when time expires</li>
                      <li>• No pause or restart allowed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900">Important Notice</h4>
                    <p className="text-sm text-red-800 mt-1">
                      Scoring below 25% on Step 1 results in assessment failure with no retake allowed.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={startAssessment}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center"
                type="button"
              >
                <Award className="w-5 h-5 mr-2" />
                Start Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question Not Found
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Question Not Found</h2>
          <p className="text-gray-600">There was an issue loading the current question.</p>
        </div>
      </div>
    );
  }

  // Main Assessment View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Step {currentStep} Assessment</h1>
              <p className="text-gray-600">
                {currentStep === 1 && "Levels A1 & A2"}
                {currentStep === 2 && "Levels B1 & B2"}
                {currentStep === 3 && "Levels C1 & C2"}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-lg font-bold text-red-600 mb-1">
                <Clock className="w-5 h-5 mr-2" />
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-indigo-800 font-bold">{currentQuestionIndex + 1}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Level {currentQuestion.level}</span>
                <div className="text-xs text-gray-400">Competency {currentQuestion.competency_id}</div>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option) => {
              const questionKey = `step${currentStep}_q${currentQuestion._id}`;
              const isSelected = userAnswers[questionKey] === option.label;
              
              return (
                <button
                  key={option.label}
                  onClick={() => handleAnswerSelect(option.label)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500 text-white' 
                        : 'border-gray-300'
                    }`}>
                      <span className="font-semibold text-sm">{option.label}</span>
                    </div>
                    <span className="text-gray-900">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {Object.keys(userAnswers).filter(key => key.startsWith(`step${currentStep}_`)).length} of {questions.length} answered
            </div>
            
            <button
              onClick={handleNextQuestion}
              disabled={!userAnswers[`step${currentStep}_q${currentQuestion._id}`]}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                userAnswers[`step${currentStep}_q${currentQuestion._id}`]
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              type="button"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Complete Step' : 'Next Question'}
            </button>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((step: number) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step < currentStep 
                    ? 'bg-green-500 text-white' 
                    : step === currentStep 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                <div className="ml-2 text-sm">
                  <div className="font-medium">Step {step}</div>
                  <div className="text-gray-500 text-xs">
                    {step === 1 && 'A1 & A2'}
                    {step === 2 && 'B1 & B2'}
                    {step === 3 && 'C1 & C2'}
                  </div>
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-4 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-1">Assessment Guidelines</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• Select the best answer for each question</li>
                <li>• Questions auto-submit when timer reaches zero</li>
                <li>• You must score ≥75% to advance to the next step</li>
                <li>• Your final certification will be based on your highest achieved level</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAssessmentSystem;