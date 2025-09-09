// Common types and interfaces used across the application

export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

export interface BaseEntity {
  id: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchOptions {
  query: string;
  fields?: string[];
  caseSensitive?: boolean;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
  forceRefresh?: boolean;
}


export type AnnouncementType = 'general' | 'class' | 'exam' | 'holiday';
export type UserRole = 'student' | 'parent' | 'admin';
export type QuestionType = 'mcq' | 'text' | 'boolean';
export type ExamStatus = 'scheduled' | 'in_progress' | 'completed' | 'expired';