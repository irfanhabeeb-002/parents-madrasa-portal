// Real-time notification listener hook using Firestore for new content alerts
import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

// Firebase imports - COMMENTED OUT FOR MANUAL MODE
// TODO: Uncomment when Firebase is enabled
/*
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
*/

interface UseNotificationListenerOptions {
  enabled?: boolean;
  pollInterval?: number; // For manual mode
}

export const useNotificationListener = (
  options: UseNotificationListenerOptions = {}
) => {
  const { enabled = true, pollInterval = 30000 } = options; // 30 seconds default
  const { user } = useAuth();
  const {
    notifyNewRecording,
    notifyNewNotes,
    notifyExamReminder,
    notifyAnnouncement,
  } = useNotifications();

  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    // MANUAL MODE - Simulate real-time updates with polling
    // TODO: Replace with Firebase real-time listeners when enabled

    let lastCheck = new Date();

    const checkForUpdates = async () => {
      try {
        // Simulate checking for new content
        // In real implementation, this would query Firestore collections

        // Mock data for demonstration
        const mockUpdates = {
          recordings: [],
          notes: [],
          exams: [],
          announcements: [],
        };

        // Process new recordings
        mockUpdates.recordings.forEach((recording: any) => {
          notifyNewRecording(recording.id, recording.title);
        });

        // Process new notes
        mockUpdates.notes.forEach((note: any) => {
          notifyNewNotes(note.id, note.title);
        });

        // Process exam reminders
        mockUpdates.exams.forEach((exam: any) => {
          notifyExamReminder(exam.id, exam.title, new Date(exam.date));
        });

        // Process announcements
        mockUpdates.announcements.forEach((announcement: any) => {
          notifyAnnouncement(
            announcement.title,
            announcement.message,
            announcement.malayalamTitle,
            announcement.malayalamMessage
          );
        });

        lastCheck = new Date();
      } catch (error) {
        console.error('Error checking for notification updates:', error);
      }
    };

    // Initial check
    checkForUpdates();

    // Set up polling interval
    const interval = setInterval(checkForUpdates, pollInterval);

    return () => {
      clearInterval(interval);
    };

    /* 
    // FIREBASE REAL-TIME LISTENERS - COMMENTED OUT FOR MANUAL MODE
    // TODO: Uncomment when Firebase is enabled
    
    const unsubscribers: Array<() => void> = [];

    // Listen for new recordings
    const recordingsQuery = query(
      collection(db, 'recordings'),
      where('createdAt', '>', Timestamp.fromDate(lastCheck)),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeRecordings = onSnapshot(recordingsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const recording = change.doc.data();
          notifyNewRecording(change.doc.id, recording.title);
        }
      });
    });
    unsubscribers.push(unsubscribeRecordings);

    // Listen for new notes
    const notesQuery = query(
      collection(db, 'notes'),
      where('createdAt', '>', Timestamp.fromDate(lastCheck)),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const note = change.doc.data();
          notifyNewNotes(change.doc.id, note.title);
        }
      });
    });
    unsubscribers.push(unsubscribeNotes);

    // Listen for exam updates
    const examsQuery = query(
      collection(db, 'exams'),
      where('userId', '==', user.uid),
      where('status', '==', 'scheduled'),
      orderBy('scheduledDate', 'asc')
    );

    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const exam = change.doc.data();
          const examDate = exam.scheduledDate.toDate();
          const now = new Date();
          const timeDiff = examDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Notify if exam is within 3 days
          if (daysDiff <= 3 && daysDiff > 0) {
            notifyExamReminder(change.doc.id, exam.title, examDate);
          }
        }
      });
    });
    unsubscribers.push(unsubscribeExams);

    // Listen for announcements
    const announcementsQuery = query(
      collection(db, 'announcements'),
      where('createdAt', '>', Timestamp.fromDate(lastCheck)),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          let announcement = change.doc.data();
          notifyAnnouncement(
            announcement.title,
            announcement.message,
            announcement.malayalamTitle,
            announcement.malayalamMessage
          );
        }
      });
    });
    unsubscribers.push(unsubscribeAnnouncements);

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
    */
  }, [
    enabled,
    user,
    pollInterval,
    notifyNewRecording,
    notifyNewNotes,
    notifyExamReminder,
    notifyAnnouncement,
  ]);
};

// Hook for listening to class schedule changes for reminders
export const useClassReminderListener = (
  options: UseNotificationListenerOptions = {}
) => {
  const { enabled = true, pollInterval = 60000 } = options; // 1 minute default
  const { user } = useAuth();
  const { scheduleClassReminder } = useNotifications();

  useEffect(() => {
    if (!enabled || !user) {
      return;
    }

    const checkUpcomingClasses = async () => {
      try {
        // MANUAL MODE - Mock class schedule check
        // TODO: Replace with Firebase query when enabled

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Mock upcoming classes
        const mockClasses = [
          {
            id: 'class_1',
            title: 'Arabic Grammar',
            scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
          },
        ];

        mockClasses.forEach(classItem => {
          const timeDiff = classItem.scheduledTime.getTime() - now.getTime();
          const minutesDiff = Math.floor(timeDiff / (1000 * 60));

          // Schedule reminder if class is within 24 hours and more than 15 minutes away
          if (minutesDiff > 15 && minutesDiff <= 1440) {
            scheduleClassReminder(
              classItem.id,
              classItem.title,
              classItem.scheduledTime
            );
          }
        });
      } catch (error) {
        console.error('Error checking upcoming classes:', error);
      }
    };

    // Initial check
    checkUpcomingClasses();

    // Set up polling interval
    const interval = setInterval(checkUpcomingClasses, pollInterval);

    return () => {
      clearInterval(interval);
    };

    /*
    // FIREBASE REAL-TIME LISTENER - COMMENTED OUT FOR MANUAL MODE
    // TODO: Uncomment when Firebase is enabled
    
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const classesQuery = query(
      collection(db, 'classes'),
      where('userId', '==', user.uid),
      where('scheduledTime', '>=', Timestamp.fromDate(now)),
      where('scheduledTime', '<=', Timestamp.fromDate(tomorrow)),
      where('status', '==', 'scheduled'),
      orderBy('scheduledTime', 'asc')
    );

    const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const classData = change.doc.data();
          const scheduledTime = classData.scheduledTime.toDate();
          
          scheduleClassReminder(change.doc.id, classData.title, scheduledTime);
        }
      });
    });

    return () => unsubscribe();
    */
  }, [enabled, user, pollInterval, scheduleClassReminder]);
};
