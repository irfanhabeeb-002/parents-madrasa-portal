import { useState, useEffect, useCallback } from 'react';
import { AttendanceService } from '../services/attendanceService';
import type {
  Attendance,
  AttendanceRecord,
  AttendanceStats,
  AttendanceStatus,
} from '../types/attendance';
import type { ApiResponse } from '../types/common';

interface UseAttendanceOptions {
  userId: string;
  autoFetch?: boolean;
}

interface UseAttendanceReturn {
  // Data
  attendance: Attendance[];
  attendanceRecord: AttendanceRecord | null;
  attendanceStats: AttendanceStats | null;

  // Loading states
  loading: boolean;
  statsLoading: boolean;
  recordLoading: boolean;

  // Error states
  error: string | null;
  statsError: string | null;
  recordError: string | null;

  // Actions
  fetchUserAttendance: (options?: {
    startDate?: Date;
    endDate?: Date;
  }) => Promise<void>;
  fetchAttendanceStats: () => Promise<void>;
  fetchMonthlyRecord: (month: number, year: number) => Promise<void>;
  markAttendance: (
    classSessionId: string,
    status: AttendanceStatus,
    notes?: string
  ) => Promise<boolean>;

  // Utility functions
  getAttendanceForDate: (date: Date) => Attendance | undefined;
  getAttendanceDataForCalendar: () => Record<
    string,
    { status: AttendanceStatus; duration?: number; notes?: string }
  >;
  refreshData: () => Promise<void>;
}

export const useAttendance = ({
  userId,
  autoFetch = true,
}: UseAttendanceOptions): UseAttendanceReturn => {
  // State
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attendanceRecord, setAttendanceRecord] =
    useState<AttendanceRecord | null>(null);
  const [attendanceStats, setAttendanceStats] =
    useState<AttendanceStats | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Fetch user attendance
  const fetchUserAttendance = useCallback(
    async (options?: { startDate?: Date; endDate?: Date }) => {
      setLoading(true);
      setError(null);

      try {
        const response: ApiResponse<Attendance[]> =
          await AttendanceService.getUserAttendance(userId, {
            startDate: options?.startDate,
            endDate: options?.endDate,
            orderBy: 'joinedAt',
            orderDirection: 'desc',
          });

        if (response.success && response.data) {
          setAttendance(response.data);
        } else {
          setError(response.error || 'Failed to fetch attendance data');
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Fetch attendance statistics
  const fetchAttendanceStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);

    try {
      const response: ApiResponse<AttendanceStats> =
        await AttendanceService.getUserAttendanceStats(userId);

      if (response.success && response.data) {
        setAttendanceStats(response.data);
      } else {
        setStatsError(
          response.error || 'Failed to fetch attendance statistics'
        );
      }
    } catch (err) {
      setStatsError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setStatsLoading(false);
    }
  }, [userId]);

  // Fetch monthly attendance record
  const fetchMonthlyRecord = useCallback(
    async (month: number, year: number) => {
      setRecordLoading(true);
      setRecordError(null);

      try {
        const response: ApiResponse<AttendanceRecord> =
          await AttendanceService.getMonthlyAttendanceRecord(
            userId,
            month,
            year
          );

        if (response.success && response.data) {
          setAttendanceRecord(response.data);
        } else {
          setRecordError(
            response.error || 'Failed to fetch monthly attendance record'
          );
        }
      } catch (err) {
        setRecordError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
      } finally {
        setRecordLoading(false);
      }
    },
    [userId]
  );

  // Mark attendance
  const markAttendance = useCallback(
    async (
      classSessionId: string,
      status: AttendanceStatus,
      notes?: string
    ): Promise<boolean> => {
      try {
        const response: ApiResponse<Attendance> =
          await AttendanceService.markAttendance(
            userId,
            classSessionId,
            status,
            notes
          );

        if (response.success && response.data) {
          // Update local state
          setAttendance(prev => [response.data!, ...prev]);
          return true;
        } else {
          setError(response.error || 'Failed to mark attendance');
          return false;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
        return false;
      }
    },
    [userId]
  );

  // Get attendance for a specific date
  const getAttendanceForDate = useCallback(
    (date: Date): Attendance | undefined => {
      const dateString = date.toISOString().split('T')[0];
      return attendance.find(att => {
        // Handle both Date and Timestamp types
        const joinedDate =
          att.joinedAt instanceof Date
            ? att.joinedAt
            : new Date(att.joinedAt.seconds * 1000);
        const attDate = joinedDate.toISOString().split('T')[0];
        return attDate === dateString;
      });
    },
    [attendance]
  );

  // Get attendance data formatted for calendar component
  const getAttendanceDataForCalendar = useCallback(() => {
    const calendarData: Record<
      string,
      { status: AttendanceStatus; duration?: number; notes?: string }
    > = {};

    attendance.forEach(att => {
      // Handle both Date and Timestamp types
      const joinedDate =
        att.joinedAt instanceof Date
          ? att.joinedAt
          : new Date(att.joinedAt.seconds * 1000);
      const dateKey = joinedDate.toISOString().split('T')[0];
      calendarData[dateKey] = {
        status: att.isPresent ? 'present' : 'absent',
        duration: att.duration,
        notes: att.notes,
      };
    });

    return calendarData;
  }, [attendance]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchUserAttendance(), fetchAttendanceStats()]);
  }, [fetchUserAttendance, fetchAttendanceStats]);

  // Auto-fetch data on mount
  useEffect(() => {
    if (autoFetch && userId) {
      refreshData();
    }
  }, [autoFetch, userId, refreshData]);

  return {
    // Data
    attendance,
    attendanceRecord,
    attendanceStats,

    // Loading states
    loading,
    statsLoading,
    recordLoading,

    // Error states
    error,
    statsError,
    recordError,

    // Actions
    fetchUserAttendance,
    fetchAttendanceStats,
    fetchMonthlyRecord,
    markAttendance,

    // Utility functions
    getAttendanceForDate,
    getAttendanceDataForCalendar,
    refreshData,
  };
};
