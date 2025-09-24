import type { BaseEntity, Timestamp } from './common';

// Zoom Meeting SDK Types
export interface ZoomMeetingConfig {
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail?: string;
  signature: string;
  apiKey: string;
  role: ZoomRole;
  leaveUrl?: string;
  success?: (result: any) => void;
  error?: (error: ZoomError) => void;
}

export interface ZoomInitConfig {
  debug: boolean;
  leaveOnPageUnload: boolean;
  showMeetingHeader: boolean;
  disableInvite: boolean;
  disableCallOut: boolean;
  disableRecord: boolean;
  disableJoinAudio: boolean;
  audioPanelAlwaysOpen: boolean;
  showPureSharingContent: boolean;
  isSupportAV: boolean;
  isSupportChat: boolean;
  isSupportQA: boolean;
  isSupportCC: boolean;
  screenShare: boolean;
  rwcBackup?: string;
  videoDrag: boolean;
  sharingMode: 'both' | 'host' | 'attendee';
  videoHeader: boolean;
  isShowJoiningErrorDialog: boolean;
  disablePreview: boolean;
  disableSetting: boolean;
  disableShareAudioVideo: boolean;
  meetingInfo: string[];
  disableReport: boolean;
  meetingInfoDescription: string;
  disableVoIP: boolean;
  disablePhoneAudio: boolean;
}

export interface ZoomMeetingInfo {
  meetingId: string;
  meetingNumber: string;
  meetingTopic: string;
  password?: string;
  hostId: string;
  hostName: string;
  startTime: Date | Timestamp;
  duration: number; // in minutes
  timezone: string;
  joinUrl: string;
  status: ZoomMeetingStatus;
  participants: ZoomParticipant[];
  settings: ZoomMeetingSettings;
}

export interface ZoomParticipant {
  userId: string;
  userName: string;
  email?: string;
  joinTime: Date | Timestamp;
  leaveTime?: Date | Timestamp;
  duration: number; // in seconds
  role: ZoomRole;
  isHost: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  isInWaitingRoom: boolean;
}

export interface ZoomMeetingSettings {
  hostVideo: boolean;
  participantVideo: boolean;
  cnMeeting: boolean;
  inMeeting: boolean;
  joinBeforeHost: boolean;
  muteUponEntry: boolean;
  watermark: boolean;
  usePmi: boolean;
  approvalType: number;
  registrationType: number;
  audio: 'both' | 'telephony' | 'voip';
  autoRecording: 'local' | 'cloud' | 'none';
  enforceLogin: boolean;
  enforceLoginDomains?: string;
  alternativeHosts?: string;
  closeRegistration: boolean;
  showShareButton: boolean;
  allowMultipleDevices: boolean;
  requestPermissionToUnmuteParticipants: boolean;
  showJoinInfo: boolean;
  deviceTesting: boolean;
  focusMode: boolean;
  enableDedicatedGalleryView: boolean;
  privateChat: boolean;
  autoSaveChat: boolean;
  entryExitChime: 'host' | 'all' | 'none';
  recordPlayOwnVoice: boolean;
  enableLiveStream: boolean;
}

export interface ZoomRecordingInfo extends BaseEntity {
  meetingId: string;
  meetingUuid: string;
  accountId: string;
  hostId: string;
  topic: string;
  startTime: Date | Timestamp;
  duration: number; // in minutes
  totalSize: number; // in bytes
  recordingCount: number;
  shareUrl: string;
  recordingFiles: ZoomRecordingFile[];
  downloadAccessToken?: string;
  password?: string;
}

export interface ZoomRecordingFile {
  id: string;
  meetingId: string;
  recordingStart: Date | Timestamp;
  recordingEnd: Date | Timestamp;
  fileType: ZoomRecordingFileType;
  fileExtension: string;
  fileSize: number; // in bytes
  playUrl: string;
  downloadUrl: string;
  status: ZoomRecordingStatus;
  recordingType: ZoomRecordingType;
}

export interface ZoomError {
  type: string;
  reason: string;
  errorCode: number;
  errorMessage: string;
}

export interface ZoomAuthConfig {
  apiKey: string;
  apiSecret: string;
  accountId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUrl?: string;
}

export interface ZoomWebhookEvent {
  event: ZoomWebhookEventType;
  payload: {
    account_id: string;
    object: {
      uuid: string;
      id: string;
      host_id: string;
      topic: string;
      type: number;
      start_time: string;
      duration: number;
      timezone: string;
      participant?: {
        user_id: string;
        user_name: string;
        id: string;
        join_time: string;
        leave_time?: string;
      };
    };
  };
}

// Enums and Union Types
export type ZoomRole = 0 | 1; // 0 = attendee, 1 = host
export type ZoomMeetingStatus = 'waiting' | 'started' | 'ended' | 'cancelled';
export type ZoomRecordingFileType =
  | 'MP4'
  | 'M4A'
  | 'TIMELINE'
  | 'TRANSCRIPT'
  | 'CHAT'
  | 'CC'
  | 'CSV';
export type ZoomRecordingStatus = 'completed' | 'processing' | 'failed';
export type ZoomRecordingType =
  | 'shared_screen_with_speaker_view'
  | 'shared_screen_with_gallery_view'
  | 'speaker_view'
  | 'gallery_view'
  | 'shared_screen'
  | 'audio_only'
  | 'audio_transcript'
  | 'chat_file'
  | 'active_speaker'
  | 'poll'
  | 'timeline'
  | 'closed_caption';

export type ZoomWebhookEventType =
  | 'meeting.started'
  | 'meeting.ended'
  | 'meeting.participant_joined'
  | 'meeting.participant_left'
  | 'recording.completed'
  | 'recording.transcript_completed';

// Zoom SDK Event Types
export interface ZoomSDKEvents {
  onMeetingStatus: (status: ZoomMeetingSDKStatus) => void;
  onConnectionChange: (payload: { state: string; reason: string }) => void;
  onUserJoin: (payload: { users: ZoomParticipant[] }) => void;
  onUserLeave: (payload: { users: ZoomParticipant[] }) => void;
  onUserUpdate: (payload: { users: ZoomParticipant[] }) => void;
  onHostChange: (payload: { userId: string }) => void;
  onMeetingEnd: (payload: { reason: string }) => void;
  onRecordingStart: () => void;
  onRecordingEnd: () => void;
  onError: (error: ZoomError) => void;
}

export type ZoomMeetingSDKStatus =
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'reconnecting'
  | 'failed';

// Attendance Tracking Integration
export interface ZoomAttendanceRecord {
  meetingId: string;
  meetingUuid: string;
  userId: string;
  userName: string;
  userEmail?: string;
  joinTime: Date | Timestamp;
  leaveTime?: Date | Timestamp;
  duration: number; // in seconds
  attentionScore?: number; // 0-100, if available
  isHost: boolean;
  deviceType: 'desktop' | 'mobile' | 'web';
  ipAddress?: string;
  location?: string;
}

// Service Response Types
export interface ZoomServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ZoomError;
  message?: string;
}

export interface ZoomMeetingListResponse {
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
  meetings: ZoomMeetingInfo[];
}

export interface ZoomRecordingListResponse {
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
  meetings: ZoomRecordingInfo[];
}
