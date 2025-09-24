// TypeScript interfaces for the questions database

export interface QuestionOption {
  id: string;
  text: string;
  textMalayalam?: string;
}

export interface QuestionData {
  id: string;
  subject: string;
  question: string;
  questionMalayalam?: string;
  options: QuestionOption[];
  answer: string;
  explanation?: string;
  explanationMalayalam?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface QuestionsDatabase {
  questions: QuestionData[];
}

// Supported subjects
export const SUPPORTED_SUBJECTS = [
  'Kithabu Thawheed',
  'Swiffathul Swalathu Nabi',
  'Tajweed',
  'Hifz',
  'Tafseer',
] as const;

export type SupportedSubject = (typeof SUPPORTED_SUBJECTS)[number];

// Subject information with Malayalam names and descriptions
export const SUBJECT_INFO: Record<
  string,
  {
    malayalamName: string;
    description: string;
    malayalamDescription: string;
    icon: string;
    difficulty: string;
  }
> = {
  'Kithabu Thawheed': {
    malayalamName: 'കിതാബുത്തൗഹീദ്',
    description: 'Learn about Islamic monotheism and the oneness of Allah',
    malayalamDescription:
      'ഇസ്ലാമിക ഏകദൈവവിശ്വാസവും അല്ലാഹുവിന്റെ ഏകത്വവും പഠിക്കുക',
    icon: '☪️',
    difficulty: 'Medium',
  },
  'Swiffathul Swalathu Nabi': {
    malayalamName: 'സ്വിഫത്തുസ്സലാത്തുന്നബി',
    description: "Study the description of Prophet's prayer method",
    malayalamDescription: 'നബിയുടെ നമസ്കാര രീതിയുടെ വിവരണം പഠിക്കുക',
    icon: '🕌',
    difficulty: 'Easy',
  },
  Tajweed: {
    malayalamName: 'തജ്വീദ്',
    description:
      'Master the art of Quranic recitation with proper pronunciation',
    malayalamDescription: 'ശരിയായ ഉച്ചാരണത്തോടെ ഖുർആൻ പാരായണ കല പഠിക്കുക',
    icon: '📖',
    difficulty: 'Hard',
  },
  Hifz: {
    malayalamName: 'ഹിഫ്സ്',
    description: 'Memorization techniques and Quranic verses',
    malayalamDescription: 'മനഃപാഠ രീതികളും ഖുർആൻ വാക്യങ്ങളും',
    icon: '🧠',
    difficulty: 'Medium',
  },
  Tafseer: {
    malayalamName: 'തഫ്സീർ',
    description: 'Understanding and interpretation of the Quran',
    malayalamDescription: 'ഖുർആനിന്റെ മനസ്സിലാക്കലും വ്യാഖ്യാനവും',
    icon: '💡',
    difficulty: 'Hard',
  },
};

// Difficulty levels with point values
export const DIFFICULTY_POINTS = {
  easy: 10,
  medium: 15,
  hard: 20,
} as const;

// Validation function for question data
export function validateQuestion(question: any): question is QuestionData {
  return (
    typeof question.id === 'string' &&
    typeof question.subject === 'string' &&
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every(
      (opt: any) => typeof opt.id === 'string' && typeof opt.text === 'string'
    ) &&
    typeof question.answer === 'string' &&
    ['easy', 'medium', 'hard'].includes(question.difficulty) &&
    typeof question.points === 'number'
  );
}

// Utility function to get questions by subject
export function getQuestionsBySubject(
  questions: QuestionData[],
  subject: string
): QuestionData[] {
  return questions.filter(q => q.subject === subject);
}

// Utility function to shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Utility function to get random questions
export function getRandomQuestions(
  questions: QuestionData[],
  count: number,
  subject?: string
): QuestionData[] {
  const filteredQuestions = subject
    ? getQuestionsBySubject(questions, subject)
    : questions;

  const shuffled = shuffleArray(filteredQuestions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Exercise result interface
export interface ExerciseResult {
  score: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  subject: string;
  completedAt: Date;
}

// Exercise session interface for localStorage
export interface ExerciseSession {
  questions: QuestionData[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  correctAnswers: Record<string, boolean>;
  score: number;
  totalPoints: number;
  timePerQuestion: number;
  timeRemaining: number;
  isCompleted: boolean;
  startTime: Date;
  subject: string;
}
