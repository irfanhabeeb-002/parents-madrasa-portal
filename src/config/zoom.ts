import type { ZoomInitConfig, ZoomAuthConfig } from '../types/zoom';

/**
 * Zoom SDK Configuration
 * These settings control the behavior and appearance of the Zoom Meeting SDK
 */
export const ZOOM_SDK_CONFIG: ZoomInitConfig = {
  // Development settings
  debug: process.env.NODE_ENV === 'development',

  // Meeting behavior
  leaveOnPageUnload: true,
  showMeetingHeader: false, // Hide meeting header for cleaner UI
  disableInvite: true, // Disable invite functionality for students
  disableCallOut: true, // Disable call out functionality
  disableRecord: true, // Students cannot record
  disableJoinAudio: false, // Allow audio joining
  audioPanelAlwaysOpen: false,
  showPureSharingContent: false,

  // Feature availability
  isSupportAV: true, // Audio/Video support
  isSupportChat: true, // Chat support
  isSupportQA: false, // Disable Q&A for simplicity
  isSupportCC: false, // Disable closed captions
  screenShare: false, // Students cannot share screen
  videoDrag: false,
  sharingMode: 'host', // Only host can share
  videoHeader: false,

  // UI customization
  isShowJoiningErrorDialog: true,
  disablePreview: false, // Allow camera/mic preview
  disableSetting: true, // Disable settings for students
  disableShareAudioVideo: true, // Students cannot share audio/video
  disableReport: true, // Disable reporting
  disableVoIP: false, // Allow VoIP
  disablePhoneAudio: false, // Allow phone audio

  // Meeting info to display
  meetingInfo: [
    'topic',
    'host',
    'mn', // Meeting number
    'pwd', // Password
    'participant',
  ],
  meetingInfoDescription: 'Parents Madrasa Portal - Live Class',
};

/**
 * Zoom Authentication Configuration
 * Note: In production, API secrets should be stored securely on the server
 */
export const getZoomAuthConfig = (): ZoomAuthConfig => {
  return {
    apiKey: process.env.VITE_ZOOM_API_KEY || '',
    apiSecret: process.env.VITE_ZOOM_API_SECRET || '',
    accountId: process.env.VITE_ZOOM_ACCOUNT_ID || '',
    clientId: process.env.VITE_ZOOM_CLIENT_ID || '',
    clientSecret: process.env.VITE_ZOOM_CLIENT_SECRET || '',
    redirectUrl:
      process.env.VITE_ZOOM_REDIRECT_URL ||
      `${window.location.origin}/auth/zoom/callback`,
  };
};

/**
 * Zoom Meeting SDK Container Configuration
 */
export const ZOOM_MEETING_CONTAINER = {
  // Container element ID where Zoom meeting will be embedded
  containerId: 'zoom-meeting-container',

  // Container styling
  containerStyle: {
    width: '100%',
    height: '100vh',
    minHeight: '400px',
    backgroundColor: '#000000',
    borderRadius: '8px',
    overflow: 'hidden',
  },
};

/**
 * Zoom Error Messages in English and Malayalam
 */
export const ZOOM_ERROR_MESSAGES = {
  INITIALIZATION_FAILED: {
    en: 'Failed to initialize Zoom. Please refresh and try again.',
    ml: 'സൂം ആരംഭിക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി പുതുക്കി വീണ്ടും ശ്രമിക്കുക.',
  },
  JOIN_FAILED: {
    en: 'Failed to join the meeting. Please check your internet connection.',
    ml: 'മീറ്റിംഗിൽ ചേരുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.',
  },
  INVALID_MEETING_ID: {
    en: 'Invalid meeting ID or password. Please contact your teacher.',
    ml: 'അസാധുവായ മീറ്റിംഗ് ഐഡി അല്ലെങ്കിൽ പാസ്‌വേഡ്. ദയവായി നിങ്ങളുടെ അധ്യാപകനെ ബന്ധപ്പെടുക.',
  },
  NETWORK_ERROR: {
    en: 'Network connection error. Please check your internet and try again.',
    ml: 'നെറ്റ്‌വർക്ക് കണക്ഷൻ പിശക്. ദയവായി നിങ്ങളുടെ ഇന്റർനെറ്റ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.',
  },
  MEETING_ENDED: {
    en: 'The meeting has ended.',
    ml: 'മീറ്റിംഗ് അവസാനിച്ചു.',
  },
  PERMISSION_DENIED: {
    en: 'Camera or microphone permission denied. Please allow access and refresh.',
    ml: 'ക്യാമറ അല്ലെങ്കിൽ മൈക്രോഫോൺ അനുമതി നിഷേധിച്ചു. ദയവായി ആക്‌സസ് അനുവദിച്ച് പുതുക്കുക.',
  },
};

/**
 * Default Zoom Meeting Settings for Students
 */
export const STUDENT_MEETING_SETTINGS = {
  role: 0 as const, // Attendee role
  muteOnEntry: true,
  videoOnEntry: false,
  allowUnmute: false, // Teacher controls unmuting
  allowVideo: true,
  allowChat: true,
  allowScreenShare: false,
  allowRecord: false,
};

/**
 * Zoom Meeting Status Messages
 */
export const MEETING_STATUS_MESSAGES = {
  connecting: {
    en: 'Connecting to meeting...',
    ml: 'മീറ്റിംഗിലേക്ക് കണക്റ്റ് ചെയ്യുന്നു...',
  },
  connected: {
    en: 'Connected to meeting',
    ml: 'മീറ്റിംഗിലേക്ക് കണക്റ്റ് ചെയ്തു',
  },
  disconnecting: {
    en: 'Leaving meeting...',
    ml: 'മീറ്റിംഗിൽ നിന്ന് പുറത്തുകടക്കുന്നു...',
  },
  disconnected: {
    en: 'Disconnected from meeting',
    ml: 'മീറ്റിംഗിൽ നിന്ന് വിച്ഛേദിച്ചു',
  },
  reconnecting: {
    en: 'Reconnecting to meeting...',
    ml: 'മീറ്റിംഗിലേക്ക് വീണ്ടും കണക്റ്റ് ചെയ്യുന്നു...',
  },
  failed: {
    en: 'Failed to connect to meeting',
    ml: 'മീറ്റിംഗിലേക്ക് കണക്റ്റ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു',
  },
};

/**
 * Zoom Recording Settings
 */
export const RECORDING_SETTINGS = {
  autoDownload: false,
  quality: 'high' as const,
  format: 'mp4' as const,
  includeChat: true,
  includeTranscript: false, // Disable for privacy
};

/**
 * Attendance Tracking Settings
 */
export const ATTENDANCE_SETTINGS = {
  trackJoinTime: true,
  trackLeaveTime: true,
  trackDuration: true,
  minimumDuration: 300, // 5 minutes minimum to count as attended
  trackAttentionScore: false, // Disable attention tracking for privacy
  autoSubmit: true, // Automatically submit attendance when leaving
};
