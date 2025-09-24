import React, { useState, useEffect, useCallback } from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { AlertBanner } from '../ui/AlertBanner';
import { ProgressTracker } from './ProgressTracker';
import questionsData from '../../data/questions.json';
import type {
  QuestionData as Question,
  ExerciseResult,
} from '../../data/questionsData';

interface ExerciseSession {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  correctAnswers: Record<string, boolean>;
  score: number;
  totalPoints: number;
  timePerQuestion: number;
  timeRemaining: number;
  isCompleted: boolean;
  startTime: Date;
}

interface EnhancedExerciseComponentProps {
  subject?: string;
  numberOfQuestions?: number;
  onComplete: (result: ExerciseResult) => void;
  onClose: () => void;
}

const QUESTION_TIME_LIMIT = 10; // 10 seconds per question
const STORAGE_KEY = 'exercise_session';

export const EnhancedExerciseComponent: React.FC<
  EnhancedExerciseComponentProps
> = ({ subject, numberOfQuestions = 5, onComplete, onClose }) => {
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Load or create exercise session
  useEffect(() => {
    initializeSession();
  }, [subject, numberOfQuestions]);

  // Timer effect for countdown
  useEffect(() => {
    if (!session || session.isCompleted || hasAnswered) {
      return;
    }

    const timer = setInterval(() => {
      setSession(prev => {
        if (!prev || prev.isCompleted || hasAnswered) {
          return prev;
        }

        const newTimeRemaining = prev.timeRemaining - 1;

        if (newTimeRemaining <= 0) {
          // Time's up - auto move to next question
          return handleTimeUp(prev);
        }

        // Save to localStorage
        const updatedSession = { ...prev, timeRemaining: newTimeRemaining };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));

        return updatedSession;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.currentQuestionIndex, hasAnswered]);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session && !session.isCompleted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  const initializeSession = useCallback(() => {
    try {
      setLoading(true);

      // Try to load existing session from localStorage
      const savedSession = localStorage.getItem(STORAGE_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        // Check if it's a valid session for the same subject
        if (parsed.questions?.[0]?.subject === subject || !subject) {
          setSession(parsed);
          setLoading(false);
          return;
        }
      }

      // Create new session
      const availableQuestions = subject
        ? questionsData.questions.filter(q => q.subject === subject)
        : questionsData.questions;

      if (availableQuestions.length === 0) {
        setError(
          `No questions found for subject: ${subject || 'All subjects'}`
        );
        setLoading(false);
        return;
      }

      // Randomly select and shuffle questions
      const shuffledQuestions = shuffleArray([...availableQuestions]);
      const selectedQuestions = shuffledQuestions.slice(
        0,
        Math.min(numberOfQuestions, shuffledQuestions.length)
      );

      // Shuffle options for each question
      const questionsWithShuffledOptions = selectedQuestions.map(q => ({
        ...q,
        options: shuffleArray([...q.options]),
      }));

      const totalPoints = questionsWithShuffledOptions.reduce(
        (sum, q) => sum + q.points,
        0
      );

      const newSession: ExerciseSession = {
        questions: questionsWithShuffledOptions,
        currentQuestionIndex: 0,
        answers: {},
        correctAnswers: {},
        score: 0,
        totalPoints,
        timePerQuestion: QUESTION_TIME_LIMIT,
        timeRemaining: QUESTION_TIME_LIMIT,
        isCompleted: false,
        startTime: new Date(),
      };

      setSession(newSession);
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize exercise');
      setLoading(false);
    }
  }, [subject, numberOfQuestions]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleTimeUp = (currentSession: ExerciseSession): ExerciseSession => {
    // Auto-move to next question when time runs out
    const isLastQuestion =
      currentSession.currentQuestionIndex ===
      currentSession.questions.length - 1;

    if (isLastQuestion) {
      return completeExercise(currentSession);
    } else {
      return {
        ...currentSession,
        currentQuestionIndex: currentSession.currentQuestionIndex + 1,
        timeRemaining: QUESTION_TIME_LIMIT,
      };
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    if (!session || hasAnswered) {
      return;
    }

    const currentQuestion = session.questions[session.currentQuestionIndex];
    const isCorrect = answerId === currentQuestion.answer;
    const points = isCorrect ? currentQuestion.points : 0;

    setSelectedAnswer(answerId);
    setHasAnswered(true);

    const updatedSession = {
      ...session,
      answers: {
        ...session.answers,
        [currentQuestion.id]: answerId,
      },
      correctAnswers: {
        ...session.correctAnswers,
        [currentQuestion.id]: isCorrect,
      },
      score: session.score + points,
    };

    setSession(updatedSession);

    // If this is the last question, complete immediately
    const isLastQuestion =
      session.currentQuestionIndex === session.questions.length - 1;
    if (isLastQuestion) {
      setTimeout(() => {
        const completedSession = completeExercise(updatedSession);
        setSession(completedSession);
        setShowResult(true);
      }, 1500); // Show feedback for 1.5 seconds before completing
    } else {
      // Auto-move to next question after 2 seconds
      setTimeout(() => {
        setSession(prev =>
          prev
            ? {
                ...prev,
                currentQuestionIndex: prev.currentQuestionIndex + 1,
                timeRemaining: QUESTION_TIME_LIMIT,
              }
            : null
        );
        setSelectedAnswer(null);
        setHasAnswered(false);
      }, 2000);
    }
  };

  const completeExercise = (
    currentSession: ExerciseSession
  ): ExerciseSession => {
    const completedSession = {
      ...currentSession,
      isCompleted: true,
      timeRemaining: 0,
    };

    // Clear from localStorage
    localStorage.removeItem(STORAGE_KEY);

    return completedSession;
  };

  const handleComplete = () => {
    if (!session) {
      return;
    }

    const timeSpent = Math.floor(
      (new Date().getTime() - session.startTime.getTime()) / 1000
    );
    const correctCount = Object.values(session.correctAnswers).filter(
      Boolean
    ).length;
    const percentage = Math.round((session.score / session.totalPoints) * 100);

    const result: ExerciseResult = {
      score: session.score,
      percentage,
      correctAnswers: correctCount,
      totalQuestions: session.questions.length,
      timeSpent,
      subject: session.questions[0]?.subject || 'Mixed',
    };

    onComplete(result);
  };

  const formatTime = (seconds: number): string => {
    return `0:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (!session) {
      return 0;
    }
    return Math.round(
      ((session.currentQuestionIndex + 1) / session.questions.length) * 100
    );
  };

  const getEncouragementMessage = (
    percentage: number
  ): { message: string; malayalam: string; emoji: string } => {
    if (percentage >= 90) {
      return {
        message: 'Excellent! Outstanding performance!',
        malayalam: 'മികച്ചത്! അതിമനോഹരമായ പ്രകടനം!',
        emoji: '🏆',
      };
    }
    if (percentage >= 80) {
      return {
        message: 'Great job! Very good work!',
        malayalam: 'നല്ല പ്രവർത്തനം! വളരെ നല്ലത്!',
        emoji: '🎉',
      };
    }
    if (percentage >= 70) {
      return {
        message: 'Good work! Keep it up!',
        malayalam: 'നല്ല പ്രവർത്തനം! തുടരുക!',
        emoji: '👍',
      };
    }
    if (percentage >= 60) {
      return {
        message: 'Not bad! You can do better!',
        malayalam: 'മോശമല്ല! നിങ്ങൾക്ക് കൂടുതൽ നന്നായി ചെയ്യാൻ കഴിയും!',
        emoji: '📚',
      };
    }
    return {
      message: "Keep practicing! You'll improve!",
      malayalam: 'അഭ്യസിക്കുന്നത് തുടരുക! നിങ്ങൾ മെച്ചപ്പെടും!',
      emoji: '💪',
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
          <p className="text-sm text-gray-500 mt-1" lang="ml">
            ചോദ്യങ്ങൾ ലോഡ് ചെയ്യുന്നു...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <AlertBanner
          type="error"
          message={error}
          malayalamMessage="ഒരു പിശക് സംഭവിച്ചു"
        />
        <div className="mt-4 text-center">
          <AccessibleButton variant="secondary" onClick={onClose}>
            Close
          </AccessibleButton>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Results screen
  if (showResult && session.isCompleted) {
    const percentage = Math.round((session.score / session.totalPoints) * 100);
    const correctCount = Object.values(session.correctAnswers).filter(
      Boolean
    ).length;
    const encouragement = getEncouragementMessage(percentage);

    return (
      <div className="p-6 text-center space-y-6">
        <div className="text-6xl mb-4">{encouragement.emoji}</div>

        <h2 className="text-2xl font-bold text-gray-900">
          Exercise Complete!
          <span className="block text-lg text-gray-600 mt-1" lang="ml">
            അഭ്യാസം പൂർത്തിയായി!
          </span>
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-primary-600 h-4 rounded-full transition-all duration-1000"
            style={{ width: '100%' }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">100% Completed</p>

        {/* Score Display */}
        <div className="bg-primary-50 rounded-lg p-6">
          <div className="text-4xl font-bold text-primary-900 mb-2">
            {session.score}/{session.totalPoints}
          </div>
          <div className="text-lg text-primary-700 mb-2">Total Score</div>
          <div className="text-3xl font-bold text-primary-800">
            {percentage}%
          </div>
        </div>

        {/* Detailed Results */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-green-800 font-semibold">Correct</div>
            <div className="text-2xl font-bold text-green-900">
              {correctCount}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-red-800 font-semibold">Incorrect</div>
            <div className="text-2xl font-bold text-red-900">
              {session.questions.length - correctCount}
            </div>
          </div>
        </div>

        {/* Encouragement Message */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800 font-medium">{encouragement.message}</p>
          <p className="text-blue-700 text-sm mt-1" lang="ml">
            {encouragement.malayalam}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 justify-center">
          <AccessibleButton variant="primary" onClick={handleComplete}>
            Continue
            <span className="block text-sm" lang="ml">
              തുടരുക
            </span>
          </AccessibleButton>
          <AccessibleButton
            variant="secondary"
            onClick={() => initializeSession()}
          >
            Try Again
            <span className="block text-sm" lang="ml">
              വീണ്ടും ശ്രമിക്കുക
            </span>
          </AccessibleButton>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const isLastQuestion =
    session.currentQuestionIndex === session.questions.length - 1;

  return (
    <div className="space-y-6">
      {/* Header with Timer and Progress */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {currentQuestion.subject} Exercise
            <span className="block text-sm text-gray-600 mt-1" lang="ml">
              {currentQuestion.subject} അഭ്യാസം
            </span>
          </h3>
        </div>

        <div className="text-right">
          <div
            className={`text-2xl font-mono font-bold ${
              session.timeRemaining <= 3
                ? 'text-red-600 animate-pulse'
                : session.timeRemaining <= 5
                  ? 'text-orange-600'
                  : 'text-gray-700'
            }`}
          >
            {formatTime(session.timeRemaining)}
          </div>
          <p className="text-xs text-gray-500">Time Left</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Question {session.currentQuestionIndex + 1} of{' '}
            {session.questions.length}
          </span>
          <span>{getProgressPercentage()}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">
            {currentQuestion.question}
          </h4>
          {currentQuestion.questionMalayalam && (
            <p className="text-gray-700 text-base" lang="ml">
              {currentQuestion.questionMalayalam}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map(option => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === currentQuestion.answer;

            let optionClasses =
              'flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[44px]';

            if (hasAnswered) {
              if (isSelected && isCorrect) {
                optionClasses +=
                  ' bg-green-100 border-green-400 text-green-800';
              } else if (isSelected && !isCorrect) {
                optionClasses += ' bg-red-100 border-red-400 text-red-800';
              } else if (isCorrect) {
                optionClasses += ' bg-green-50 border-green-300 text-green-700';
              } else {
                optionClasses += ' border-gray-200 text-gray-600 opacity-60';
              }
            } else {
              optionClasses += isSelected
                ? ' bg-blue-50 border-blue-400 text-blue-800'
                : ' border-gray-300 hover:bg-gray-50 hover:border-gray-400';
            }

            return (
              <div
                key={option.id}
                className={optionClasses}
                onClick={() => !hasAnswered && handleAnswerSelect(option.id)}
                role="button"
                tabIndex={0}
                aria-label={`Option ${option.id}: ${option.text}`}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && !hasAnswered) {
                    e.preventDefault();
                    handleAnswerSelect(option.id);
                  }
                }}
              >
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      hasAnswered && isCorrect
                        ? 'border-green-500 bg-green-500'
                        : hasAnswered && isSelected && !isCorrect
                          ? 'border-red-500 bg-red-500'
                          : isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-400'
                    }`}
                  >
                    {(hasAnswered && isCorrect) ||
                    (isSelected && !hasAnswered) ? (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    ) : hasAnswered && isSelected && !isCorrect ? (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-base">{option.text}</span>
                    {hasAnswered && isCorrect && (
                      <span className="text-green-600 text-xl">✓</span>
                    )}
                    {hasAnswered && isSelected && !isCorrect && (
                      <span className="text-red-600 text-xl">✗</span>
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

        {/* Answer Feedback */}
        {hasAnswered && currentQuestion.explanation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <strong className="text-blue-800 text-sm">Explanation:</strong>
                <p className="text-blue-700 text-sm mt-1">
                  {currentQuestion.explanation}
                </p>
                {currentQuestion.explanationMalayalam && (
                  <p className="text-blue-600 text-sm mt-2" lang="ml">
                    {currentQuestion.explanationMalayalam}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Question Info */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <span>Points: {currentQuestion.points}</span>
          <span>Difficulty: {currentQuestion.difficulty}</span>
        </div>
      </div>

      {/* Current Score */}
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-primary-700">Current Score:</span>
            <span className="ml-2 text-lg font-semibold text-primary-900">
              {session.score} / {session.totalPoints} points
            </span>
          </div>
          <div className="text-sm text-primary-600">
            {Math.round((session.score / session.totalPoints) * 100)}%
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
        <p>
          <strong>Instructions:</strong> Select your answer by clicking on one
          of the options above.
          {isLastQuestion
            ? ' This is the last question - the test will end when you select an answer.'
            : ' You will automatically move to the next question after selecting an answer.'}
        </p>
        <p className="mt-1" lang="ml">
          <strong>നിർദ്ദേശങ്ങൾ:</strong> മുകളിലുള്ള ഓപ്ഷനുകളിൽ ഒന്നിൽ ക്ലിക്ക്
          ചെയ്ത് നിങ്ങളുടെ ഉത്തരം തിരഞ്ഞെടുക്കുക.
        </p>
      </div>
    </div>
  );
};
