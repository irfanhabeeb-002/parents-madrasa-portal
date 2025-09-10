# Zoom Integration Guide

## Overview

This guide covers the complete Zoom Meeting SDK integration for the Parents Madrasa Portal. The integration provides seamless meeting joining, attendance tracking, and recording management capabilities.

## 🚀 Features Implemented

### ✅ Task 8.1: Zoom SDK and Authentication Setup

- **Zoom Meeting SDK Integration**: Full integration with `@zoom/meetingsdk`
- **TypeScript Support**: Comprehensive type definitions for all Zoom functionality
- **Authentication System**: JWT signature generation and API key management
- **Error Handling**: Robust error handling with multilingual messages
- **Configuration Management**: Centralized configuration for all Zoom settings

## 📁 File Structure

```
src/
├── components/zoom/
│   ├── ZoomMeeting.tsx          # Main Zoom meeting component
│   └── index.ts                 # Component exports
├── config/
│   └── zoom.ts                  # Zoom SDK configuration
├── hooks/
│   └── useZoom.ts               # React hook for Zoom functionality
├── services/
│   └── zoomService.ts           # Zoom service class
└── types/
    └── zoom.ts                  # TypeScript type definitions
```

## 🔧 Setup Instructions

### 1. Install Dependencies

The Zoom Meeting SDK is already installed:

```bash
npm install @zoom/meetingsdk
```

### 2. Environment Configuration

Add your Zoom credentials to `.env`:

```env
# Zoom Configuration
VITE_ZOOM_API_KEY=your_zoom_api_key_here
VITE_ZOOM_API_SECRET=your_zoom_api_secret_here
VITE_ZOOM_ACCOUNT_ID=your_zoom_account_id_here
VITE_ZOOM_CLIENT_ID=your_zoom_client_id_here
VITE_ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
VITE_ZOOM_REDIRECT_URL=http://localhost:5173/auth/zoom/callback
```

### 3. Zoom App Setup

1. **Create a Zoom App**:
   - Go to [Zoom Marketplace](https://marketplace.zoom.us/)
   - Create a new "Meeting SDK" app
   - Get your API Key and Secret

2. **Configure App Settings**:
   - Set redirect URL to your domain
   - Enable required scopes (meeting:write, meeting:read)
   - Configure webhook endpoints if needed

## 🎯 Usage Examples

### Basic Meeting Component

```tsx
import { ZoomMeeting } from '../components/zoom';
import { useAuth } from '../contexts/AuthContext';

function LiveClassPage() {
  const { user } = useAuth();
  
  const classSession = {
    id: '1',
    title: 'Arabic Grammar Class',
    instructor: 'Teacher Ahmad',
    zoomMeetingId: '123456789',
    zoomPassword: 'password123',
    scheduledAt: new Date(),
    duration: 60,
    isLive: true,
    status: 'live' as const
  };

  return (
    <div className="p-4">
      <ZoomMeeting
        classSession={classSession}
        userName={user?.displayName || 'Student'}
        userEmail={user?.email}
        onMeetingStart={() => console.log('Meeting started')}
        onMeetingEnd={() => console.log('Meeting ended')}
        onAttendanceTracked={(duration) => console.log('Attended for:', duration, 'seconds')}
      />
    </div>
  );
}
```

### Using the Zoom Hook

```tsx
import { useZoom } from '../hooks/useZoom';

function CustomMeetingComponent() {
  const {
    isInitialized,
    isJoining,
    isInMeeting,
    error,
    joinMeeting,
    leaveMeeting
  } = useZoom({
    autoInitialize: true,
    trackAttendance: true,
    onError: (error) => console.error('Zoom error:', error)
  });

  const handleJoin = async () => {
    await joinMeeting({
      meetingNumber: '123456789',
      password: 'password123',
      userName: 'Student Name',
      apiKey: process.env.VITE_ZOOM_API_KEY!
    });
  };

  return (
    <div>
      {error && <div className="error">{error.errorMessage}</div>}
      
      {!isInMeeting ? (
        <button onClick={handleJoin} disabled={isJoining}>
          {isJoining ? 'Joining...' : 'Join Meeting'}
        </button>
      ) : (
        <button onClick={leaveMeeting}>Leave Meeting</button>
      )}
    </div>
  );
}
```

### Direct Service Usage

```tsx
import { zoomService } from '../services/zoomService';
import { ZOOM_SDK_CONFIG } from '../config/zoom';

// Initialize Zoom SDK
const initializeZoom = async () => {
  const result = await zoomService.initialize(ZOOM_SDK_CONFIG);
  if (result.success) {
    console.log('Zoom SDK initialized');
  } else {
    console.error('Failed to initialize:', result.error);
  }
};

// Join a meeting
const joinMeeting = async () => {
  const result = await zoomService.joinMeeting({
    meetingNumber: '123456789',
    password: 'password123',
    userName: 'Student Name',
    signature: 'generated_jwt_signature',
    apiKey: 'your_api_key',
    role: 0 // Attendee
  });
  
  if (result.success) {
    console.log('Joined meeting successfully');
  }
};
```

## 🔐 Security Considerations

### JWT Signature Generation

**⚠️ Important**: The current implementation includes client-side signature generation for development purposes. In production, signatures should be generated on your backend server.

```typescript
// Development (current implementation)
const signature = zoomService.generateSignature(meetingNumber, role);

// Production (recommended)
const signature = await fetch('/api/zoom/signature', {
  method: 'POST',
  body: JSON.stringify({ meetingNumber, role }),
  headers: { 'Content-Type': 'application/json' }
}).then(res => res.json()).then(data => data.signature);
```

### Environment Variables

- Never commit actual API keys to version control
- Use different keys for development and production
- Rotate keys regularly
- Restrict API key permissions to minimum required

## 📊 Features Overview

### ZoomService Class

```typescript
class ZoomService {
  // Initialization
  initialize(config: ZoomInitConfig): Promise<ZoomServiceResponse<boolean>>
  
  // Meeting Management
  joinMeeting(config: ZoomMeetingConfig): Promise<ZoomServiceResponse<boolean>>
  leaveMeeting(): Promise<ZoomServiceResponse<boolean>>
  
  // Event Handling
  on<K extends keyof ZoomSDKEvents>(event: K, handler: ZoomSDKEvents[K]): void
  off<K extends keyof ZoomSDKEvents>(event: K): void
  
  // Utilities
  generateSignature(meetingNumber: string, role: ZoomRole): string
  getCurrentMeetingId(): string | null
  isInMeeting(): boolean
  isSDKInitialized(): boolean
  
  // API Methods (Mock implementations ready for backend integration)
  getMeetings(userId: string): Promise<ZoomServiceResponse<ZoomMeetingListResponse>>
  getRecordings(meetingId?: string): Promise<ZoomServiceResponse<ZoomRecordingListResponse>>
  trackAttendance(meetingId: string, userId: string, action: 'join' | 'leave'): Promise<ZoomServiceResponse<ZoomAttendanceRecord>>
}
```

### useZoom Hook

```typescript
const {
  // State
  isInitialized,
  isJoining,
  isInMeeting,
  meetingStatus,
  error,
  attendanceRecord,
  
  // Actions
  initializeZoom,
  joinMeeting,
  leaveMeeting,
  clearError,
  
  // Utilities
  generateMeetingSignature
} = useZoom(options);
```

### ZoomMeeting Component Props

```typescript
interface ZoomMeetingProps {
  classSession: ClassSession;           // Class information with Zoom details
  userName: string;                     // Student name
  userEmail?: string;                   // Student email (optional)
  onMeetingStart?: () => void;          // Callback when meeting starts
  onMeetingEnd?: () => void;            // Callback when meeting ends
  onAttendanceTracked?: (duration: number) => void; // Attendance callback
  className?: string;                   // Additional CSS classes
}
```

## 🎨 UI Features

### Meeting States

1. **Pre-Meeting**: Shows class info, instructor, schedule, join button
2. **Joining**: Loading state with spinner
3. **In-Meeting**: Full Zoom interface with leave button overlay
4. **Post-Meeting**: Attendance summary and next steps

### Visual Indicators

- **Live Badge**: Red pulsing indicator for live meetings
- **Scheduled Badge**: Blue indicator for upcoming meetings
- **Completed Badge**: Gray indicator for finished meetings
- **Status Messages**: Real-time connection status updates

### Accessibility Features

- **ARIA Labels**: All interactive elements have proper labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with screen readers
- **High Contrast**: Works with high contrast mode
- **Touch Targets**: 44px minimum touch target size

## 🌐 Multilingual Support

All UI text includes Malayalam translations:

```typescript
// Example from component
<span className="block text-sm mt-1" lang="ml">
  മീറ്റിംഗിൽ ചേരുക
</span>
```

Error messages and status updates are available in both English and Malayalam.

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Touch Friendly**: Large touch targets and gestures
- **Adaptive Layout**: Adjusts to screen size
- **Thumb Zone**: Important controls in easy reach

## 🔄 Event Handling

The integration provides comprehensive event handling:

```typescript
// Meeting status events
onMeetingStatus: (status: ZoomMeetingSDKStatus) => void
onConnectionChange: (payload: { state: string; reason: string }) => void

// User events
onUserJoin: (payload: { users: ZoomParticipant[] }) => void
onUserLeave: (payload: { users: ZoomParticipant[] }) => void
onUserUpdate: (payload: { users: ZoomParticipant[] }) => void

// Meeting lifecycle
onMeetingEnd: (payload: { reason: string }) => void
onHostChange: (payload: { userId: string }) => void

// Recording events
onRecordingStart: () => void
onRecordingEnd: () => void

// Error handling
onError: (error: ZoomError) => void
```

## 📈 Attendance Tracking

Automatic attendance tracking includes:

- **Join Time**: When student joins the meeting
- **Leave Time**: When student leaves the meeting
- **Duration**: Total time spent in meeting
- **Device Type**: Web, mobile, or desktop
- **Attention Score**: If available from Zoom (disabled for privacy)

## 🚨 Error Handling

Comprehensive error handling with user-friendly messages:

```typescript
// Error types
type ZoomErrorType = 
  | 'INITIALIZATION_ERROR'
  | 'JOIN_MEETING_ERROR'
  | 'LEAVE_MEETING_ERROR'
  | 'CONNECTION_ERROR'
  | 'API_ERROR'
  | 'ATTENDANCE_ERROR';

// Error display
{error && (
  <AlertBanner
    type="error"
    message={getErrorMessage(error)}
    onDismiss={clearError}
  />
)}
```

## 🔮 Next Steps (Tasks 8.2 and 8.3)

This implementation provides the foundation for:

1. **Task 8.2**: LiveClass page integration (ready to implement)
2. **Task 8.3**: Zoom recordings integration (API methods prepared)

The service includes mock implementations for recordings and meetings that can be easily replaced with actual Zoom REST API calls through your backend.

## 🐛 Troubleshooting

### Common Issues

1. **SDK Initialization Fails**
   - Check API key and secret
   - Verify network connectivity
   - Check browser console for errors

2. **Meeting Join Fails**
   - Verify meeting ID and password
   - Check signature generation
   - Ensure meeting is active

3. **Signature Errors**
   - Verify API key/secret format
   - Check JWT generation logic
   - Ensure proper role assignment

### Debug Mode

Enable debug mode in development:

```typescript
const ZOOM_SDK_CONFIG = {
  debug: true, // Enable debug logging
  // ... other config
};
```

## 📚 Resources

- [Zoom Meeting SDK Documentation](https://developers.zoom.us/docs/meeting-sdk/)
- [Zoom REST API Reference](https://developers.zoom.us/docs/api/)
- [JWT.io](https://jwt.io/) - For JWT debugging
- [Zoom Marketplace](https://marketplace.zoom.us/) - Create apps

---

**Status**: ✅ Task 8.1 Complete - Zoom SDK and authentication setup finished
**Next**: Ready for Task 8.2 - LiveClass page integration