import { BaseEntity, UserRole, Timestamp } from './common';

export interface User extends BaseEntity {
  uid: string;
  email?: string;
  phone?: string;
  displayName: string;
  role: UserRole;
  profilePictureUrl?: string;
  preferences: UserPreferences;
  lastLoginAt?: Date | Timestamp;
  isActive: boolean;
}

export interface UserPreferences {
  language: 'en' | 'ml';
  fontSize: 'small' | 'medium' | 'large';
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationPreferences {
  classReminders: boolean;
  newRecordings: boolean;
  newNotes: boolean;
  examReminders: boolean;
  announcements: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Legacy interface for backward compatibility
export interface LegacyUser {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}