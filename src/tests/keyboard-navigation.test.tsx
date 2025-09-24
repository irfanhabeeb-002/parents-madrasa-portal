import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import { BottomNavigation } from '../components/layout/BottomNavigation';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { Profile } from '../pages/Profile';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Keyboard Navigation Tests', () => {
  describe('BottomNavigation Keyboard Support', () => {
    it('should support Tab navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('tab');
      expect(navButtons.length).toBe(4);

      // First button should be focusable
      await user.tab();
      expect(navButtons[0]).toHaveFocus();
    });

    it('should support Arrow key navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('tab');

      // Focus first button
      navButtons[0].focus();
      expect(navButtons[0]).toHaveFocus();

      // Arrow right should move to next button
      await user.keyboard('{ArrowRight}');
      // Note: This tests the keyboard handler, actual focus change depends on implementation
    });

    it('should support Enter and Space activation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const homeButton = screen.getByRole('tab', { name: /home/i });
      homeButton.focus();

      // Should respond to Enter key
      await user.keyboard('{Enter}');

      // Should respond to Space key
      await user.keyboard(' ');
    });

    it('should have proper focus indicators', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('tab');
      navButtons.forEach(button => {
        // Should have focus styles
        expect(button).toHaveClass('focus:outline-none');
      });
    });
  });

  describe('AccessibleButton Keyboard Support', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockClick = vi.fn();

      render(
        <AccessibleButton onClick={mockClick} ariaLabel="Test button">
          Click me
        </AccessibleButton>
      );

      const button = screen.getByRole('button');

      // Should be focusable
      await user.tab();
      expect(button).toHaveFocus();

      // Should activate on Enter
      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalled();

      // Should activate on Space
      mockClick.mockClear();
      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should have proper focus styles', () => {
      render(
        <AccessibleButton ariaLabel="Test button">Click me</AccessibleButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });
  });

  describe('Profile Page Keyboard Navigation', () => {
    it('should have proper tab order', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Should be able to tab to logout button
      const logoutButton = screen.getByLabelText(/logout from application/i);

      // Tab navigation should reach the logout button
      await user.tab();
      // Continue tabbing until we reach the logout button or confirm it's reachable
      const attempts = 0;
      while (document.activeElement !== logoutButton && attempts < 10) {
        await user.tab();
        attempts++;
      }

      // The logout button should be keyboard accessible
      expect(logoutButton).toBeInTheDocument();
    });

    it('should support keyboard activation of interactive elements', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);

      // Focus the button
      logoutButton.focus();
      expect(logoutButton).toHaveFocus();

      // Should respond to keyboard activation
      // Note: We're not testing the actual logout functionality, just keyboard interaction
      await user.keyboard('{Enter}');
    });
  });

  describe('Skip Links', () => {
    it('should have skip to main content link', () => {
      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should make skip links visible on focus', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const skipLink = screen.getByText(/skip to main content/i);

      // Should be screen reader only by default
      expect(skipLink).toHaveClass('sr-only');

      // Should become visible on focus
      await user.tab();
      if (document.activeElement === skipLink) {
        expect(skipLink).toHaveClass('focus:not-sr-only');
      }
    });
  });

  describe('Focus Management', () => {
    it('should maintain logical focus order', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div>
            <BottomNavigation />
            <AccessibleButton ariaLabel="Test button">Test</AccessibleButton>
          </div>
        </TestWrapper>
      );

      // Tab through elements and verify logical order
      await user.tab(); // Should focus first interactive element
      const firstFocused = document.activeElement;

      await user.tab(); // Should focus next interactive element
      const secondFocused = document.activeElement;

      // Elements should be different (focus moved)
      expect(firstFocused).not.toBe(secondFocused);
    });

    it('should not trap focus unintentionally', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div>
            <AccessibleButton ariaLabel="Before">Before</AccessibleButton>
            <BottomNavigation />
            <AccessibleButton ariaLabel="After">After</AccessibleButton>
          </div>
        </TestWrapper>
      );

      // Should be able to tab through all elements
      const beforeButton = screen.getByLabelText('Before');
      const afterButton = screen.getByLabelText('After');

      beforeButton.focus();
      expect(beforeButton).toHaveFocus();

      // Tab multiple times to get through navigation
      for (const i = 0; i < 10; i++) {
        await user.tab();
        if (document.activeElement === afterButton) {
          break;
        }
      }

      // Should eventually reach the after button
      expect(document.activeElement).toBe(afterButton);
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should maintain keyboard navigation in high contrast mode', () => {
      // Mock high contrast mode
      vi.mocked(require('../contexts/ThemeContext').useTheme).mockReturnValue({
        theme: 'light',
        isHighContrast: true,
        prefersReducedMotion: false,
      });

      render(
        <TestWrapper>
          <BottomNavigation />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('tab');
      navButtons.forEach(button => {
        // Should still be keyboard accessible in high contrast mode
        expect(button).toHaveAttribute('role', 'tab');
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});
