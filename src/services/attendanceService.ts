import { 
  Attendance, 
  AttendanceRecord, 
  DailyAttendance, 
  AttendanceStats, 
  MonthlyAttendanceStats,
  AttendanceType,
  AttendanceStatus,
  VerificationMethod
} from '../types/attendance';
import { ApiResponse, PaginationOptions, FilterOptions } from '../types/common';
import { StorageService } from './storageService';

export class AttendanceService {
  private static readonly STORAGE_KEY = 'attendance';
  private static readonly RECORDS_STORAGE_KEY = 'attendance_records';

  // Mock data for development
  private static mockAttendance: Attendance[] = [
    {
      id: 'att-1',
      userId: 'user-1',
      classSessionId: 'class-1',
      joinedAt: new Date('2024-01-15T10:00:00'),
      leftAt: new Date('2024-01-15T11:30:00'),
      duration: 5400, // 1.5 hours in seconds
      isPresent: true,
      attendanceType: 'zoom_integration',
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        platform: 'Win32',
        browser: 'Chrome',
        screenResolution: '1920x1080',
        timezone: 'Asia/Kolkata'
      },
      ipAddress: '192.168.1.100',
      notes: 'Attended full session, participated actively',
      verificationMethod: 'zoom_join',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'att-2',
      userId: 'user-1',
      classSessionId: 'class-2',
      joinedAt: new Date('2024-01-20T14:00:00'),
      leftAt: new Date('2024-01-20T15:15:00'),
      duration: 4500, // 1.25 hours in seconds
      isPresent: true,
      attendanceType: 'zoom_integration',
      deviceInfo: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        platform: 'iPhone',
        browser: 'Safari',
        screenResolution: '375x812',
        timezone: 'Asia/Kolkata'
      },
      ipAddress: '192.168.1.101',
      notes: 'Joined from mobile device',
      verificationMethod: 'zoom_join',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 'att-3',
      userId: 'user-1',
      classSessionId: 'class-3',
      joinedAt: new Date('2024-01-22T09:30:00'),
      duration: 0,
      isPresent: false,
      attendanceType: 'manual',
      notes: 'Marked absent - no show',
      verificationMethod: 'manual_checkin',
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22')
    }
  ];

  // Record attendance
  static async recordAttendance(attendance: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Attendance>> {
    try {
      const newAttendance: Attendance = {
        ...attendance,
        id: `att-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await StorageService.appendToArray(this.STORAGE_KEY, newAttendance);
      this.mockAttendance.push(newAttendance);

      return {
        data: newAttendance,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: {} as Attendance,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record attendance',
        timestamp: new Date()
      };
    }
  }

  // Get user attendance with filtering
  static async getUserAttendance(
    userId: string,
    options?: PaginationOptions & FilterOptions
  ): Promise<ApiResponse<Attendance[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      let userAttendance = this.mockAttendance.filter(att => att.userId === userId);

      // Apply filters
      if (options?.classSessionId) {
        userAttendance = userAttendance.filter(att => att.classSessionId === options.classSessionId);
      }
      if (options?.isPresent !== undefined) {
        userAttendance = userAttendance.filter(att => att.isPresent === options.isPresent);
      }
      if (options?.attendanceType) {
        userAttendance = userAttendance.filter(att => att.attendanceType === options.attendanceType);
      }
      if (options?.startDate) {
        userAttendance = userAttendance.filter(att => 
          new Date(att.joinedAt) >= new Date(options.startDate!)
        );
      }
      if (options?.endDate) {
        userAttendance = userAttendance.filter(att => 
          new Date(att.joinedAt) <= new Date(options.endDate!)
        );
      }

      // Apply sorting
      if (options?.orderBy) {
        userAttendance.sort((a, b) => {
          const aValue = a[options.orderBy as keyof Attendance];
          const bValue = b[options.orderBy as keyof Attendance];
          const direction = options.orderDirection === 'desc' ? -1 : 1;
          
          if (aValue < bValue) return -1 * direction;
          if (aValue > bValue) return 1 * direction;
          return 0;
        });
      } else {
        // Default sort by joinedAt descending
        userAttendance.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
      }

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 20;
      const paginatedAttendance = userAttendance.slice(offset, offset + limit);

      return {
        data: paginatedAttendance,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user attendance',
        timestamp: new Date()
      };
    }
  }

  // Get attendance statistics for a user
  static async getUserAttendanceStats(userId: string): Promise<ApiResponse<AttendanceStats>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const userAttendance = this.mockAttendance.filter(att => att.userId === userId);
      const totalClasses = userAttendance.length;
      const attendedClasses = userAttendance.filter(att => att.isPresent).length;
      const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      // Calculate consecutive days present
      const sortedAttendance = userAttendance
        .filter(att => att.isPresent)
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      let consecutiveDaysPresent = 0;
      let longestStreak = 0;
      let currentStreak = 0;

      for (let i = 0; i < sortedAttendance.length; i++) {
        const currentDate = new Date(sortedAttendance[i].joinedAt);
        const prevDate = i > 0 ? new Date(sortedAttendance[i - 1].joinedAt) : null;

        if (prevDate) {
          const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            currentStreak++;
          } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
      }

      consecutiveDaysPresent = currentStreak;
      longestStreak = Math.max(longestStreak, currentStreak);

      // Calculate average duration
      const totalDuration = userAttendance
        .filter(att => att.isPresent)
        .reduce((sum, att) => sum + att.duration, 0);
      const averageDuration = attendedClasses > 0 ? Math.round(totalDuration / attendedClasses) : 0;

      // Get last attended class
      const lastAttendedClass = sortedAttendance.length > 0 
        ? sortedAttendance[sortedAttendance.length - 1].joinedAt 
        : undefined;

      // Calculate monthly stats
      const monthlyStats = this.calculateMonthlyStats(userAttendance);

      const stats: AttendanceStats = {
        userId,
        totalClasses,
        attendedClasses,
        attendancePercentage,
        consecutiveDaysPresent,
        longestStreak,
        averageDuration,
        lastAttendedClass,
        monthlyStats
      };

      return {
        data: stats,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: {} as AttendanceStats,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate attendance stats',
        timestamp: new Date()
      };
    }
  }

  // Calculate monthly attendance statistics
  private static calculateMonthlyStats(attendance: Attendance[]): MonthlyAttendanceStats[] {
    const monthlyData: Record<string, { total: number; attended: number }> = {};

    attendance.forEach(att => {
      const date = new Date(att.joinedAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, attended: 0 };
      }
      
      monthlyData[monthKey].total++;
      if (att.isPresent) {
        monthlyData[monthKey].attended++;
      }
    });

    return Object.entries(monthlyData).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-').map(Number);
      const attendancePercentage = data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0;
      
      return {
        month: month + 1, // Convert from 0-based to 1-based
        year,
        totalClasses: data.total,
        attendedClasses: data.attended,
        attendancePercentage,
        daysPresent: data.attended,
        daysAbsent: data.total - data.attended
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }

  // Get attendance record for a specific month
  static async getMonthlyAttendanceRecord(
    userId: string, 
    month: number, 
    year: number
  ): Promise<ApiResponse<AttendanceRecord>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 250));

      const userAttendance = this.mockAttendance.filter(att => {
        const attDate = new Date(att.joinedAt);
        return att.userId === userId && 
               attDate.getMonth() === month - 1 && // Convert to 0-based month
               attDate.getFullYear() === year;
      });

      const totalClasses = userAttendance.length;
      const attendedClasses = userAttendance.filter(att => att.isPresent).length;
      const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      // Create daily attendance details
      const attendanceDetails: DailyAttendance[] = userAttendance.map(att => {
        const date = new Date(att.joinedAt);
        return {
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          classSessionId: att.classSessionId,
          status: att.isPresent ? 'present' : 'absent',
          duration: att.duration,
          joinedAt: att.joinedAt,
          leftAt: att.leftAt,
          notes: att.notes
        };
      });

      const record: AttendanceRecord = {
        id: `record-${userId}-${year}-${month}`,
        userId,
        month,
        year,
        totalClasses,
        attendedClasses,
        attendancePercentage,
        attendanceDetails,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        data: record,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: {} as AttendanceRecord,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch monthly attendance record',
        timestamp: new Date()
      };
    }
  }

  // Mark attendance manually
  static async markAttendance(
    userId: string,
    classSessionId: string,
    status: AttendanceStatus,
    notes?: string
  ): Promise<ApiResponse<Attendance>> {
    try {
      const attendance: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        classSessionId,
        joinedAt: new Date(),
        duration: 0,
        isPresent: status === 'present',
        attendanceType: 'manual',
        notes,
        verificationMethod: 'manual_checkin'
      };

      return this.recordAttendance(attendance);
    } catch (error) {
      return {
        data: {} as Attendance,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark attendance',
        timestamp: new Date()
      };
    }
  }

  // Update attendance record
  static async updateAttendance(
    attendanceId: string, 
    updates: Partial<Attendance>
  ): Promise<ApiResponse<Attendance | null>> {
    try {
      const attendanceIndex = this.mockAttendance.findIndex(att => att.id === attendanceId);
      
      if (attendanceIndex === -1) {
        return {
          data: null,
          success: false,
          error: 'Attendance record not found',
          timestamp: new Date()
        };
      }

      this.mockAttendance[attendanceIndex] = {
        ...this.mockAttendance[attendanceIndex],
        ...updates,
        updatedAt: new Date()
      };

      // Update in storage
      const allAttendance = await StorageService.getArray<Attendance>(this.STORAGE_KEY);
      const storageIndex = allAttendance.findIndex(att => att.id === attendanceId);
      if (storageIndex !== -1) {
        allAttendance[storageIndex] = this.mockAttendance[attendanceIndex];
        await StorageService.setArray(this.STORAGE_KEY, allAttendance);
      }

      return {
        data: this.mockAttendance[attendanceIndex],
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update attendance',
        timestamp: new Date()
      };
    }
  }

  // Get attendance by class session
  static async getAttendanceByClass(classSessionId: string): Promise<ApiResponse<Attendance[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const classAttendance = this.mockAttendance.filter(att => att.classSessionId === classSessionId);

      return {
        data: classAttendance,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch class attendance',
        timestamp: new Date()
      };
    }
  }

  // Get attendance summary for date range
  static async getAttendanceSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiResponse<{ totalClasses: number; attendedClasses: number; attendancePercentage: number }>> {
    try {
      const userAttendance = this.mockAttendance.filter(att => {
        const attDate = new Date(att.joinedAt);
        return att.userId === userId && 
               attDate >= startDate && 
               attDate <= endDate;
      });

      const totalClasses = userAttendance.length;
      const attendedClasses = userAttendance.filter(att => att.isPresent).length;
      const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      return {
        data: {
          totalClasses,
          attendedClasses,
          attendancePercentage
        },
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: { totalClasses: 0, attendedClasses: 0, attendancePercentage: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch attendance summary',
        timestamp: new Date()
      };
    }
  }
}