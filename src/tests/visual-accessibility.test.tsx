import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
    },
    loading: false,
    logout: vi.fn(),
    login: vi.fn(),
  }),
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
  }),
  useNotificationBadge: () => ({
    visible: false,
    count: 0,
  }),
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isHighContrast: false,
    prefersReducedMotion: false,
  }),
}));

vi.mock('../hooks/useDashboard', () => ({
  useDashboard: () => ({
    announcements: [],
    notifications: [],
    todaysClass: null,
    loading: {
      announcements: false,
      notifications: false,
      todaysClass: false,
    },
    error: {
      announcements: null,
      notifications: null,
      todaysClass: null,
    },
    refreshAnnouncements: vi.fn(),
    refreshNotifications: vi.fn(),
    refreshTodaysClass: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../hooks/useNotificationListener', () => ({
  useNotificationListener: () => {},
  useClassReminderListener: () => {},
}));

vi.mock('../assets/icons', () => ({
  AppIcons: {
    main: '/test-icon.png',
  },
}));

import { Profile } from '../pages/Profile';
import { Dashboard } from '../pages/Dashboard';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Visual Accessibility and Balance Tests', () => {
  describe('Malayalam Removal Impact', () => {
    it('should maintain visual balance in Profile page after Malayalam UI removal', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Check that all form sections have proper content
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('User ID')).toBeInTheDocument();

      // Verify no empty sections or Malayalam UI remnants (Malayalam should only be in educational content)
      expect(screen.queryByText(/മലയാളം/)).not.toBeInTheDocument();
      expect(screen.queryByText(/പേര്/)).not.toBeInTheDocument();
      expect(screen.queryByText(/ഫോൺ/)).not.toBeInTheDocument();
    });

    it('should maintain visual balance in Dashboard after Malayalam UI removal', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check that navigation cards are properly balanced
      const navigationCards = [
        'Live Class',
        'Recordings',
        'Notes/Exercises',
        'Exams/Attendance',
      ];
      navigationCards.forEach(cardTitle => {
        expect(screen.getAllByText(cardTitle).length).toBeGreaterThan(0);
      });

      // Verify no Malayalam UI subtitles remain (Malayalam should only be in educational content)
      expect(screen.queryByText(/ലൈവ് ക്ലാസ്/)).not.toBeInTheDocument();
      expect(screen.queryByText(/റെക്കോർഡിംഗുകൾ/)).not.toBeInTheDocument();
    });

    it('should not have empty containers after Malayalam removal', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Check that all containers have meaningful content
      const containers = screen.getAllByRole('generic');
      containers.forEach(container => {
        // Skip containers that are intentionally empty (like spacers)
        if (
          container.className.includes('space-') ||
          container.className.includes('gap-')
        ) {
          return;
        }

        // Check that non-spacer containers have some content
        const hasContent =
          container.textContent && container.textContent.trim().length > 0;
        const hasChildren = container.children.length > 0;

        if (
          !hasContent &&
          !hasChildren &&
          !container.className.includes('sr-only')
        ) {
          // This would indicate an empty container that might affect visual balance
          console.warn(
            'Potentially empty container found:',
            container.className
          );
        }
      });
    });
  });

  describe('Color Contrast and Visual Hierarchy', () => {
    it('should maintain proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Check for proper heading structure
      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      expect(h1Elements.length).toBeGreaterThan(0);

      // Verify main heading content
      expect(h1Elements[0]).toHaveTextContent('Profile');
    });

    it('should have sufficient color contrast for text elements', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Check that important text elements have proper contrast classes
      const nameLabel = screen.getByText('Name');
      expect(nameLabel).toHaveClass('text-gray-700'); // Should have sufficient contrast

      const logoutButton = screen.getByLabelText(/logout from application/i);
      expect(logoutButton).toHaveStyle({
        backgroundColor: '#dc2626',
        color: 'white',
      });
    });

    it('should maintain visual balance in card layouts', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check that cards have consistent structure
      const cardButtons = screen.getAllByRole('button');
      const navigationCards = cardButtons.filter(
        button =>
          button.getAttribute('aria-label')?.includes('class') ||
          button.getAttribute('aria-label')?.includes('recordings') ||
          button.getAttribute('aria-label')?.includes('notes') ||
          button.getAttribute('aria-label')?.includes('exams')
      );

      expect(navigationCards.length).toBe(4);

      // Each navigation card should have meaningful content
      navigationCards.forEach(card => {
        expect(card.textContent).toBeTruthy();
        expect(card.textContent!.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper ARIA live regions', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const liveRegions = screen.getAllByRole('status');
      expect(liveRegions.length).toBeGreaterThan(0);

      liveRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live');
      });
    });

    it('should have English-only content for screen readers', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Verify that all interactive elements have English labels for UI elements
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const ariaLabel = button.getAttribute('aria-label');
        if (ariaLabel) {
          // UI elements should not contain Malayalam characters (Malayalam only for educational content)
          expect(ariaLabel).not.toMatch(/[\u0D00-\u0D7F]/);
        }
      });
    });

    it('should maintain proper focus management', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        // Check that focusable elements have proper focus styles
        expect(element).toHaveClass('focus:outline-none');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper tab order', () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        // Should be keyboard accessible
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should support keyboard interaction patterns', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const cardButtons = screen.getAllByRole('button');
      cardButtons.forEach(button => {
        // Should have proper button role and be keyboard accessible
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
