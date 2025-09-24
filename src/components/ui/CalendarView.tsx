import React, { useState, useEffect, useRef } from 'react';
import { AccessibleButton } from './AccessibleButton';
import type { AttendanceStatus, AttendanceStats } from '../../types/attendance';

interface CalendarDay {
  date: Date;
  status?: AttendanceStatus;
  isCurrentMonth: boolean;
  isCurrentWeek?: boolean;
  duration?: number; // in seconds
  notes?: string;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

interface CalendarViewProps {
  month: number; // 1-12
  year: number;
  attendanceData: Record<
    string,
    { status: AttendanceStatus; duration?: number; notes?: string }
  >;
  attendanceStats?: AttendanceStats;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (month: number, year: number) => void;
  onWeekChange?: (startDate: Date, endDate: Date) => void;
  onViewChange?: (view: 'month' | 'week') => void;
  initialView?: 'month' | 'week';
  className?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  month,
  year,
  attendanceData,
  attendanceStats,
  onDateSelect,
  onMonthChange,
  onWeekChange,
  onViewChange,
  initialView = 'month',
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [currentYear, setCurrentYear] = useState(year);
  const [currentView, setCurrentView] = useState<'month' | 'week'>(initialView);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek;
  });

  // Refs for accessibility
  const calendarRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const malayalamMonths = [
    'ജനുവരി',
    'ഫെബ്രുവരി',
    'മാർച്ച്',
    'ഏപ്രിൽ',
    'മേയ്',
    'ജൂൺ',
    'ജൂലൈ',
    'ഓഗസ്റ്റ്',
    'സെപ്റ്റംബർ',
    'ഒക്ടോബർ',
    'നവംബർ',
    'ഡിസംബർ',
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const malayalamWeekDays = ['ഞാ', 'തി', 'ചൊ', 'ബു', 'വ്യാ', 'വെ', 'ശ'];

  // Calculate attendance summary from data
  const calculateAttendanceSummary = (): AttendanceSummary => {
    const entries = Object.entries(attendanceData);
    const totalDays = entries.length;

    const statusCounts = entries.reduce(
      (acc, [_, data]) => {
        const status = data.status as AttendanceStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<AttendanceStatus, number>
    );

    const presentDays = statusCounts.present || 0;
    const absentDays = statusCounts.absent || 0;
    const lateDays = statusCounts.late || 0;
    const excusedDays = statusCounts.excused || 0;

    const attendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage,
    };
  };

  // Generate week view days
  const generateWeekDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    for (const i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);

      const dateKey = date.toISOString().split('T')[0];
      const attendanceInfo = attendanceData[dateKey];

      days.push({
        date: new Date(date),
        status: attendanceInfo?.status,
        isCurrentMonth: date.getMonth() === currentMonth - 1,
        isCurrentWeek: true,
        duration: attendanceInfo?.duration,
        notes: attendanceInfo?.notes,
      });
    }

    return days;
  };

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41); // 6 weeks

    for (
      const date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const attendanceInfo = attendanceData[dateKey];

      days.push({
        date: new Date(date),
        status: attendanceInfo?.status,
        isCurrentMonth: date.getMonth() === currentMonth - 1,
        duration: attendanceInfo?.duration,
        notes: attendanceInfo?.notes,
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    const newMonth = currentMonth - 1;
    const newYear = currentYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newMonth, newYear);
  };

  const handleNextMonth = () => {
    const newMonth = currentMonth + 1;
    const newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newMonth, newYear);
  };

  const handlePrevWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);

    const weekEnd = new Date(newWeekStart);
    weekEnd.setDate(newWeekStart.getDate() + 6);
    onWeekChange?.(newWeekStart, weekEnd);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);

    const weekEnd = new Date(newWeekStart);
    weekEnd.setDate(newWeekStart.getDate() + 6);
    onWeekChange?.(newWeekStart, weekEnd);
  };

  const handleViewChange = (view: 'month' | 'week') => {
    setCurrentView(view);
    onViewChange?.(view);

    // Announce view change for screen readers
    if (announcementRef.current) {
      announcementRef.current.textContent = `Switched to ${view} view`;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, date: Date) => {
    let newDate: Date | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        newDate = new Date(date);
        newDate.setDate(date.getDate() - 1);
        break;
      case 'ArrowRight':
        newDate = new Date(date);
        newDate.setDate(date.getDate() + 1);
        break;
      case 'ArrowUp':
        newDate = new Date(date);
        newDate.setDate(date.getDate() - 7);
        break;
      case 'ArrowDown':
        newDate = new Date(date);
        newDate.setDate(date.getDate() + 7);
        break;
      case 'Home':
        newDate = new Date(currentYear, currentMonth - 1, 1);
        break;
      case 'End':
        newDate = new Date(currentYear, currentMonth, 0);
        break;
      default:
        return;
    }

    if (newDate) {
      event.preventDefault();
      onDateSelect?.(newDate);

      // Focus the new date if it's visible
      const dateButton = calendarRef.current?.querySelector(
        `[data-date="${newDate.toISOString().split('T')[0]}"]`
      ) as HTMLButtonElement;
      dateButton?.focus();
    }
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
    if (!seconds) {
      return '';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calendarDays =
    currentView === 'month' ? generateCalendarDays() : generateWeekDays();
  const attendanceSummary = calculateAttendanceSummary();

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 ${className}`}
      ref={calendarRef}
    >
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* View switcher */}
      <div className="flex justify-center mb-4">
        <div
          className="bg-gray-100 rounded-lg p-1 flex"
          role="tablist"
          aria-label="Calendar view options"
        >
          <AccessibleButton
            variant={currentView === 'month' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleViewChange('month')}
            ariaLabel="Switch to month view"
            malayalamLabel="മാസം"
            className="!min-h-[44px] !px-4"
            role="tab"
            aria-selected={currentView === 'month'}
            aria-controls="calendar-grid"
          >
            Month
          </AccessibleButton>
          <AccessibleButton
            variant={currentView === 'week' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleViewChange('week')}
            ariaLabel="Switch to week view"
            malayalamLabel="ആഴ്ച"
            className="!min-h-[44px] !px-4 ml-1"
            role="tab"
            aria-selected={currentView === 'week'}
            aria-controls="calendar-grid"
          >
            Week
          </AccessibleButton>
        </div>
      </div>

      {/* Attendance Statistics Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Attendance Summary
          <span className="text-sm text-gray-600 ml-2" lang="ml">
            ഹാജർ സംഗ്രഹം
          </span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {attendanceSummary.totalDays}
            </div>
            <div className="text-sm text-gray-600">
              Total Days
              <div className="text-xs" lang="ml">
                മൊത്തം ദിവസങ്ങൾ
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-success-600">
              {attendanceSummary.presentDays}
            </div>
            <div className="text-sm text-gray-600">
              Present
              <div className="text-xs" lang="ml">
                ഹാജർ
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-error-600">
              {attendanceSummary.absentDays}
            </div>
            <div className="text-sm text-gray-600">
              Absent
              <div className="text-xs" lang="ml">
                ഹാജരല്ല
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {attendanceSummary.attendancePercentage}%
            </div>
            <div className="text-sm text-gray-600">
              Percentage
              <div className="text-xs" lang="ml">
                ശതമാനം
              </div>
            </div>
          </div>
        </div>

        {/* Additional stats if available */}
        {attendanceStats && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Streak:</span>
                <span className="ml-2 font-semibold text-primary-600">
                  {attendanceStats.consecutiveDaysPresent} days
                </span>
              </div>
              <div>
                <span className="text-gray-600">Longest Streak:</span>
                <span className="ml-2 font-semibold text-success-600">
                  {attendanceStats.longestStreak} days
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <AccessibleButton
          variant="secondary"
          size="sm"
          onClick={currentView === 'month' ? handlePrevMonth : handlePrevWeek}
          ariaLabel={
            currentView === 'month' ? 'Previous month' : 'Previous week'
          }
          className="!min-w-[44px] !min-h-[44px]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </AccessibleButton>

        <div className="text-center">
          {currentView === 'month' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentMonth - 1]} {currentYear}
              </h2>
              <p className="text-sm text-gray-600" lang="ml">
                {malayalamMonths[currentMonth - 1]} {currentYear}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentWeekStart.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {new Date(
                  currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h2>
              <p className="text-sm text-gray-600" lang="ml">
                ആഴ്ച കാഴ്ച
              </p>
            </>
          )}
        </div>

        <AccessibleButton
          variant="secondary"
          size="sm"
          onClick={currentView === 'month' ? handleNextMonth : handleNextWeek}
          ariaLabel={currentView === 'month' ? 'Next month' : 'Next week'}
          className="!min-w-[44px] !min-h-[44px]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </AccessibleButton>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div key={day} className="text-center py-2">
            <div className="text-sm font-medium text-gray-700">{day}</div>
            <div className="text-xs text-gray-500" lang="ml">
              {malayalamWeekDays[index]}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className={`grid gap-1 ${currentView === 'month' ? 'grid-cols-7' : 'grid-cols-7'}`}
        id="calendar-grid"
        role="grid"
        aria-label={`${currentView === 'month' ? 'Monthly' : 'Weekly'} attendance calendar`}
        onKeyDown={e => {
          // Handle grid navigation
          const focusedElement = document.activeElement as HTMLButtonElement;
          const dateAttr = focusedElement?.getAttribute('data-date');
          if (dateAttr) {
            const focusedDate = new Date(dateAttr);
            handleKeyDown(e, focusedDate);
          }
        }}
      >
        {calendarDays.map((day, index) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          const hasAttendance = day.status !== undefined;
          const dateKey = day.date.toISOString().split('T')[0];
          const isCurrentPeriod =
            currentView === 'month' ? day.isCurrentMonth : day.isCurrentWeek;

          return (
            <button
              key={index}
              onClick={() => onDateSelect?.(day.date)}
              data-date={dateKey}
              className={`
                relative p-2 min-h-[44px] rounded-lg border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                focus-visible:ring-2 focus-visible:ring-primary-500
                ${
                  isCurrentPeriod
                    ? hasAttendance
                      ? getStatusColor(day.status)
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    : 'bg-gray-50 text-gray-400 border-gray-100'
                }
                ${isToday ? 'ring-2 ring-primary-400' : ''}
                ${currentView === 'week' ? 'min-h-[80px]' : ''}
              `}
              disabled={!isCurrentPeriod}
              role="gridcell"
              tabIndex={isToday ? 0 : -1}
              aria-label={`
                ${day.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                ${hasAttendance ? `, Status: ${day.status}` : ', No class scheduled'}
                ${day.duration ? `, Duration: ${formatDuration(day.duration)}` : ''}
                ${day.notes ? `, Notes: ${day.notes}` : ''}
                ${isToday ? ', Today' : ''}
              `}
              aria-selected={hasAttendance}
              aria-describedby={
                hasAttendance ? `status-${day.status}` : undefined
              }
            >
              <div className="flex flex-col items-center">
                {currentView === 'week' && (
                  <div className="text-xs text-gray-500 mb-1">
                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                )}

                <span
                  className={`text-sm font-medium ${isToday ? 'font-bold' : ''}`}
                >
                  {currentView === 'week'
                    ? day.date.getDate()
                    : day.date.getDate()}
                </span>

                {hasAttendance && (
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-xs" aria-hidden="true">
                      {getStatusIcon(day.status)}
                    </span>
                    {currentView === 'week' && day.status && (
                      <span className="text-xs capitalize mt-1">
                        {day.status}
                      </span>
                    )}
                  </div>
                )}

                {day.duration && currentView === 'week' && (
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

      {/* Legend and Instructions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Attendance Legend
          <span className="text-xs text-gray-500 ml-2" lang="ml">
            ഹാജർ വിവരണം
          </span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="flex items-center" id="status-present">
            <div className="w-4 h-4 bg-success-100 border border-success-300 rounded mr-2 flex items-center justify-center">
              <span className="text-success-800" aria-hidden="true">
                ✓
              </span>
            </div>
            <span>Present / ഹാജർ</span>
          </div>

          <div className="flex items-center" id="status-absent">
            <div className="w-4 h-4 bg-error-100 border border-error-300 rounded mr-2 flex items-center justify-center">
              <span className="text-error-800" aria-hidden="true">
                ✗
              </span>
            </div>
            <span>Absent / ഹാജരല്ല</span>
          </div>

          <div className="flex items-center" id="status-late">
            <div className="w-4 h-4 bg-warning-100 border border-warning-300 rounded mr-2 flex items-center justify-center">
              <span className="text-warning-800" aria-hidden="true">
                ⏰
              </span>
            </div>
            <span>Late / വൈകി</span>
          </div>

          <div className="flex items-center" id="status-excused">
            <div className="w-4 h-4 bg-primary-100 border border-primary-300 rounded mr-2 flex items-center justify-center">
              <span className="text-primary-800" aria-hidden="true">
                📝
              </span>
            </div>
            <span>Excused / അനുവാദം</span>
          </div>
        </div>

        {/* Keyboard navigation instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
          <p className="font-medium mb-1">Keyboard Navigation:</p>
          <p>
            Use arrow keys to navigate dates, Home/End for first/last day of
            month, Enter/Space to select
          </p>
          <p lang="ml" className="mt-1">
            കീബോർഡ് നാവിഗേഷൻ: ആരോ കീകൾ ഉപയോഗിച്ച് തീയതികൾ നാവിഗേറ്റ് ചെയ്യുക
          </p>
        </div>
      </div>
    </div>
  );
};
