import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DashboardService,
  withRetry 
} from '../services/dashboardService';
import type { 
  Announcement, 
  DashboardNotification, 
  ClassSession
} from '../services/dashboardService';

interface DashboardState {
  announcements: Announcement[];
  notifications: DashboardNotification[];
  todaysClass: ClassSession | null;
  loading: {
    announcements: boolean;
    notifications: boolean;
    todaysClass: boolean;
  };
  error: {
    announcements: string | null;
    notifications: string | null;
    todaysClass: string | null;
  };
}

interface DashboardActions {
  refreshAnnouncements: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshTodaysClass: () => Promise<void>;
  clearError: (type: keyof DashboardState['error']) => void;
}

export const useDashboard = (): DashboardState & DashboardActions => {
  const { user } = useAuth();
  
  const [state, setState] = useState<DashboardState>({
    announcements: [],
    notifications: [],
    todaysClass: null,
    loading: {
      announcements: true,
      notifications: true,
      todaysClass: true,
    },
    error: {
      announcements: null,
      notifications: null,
      todaysClass: null,
    },
  });

  // Update loading state for specific data type
  const setLoading = useCallback((type: keyof DashboardState['loading'], loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [type]: loading,
      },
    }));
  }, []);

  // Update error state for specific data type
  const setError = useCallback((type: keyof DashboardState['error'], error: string | null) => {
    setState(prev => ({
      ...prev,
      error: {
        ...prev.error,
        [type]: error,
      },
    }));
  }, []);

  // Clear error for specific data type
  const clearError = useCallback((type: keyof DashboardState['error']) => {
    setError(type, null);
  }, [setError]);

  // Refresh announcements with retry mechanism
  const refreshAnnouncements = useCallback(async () => {
    setLoading('announcements', true);
    setError('announcements', null);
    
    try {
      const announcements = await withRetry(() => DashboardService.getAnnouncements());
      setState(prev => ({
        ...prev,
        announcements,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load announcements';
      setError('announcements', errorMessage);
    } finally {
      setLoading('announcements', false);
    }
  }, [setLoading, setError]);

  // Refresh notifications with retry mechanism
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading('notifications', true);
    setError('notifications', null);
    
    try {
      const notifications = await withRetry(() => 
        DashboardService.getUserNotifications(user.id)
      );
      setState(prev => ({
        ...prev,
        notifications,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notifications';
      setError('notifications', errorMessage);
    } finally {
      setLoading('notifications', false);
    }
  }, [user?.id, setLoading, setError]);

  // Refresh today's class with retry mechanism
  const refreshTodaysClass = useCallback(async () => {
    setLoading('todaysClass', true);
    setError('todaysClass', null);
    
    try {
      const todaysClass = await withRetry(() => DashboardService.getTodaysClass());
      setState(prev => ({
        ...prev,
        todaysClass,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load today\'s class';
      setError('todaysClass', errorMessage);
    } finally {
      setLoading('todaysClass', false);
    }
  }, [setLoading, setError]);

  // Set up real-time listeners
  useEffect(() => {
    let unsubscribeAnnouncements: (() => void) | null = null;
    let unsubscribeNotifications: (() => void) | null = null;
    let unsubscribeTodaysClass: (() => void) | null = null;

    // Subscribe to announcements
    unsubscribeAnnouncements = DashboardService.subscribeToAnnouncements(
      (announcements) => {
        setState(prev => ({
          ...prev,
          announcements,
        }));
        setLoading('announcements', false);
        setError('announcements', null);
      }
    );

    // Subscribe to notifications if user is authenticated
    if (user?.id) {
      unsubscribeNotifications = DashboardService.subscribeToUserNotifications(
        user.id,
        (notifications) => {
          setState(prev => ({
            ...prev,
            notifications,
          }));
          setLoading('notifications', false);
          setError('notifications', null);
        }
      );
    }

    // Subscribe to today's class
    unsubscribeTodaysClass = DashboardService.subscribeToTodaysClass(
      (todaysClass) => {
        setState(prev => ({
          ...prev,
          todaysClass,
        }));
        setLoading('todaysClass', false);
        setError('todaysClass', null);
      }
    );

    // Cleanup subscriptions
    return () => {
      if (unsubscribeAnnouncements) unsubscribeAnnouncements();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeTodaysClass) unsubscribeTodaysClass();
    };
  }, [user?.id, setLoading, setError]);

  return {
    ...state,
    refreshAnnouncements,
    refreshNotifications,
    refreshTodaysClass,
    clearError,
  };
};