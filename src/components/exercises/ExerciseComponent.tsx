import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { AlertBanner } from '../ui/AlertBanner';
import { ProgressTracker } from './ProgressTracker';
import { ExerciseService } from '../../services/exerciseService';
import type { Exercise, ExamAttempt, Question, ExamResult } from '../../types/exercise';

interface ExerciseComponentProps {
  exercise: Exercise;
  attempt: ExamAttempt;
  onComplete: (result: ExamResult) => void;
  onClose: () => void;
}

interface ExerciseState {
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  timeRemaining: number | null;
  showResults: boolean;
  result: ExamResult | null;
  loading: boolean;
  error: string | null;
  currentScore: number;
  questionResults: Record<string, boolean>;
  showAnswerFeedback: boolean;
  selectedAnswer: string | string[] | null;
}

export const ExerciseComponent: React.FC<ExerciseComponentProps> = ({
  exercise,
  attempt,
  onComplete,
  onClose
}) => {
  const [state, setState] = useState<ExerciseState>({
    currentQuestionIndex: attempt.currentQuestionIndex || 0,
    answers: attempt.answers || {},
    timeRemaining: attempt.timeRemaining || null,
    showResults: false,
    result: null,
    loading: false,
    error: null,
    currentScore: 0,
    questionResults: {},
    showAnswerFeedback: false,
    selectedAnswer: null
  });

  // Timer effect - reduced to 20 seconds
  useEffect(() => {
    if (exercise.timeLimit) {
      setState(prev => ({ ...prev, timeRemaining: 20 })); // 20 seconds total
    }
  }, [exercise.timeLimit]);

  useEffect(() => {
    if (state.timeRemaining && state.timeRemaining > 0 && !state.showResults) {
      const timer = setInterval(() => {
        setState(prev => {
          const newTimeRemaining = (prev.timeRemaining || 0) - 1;
          if (newTimeRemaining <= 0) {
            handleSubmit();
            return { ...prev, timeRemaining: 0 };
          }
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.timeRemaining, state.showResults]);

  const currentQuestion = exercise.questions[state.currentQuestionIndex];
  const isLastQuestion = state.currentQuestionIndex === exercise.questions.length - 1;
  const isFirstQuestion = state.currentQuestionIndex === 0;

  const handleAnswerSelect = (questionId: string, answer: string | string[]) => {
    // Don't allow selection if already answered
    if (state.answers[questionId]) return;

    const isCorrect = checkAnswer(currentQuestion, answer);
    const points = isCorrect ? currentQuestion.points : 0;

    setState(prev => ({
      ...prev,
      selectedAnswer: answer,
      answers: {
        ...prev.answers,
        [questionId]: answer
      },
      questionResults: {
        ...prev.questionResults,
        [questionId]: isCorrect
      },
      currentScore: prev.currentScore + points,
      showAnswerFeedback: true,
      timeRemaining: 20 // Reset timer to 20 seconds when option is clicked
    }));
  };

  const handleAnswerSubmit = () => {
    if (!state.selectedAnswer || !currentQuestion) return;

    const isCorrect = checkAnswer(currentQuestion, state.selectedAnswer);
    const points = isCorrect ? currentQuestion.points : 0;

    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: prev.selectedAnswer!
      },
      questionResults: {
        ...prev.questionResults,
        [currentQuestion.id]: isCorrect
      },
      currentScore: prev.currentScore + points,
      showAnswerFeedback: true
    }));

    // Update attempt in storage
    ExerciseService.updateExamAttempt(attempt.id, {
      answers: {
        ...state.answers,
        [currentQuestion.id]: state.selectedAnswer
      },
      currentQuestionIndex: state.currentQuestionIndex,
      timeRemaining: state.timeRemaining || undefined
    });
  };

  const checkAnswer = (question: Question, userAnswer: string | string[]): boolean => {
    if (question.type === 'mcq') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'text') {
      const correctAnswer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0]?.toLowerCase().trim()
        : question.correctAnswer.toLowerCase().trim();
      const userAnswerStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      return userAnswerStr?.toLowerCase().trim() === correctAnswer;
    }
    return false;
  };

  const handleNext = () => {
    console.log('handleNext called, isLastQuestion:', isLastQuestion, 'currentIndex:', state.currentQuestionIndex);
    if (!isLastQuestion) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        showAnswerFeedback: false,
        selectedAnswer: null
      }));
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        showAnswerFeedback: false,
        selectedAnswer: prev.answers[exercise.questions[prev.currentQuestionIndex - 1].id] || null
      }));
    }
  };

  const handleSubmit = async () => {
    // Calculate final score and show results modal
    const finalScore = Math.round((state.currentScore / exercise.totalPoints) * 100);
    const passed = finalScore >= exercise.passingScore;

    const mockResult = {
      score: finalScore,
      earnedPoints: state.currentScore,
      totalPoints: exercise.totalPoints,
      timeSpent: 0,
      attemptNumber: 1,
      status: 'completed' as const
    };

    setState(prev => ({
      ...prev,
      result: mockResult as any,
      showResults: true,
      loading: false
    }));
  };

  const handleComplete = () => {
    if (state.result) {
      onComplete(state.result);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= exercise.passingScore) return 'text-success-600';
    if (score >= exercise.passingScore * 0.7) return 'text-warning-600';
    return 'text-error-600';
  };

  if (state.showResults && state.result) {
    return (
      <div className="space-y-6">
        {/* Simple Total Marks Popup */}
        <div className="bg-white border-2 border-primary-200 rounded-xl p-8 text-center shadow-lg">
          <div className="mb-6">
            <div className="text-6xl mb-4">
              {state.result.score >= exercise.passingScore ? '🎉' : '📚'}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Exercise Complete!
            </h3>

            {/* Total Marks Display */}
            <div className="bg-primary-50 rounded-lg p-6 mb-4">
              <div className="text-4xl font-bold text-primary-900 mb-2">
                {state.result.earnedPoints}/{state.result.totalPoints}
              </div>
              <div className="text-lg text-primary-700">Total Marks</div>
              <div className="text-2xl font-semibold text-primary-800 mt-2">
                {state.result.score}%
              </div>
            </div>

            {/* Pass/Fail Message */}
            {state.result.score >= exercise.passingScore ? (
              <div className="text-green-600 font-semibold text-lg">
                ✅ Congratulations! You Passed!
              </div>
            ) : (
              <div className="text-orange-600 font-semibold text-lg">
                📚 Keep practicing! You need {exercise.passingScore}% to pass.
              </div>
            )}

            {/* Continue Button */}
            <div className="mt-6">
              <AccessibleButton
                variant="primary"
                onClick={handleComplete}
              >
                Continue
              </AccessibleButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state.error && (
        <AlertBanner
          type="error"
          message={state.error}
          malayalamMessage="ഒരു പിശക് സംഭവിച്ചു"
          onDismiss={() => setState(prev => ({ ...prev, error: null }))}
        />
      )}

      {/* Exercise Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {exercise.title}
          </h3>
          <p className="text-gray-600 mt-1">{exercise.description}</p>
        </div>

        {state.timeRemaining !== null && (
          <div className="text-right">
            <div className={`text-lg font-mono ${state.timeRemaining < 300 ? 'text-error-600' : 'text-gray-700'
              }`}>
              {formatTime(state.timeRemaining)}
            </div>
            <p className="text-xs text-gray-500">Time Remaining</p>
          </div>
        )}
      </div>

      {/* Progress Tracker */}
      <ProgressTracker
        currentStep={state.currentQuestionIndex + 1}
        totalSteps={exercise.questions.length}
        completedSteps={Object.keys(state.answers).length}
      />

      {/* Question Status Indicator */}
      {state.answers[currentQuestion.id] && (
        <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-gray-50">
          {state.questionResults[currentQuestion.id] ? (
            <>
              <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-success-700 font-medium">Correct! +{currentQuestion.points} points</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-error-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-error-700 font-medium">Incorrect. +0 points</span>
            </>
          )}
        </div>
      )}

      {/* Current Question */}
      {currentQuestion && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Question {state.currentQuestionIndex + 1} of {exercise.questions.length}
            </h4>
            <p className="text-gray-700">{currentQuestion.question}</p>

            {currentQuestion.questionMalayalam && (
              <p className="text-gray-600 mt-2" lang="ml">
                {currentQuestion.questionMalayalam}
              </p>
            )}
          </div>

          {/* Question Content */}
          <div className="space-y-4">
            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map(option => {
                  const isSelected = state.selectedAnswer === option.id;
                  const hasAnswered = !!state.answers[currentQuestion.id];
                  const isCorrect = option.isCorrect;

                  let optionClasses = "flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors";

                  if (hasAnswered) {
                    if (isSelected && isCorrect) {
                      optionClasses += " bg-green-100 border-green-300 text-green-800";
                    } else if (isSelected && !isCorrect) {
                      optionClasses += " bg-red-100 border-red-300 text-red-800";
                    } else if (isCorrect) {
                      optionClasses += " bg-green-50 border-green-200 text-green-700";
                    } else {
                      optionClasses += " border-gray-200 text-gray-600";
                    }
                  } else {
                    optionClasses += isSelected
                      ? " bg-blue-50 border-blue-300"
                      : " border-gray-200 hover:bg-gray-50";
                  }

                  return (
                    <div key={option.id} className={optionClasses} onClick={() => !hasAnswered && handleAnswerSelect(currentQuestion.id, option.id)}>
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => { }}
                        disabled={hasAnswered}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.text}</span>
                          {hasAnswered && isCorrect && (
                            <span className="text-green-600">✓</span>
                          )}
                          {hasAnswered && isSelected && !isCorrect && (
                            <span className="text-red-600">✗</span>
                          )}
                        </div>
                        {option.textMalayalam && (
                          <span className="block text-sm mt-1 opacity-80" lang="ml">
                            {option.textMalayalam}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div>
                <label htmlFor={`text-${currentQuestion.id}`} className="sr-only">
                  Your answer
                </label>
                <textarea
                  id={`text-${currentQuestion.id}`}
                  value={(state.selectedAnswer as string) || (state.answers[currentQuestion.id] as string) || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                  disabled={state.showAnswerFeedback || !!state.answers[currentQuestion.id]}
                  placeholder="Type your answer here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                  rows={4}
                />
                {(state.showAnswerFeedback || state.answers[currentQuestion.id]) && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <strong className="text-blue-800 text-sm">Correct Answer:</strong>
                    <p className="text-blue-700 text-sm mt-1">
                      {Array.isArray(currentQuestion.correctAnswer)
                        ? currentQuestion.correctAnswer.join(', ')
                        : currentQuestion.correctAnswer}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Answer Feedback */}
            {state.showAnswerFeedback && currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong className="text-blue-800 text-sm">Explanation:</strong>
                    <p className="text-blue-700 text-sm mt-1">{currentQuestion.explanation}</p>
                    {currentQuestion.explanationMalayalam && (
                      <p className="text-blue-600 text-sm mt-1" lang="ml">
                        {currentQuestion.explanationMalayalam}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Question Points */}
          <div className="mt-4 text-sm text-gray-500">
            <span>Points: {currentQuestion.points}</span>
            <span className="mx-2">•</span>
            <span>Difficulty: {currentQuestion.difficulty}</span>
          </div>
        </div>
      )}

      {/* Current Score Display */}
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-primary-700">Current Score:</span>
            <span className="ml-2 text-lg font-semibold text-primary-900">
              {state.currentScore} / {exercise.totalPoints} points
            </span>
          </div>
          <div className="text-sm text-primary-600">
            {Math.round((state.currentScore / exercise.totalPoints) * 100)}%
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <AccessibleButton
          variant="secondary"
          onClick={handlePrevious}
          disabled={isFirstQuestion}
        >
          Previous
        </AccessibleButton>

        <div className="flex space-x-3">
          {/* Debug info */}
          <div className="text-xs text-gray-500 mr-4">
            Selected: {state.selectedAnswer || 'none'} | Answered: {state.answers[currentQuestion.id] || 'no'} | Q: {state.currentQuestionIndex + 1}/{exercise.questions.length}
          </div>



          {/* Always show Next button if not last question */}
          {!isLastQuestion && (
            <AccessibleButton
              variant="secondary"
              onClick={handleNext}
              disabled={!state.answers[currentQuestion.id]}
            >
              NEXT →
            </AccessibleButton>
          )}

          {/* Show Submit on last question */}
          {isLastQuestion && state.answers[currentQuestion.id] && (
            <AccessibleButton
              variant="primary"
              onClick={handleSubmit}
              loading={state.loading}
            >
              Submit Exercise
            </AccessibleButton>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
        <p>
          <strong>Instructions:</strong> {exercise.instructions}
        </p>
        <p className="mt-2">
          Answer all questions to complete the exercise. You can navigate between questions using the Previous/Next buttons.
        </p>
      </div>
    </div>
  );
};