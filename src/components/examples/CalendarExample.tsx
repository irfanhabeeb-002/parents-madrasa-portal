import React, { useState } from 'react';
import { CalendarView } from '../ui/CalendarView';
import { useAttendance } from '../../hooks/useAttendance';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { AlertBanner } from '../ui/AlertBanner';

interface CalendarExampleProps {
  userId: string;
  className?: string;
}

export const CalendarExample: React.FC<CalendarExampleProps> = ({ 
  userId, 
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    attendance,
    attendanceStats,
    loading,
    error,
    getAttendanceDataForCalendar,
    fetchMonthlyRecord,
    refreshData
  } = useAttendance({ userId });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    console.log('Selected date:', date.toLocaleDateString());
  };

  const handleMonthChange = async (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    
    // Fetch monthly record for the new month
    await fetchMonthlyRecord(month, year);
  };

  const handleWeekChange = (startDate: Date, endDate: Date) => {
    console.log('Week changed:', startDate.toLocaleDateString(), 'to', endDate.toLocaleDateString());
  };

  const handleViewChange = (view: 'month' | 'week') => {
    console.log('View changed to:', view);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <SkeletonLoader className="h-8 w-48" />
        <SkeletonLoader className="h-64 w-full" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <AlertBanner
          type="error"
          message={error}
          onDismiss={() => refreshData()}
        />
      </div>
    );
  }

  const attendanceData = getAttendanceDataForCalendar();

  return (
    <div className={`space-y-4 ${className}`}>
      <CalendarView
        month={currentMonth}
        year={currentYear}
        attendanceData={attendanceData}
        attendanceStats={attendanceStats}
        onDateSelect={handleDateSelect}
        onMonthChange={handleMonthChange}
        onWeekChange={handleWeekChange}
        onViewChange={handleViewChange}
        initialView="month"
        className="w-full"
      />

      {/* Selected date info */}
      {selectedDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            Selected Date: {selectedDate.toLocaleDateString()}
          </h4>
          
          {(() => {
            const dateKey = selectedDate.toISOString().split('T')[0];
            const dayAttendance = attendanceData[dateKey];
            
            if (dayAttendance) {
              return (
                <div className="text-sm text-blue-800">
                  <p><strong>Status:</strong> {dayAttendance.status}</p>
                  {dayAttendance.duration && (
                    <p><strong>Duration:</strong> {Math.floor(dayAttendance.duration / 3600)}h {Math.floor((dayAttendance.duration % 3600) / 60)}m</p>
                  )}
                  {dayAttendance.notes && (
                    <p><strong>Notes:</strong> {dayAttendance.notes}</p>
                  )}
                </div>
              );
            } else {
              return (
                <p className="text-sm text-blue-600">No class scheduled for this date</p>
              );
            }
          })()}
        </div>
      )}

      {/* Attendance statistics summary */}
      {attendanceStats && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Overall Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Classes:</span>
              <span className="ml-2 font-semibold">{attendanceStats.totalClasses}</span>
            </div>
            <div>
              <span className="text-gray-600">Attended:</span>
              <span className="ml-2 font-semibold text-success-600">{attendanceStats.attendedClasses}</span>
            </div>
            <div>
              <span className="text-gray-600">Percentage:</span>
              <span className="ml-2 font-semibold text-primary-600">{attendanceStats.attendancePercentage}%</span>
            </div>
            <div>
              <span className="text-gray-600">Current Streak:</span>
              <span className="ml-2 font-semibold text-success-600">{attendanceStats.consecutiveDaysPresent} days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};