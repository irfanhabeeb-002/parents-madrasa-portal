import type { BaseEntity, Timestamp, QuestionType, ExamStatus } from './common';

export interface Exercise extends BaseEntity {
  noteId?: string;
  classSessionId?: string;
  title: string;
  description: string;
  instructions: string;
  questions: Question[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  maxAttempts: number;
  isPublic: boolean;
  difficulty: ExerciseDifficulty;
  tags: string[];
  totalPoints: number;
  estimatedDuration: number; // in minutes
  prerequisites: string[]; // IDs of other exercises
}

export interface Question extends BaseEntity {
  exerciseId: string;
  type: QuestionType;
  question: string;
  questionMalayalam?: string;
  options?: QuestionOption[];
  correctAnswer: string | string[]; // string for single answer, array for multiple
  explanation?: string;
  explanationMalayalam?: string;
  points: number;
  difficulty: QuestionDifficulty;
  tags: string[];
  imageUrl?: string;
  audioUrl?: string;
  orderIndex: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  textMalayalam?: string;
  isCorrect: boolean;
  imageUrl?: string;
}

export interface ExamResult extends BaseEntity {
  userId: string;
  exerciseId: string;
  answers: Record<string, string | string[]>;
  score: number; // percentage
  totalPoints: number;
  earnedPoints: number;
  timeSpent: number; // in seconds
  completedAt: Date | Timestamp;
  startedAt: Date | Timestamp;
  attemptNumber: number;
  status: ExamStatus;
  feedback?: string;
  detailedResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  timeSpent: number; // in seconds
}

export interface ExamAttempt extends BaseEntity {
  userId: string;
  exerciseId: string;
  startedAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
  status: ExamStatus;
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  timeRemaining?: number; // in seconds
  isSubmitted: boolean;
}

export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
