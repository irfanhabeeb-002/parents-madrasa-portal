// Simple data structures for manual login system

// Types for dashboard data
export interface Announcement {
  id: string;
  title: string;
  message: string;
  malayalamMessage?: string;
  type: 'general' | 'class' | 'exam' | 'holiday';
  createdAt: Date;
  isActive: boolean;
}

export interface DashboardNotification {
  id: string;
  type: 'new_recording' | 'new_notes' | 'class_reminder' | 'exam_reminder';
  title: string;
  message: string;
  malayalamMessage?: string;
  timestamp: Date;
  read: boolean;
  userId: string;
}

export interface ClassSession {
  id: string;
  title: string;
  description: string;
  scheduledAt: Date;
  zoomMeetingId: string;
  zoomJoinUrl: string;
  isLive: boolean;
  recordingUrl?: string;
}

// Mock data for demo
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to Parents Madrasa Portal',
    message: 'Access your Islamic education resources easily',
    malayalamMessage: 'നിങ്ങളുടെ ഇസ്ലാമിക് വിദ്യാഭ്യാസ വിഭവങ്ങൾ എളുപ്പത്തിൽ ആക്സസ് ചെയ്യുക',
    type: 'general',
    createdAt: new Date(),
    isActive: true
  },
  {
    id: '2',
    title: 'New Class Schedule Available',
    message: 'Check your dashboard for updated class timings',
    malayalamMessage: 'അപ്ഡേറ്റ് ചെയ്ത ക്ലാസ് സമയങ്ങൾക്കായി നിങ്ങളുടെ ഡാഷ്ബോർഡ് പരിശോധിക്കുക',
    type: 'class',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    isActive: true
  }
];

const mockNotifications: DashboardNotification[] = [
  {
    id: 'notif-1',
    type: 'class_reminder',
    title: 'Class Reminder',
    message: 'Your Islamic Studies class starts in 15 minutes',
    malayalamMessage: 'നിങ്ങളുടെ ഇസ്ലാമിക് പഠന ക്ലാസ് 15 മിനിറ്റിനുള്ളിൽ ആരംഭിക്കുന്നു',
    timestamp: new Date(),
    read: false,
    userId: '1'
  },
  {
    id: 'notif-2',
    type: 'new_recording',
    title: 'New Recording Available',
    message: 'Yesterday\'s class recording is now available',
    malayalamMessage: 'ഇന്നലത്തെ ക്ലാസ് റെക്കോർഡിംഗ് ഇപ്പോൾ ലഭ്യമാണ്',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    read: false,
    userId: '1'
  }
];

const mockClassSession: ClassSession = {
  id: 'class-1',
  title: 'Islamic Studies - Introduction',
  description: 'Introduction to Islamic History and Principles',
  scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
  zoomMeetingId: '123456789',
  zoomJoinUrl: 'https://zoom.us/j/123456789',
  isLive: false,
  recordingUrl: undefined
};

// Dashboard Service Class - Simple implementation without Firebase
export class DashboardService {
  // Get active announcements
  static async getAnnouncements(): Promise<Announcement[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAnnouncements.filter(a => a.isActive);
  }

  // Simple listener for announcements (simulates real-time updates)
  static subscribeToAnnouncements(
    callback: (announcements: Announcement[]) => void
  ): () => void {
    // Call callback with demo data immediately
    setTimeout(() => {
      this.getAnnouncements().then(callback);
    }, 100);
    
    // Return empty unsubscribe function
    return () => {};
  }

  // Get user notifications
  static async getUserNotifications(userId: string): Promise<DashboardNotification[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return notifications for the specific user
    return mockNotifications.filter(notif => notif.userId === userId);
  }

  // Simple listener for user notifications
  static subscribeToUserNotifications(
    userId: string,
    callback: (notifications: DashboardNotification[]) => void
  ): () => void {
    // Call callback with demo data
    setTimeout(() => {
      this.getUserNotifications(userId).then(callback);
    }, 100);
    
    return () => {};
  }

  // Get today's class session
  static async getTodaysClass(): Promise<ClassSession | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // Check if the mock class is scheduled for today
    const today = new Date();
    const classDate = mockClassSession.scheduledAt;
    
    if (
      classDate.getDate() === today.getDate() &&
      classDate.getMonth() === today.getMonth() &&
      classDate.getFullYear() === today.getFullYear()
    ) {
      return mockClassSession;
    }
    
    return null;
  }

  // Simple listener for today's class
  static subscribeToTodaysClass(
    callback: (classSession: ClassSession | null) => void
  ): () => void {
    // Call callback with demo data
    setTimeout(() => {
      this.getTodaysClass().then(callback);
    }, 100);
    
    return () => {};
  }
}

// Utility function for retry mechanism
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};