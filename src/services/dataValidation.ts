import { Recording } from '../types/recording';
import { Note } from '../types/note';
import { Exercise, Question } from '../types/exercise';
import { Attendance } from '../types/attendance';
import { User } from '../types/user';
import { ApiResponse } from '../types/common';

// Validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * Data Validation Service for ensuring data integrity
 */
export class DataValidationService {

  // Common validation rules
  private static readonly VALIDATION_RULES = {
    required: (value: any, fieldName: string): ValidationError | null => {
      if (value === null || value === undefined || value === '') {
        return {
          field: fieldName,
          message: `${fieldName} is required`,
          code: 'REQUIRED_FIELD',
          severity: 'error' as const
        };
      }
      return null;
    },

    email: (value: string, fieldName: string): ValidationError | null => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid email address`,
          code: 'INVALID_EMAIL',
          severity: 'error' as const
        };
      }
      return null;
    },

    phone: (value: string, fieldName: string): ValidationError | null => {
      if (value && !/^\+?[\d\s\-\(\)]{10,}$/.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid phone number`,
          code: 'INVALID_PHONE',
          severity: 'error' as const
        };
      }
      return null;
    },

    url: (value: string, fieldName: string): ValidationError | null => {
      if (value && !/^https?:\/\/.+/.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid URL`,
          code: 'INVALID_URL',
          severity: 'error' as const
        };
      }
      return null;
    },

    positiveNumber: (value: number, fieldName: string): ValidationError | null => {
      if (value !== undefined && value !== null && value < 0) {
        return {
          field: fieldName,
          message: `${fieldName} must be a positive number`,
          code: 'INVALID_POSITIVE_NUMBER',
          severity: 'error' as const
        };
      }
      return null;
    },

    dateRange: (startDate: Date | string, endDate: Date | string, fieldName: string): ValidationError | null => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        return {
          field: fieldName,
          message: `Start date must be before end date`,
          code: 'INVALID_DATE_RANGE',
          severity: 'error' as const
        };
      }
      return null;
    },

    arrayNotEmpty: (value: any[], fieldName: string): ValidationError | null => {
      if (Array.isArray(value) && value.length === 0) {
        return {
          field: fieldName,
          message: `${fieldName} cannot be empty`,
          code: 'EMPTY_ARRAY',
          severity: 'error' as const
        };
      }
      return null;
    }
  };

  // Validate Recording
  static validateRecording(recording: Partial<Recording>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    const requiredFields = ['id', 'classSessionId', 'title', 'videoUrl', 'duration'];
    requiredFields.forEach(field => {
      const error = this.VALIDATION_RULES.required((recording as any)[field], field);
      if (error) errors.push(error);
    });

    // URL validation
    if (recording.videoUrl) {
      const error = this.VALIDATION_RULES.url(recording.videoUrl, 'videoUrl');
      if (error) errors.push(error);
    }

    if (recording.thumbnailUrl) {
      const error = this.VALIDATION_RULES.url(recording.thumbnailUrl, 'thumbnailUrl');
      if (error) errors.push(error);
    }

    // Positive numbers
    if (recording.duration !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(recording.duration, 'duration');
      if (error) errors.push(error);
    }

    if (recording.fileSize !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(recording.fileSize, 'fileSize');
      if (error) errors.push(error);
    }

    // Warnings
    if (recording.duration && recording.duration > 7200) { // 2 hours
      warnings.push({
        field: 'duration',
        message: 'Recording duration is unusually long (over 2 hours)',
        code: 'LONG_DURATION'
      });
    }

    if (recording.fileSize && recording.fileSize > 1073741824) { // 1GB
      warnings.push({
        field: 'fileSize',
        message: 'Recording file size is very large (over 1GB)',
        code: 'LARGE_FILE_SIZE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate Note
  static validateNote(note: Partial<Note>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    const requiredFields = ['id', 'classSessionId', 'title', 'content', 'author', 'subject'];
    requiredFields.forEach(field => {
      const error = this.VALIDATION_RULES.required((note as any)[field], field);
      if (error) errors.push(error);
    });

    // URL validation
    if (note.pdfUrl) {
      const error = this.VALIDATION_RULES.url(note.pdfUrl, 'pdfUrl');
      if (error) errors.push(error);
    }

    // Array validation
    if (note.imageUrls) {
      note.imageUrls.forEach((url, index) => {
        const error = this.VALIDATION_RULES.url(url, `imageUrls[${index}]`);
        if (error) errors.push(error);
      });
    }

    // Positive numbers
    if (note.fileSize !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(note.fileSize, 'fileSize');
      if (error) errors.push(error);
    }

    if (note.pageCount !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(note.pageCount, 'pageCount');
      if (error) errors.push(error);
    }

    // Content length warning
    if (note.content && note.content.length < 100) {
      warnings.push({
        field: 'content',
        message: 'Note content is quite short (less than 100 characters)',
        code: 'SHORT_CONTENT'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate Exercise
  static validateExercise(exercise: Partial<Exercise>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    const requiredFields = ['id', 'title', 'description', 'questions', 'passingScore', 'maxAttempts'];
    requiredFields.forEach(field => {
      const error = this.VALIDATION_RULES.required((exercise as any)[field], field);
      if (error) errors.push(error);
    });

    // Questions validation
    if (exercise.questions) {
      const questionsError = this.VALIDATION_RULES.arrayNotEmpty(exercise.questions, 'questions');
      if (questionsError) errors.push(questionsError);

      exercise.questions.forEach((question, index) => {
        const questionErrors = this.validateQuestion(question, `questions[${index}]`);
        errors.push(...questionErrors);
      });
    }

    // Positive numbers
    if (exercise.passingScore !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(exercise.passingScore, 'passingScore');
      if (error) errors.push(error);
      
      if (exercise.passingScore > 100) {
        errors.push({
          field: 'passingScore',
          message: 'Passing score cannot exceed 100%',
          code: 'INVALID_PASSING_SCORE',
          severity: 'error'
        });
      }
    }

    if (exercise.maxAttempts !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(exercise.maxAttempts, 'maxAttempts');
      if (error) errors.push(error);
    }

    if (exercise.timeLimit !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(exercise.timeLimit, 'timeLimit');
      if (error) errors.push(error);
    }

    // Warnings
    if (exercise.timeLimit && exercise.timeLimit > 180) { // 3 hours
      warnings.push({
        field: 'timeLimit',
        message: 'Exercise time limit is very long (over 3 hours)',
        code: 'LONG_TIME_LIMIT'
      });
    }

    if (exercise.questions && exercise.questions.length > 50) {
      warnings.push({
        field: 'questions',
        message: 'Exercise has many questions (over 50), consider splitting',
        code: 'MANY_QUESTIONS'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate Question
  private static validateQuestion(question: Partial<Question>, fieldPrefix: string = ''): ValidationError[] {
    const errors: ValidationError[] = [];
    const prefix = fieldPrefix ? `${fieldPrefix}.` : '';

    // Required fields
    const requiredFields = ['id', 'type', 'question', 'correctAnswer', 'points'];
    requiredFields.forEach(field => {
      const error = this.VALIDATION_RULES.required((question as any)[field], `${prefix}${field}`);
      if (error) errors.push(error);
    });

    // MCQ specific validation
    if (question.type === 'mcq') {
      if (!question.options || question.options.length < 2) {
        errors.push({
          field: `${prefix}options`,
          message: 'MCQ questions must have at least 2 options',
          code: 'INSUFFICIENT_OPTIONS',
          severity: 'error'
        });
      }

      if (question.options) {
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          errors.push({
            field: `${prefix}options`,
            message: 'MCQ questions must have at least one correct option',
            code: 'NO_CORRECT_OPTION',
            severity: 'error'
          });
        }
      }
    }

    // Points validation
    if (question.points !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(question.points, `${prefix}points`);
      if (error) errors.push(error);
    }

    return errors;
  }

  // Validate Attendance
  static validateAttendance(attendance: Partial<Attendance>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    const requiredFields = ['id', 'userId', 'classSessionId', 'joinedAt', 'isPresent'];
    requiredFields.forEach(field => {
      const error = this.VALIDATION_RULES.required((attendance as any)[field], field);
      if (error) errors.push(error);
    });

    // Date validation
    if (attendance.joinedAt && attendance.leftAt) {
      const error = this.VALIDATION_RULES.dateRange(attendance.joinedAt, attendance.leftAt, 'attendance period');
      if (error) errors.push(error);
    }

    // Duration validation
    if (attendance.duration !== undefined) {
      const error = this.VALIDATION_RULES.positiveNumber(attendance.duration, 'duration');
      if (error) errors.push(error);
    }

    // Logical validation
    if (attendance.isPresent === false && attendance.duration && attendance.duration > 0) {
      warnings.push({
        field: 'duration',
        message: 'Attendance marked as absent but has positive duration',
        code: 'INCONSISTENT_ATTENDANCE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate User
  static validateUser(user: Partial<User>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    const requiredFields = ['uid', 'displayName', 'role'];
    requiredFields.forEach(field => {
      const error = this.VALIDATION_RULES.required((user as any)[field], field);
      if (error) errors.push(error);
    });

    // Email validation
    if (user.email) {
      const error = this.VALIDATION_RULES.email(user.email, 'email');
      if (error) errors.push(error);
    }

    // Phone validation
    if (user.phone) {
      const error = this.VALIDATION_RULES.phone(user.phone, 'phone');
      if (error) errors.push(error);
    }

    // At least one contact method
    if (!user.email && !user.phone) {
      errors.push({
        field: 'contact',
        message: 'User must have either email or phone number',
        code: 'NO_CONTACT_METHOD',
        severity: 'error'
      });
    }

    // Profile picture URL
    if (user.profilePictureUrl) {
      const error = this.VALIDATION_RULES.url(user.profilePictureUrl, 'profilePictureUrl');
      if (error) errors.push(error);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate collection data
  static validateCollection<T>(
    items: T[],
    validator: (item: T) => ValidationResult
  ): ApiResponse<{
    validItems: T[];
    invalidItems: { item: T; validation: ValidationResult }[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      warnings: number;
    };
  }> {
    try {
      const validItems: T[] = [];
      const invalidItems: { item: T; validation: ValidationResult }[] = [];
      let totalWarnings = 0;

      items.forEach(item => {
        const validation = validator(item);
        
        if (validation.isValid) {
          validItems.push(item);
        } else {
          invalidItems.push({ item, validation });
        }
        
        totalWarnings += validation.warnings.length;
      });

      const summary = {
        total: items.length,
        valid: validItems.length,
        invalid: invalidItems.length,
        warnings: totalWarnings
      };

      return {
        data: {
          validItems,
          invalidItems,
          summary
        },
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: {
          validItems: [],
          invalidItems: [],
          summary: { total: 0, valid: 0, invalid: 0, warnings: 0 }
        },
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        timestamp: new Date()
      };
    }
  }

  // Sanitize data (remove/fix common issues)
  static sanitizeData<T extends Record<string, any>>(data: T): T {
    const sanitized = { ...data };

    // Trim string values
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    // Convert date strings to Date objects
    const dateFields = ['createdAt', 'updatedAt', 'joinedAt', 'leftAt', 'scheduledAt', 'completedAt'];
    dateFields.forEach(field => {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        try {
          sanitized[field] = new Date(sanitized[field]);
        } catch {
          // Keep original value if conversion fails
        }
      }
    });

    // Remove null/undefined values from arrays
    Object.keys(sanitized).forEach(key => {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].filter((item: any) => item !== null && item !== undefined);
      }
    });

    return sanitized;
  }

  // Get validation summary for multiple items
  static getValidationSummary(validationResults: ValidationResult[]): {
    totalItems: number;
    validItems: number;
    invalidItems: number;
    totalErrors: number;
    totalWarnings: number;
    commonErrors: { code: string; count: number; message: string }[];
  } {
    const totalItems = validationResults.length;
    const validItems = validationResults.filter(r => r.isValid).length;
    const invalidItems = totalItems - validItems;
    
    const allErrors = validationResults.flatMap(r => r.errors);
    const totalErrors = allErrors.length;
    const totalWarnings = validationResults.flatMap(r => r.warnings).length;

    // Count common errors
    const errorCounts: Record<string, { count: number; message: string }> = {};
    allErrors.forEach(error => {
      if (!errorCounts[error.code]) {
        errorCounts[error.code] = { count: 0, message: error.message };
      }
      errorCounts[error.code].count++;
    });

    const commonErrors = Object.entries(errorCounts)
      .map(([code, data]) => ({ code, count: data.count, message: data.message }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 most common errors

    return {
      totalItems,
      validItems,
      invalidItems,
      totalErrors,
      totalWarnings,
      commonErrors
    };
  }
}