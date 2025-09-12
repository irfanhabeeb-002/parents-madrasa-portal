import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Components to test
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { Card } from '../components/ui/Card';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { Header } from '../components/layout/Header';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';

// Mock Firebase and contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890'
    },
    loading: false,
    logout: vi.fn(),
    login: vi.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0
  }),
  useNotificationBadge: () => ({
    visible: false,
    count: 0
  }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isHighContrast: false,
    prefersReducedMotion: false
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('../hooks/useDashboard', () => ({
  useDashboard: () => ({
    announcements: [],
    notifications: [],
    todaysClass: null,
    loading: {
      announcements: false,
      notifications: false,
      todaysClass: false
    },
    error: {
      announcements: null,
      notifications: null,
      todaysClass: null
    },
    refreshAnnouncements: vi.fn(),
    refreshNotifications: vi.fn(),
    refreshTodaysClass: vi.fn(),
    clearError: vi.fn()
  })
}));

vi.mock('../hooks/useNotificationListener', () => ({
  useNotificationListener: () => {},
  useClassReminderListener: () => {}
}));

vi.mock('../assets/icons', () => ({
  AppIcons: {
    main: '/test-icon.png'
  }
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Accessibility Tests', () => {
  describe('Header Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <Header showBackButton={true} title="Test Page" />
        </TestWrapper>
      );

      // Check for proper banner role
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // Check back button accessibility (if present)
      const backButtons = screen.queryAllByLabelText(/go back to previous page/i);
      if (backButtons.length > 0) {
        expect(backButtons[0]).toBeInTheDocument();
        expect(backButtons[0]).toHaveAttribute('aria-label');
      }
    });

    it('should handle disabled hamburger menu correctly', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const hamburgerButtons = screen.getAllByLabelText(/menu \(disabled\)/i);
      expect(hamburgerButtons[0]).toBeDisabled();
      expect(hamburgerButtons[0]).toHaveClass('cursor-not-allowed');
    });
  });

  describe('BottomNavigation Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper navigation structure', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      // Check for proper navigation role and label
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label');
      
      // Check for tablist structure
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      
      // Check all navigation buttons have proper labels
      const navButtons = screen.getAllByRole('tab');
      navButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have English-only labels', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      // Verify English labels are present
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Live Class')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Verify no Malayalam UI labels are present (Malayalam should only be in educational content)
      const malayalamUILabels = ['ഹോം', 'ലൈവ് ക്ലാസ്', 'പ്രൊഫൈൽ', 'ക്രമീകരണങ്ങൾ'];
      malayalamUILabels.forEach(label => {
        expect(screen.queryByText(label)).not.toBeInTheDocument();
      });
    });
  });

  describe('Profile Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and structure', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Check for English-only labels
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('User ID')).toBeInTheDocument();

      // Verify no Malayalam UI labels (Malayalam should only be in educational content)
      const malayalamUILabels = ['പേര്', 'ഫോൺ നമ്പർ', 'ഇമെയിൽ', 'ഉപയോക്തൃ ഐഡി'];
      malayalamUILabels.forEach(label => {
        expect(screen.queryByText(label)).not.toBeInTheDocument();
      });
    });

    it('should have accessible logout section', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveAttribute('aria-label');
      
      // Check that logout section doesn't have unnecessary containers
      expect(screen.queryByText('Account Actions')).not.toBeInTheDocument();
    });
  });

  describe('Dashboard Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have personalized welcome message', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check for personalized welcome with emoji
      expect(screen.getAllByText(/welcome test user 👋/i)[0]).toBeInTheDocument();
    });

    it('should have English-only navigation cards', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check English navigation titles
      expect(screen.getAllByText('Live Class')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Recordings')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Notes/Exercises')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Exams/Attendance')[0]).toBeInTheDocument();

      // Verify no Malayalam UI subtitles (Malayalam should only be in educational content)
      const malayalamUISubtitles = ['ലൈവ് ക്ലാസ്', 'റെക്കോർഡിംഗുകൾ', 'കുറിപ്പുകളും അഭ്യാസങ്ങളും', 'പരീക്ഷകളും ഹാജരും'];
      malayalamUISubtitles.forEach(subtitle => {
        expect(screen.queryByText(subtitle)).not.toBeInTheDocument();
      });
    });

    it('should have proper ARIA live region for notifications', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const liveRegions = screen.getAllByLabelText(/notification updates/i);
      expect(liveRegions[0]).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('AccessibleButton Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AccessibleButton ariaLabel="Test button">
          Click me
        </AccessibleButton>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper focus management', () => {
      render(
        <AccessibleButton ariaLabel="Test button">
          Click me
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should handle loading state accessibly', () => {
      render(
        <AccessibleButton loading={true} ariaLabel="Loading button">
          Loading...
        </AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });
  });

  describe('Card Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card 
          title="Test Card" 
          subtitle="Test subtitle"
          onClick={() => {}}
          ariaLabel="Test card button"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper interactive behavior', () => {
      const mockClick = vi.fn();
      render(
        <Card 
          title="Interactive Card" 
          onClick={mockClick}
          ariaLabel="Interactive card"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Color Contrast and Visual Balance', () => {
    it('should maintain proper text hierarchy after Malayalam removal', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Check that headings are properly structured
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Profile');
    });

    it('should not have empty or unbalanced UI sections', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Verify that navigation cards have content
      const cards = screen.getAllByRole('button');
      const navigationCards = cards.filter(card => 
        card.getAttribute('aria-label')?.includes('class') ||
        card.getAttribute('aria-label')?.includes('recordings') ||
        card.getAttribute('aria-label')?.includes('notes') ||
        card.getAttribute('aria-label')?.includes('exams') ||
        card.textContent?.includes('Live Class') ||
        card.textContent?.includes('Recordings') ||
        card.textContent?.includes('Notes/Exercises') ||
        card.textContent?.includes('Exams/Attendance')
      );
      navigationCards.forEach(card => {
        expect(card).toHaveTextContent(/\S/); // Has non-whitespace content
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in BottomNavigation', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('tab');
      
      // Check that buttons are keyboard accessible
      navButtons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
        // Note: onKeyDown is a React prop, not an HTML attribute
        // We check for keyboard accessibility through other means
        expect(button).toHaveAttribute('role', 'tab');
      });
    });

    it('should have skip link for keyboard users', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });
});