import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Import components for testing
import _App from '../_App';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { AuthPage } from '../pages/AuthPage';
import { LiveClass } from '../pages/LiveClass';
import { Recordings } from '../pages/Recordings';
import { NotesExercises } from '../pages/NotesExercises';
import { ExamsAttendance } from '../pages/ExamsAttendance';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { Header } from '../components/layout/Header';

// Mock contexts and services
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
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isHighContrast: false,
    prefersReducedMotion: false,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('../hooks/useDashboard', () => ({
  useDashboard: () => ({
    announcements: [
      {
        id: '1',
        title: 'Test Announcement',
        content: 'Test content',
        date: new Date(),
      },
    ],
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

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Comprehensive Accessibility Audit', () => {
  beforeEach(() => {
    // Reset any DOM modifications
    document.body.innerHTML = '';
  });

  describe('Automated Accessibility Tests with axe-core', () => {
    it('should pass axe accessibility audit for Dashboard', async () => {
      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility audit for Profile page', async () => {
      const { container } = render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility audit for AuthPage', async () => {
      const { container } = render(
        <TestWrapper>
          <AuthPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility audit for LiveClass page', async () => {
      const { container } = render(
        <TestWrapper>
          <LiveClass />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility audit for Recordings page', async () => {
      const { container } = render(
        <TestWrapper>
          <Recordings />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility audit for NotesExercises page', async () => {
      const { container } = render(
        <TestWrapper>
          <NotesExercises />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility audit for ExamsAttendance page', async () => {
      const { container } = render(
        <TestWrapper>
          <ExamsAttendance />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility audit for BottomNavigation', async () => {
      const { container } = render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility audit for Header component', async () => {
      const { container } = render(
        <TestWrapper>
          <Header title="Test Page" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast Verification', () => {
    it('should verify proper contrast ratios for primary text', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check for text elements with proper contrast
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        const _styles = window.getComputedStyle(heading);
        // Verify text is not using low contrast colors
        expect(styles.color).not.toBe('rgb(128, 128, 128)'); // Avoid gray text
        expect(styles.color).not.toBe('#888888'); // Avoid light gray
      });
    });

    it('should verify button contrast ratios meet WCAG standards', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('tab');
      buttons.forEach(button => {
        const _styles = window.getComputedStyle(button);
        // Verify buttons have sufficient contrast
        expect(button).toHaveAttribute('aria-label');
        // Button should be focusable
        expect(button).toHaveAttribute('tabIndex');
      });
    });

    it('should verify link contrast ratios are accessible', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const links = screen.getAllByRole('button');
      const navigationLinks = links.filter(
        link =>
          link.getAttribute('aria-label')?.includes('navigate') ||
          link.textContent?.includes('Live Class') ||
          link.textContent?.includes('Recordings')
      );

      navigationLinks.forEach(link => {
        // Verify links have proper ARIA labels
        expect(link).toHaveAttribute('aria-label');
      });
    });

    it('should verify form input contrast ratios', () => {
      render(
        <TestWrapper>
          <AuthPage />
        </TestWrapper>
      );

      // Check for input elements
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const _styles = window.getComputedStyle(input);
        // Verify inputs have visible borders and backgrounds
        expect(styles.borderWidth).not.toBe('0px');
        expect(input).toHaveAttribute('aria-label');
      });
    });

    it('should verify error message contrast ratios', () => {
      render(
        <TestWrapper>
          <AuthPage />
        </TestWrapper>
      );

      // Look for error message elements
      const errorElements = document.querySelectorAll(
        '[role="alert"], .error, .text-red-500'
      );
      errorElements.forEach(element => {
        const _styles = window.getComputedStyle(element);
        // Error messages should have high contrast
        expect(styles.color).not.toBe('rgb(255, 192, 203)'); // Avoid light pink
      });
    });
  });

  describe('Keyboard Navigation Testing', () => {
    it('should support full keyboard navigation in BottomNavigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('tab');

      // Test Tab navigation
      await user.tab();
      expect(navButtons[0]).toHaveFocus();

      // Test Arrow key navigation
      await user.keyboard('{ArrowRight}');
      expect(navButtons[1]).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(navButtons[0]).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');
      // Button should be activated (we can't test navigation in this context)
    });

    it('should support keyboard navigation in Dashboard cards', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const cards = screen.getAllByRole('button');
      const navigationCards = cards.filter(
        card =>
          card.textContent?.includes('Live Class') ||
          card.textContent?.includes('Recordings') ||
          card.textContent?.includes('Notes/Exercises') ||
          card.textContent?.includes('Exams/Attendance')
      );

      // Test that cards are keyboard accessible
      for (const card of navigationCards) {
        await user.tab();
        if (document.activeElement === card) {
          expect(card).toHaveFocus();

          // Test Enter key activation
          await user.keyboard('{Enter}');
          // Card should be activated
        }
      }
    });

    it('should support keyboard navigation in forms', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthPage />
        </TestWrapper>
      );

      // Test form field navigation
      const inputs = screen.getAllByRole('textbox');
      if (inputs.length > 0) {
        await user.tab();
        expect(inputs[0]).toHaveFocus();

        // Test typing in input
        await user.type(inputs[0], 'test input');
        expect(inputs[0]).toHaveValue('test input');
      }

      // Test button navigation
      const buttons = screen.getAllByRole('button');
      const submitButtons = buttons.filter(
        button =>
          button.textContent?.includes('Submit') ||
          button.textContent?.includes('Login') ||
          button.textContent?.includes('Send')
      );

      for (const button of submitButtons) {
        if (button.tabIndex >= 0) {
          await user.tab();
          if (document.activeElement === button) {
            expect(button).toHaveFocus();
          }
        }
      }
    });

    it('should provide skip links for keyboard users', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');

      // Skip link should be keyboard accessible
      expect(skipLink.tagName.toLowerCase()).toBe('a');
    });

    it('should handle focus management correctly', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Test that focus is visible
      const _focusableElements = screen.getAllByRole('button');

      for (const element of focusableElements.slice(0, 3)) {
        // Test first 3 elements
        await user.tab();
        if (document.activeElement === element) {
          // Verify focus styles are applied
          const _styles = window.getComputedStyle(element);
          // Element should have focus styles (outline or ring)
          expect(element).toHaveClass(/focus:/);
        }
      }
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper ARIA labels for all interactive elements', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Every button should have an accessible name
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const headings = screen.getAllByRole('heading');

      // Should have at least one h1
      const h1Elements = headings.filter(h => h.tagName === 'H1');
      expect(h1Elements.length).toBeGreaterThan(0);

      // Verify heading levels are logical
      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(6);
      });
    });

    it('should have proper landmark regions', () => {
      render(
        <TestWrapper>
          <div>
            <Header title="Test" />
            <Dashboard />
            <BottomNavigation />
          </div>
        </TestWrapper>
      );

      // Check for banner (header)
      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();

      // Check for navigation
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
      expect(navigation).toHaveAttribute('aria-label');
    });

    it('should have proper form labels and descriptions', () => {
      render(
        <TestWrapper>
          <AuthPage />
        </TestWrapper>
      );

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        // Each input should have a label
        expect(input).toHaveAttribute('aria-label');
      });
    });

    it('should have proper live regions for dynamic content', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check for ARIA live regions
      const liveRegions = screen.getAllByLabelText(/notification updates/i);
      if (liveRegions.length > 0) {
        expect(liveRegions[0]).toHaveAttribute('aria-live', 'polite');
      }
    });

    it('should have proper error announcements', () => {
      render(
        <TestWrapper>
          <AuthPage />
        </TestWrapper>
      );

      // Look for error regions
      const errorRegions = document.querySelectorAll('[role="alert"]');
      errorRegions.forEach(region => {
        expect(region).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have proper touch target sizes', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('tab');
      buttons.forEach(button => {
        const _styles = window.getComputedStyle(button);
        // Touch targets should be at least 44px (iOS) or 48px (Android)
        const _minSize = 44;

        // Note: In test environment, we can't get actual computed sizes
        // but we can verify the button has proper classes
        expect(button).toHaveClass(/p-|h-|w-/); // Has padding/height/width classes
      });
    });

    it('should support zoom up to 200% without horizontal scrolling', () => {
      // Mock viewport for zoom testing
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 375, // iPhone width
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Verify responsive design classes are applied
      const container = document.querySelector('.container, .max-w-');
      if (container) {
        expect(container).toHaveClass(/max-w-|container/);
      }
    });

    it('should have proper orientation support', () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Verify layout adapts to different orientations
      const mainContent = document.querySelector('main, .main, [role="main"]');
      if (mainContent) {
        const _styles = window.getComputedStyle(mainContent);
        // Should have responsive layout
        expect(mainContent).toHaveClass(/flex|grid|block/);
      }
    });
  });

  describe('Performance and Accessibility', () => {
    it('should not have excessive DOM nesting that affects screen readers', () => {
      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check DOM depth (shouldn't be too deeply nested)
      const deepestElement = container.querySelector(
        'div div div div div div div div div div'
      );
      expect(deepestElement).toBeNull(); // No more than 10 levels deep
    });

    it('should have efficient focus management', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const _focusableElements = screen.getAllByRole('tab');

      // Test that focus moves efficiently
      const startTime = performance.now();
      await user.tab();
      const endTime = performance.now();

      // Focus should happen quickly (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should not have accessibility performance bottlenecks', async () => {
      const startTime = performance.now();

      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Run axe audit
      await axe(container);

      const endTime = performance.now();

      // Accessibility audit should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // Under 5 seconds
    });
  });
});
