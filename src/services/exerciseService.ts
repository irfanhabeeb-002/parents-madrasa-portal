import {
  Exercise,
  Question,
  ExamResult,
  ExamAttempt,
  QuestionResult,
  _ExerciseDifficulty,
} from '../types/exercise';
import {
  ApiResponse,
  PaginationOptions,
  SearchOptions,
  FilterOptions,
  _ExamStatus,
} from '../types/common';
import {
  _FirebaseExercise,
  _FirebaseExamResult,
  FIREBASE_COLLECTIONS,
} from '../types/firebase';
import { FirebaseService } from './firebaseService';
import { StorageService } from './storageService';
import {
  _where,
  _orderBy,
  limit as _firestoreLimit,
  Timestamp as _FirestoreTimestamp,
} from 'firebase/firestore';

export class ExerciseService extends FirebaseService {
  private static instance: ExerciseService;
  private static readonly STORAGE_KEY = 'exercises';
  private static readonly RESULTS_STORAGE_KEY = 'exam_results';
  private static readonly ATTEMPTS_STORAGE_KEY = 'exam_attempts';

  constructor() {
    super(FIREBASE_COLLECTIONS.EXERCISES);
  }

  static getInstance(): ExerciseService {
    if (!ExerciseService.instance) {
      ExerciseService.instance = new ExerciseService();
    }
    return ExerciseService.instance;
  }

  // Mock data for development
  private static mockExercises: Exercise[] = [
    {
      id: 'exercise-1',
      noteId: 'note-1',
      classSessionId: 'class-1',
      title: 'Islamic History Quiz - Early Period',
      description:
        'Test your knowledge of early Islamic history including the life of Prophet Muhammad (PBUH) and the Rashidun Caliphate',
      instructions:
        'Answer all questions to the best of your ability. You have 30 minutes to complete this quiz. Each question is worth different points based on difficulty.',
      questions: [
        {
          id: 'q1',
          exerciseId: 'exercise-1',
          type: 'mcq',
          question:
            'In which year did Prophet Muhammad (PBUH) receive his first revelation?',
          questionMalayalam:
            'പ്രവാചകൻ മുഹമ്മദ് (സ) ന് ആദ്യ വെളിപാട് ലഭിച്ചത് ഏത് വർഷമാണ്?',
          options: [
            {
              id: 'opt1',
              text: '608 CE',
              textMalayalam: '608 CE',
              isCorrect: false,
            },
            {
              id: 'opt2',
              text: '610 CE',
              textMalayalam: '610 CE',
              isCorrect: true,
            },
            {
              id: 'opt3',
              text: '612 CE',
              textMalayalam: '612 CE',
              isCorrect: false,
            },
            {
              id: 'opt4',
              text: '615 CE',
              textMalayalam: '615 CE',
              isCorrect: false,
            },
          ],
          correctAnswer: 'opt2',
          explanation:
            'Prophet Muhammad (PBUH) received his first revelation in 610 CE in the cave of Hira.',
          explanationMalayalam:
            'പ്രവാചകൻ മുഹമ്മദ് (സ) ന് ഹിറാ ഗുഹയിൽ വച്ച് 610 CE ൽ ആദ്യ വെളിപാട് ലഭിച്ചു.',
          points: 2,
          difficulty: 'easy',
          tags: ['prophet', 'revelation', 'history'],
          orderIndex: 1,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'q2',
          exerciseId: 'exercise-1',
          type: 'mcq',
          question: 'What does "Hijra" refer to in Islamic history?',
          questionMalayalam: 'ഇസ്ലാമിക ചരിത്രത്തിൽ "ഹിജ്റ" എന്നാൽ എന്താണ്?',
          options: [
            {
              id: 'opt1',
              text: 'The first revelation',
              textMalayalam: 'ആദ്യ വെളിപാട്',
              isCorrect: false,
            },
            {
              id: 'opt2',
              text: 'Migration from Mecca to Medina',
              textMalayalam: 'മക്കയിൽ നിന്ന് മദീനയിലേക്കുള്ള കുടിയേറ്റം',
              isCorrect: true,
            },
            {
              id: 'opt3',
              text: 'The conquest of Mecca',
              textMalayalam: 'മക്ക വിജയം',
              isCorrect: false,
            },
            {
              id: 'opt4',
              text: 'The last sermon',
              textMalayalam: 'അവസാന പ്രസംഗം',
              isCorrect: false,
            },
          ],
          correctAnswer: 'opt2',
          explanation:
            'Hijra refers to the migration of Prophet Muhammad (PBUH) and his followers from Mecca to Medina in 622 CE.',
          explanationMalayalam:
            'ഹിജ്റ എന്നാൽ 622 CE ൽ പ്രവാചകൻ മുഹമ്മദ് (സ) ഉം അനുയായികളും മക്കയിൽ നിന്ന് മദീനയിലേക്ക് കുടിയേറിയതിനെ സൂചിപ്പിക്കുന്നു.',
          points: 3,
          difficulty: 'medium',
          tags: ['hijra', 'migration', 'medina'],
          orderIndex: 2,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'q3',
          exerciseId: 'exercise-1',
          type: 'text',
          question: 'Name the four Rashidun Caliphs in chronological order.',
          questionMalayalam:
            'നാല് റാഷിദുൻ ഖലീഫമാരുടെ പേര് കാലക്രമത്തിൽ എഴുതുക.',
          correctAnswer:
            'Abu Bakr, Umar ibn al-Khattab, Uthman ibn Affan, Ali ibn Abi Talib',
          explanation:
            'The four Rashidun (Rightly-Guided) Caliphs ruled in succession after Prophet Muhammad (PBUH).',
          explanationMalayalam:
            'നാല് റാഷിദുൻ (നേർവഴി നടത്തിയ) ഖലീഫമാർ പ്രവാചകൻ മുഹമ്മദ് (സ) ന് ശേഷം തുടർച്ചയായി ഭരിച്ചു.',
          points: 5,
          difficulty: 'hard',
          tags: ['caliphs', 'rashidun', 'succession'],
          orderIndex: 3,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
      ],
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3,
      isPublic: true,
      difficulty: 'medium',
      tags: ['history', 'early-islam', 'quiz'],
      totalPoints: 10,
      estimatedDuration: 25,
      prerequisites: [],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'exercise-2',
      noteId: 'note-2',
      classSessionId: 'class-2',
      title: 'Tajweed Rules Assessment',
      description:
        'Comprehensive assessment of basic tajweed rules including makharij, sifaat, and pronunciation guidelines',
      instructions:
        'This assessment covers fundamental tajweed concepts. Take your time to read each question carefully. Audio examples may be provided for some questions.',
      questions: [
        {
          id: 'q4',
          exerciseId: 'exercise-2',
          type: 'mcq',
          question: 'Which letters are pronounced from the throat (الحلق)?',
          questionMalayalam:
            'ഏത് അക്ഷരങ്ങളാണ് തൊണ്ടയിൽ നിന്ന് (الحلق) ഉച്ചരിക്കുന്നത്?',
          options: [
            {
              id: 'opt1',
              text: 'ء، ه، ع، ح، غ، خ',
              textMalayalam: 'ء، ه، ع، ح، غ، خ',
              isCorrect: true,
            },
            {
              id: 'opt2',
              text: 'ق، ك، ج، ش، ي',
              textMalayalam: 'ق، ك، ج، ش، ي',
              isCorrect: false,
            },
            {
              id: 'opt3',
              text: 'ف، ب، م، و',
              textMalayalam: 'ف، ب، م، و',
              isCorrect: false,
            },
            {
              id: 'opt4',
              text: 'ط، د، ت، ص',
              textMalayalam: 'ط، د، ت، ص',
              isCorrect: false,
            },
          ],
          correctAnswer: 'opt1',
          explanation:
            'The six letters ء، ه، ع، ح، غ، خ are pronounced from different parts of the throat.',
          explanationMalayalam:
            'ആറ് അക്ഷരങ്ങൾ ء، ه، ع، ح، غ، خ തൊണ്ടയുടെ വിവിധ ഭാഗങ്ങളിൽ നിന്ന് ഉച്ചരിക്കുന്നു.',
          points: 3,
          difficulty: 'medium',
          tags: ['makharij', 'throat', 'pronunciation'],
          orderIndex: 1,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20'),
        },
        {
          id: 'q5',
          exerciseId: 'exercise-2',
          type: 'mcq',
          question: 'What is the rule for Noon Sakinah before the letter ب?',
          questionMalayalam:
            'ب അക്ഷരത്തിന് മുമ്പുള്ള നൂൻ സാകിനയുടെ നിയമം എന്താണ്?',
          options: [
            {
              id: 'opt1',
              text: 'Izhaar (Clear pronunciation)',
              textMalayalam: 'ഇഴ്ഹാർ (വ്യക്തമായ ഉച്ചാരണം)',
              isCorrect: false,
            },
            {
              id: 'opt2',
              text: 'Idghaam (Merging)',
              textMalayalam: 'ഇദ്ഗാം (ലയിപ്പിക്കൽ)',
              isCorrect: false,
            },
            {
              id: 'opt3',
              text: 'Iqlaab (Conversion to Meem)',
              textMalayalam: 'ഇഖ്ലാബ് (മീമായി മാറ്റൽ)',
              isCorrect: true,
            },
            {
              id: 'opt4',
              text: 'Ikhfaa (Concealment)',
              textMalayalam: 'ഇഖ്ഫാ (മറച്ചുവെക്കൽ)',
              isCorrect: false,
            },
          ],
          correctAnswer: 'opt3',
          explanation:
            'When Noon Sakinah or Tanween comes before ب, it is converted to Meem with ghunna (nasal sound).',
          explanationMalayalam:
            'നൂൻ സാകിന അല്ലെങ്കിൽ തൻവീൻ ب ന് മുമ്പ് വരുമ്പോൾ, അത് ഗുന്നയോടെ (നാസിക ശബ്ദം) മീമായി മാറുന്നു.',
          points: 4,
          difficulty: 'medium',
          tags: ['noon-sakinah', 'iqlaab', 'rules'],
          orderIndex: 2,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20'),
        },
      ],
      timeLimit: 20,
      passingScore: 75,
      maxAttempts: 2,
      isPublic: true,
      difficulty: 'medium',
      tags: ['tajweed', 'pronunciation', 'assessment'],
      totalPoints: 7,
      estimatedDuration: 15,
      prerequisites: [],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
  ];

  // Get all exercises with pagination and filtering
  static async getExercises(
    options?: PaginationOptions & FilterOptions
  ): Promise<ApiResponse<Exercise[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      let exercises = [...this.mockExercises];

      // Apply filters
      if (options?.noteId) {
        exercises = exercises.filter(e => e.noteId === options.noteId);
      }
      if (options?.classSessionId) {
        exercises = exercises.filter(
          e => e.classSessionId === options.classSessionId
        );
      }
      if (options?.difficulty) {
        exercises = exercises.filter(e => e.difficulty === options.difficulty);
      }
      if (options?.isPublic !== undefined) {
        exercises = exercises.filter(e => e.isPublic === options.isPublic);
      }

      // Apply sorting
      if (options?.orderBy) {
        exercises.sort((a, b) => {
          const aValue = a[options.orderBy as keyof Exercise];
          const bValue = b[options.orderBy as keyof Exercise];
          const direction = options.orderDirection === 'desc' ? -1 : 1;

          if (aValue < bValue) {
            return -1 * direction;
          }
          if (aValue > bValue) {
            return 1 * direction;
          }
          return 0;
        });
      }

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 10;
      const paginatedExercises = exercises.slice(offset, offset + limit);

      return {
        data: paginatedExercises,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch exercises',
        timestamp: new Date(),
      };
    }
  }

  // Get exercise by ID
  static async getExerciseById(
    id: string
  ): Promise<ApiResponse<Exercise | null>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const exercise = this.mockExercises.find(e => e.id === id);

      return {
        data: exercise || null,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch exercise',
        timestamp: new Date(),
      };
    }
  }

  // Start exam attempt
  static async startExamAttempt(
    exerciseId: string,
    userId: string
  ): Promise<ApiResponse<ExamAttempt>> {
    try {
      // Check if user has exceeded max attempts
      const userResults = await this.getUserResults(userId);
      const previousAttempts =
        userResults.data?.filter(r => r.exerciseId === exerciseId) || [];

      const exercise = this.mockExercises.find(e => e.id === exerciseId);
      if (!exercise) {
        return {
          data: {} as ExamAttempt,
          success: false,
          error: 'Exercise not found',
          timestamp: new Date(),
        };
      }

      if (previousAttempts.length >= exercise.maxAttempts) {
        return {
          data: {} as ExamAttempt,
          success: false,
          error: 'Maximum attempts exceeded',
          timestamp: new Date(),
        };
      }

      const attempt: ExamAttempt = {
        id: `attempt-${Date.now()}`,
        userId,
        exerciseId,
        startedAt: new Date(),
        status: 'in_progress',
        currentQuestionIndex: 0,
        answers: {},
        timeRemaining: exercise.timeLimit ? exercise.timeLimit * 60 : undefined, // Convert to seconds
        isSubmitted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await StorageService.appendToArray(this.ATTEMPTS_STORAGE_KEY, attempt);

      return {
        data: attempt,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {} as ExamAttempt,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start exam attempt',
        timestamp: new Date(),
      };
    }
  }

  // Update exam attempt
  static async updateExamAttempt(
    attemptId: string,
    updates: Partial<ExamAttempt>
  ): Promise<ApiResponse<ExamAttempt | null>> {
    try {
      const attempts = await StorageService.getArray<ExamAttempt>(
        this.ATTEMPTS_STORAGE_KEY
      );
      const attemptIndex = attempts.findIndex(a => a.id === attemptId);

      if (attemptIndex === -1) {
        return {
          data: null,
          success: false,
          error: 'Attempt not found',
          timestamp: new Date(),
        };
      }

      attempts[attemptIndex] = {
        ...attempts[attemptIndex],
        ...updates,
        updatedAt: new Date(),
      };

      await StorageService.setArray(this.ATTEMPTS_STORAGE_KEY, attempts);

      return {
        data: attempts[attemptIndex],
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update attempt',
        timestamp: new Date(),
      };
    }
  }

  // Submit exam
  static async submitExam(attemptId: string): Promise<ApiResponse<ExamResult>> {
    try {
      const attempts = await StorageService.getArray<ExamAttempt>(
        this.ATTEMPTS_STORAGE_KEY
      );
      const attempt = attempts.find(a => a.id === attemptId);

      if (!attempt) {
        return {
          data: {} as ExamResult,
          success: false,
          error: 'Attempt not found',
          timestamp: new Date(),
        };
      }

      const exercise = this.mockExercises.find(
        e => e.id === attempt.exerciseId
      );
      if (!exercise) {
        return {
          data: {} as ExamResult,
          success: false,
          error: 'Exercise not found',
          timestamp: new Date(),
        };
      }

      // Calculate results
      const detailedResults: QuestionResult[] = [];
      let earnedPoints = 0;

      exercise.questions.forEach(question => {
        const userAnswer = attempt.answers[question.id];
        const isCorrect = this.checkAnswer(question, userAnswer);
        const pointsEarned = isCorrect ? question.points : 0;

        earnedPoints += pointsEarned;

        detailedResults.push({
          questionId: question.id,
          userAnswer: userAnswer || '',
          correctAnswer: question.correctAnswer,
          isCorrect,
          pointsEarned,
          pointsPossible: question.points,
          timeSpent: 0, // Would be tracked in real implementation
        });
      });

      const score = Math.round((earnedPoints / exercise.totalPoints) * 100);
      const timeSpent = attempt.startedAt
        ? Math.floor(
            (new Date().getTime() - new Date(attempt.startedAt).getTime()) /
              1000
          )
        : 0;

      // Get attempt number
      const userResults = await this.getUserResults(attempt.userId);
      const previousAttempts =
        userResults.data?.filter(r => r.exerciseId === attempt.exerciseId) ||
        [];
      const attemptNumber = previousAttempts.length + 1;

      const result: ExamResult = {
        id: `result-${Date.now()}`,
        userId: attempt.userId,
        exerciseId: attempt.exerciseId,
        answers: attempt.answers,
        score,
        totalPoints: exercise.totalPoints,
        earnedPoints,
        timeSpent,
        completedAt: new Date(),
        startedAt: new Date(attempt.startedAt),
        attemptNumber,
        status: 'completed',
        feedback:
          score >= exercise.passingScore
            ? 'Congratulations! You passed the exam.'
            : 'You did not meet the passing score. Please review the material and try again.',
        detailedResults,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save result
      await StorageService.appendToArray(this.RESULTS_STORAGE_KEY, result);

      // Update attempt status
      await this.updateExamAttempt(attemptId, {
        status: 'completed',
        completedAt: new Date(),
        isSubmitted: true,
      });

      return {
        data: result,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {} as ExamResult,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit exam',
        timestamp: new Date(),
      };
    }
  }

  // Check if answer is correct
  private static checkAnswer(
    question: Question,
    userAnswer: string | string[]
  ): boolean {
    if (question.type === 'mcq') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'text') {
      // Simple text comparison - in real implementation, this would be more sophisticated
      const correctAnswer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0]?.toLowerCase().trim()
        : question.correctAnswer.toLowerCase().trim();
      const userAnswerStr = Array.isArray(userAnswer)
        ? userAnswer[0]
        : userAnswer;
      return userAnswerStr?.toLowerCase().trim() === correctAnswer;
    }
    return false;
  }

  // Get user's exam results
  static async getUserResults(
    userId: string
  ): Promise<ApiResponse<ExamResult[]>> {
    try {
      const allResults = await StorageService.getArray<ExamResult>(
        this.RESULTS_STORAGE_KEY
      );
      const userResults = allResults.filter(result => result.userId === userId);

      return {
        data: userResults,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user results',
        timestamp: new Date(),
      };
    }
  }

  // Get user's active attempts
  static async getUserAttempts(
    userId: string
  ): Promise<ApiResponse<ExamAttempt[]>> {
    try {
      const allAttempts = await StorageService.getArray<ExamAttempt>(
        this.ATTEMPTS_STORAGE_KEY
      );
      const userAttempts = allAttempts.filter(
        attempt => attempt.userId === userId
      );

      return {
        data: userAttempts,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user attempts',
        timestamp: new Date(),
      };
    }
  }

  // Get exercises by note
  static async getExercisesByNote(
    noteId: string
  ): Promise<ApiResponse<Exercise[]>> {
    return this.getExercises({ noteId });
  }

  // Get exercises by class
  static async getExercisesByClass(
    classSessionId: string
  ): Promise<ApiResponse<Exercise[]>> {
    return this.getExercises({ classSessionId });
  }

  // Search exercises
  static async searchExercises(
    searchOptions: SearchOptions,
    paginationOptions?: PaginationOptions
  ): Promise<ApiResponse<Exercise[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 250));

      const {
        query,
        fields = ['title', 'description', 'tags'],
        caseSensitive = false,
      } = searchOptions;
      const searchTerm = caseSensitive ? query : query.toLowerCase();

      let filteredExercises = this.mockExercises.filter(exercise => {
        return fields.some(field => {
          const fieldValue = exercise[field as keyof Exercise];
          if (Array.isArray(fieldValue)) {
            return fieldValue.some(item =>
              caseSensitive
                ? item.includes(searchTerm)
                : item.toLowerCase().includes(searchTerm)
            );
          }
          if (typeof fieldValue === 'string') {
            return caseSensitive
              ? fieldValue.includes(searchTerm)
              : fieldValue.toLowerCase().includes(searchTerm);
          }
          return false;
        });
      });

      // Apply pagination
      const offset = paginationOptions?.offset || 0;
      const limit = paginationOptions?.limit || 10;
      filteredExercises = filteredExercises.slice(offset, offset + limit);

      return {
        data: filteredExercises,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        timestamp: new Date(),
      };
    }
  }
}
