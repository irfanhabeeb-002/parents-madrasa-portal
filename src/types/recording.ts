import { BaseEntity, Timestamp } from './common';

export interface Recording extends BaseEntity {
  classSessionId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  quality: VideoQuality;
  format: VideoFormat;
  isProcessed: boolean;
  processingStatus: ProcessingStatus;
  viewCount: number;
  downloadCount: number;
  tags: string[];
  chapters: RecordingChapter[];
  captions?: RecordingCaption[];
  metadata: RecordingMetadata;
}

export interface RecordingChapter {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  description?: string;
}

export interface RecordingCaption {
  id: string;
  language: 'en' | 'ml';
  url: string;
  format: 'vtt' | 'srt';
}

export interface RecordingMetadata {
  resolution: string; // e.g., "1920x1080"
  bitrate: number; // in kbps
  fps: number;
  codec: string;
  uploadedBy: string;
  originalFileName?: string;
  zoomRecordingId?: string;
}

export type VideoQuality = 'low' | 'medium' | 'high' | 'hd';
export type VideoFormat = 'mp4' | 'webm' | 'mov';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RecordingView {
  id: string;
  recordingId: string;
  userId: string;
  viewedAt: Date | Timestamp;
  duration: number; // how long they watched in seconds
  completed: boolean;
  lastPosition: number; // last watched position in seconds
}