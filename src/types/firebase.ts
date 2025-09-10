import { Timestamp } from 'firebase/firestore';

// Firebase User interface extending the existing User type
export interface FirebaseUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  role: 'parent' | 'student';
}

// Firebase-specific data models with Timestamp
export interface FirebaseClassSession {
  id: string;
  title: string;
  description: string;
  subject: string;
  instructor: string;
  scheduledAt: Timestamp;
  duration?: number;
  zoomMeetingId: string;
  zoomJoinUrl: string;
  zoomPassword?: string;
  recordingUrl?: string;
  isLive: boolean;
  isRecorded?: boolean;
  status: 'scheduled' | 'live' | 'ended' | 'completed' | 'cancelled';
  reminderSent: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
  tags?: string[];
  materials?: any[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseRecording {
  id: string;
  classSessionId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  fileSize?: number; // in bytes
  quality?: 'low' | 'medium' | 'high' | 'hd';
  format?: 'mp4' | 'webm' | 'mov';
  isProcessed?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  viewCount?: number;
  downloadCount?: number;
  tags?: string[];
  chapters?: any[];
  captions?: any[];
  metadata?: Record<string, any>;
  uploadedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirebaseNote {
  id: string;
  classSessionId: string;
  title: string;
  content: string;
  pdfUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseExercise {
  id: string;
  noteId: string;
  title: string;
  description: string;
  questions: FirebaseQuestion[];
  timeLimit?: number;
  passingScore: number;
  type: 'practice' | 'exam';
  progressTracking: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseQuestion {
  id: string;
  type: 'mcq' | 'text';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

export interface FirebaseExamResult {
  id: string;
  userId: string;
  exerciseId: string;
  answers: Record<string, string>;
  score: number;
  totalPoints: number;
  percentage: number;
  completedAt: Timestamp;
  timeSpent: number; // in seconds
}

export interface FirebaseAttendance {
  id: string;
  userId: string;
  classSessionId: string;
  joinedAt: Timestamp;
  leftAt?: Timestamp;
  duration: number; // in seconds
  status: 'present' | 'absent' | 'late';
  autoTracked: boolean;
  createdAt: Timestamp;
}

export interface FirebaseAnnouncement {
  id: string;
  title: string;
  message: string;
  malayalamMessage?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  isActive: boolean;
}

export interface FirebaseNotification {
  id: string;
  userId: string;
  type: 'class_reminder' | 'new_recording' | 'new_notes' | 'exam_reminder';
  title: string;
  message: string;
  malayalamMessage?: string;
  data?: Record<string, any>;
  read: boolean;
  scheduledFor?: Timestamp;
  createdAt: Timestamp;
}

export interface FirebaseUserPreferences {
  userId: string;
  language: 'english' | 'malayalam' | 'both';
  fontSize: 'small' | 'medium' | 'large';
  notifications: {
    classReminders: boolean;
    newContent: boolean;
    examReminders: boolean;
    pushNotifications: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
  };
  updatedAt: Timestamp;
}

// Firebase error types
export interface FirebaseError {
  code: string;
  message: string;
  malayalamMessage?: string;
  retryable: boolean;
}

// Firebase collection names
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  RECORDINGS: 'recordings',
  NOTES: 'notes',
  EXERCISES: 'exercises',
  EXAM_RESULTS: 'examResults',
  ATTENDANCE: 'attendance',
  ANNOUNCEMENTS: 'announcements',
  NOTIFICATIONS: 'notifications',
  USER_PREFERENCES: 'userPreferences',
} as const;

// Firebase converter utility type
export type FirebaseConverter<T> = {
  toFirestore: (data: T) => Record<string, any>;
  fromFirestore: (snapshot: any) => T;
};