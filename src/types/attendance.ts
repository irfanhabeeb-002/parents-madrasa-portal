import type { BaseEntity, Timestamp } from './common';

export interface Attendance extends BaseEntity {
  userId: string;
  classSessionId: string;
  joinedAt: Date | Timestamp;
  leftAt?: Date | Timestamp;
  duration: number; // in seconds
  isPresent: boolean;
  attendanceType: AttendanceType;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  notes?: string;
  verificationMethod: VerificationMethod;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  month: number; // 1-12
  year: number;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  attendanceDetails: DailyAttendance[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface DailyAttendance {
  date: string; // YYYY-MM-DD format
  classSessionId?: string;
  status: AttendanceStatus;
  duration?: number; // in seconds
  joinedAt?: Date | Timestamp;
  leftAt?: Date | Timestamp;
  notes?: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  screenResolution: string;
  timezone: string;
}

export type AttendanceType = 'manual' | 'automatic' | 'zoom_integration';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type VerificationMethod = 'zoom_join' | 'manual_checkin' | 'qr_code' | 'geolocation';

export interface AttendanceStats {
  userId: string;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  consecutiveDaysPresent: number;
  longestStreak: number;
  averageDuration: number; // in seconds
  lastAttendedClass?: Date | Timestamp;
  monthlyStats: MonthlyAttendanceStats[];
}

export interface MonthlyAttendanceStats {
  month: number;
  year: number;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  daysPresent: number;
  daysAbsent: number;
}