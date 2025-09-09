import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import type { AttendanceStatus, AttendanceStats } from '../../../types/attendance';

// Mock data for testing
const mockAttendanceData: Record<string, { status: AttendanceStatus; duration?: number; notes?: string }> = {
  '2024-01-15': { status: 'present', duration: 5400, notes: 'Full attendance' },
  '2024-01-16': { status: 'absent' },
  '2024-01-17': { status: 'late', duration: 3600, notes: 'Joined 30 minutes late' },
  '2024-01-18': { status: 'present', duration: 5400 },
  '2024-01-19': { status: 'excused', notes: 'Medical appointment' },
};

const mockAttendanceStats: AttendanceStats = {
  userId: 'user-1',
  totalClasses: 20,
  attendedClasses: 15,
  attendancePercentage: 75,
  consecutiveDaysPresent: 3,
  longestStreak: 7,
  averageDuration: 4800,
  lastAttendedClass: new Date('2024-01-18'),
  monthlyStats: [
    {
      month: 1,
      year: 2024,
      totalClasses: 20,
      attendedClasses: 15,
      attendancePercentage: 75,
      daysPresent: 15,
      daysAbsent: 5
    }
  ]
};

describe('CalendarView Component', () => {
  const defaultProps = {
    month: 1,
    year: 2024,
    attendanceData: mockAttendanceData,
    attendanceStats: mockAttendanceStats,
  };

  it('renders calendar with month view by default', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Check if month header is displayed
    expect(screen.getByText('January 2024')).toBeInTheDocument();
    
    // Check if view switcher is present
    expect(screen.getByRole('tab', { name: /switch to month view/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /switch to week view/i })).toBeInTheDocument();
  });

  it('displays attendance statistics summary', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Check attendance summary
    expect(screen.getByText('Attendance Summary')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Total days
    expect(screen.getByText('2')).toBeInTheDocument(); // Present days
    expect(screen.getByText('1')).toBeInTheDocument(); // Absent days
    expect(screen.getByText('40%')).toBeInTheDocument(); // Percentage
  });

  it('switches between month and week views', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Initially in month view
    expect(screen.getByText('January 2024')).toBeInTheDocument();
    
    // Switch to week view
    const weekButton = screen.getByRole('tab', { name: /switch to week view/i });
    fireEvent.click(weekButton);
    
    // Should show week view header
    expect(screen.getByText(/ആഴ്ച കാഴ്ച/)).toBeInTheDocument();
  });

  it('displays attendance legend with Malayalam translations', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('Attendance Legend')).toBeInTheDocument();
    expect(screen.getByText('Present / ഹാജർ')).toBeInTheDocument();
    expect(screen.getByText('Absent / ഹാജരല്ല')).toBeInTheDocument();
    expect(screen.getByText('Late / വൈകി')).toBeInTheDocument();
    expect(screen.getByText('Excused / അനുവാദം')).toBeInTheDocument();
  });

  it('shows keyboard navigation instructions', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('Keyboard Navigation:')).toBeInTheDocument();
    expect(screen.getByText(/Use arrow keys to navigate dates/)).toBeInTheDocument();
    expect(screen.getByText(/കീബോർഡ് നാവിഗേഷൻ/)).toBeInTheDocument();
  });

  it('calls onDateSelect when a date is clicked', () => {
    const mockOnDateSelect = jest.fn();
    render(<CalendarView {...defaultProps} onDateSelect={mockOnDateSelect} />);
    
    // Find a date button and click it
    const dateButtons = screen.getAllByRole('gridcell');
    const firstDateButton = dateButtons.find(button => !button.disabled);
    
    if (firstDateButton) {
      fireEvent.click(firstDateButton);
      expect(mockOnDateSelect).toHaveBeenCalled();
    }
  });

  it('calls onViewChange when view is switched', () => {
    const mockOnViewChange = jest.fn();
    render(<CalendarView {...defaultProps} onViewChange={mockOnViewChange} />);
    
    const weekButton = screen.getByRole('tab', { name: /switch to week view/i });
    fireEvent.click(weekButton);
    
    expect(mockOnViewChange).toHaveBeenCalledWith('week');
  });

  it('displays additional stats when provided', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('Current Streak:')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
    expect(screen.getByText('Longest Streak:')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
  });

  it('handles navigation between months', () => {
    const mockOnMonthChange = jest.fn();
    render(<CalendarView {...defaultProps} onMonthChange={mockOnMonthChange} />);
    
    const nextButton = screen.getByLabelText('Next month');
    fireEvent.click(nextButton);
    
    expect(mockOnMonthChange).toHaveBeenCalledWith(2, 2024);
  });

  it('is accessible with proper ARIA labels', () => {
    render(<CalendarView {...defaultProps} />);
    
    // Check for proper ARIA roles and labels
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly attendance calendar/)).toBeInTheDocument();
  });
});