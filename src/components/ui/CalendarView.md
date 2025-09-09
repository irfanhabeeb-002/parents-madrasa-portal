# CalendarView Component

The CalendarView component is an enhanced calendar component designed for attendance tracking with comprehensive accessibility features, Malayalam language support, and both month and week view capabilities.

## Features

### ✅ Completed Features

1. **Month/Week View Switching**
   - Toggle between month and week views
   - Accessible tab interface with ARIA support
   - Malayalam subtitles for view options

2. **Attendance Statistics Summary**
   - Total days, present days, absent days display
   - Attendance percentage calculation
   - Current streak and longest streak tracking
   - Bilingual labels (English/Malayalam)

3. **Enhanced Accessibility**
   - Full keyboard navigation with arrow keys
   - ARIA roles and labels for screen readers
   - Focus management and visual indicators
   - 44px minimum touch targets
   - High contrast color coding

4. **Visual Indicators**
   - Color-coded attendance status (present/absent/late/excused)
   - Icons for each attendance status
   - Duration display for attended sessions
   - Today indicator

5. **Malayalam Language Support**
   - Bilingual month names and weekday headers
   - Malayalam subtitles for all major UI elements
   - Culturally appropriate translations

## Usage

### Basic Usage

```tsx
import { CalendarView } from '../components/ui/CalendarView';
import { useAttendance } from '../hooks/useAttendance';

function AttendancePage() {
  const { 
    attendanceStats, 
    getAttendanceDataForCalendar 
  } = useAttendance({ userId: 'user-123' });

  const attendanceData = getAttendanceDataForCalendar();

  return (
    <CalendarView
      month={new Date().getMonth() + 1}
      year={new Date().getFullYear()}
      attendanceData={attendanceData}
      attendanceStats={attendanceStats}
      onDateSelect={(date) => console.log('Selected:', date)}
      onMonthChange={(month, year) => console.log('Month changed:', month, year)}
      onWeekChange={(start, end) => console.log('Week changed:', start, end)}
      onViewChange={(view) => console.log('View changed:', view)}
      initialView="month"
    />
  );
}
```

### With Custom Hook

```tsx
import { CalendarExample } from '../components/examples/CalendarExample';

function MyPage() {
  return (
    <CalendarExample 
      userId="user-123" 
      className="max-w-4xl mx-auto"
    />
  );
}
```

## Props

### CalendarViewProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `month` | `number` | ✅ | Current month (1-12) |
| `year` | `number` | ✅ | Current year |
| `attendanceData` | `Record<string, AttendanceInfo>` | ✅ | Attendance data keyed by date (YYYY-MM-DD) |
| `attendanceStats` | `AttendanceStats` | ❌ | Overall attendance statistics |
| `onDateSelect` | `(date: Date) => void` | ❌ | Called when a date is selected |
| `onMonthChange` | `(month: number, year: number) => void` | ❌ | Called when month changes |
| `onWeekChange` | `(start: Date, end: Date) => void` | ❌ | Called when week changes |
| `onViewChange` | `(view: 'month' \| 'week') => void` | ❌ | Called when view changes |
| `initialView` | `'month' \| 'week'` | ❌ | Initial view mode (default: 'month') |
| `className` | `string` | ❌ | Additional CSS classes |

### AttendanceInfo

```tsx
interface AttendanceInfo {
  status: 'present' | 'absent' | 'late' | 'excused';
  duration?: number; // in seconds
  notes?: string;
}
```

### AttendanceStats

```tsx
interface AttendanceStats {
  userId: string;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  consecutiveDaysPresent: number;
  longestStreak: number;
  averageDuration: number;
  lastAttendedClass?: Date;
  monthlyStats: MonthlyAttendanceStats[];
}
```

## Accessibility Features

### Keyboard Navigation
- **Arrow Keys**: Navigate between dates
- **Home/End**: Jump to first/last day of month
- **Enter/Space**: Select a date
- **Tab**: Navigate between interactive elements

### Screen Reader Support
- Comprehensive ARIA labels for all interactive elements
- Live regions for dynamic content announcements
- Proper role attributes (grid, gridcell, tab, tablist)
- Descriptive date information including attendance status

### Visual Accessibility
- High contrast color coding for attendance status
- Minimum 44px touch targets for mobile
- Clear focus indicators
- AA compliant color contrast ratios

## Styling

The component uses TailwindCSS classes and follows the project's design system:

- **Colors**: Primary, success, error, warning color schemes
- **Typography**: Responsive font sizes with Malayalam support
- **Spacing**: Consistent spacing using the design system
- **Responsive**: Mobile-first responsive design

## Integration with Services

The component integrates with the `AttendanceService` through the `useAttendance` hook:

```tsx
const {
  attendanceStats,
  getAttendanceDataForCalendar,
  fetchMonthlyRecord
} = useAttendance({ userId });

// Use in CalendarView
const attendanceData = getAttendanceDataForCalendar();
```

## Testing

The component includes comprehensive tests covering:
- Rendering in different view modes
- User interactions (clicking, keyboard navigation)
- Accessibility compliance
- Data display accuracy
- Event handler calls

Run tests with:
```bash
npm test CalendarView.test.tsx
```

## Requirements Fulfilled

This implementation fulfills all requirements from task 9.4:

✅ **Build CalendarView component for attendance tracking**
✅ **Add visual indicators for present/absent/late status with color coding**
✅ **Implement month/week view switching with accessible navigation**
✅ **Add ARIA labels and keyboard navigation support for date selection**
✅ **Create attendance statistics summary (total days, present days, percentage)**
✅ **Requirements: 5.1, 5.5, 7.1, 7.2**

## Future Enhancements

Potential improvements for future iterations:
- Export calendar data to PDF/CSV
- Custom date range selection
- Attendance goal tracking
- Integration with notification system
- Offline data caching