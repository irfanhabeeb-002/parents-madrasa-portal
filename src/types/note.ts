import type { BaseEntity, Timestamp } from './common';

export interface Note extends BaseEntity {
  classSessionId: string;
  title: string;
  content: string;
  summary?: string;
  pdfUrl?: string;
  imageUrls: string[];
  author: string;
  subject: string;
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  fileSize?: number; // in bytes for PDF
  pageCount?: number; // for PDF documents
  language: 'en' | 'ml' | 'both';
  difficulty: NoteDifficulty;
  attachments: NoteAttachment[];
}

export interface NoteAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document';
  url: string;
  size: number; // in bytes
  mimeType: string;
  description?: string;
}

export type NoteDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface NoteView {
  id: string;
  noteId: string;
  userId: string;
  viewedAt: Date | Timestamp;
  duration: number; // how long they viewed in seconds
  pagesViewed?: number[]; // for PDF notes
  downloaded: boolean;
}

export interface NoteBookmark {
  id: string;
  noteId: string;
  userId: string;
  bookmarkedAt: Date | Timestamp;
  notes?: string; // user's personal notes
}