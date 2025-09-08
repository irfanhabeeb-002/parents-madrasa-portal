import { BaseEntity, Timestamp } from './common';

export interface ClassSession extends BaseEntity {
  title: string;
  description: string;
  subject: string;
  instructor: string;
  scheduledAt: Date | Timestamp;
  duration: number; // in minutes
  zoomMeetingId: string;
  zoomJoinUrl: string;
  zoomPassword?: string;
  isLive: boolean;
  isRecorded: boolean;
  recordingUrl?: string;
  thumbnailUrl?: string;
  maxParticipants?: number;
  tags: string[];
  materials: ClassMaterial[];
  status: ClassStatus;
}

export interface ClassMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'link';
  url: string;
  size?: number; // in bytes
  description?: string;
}

export type ClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface ClassSchedule {
  id: string;
  userId: string;
  classSessionId: string;
  isEnrolled: boolean;
  enrolledAt: Date | Timestamp;
  reminderSent: boolean;
}