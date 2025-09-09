import React, { useState } from 'react';
import { AccessibleButton } from './AccessibleButton';
import type { AttendanceStatus } from '../../types/attendance';

interface CalendarDay {
  date: Date;
  status?: AttendanceStatus;
  isCurrentMonth: boolean;
  duration?: number; // in seconds
  notes?: string;
}

interface CalendarViewProps {
  month: number; // 1-12
  year: number;
  attendanceData: Record<string, { status: AttendanceStatus; duration?: number; notes?: string }>;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (month: number, year: number) => void;
  className?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  month,
  year,
  attendanceData,
  onDateSelect,
  onMonthChange,
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [currentYear, setCurrentYear] = useState(year);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const malayalamMonths = [
    'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ',
    'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const malayalamWeekDays = ['ഞാ', 'തി', 'ചൊ', 'ബു', 'വ്യാ', 'വെ', 'ശ'];

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41); // 6 weeks

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const attendanceInfo = attendanceData[dateKey];
      
      days.push({
        date: new Date(date),
        status: attendanceInfo?.status,
        isCurrentMonth: date.getMonth() === currentMonth - 1,
        duration: attendanceInfo?.duration,
        notes: attendanceInfo?.notes
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newMonth, newYear);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newMonth, newYear);
  };

  const getStatusColor = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-success-100 text-success-800 border-success-300';
      case 'absent':
        return 'bg-error-100 text-error-800 border-error-300';
      case 'late':
        return 'bg-warning-100 text-warning-800 border-warning-300';
      case 'excused':
        return 'bg-primary-100 text-primary-800 border-primary-300';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return '✓';
      case 'absent':
        return '✗';
      case 'late':
        return '⏰';
      case 'excused':
        return '📝';
      default:
        return '';
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-6">
        <AccessibleButton
          variant="secondary"
          size="sm"
          onClick={handlePrevMonth}
          ariaLabel="Previous month"
          className="!min-w-[44px] !min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </AccessibleButton>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth - 1]} {currentYear}
          </h2>
          <p className="text-sm text-gray-600" lang="ml">
            {malayalamMonths[currentMonth - 1]} {currentYear}
          </p>
        </div>

        <AccessibleButton
          variant="secondary"
          size="sm"
          onClick={handleNextMonth}
          ariaLabel="Next month"
          className="!min-w-[44px] !min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </AccessibleButton>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div key={day} className="text-center py-2">
            <div className="text-sm font-medium text-gray-700">{day}</div>
            <div className="text-xs text-gray-500" lang="ml">{malayalamWeekDays[index]}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          const hasAttendance = day.status !== undefined;
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect?.(day.date)}
              className={`
                relative p-2 min-h-[44px] rounded-lg border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                ${day.isCurrentMonth 
                  ? hasAttendance 
                    ? getStatusColor(day.status)
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                  : 'bg-gray-50 text-gray-400 border-gray-100'
                }
                ${isToday ? 'ring-2 ring-primary-400' : ''}
              `}
              disabled={!day.isCurrentMonth}
              aria-label={`
                ${day.date.toLocaleDateString()} 
                ${hasAttendance ? `- ${day.status}` : '- No class'}
                ${day.duration ? `- Duration: ${formatDuration(day.duration)}` : ''}
              `}
            >
              <div className="flex flex-col items-center">
                <span className={`text-sm font-medium ${isToday ? 'font-bold' : ''}`}>
                  {day.date.getDate()}
                </span>
                
                {hasAttendance && (
                  <span className="text-xs mt-1" aria-hidden="true">
                    {getStatusIcon(day.status)}
                  </span>
                )}
                
                {day.duration && (
                  <span className="text-xs text-gray-600 mt-1">
                    {formatDuration(day.duration)}
                  </span>
                )}
              </div>

              {isToday && (
                <div 
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Attendance Legend
          <span className="text-xs text-gray-500 ml-2" lang="ml">ഹാജർ വിവരണം</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-success-100 border border-success-300 rounded mr-2 flex items-center justify-center">
              <span className="text-success-800">✓</span>
            </div>
            <span>Present / ഹാജർ</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-4 h-4 bg-error-100 border border-error-300 rounded mr-2 flex items-center justify-center">
              <span className="text-error-800">✗</span>
            </div>
            <span>Absent / ഹാജരല്ല</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-4 h-4 bg-warning-100 border border-warning-300 rounded mr-2 flex items-center justify-center">
              <span className="text-warning-800">⏰</span>
            </div>
            <span>Late / വൈകി</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-4 h-4 bg-primary-100 border border-primary-300 rounded mr-2 flex items-center justify-center">
              <span className="text-primary-800">📝</span>
            </div>
            <span>Excused / അനുവാദം</span>
          </div>
        </div>
      </div>
    </div>
  );
};