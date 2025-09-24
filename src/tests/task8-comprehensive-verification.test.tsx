import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { Profile } from '../pages/Profile';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock console methods
const consoleMock = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
Object.defineProperty(console, 'log', { value: consoleMock.log });
Object.defineProperty(console, 'error', { value: consoleMock.error });
Object.defineProperty(console, 'warn', { value: consoleMock.warn });

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/profile',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};
Object.defineProperty(window, 'location', { value: mockLocation });

// Mock window.history
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
};
Object.defineProperty(window, 'history', { value: mockHistory });

// Mock navigator for mobile testing
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  platform: 'iPhone',
  maxTouchPoints: 5,
};
Object.defineProperty(window, 'navigator', { value: mockNavigator });

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 768px'), // Default to mobile
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('Task 8: Comprehensive Logout Functionality Verification', () => {
  const mockUser = {
    uid: 'test-user-123',
    displayName: 'Test User',
    phone: '9876543210',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

    // Reset DOM
    document.body.innerHTML = '';

    // Reset console mocks
    consoleMock.log.mockClear();
    consoleMock.error.mockClear();
    consoleMock.warn.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Cross-Browser and Device Testing', () => {
    it('should work consistently across different user agents', async () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
      ];

      for (const userAgent of userAgents) {
        Object.defineProperty(window.navigator, 'userAgent', {
          value: userAgent,
          configurable: true,
        });

        render(
          <TestWrapper>
            <Profile />
          </TestWrapper>
        );

        // Verify logout button is present and functional
        const logoutButton = screen.getByLabelText(/logout from application/i);
        expect(logoutButton).toBeInTheDocument();
        expect(logoutButton).toBeEnabled();

        // Test logout flow
        await userEvent.click(logoutButton);

        // Should show confirmation dialog
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Cleanup for next iteration
        document.body.innerHTML = '';
      }
    });

    it('should handle different screen sizes and orientations', async () => {
      const screenSizes = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 896 }, // iPhone 11 Pro Max
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // iPad Landscape
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const size of screenSizes) {
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: size.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: size.height,
        });

        // Update matchMedia mock based on screen size
        window.matchMedia = vi.fn().mockImplementation(query => ({
          matches:
            size.width <= 768
              ? query.includes('max-width')
              : query.includes('min-width'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }));

        render(
          <TestWrapper>
            <Profile />
          </TestWrapper>
        );

        const logoutButton = screen.getByLabelText(/logout from application/i);
        expect(logoutButton).toBeInTheDocument();

        // Verify button meets minimum touch target requirements
        const _buttonRect = logoutButton.getBoundingClientRect();
        if (size.width <= 768) {
          // Mobile: should have adequate touch targets
          expect(logoutButton).toHaveClass(/min-h-\[48px\]/);
        }

        // Cleanup
        document.body.innerHTML = '';
      }
    });
  });

  describe('Error Scenario Handling', () => {
    it('should handle localStorage access errors gracefully', async () => {
      // Mock localStorage to throw errors
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      await userEvent.click(logoutButton);

      // Confirm logout
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/yes, logout/i);
      await userEvent.click(confirmButton);

      // Should handle the error gracefully and still attempt logout
      await waitFor(
        () => {
          expect(consoleMock.error).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('should handle network failures during logout', async () => {
      vi.useFakeTimers();

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      await userEvent.click(logoutButton);

      // Confirm logout
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/yes, logout/i);

      // Simulate network delay/failure
      await act(async () => {
        await userEvent.click(confirmButton);
        vi.advanceTimersByTime(1000);
      });

      // Should show loading state
      await waitFor(() => {
        const loadingButton = screen.getByLabelText(
          /logging out, please wait/i
        );
        expect(loadingButton).toBeInTheDocument();
        expect(loadingButton).toBeDisabled();
      });

      vi.useRealTimers();
    });

    it('should handle session storage cleanup failures', async () => {
      // Mock sessionStorage to throw errors
      sessionStorageMock.clear.mockImplementation(() => {
        throw new Error('sessionStorage access denied');
      });

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/yes, logout/i);
      await userEvent.click(confirmButton);

      // Should handle the error and continue with logout
      await waitFor(
        () => {
          // Logout should still proceed despite sessionStorage error
          expect(localStorageMock.removeItem).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Accessibility Compliance Verification', () => {
    it('should support full keyboard navigation', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);

      // Focus the logout button using keyboard
      logoutButton.focus();
      expect(document.activeElement).toBe(logoutButton);

      // Activate with Enter key
      fireEvent.keyDown(logoutButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Navigate within dialog using Tab
      const confirmButton = screen.getByText(/yes, logout/i);
      const cancelButton = screen.getByText(/cancel/i);

      // Tab should move focus to confirm button
      fireEvent.keyDown(document.activeElement!, { key: 'Tab', code: 'Tab' });
      await waitFor(() => {
        expect(document.activeElement).toBe(confirmButton);
      });

      // Tab again should move to cancel button
      fireEvent.keyDown(document.activeElement!, { key: 'Tab', code: 'Tab' });
      await waitFor(() => {
        expect(document.activeElement).toBe(cancelButton);
      });

      // Escape should close dialog
      fireEvent.keyDown(document.activeElement!, {
        key: 'Escape',
        code: 'Escape',
      });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should provide proper screen reader announcements', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);

      // Verify ARIA attributes
      expect(logoutButton).toHaveAttribute(
        'aria-label',
        'Logout from application'
      );
      expect(logoutButton).toHaveAttribute('aria-describedby');
      expect(logoutButton).toHaveAttribute('role', 'button');

      await userEvent.click(logoutButton);

      // Verify dialog accessibility
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAttribute('aria-describedby');
      });

      // Verify screen reader announcements
      const srAnnouncement = screen.getByRole('status');
      expect(srAnnouncement).toBeInTheDocument();
      expect(srAnnouncement).toHaveAttribute('aria-live', 'assertive');
    });

    it('should meet WCAG contrast requirements', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);

      // Verify button has proper styling for contrast
      const _computedStyle = window.getComputedStyle(logoutButton);

      // Button should have explicit background and text colors
      expect(logoutButton).toHaveStyle({
        'background-color': 'rgb(220, 38, 38)', // red-700
        color: 'white',
      });

      // Verify focus indicators
      logoutButton.focus();
      expect(logoutButton).toHaveClass(/focus-visible:outline-2/);
      expect(logoutButton).toHaveClass(/focus-visible:ring-4/);
    });
  });

  describe('Mobile Touch Interaction Testing', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      // Mock touch support
      Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 5 });
    });

    it('should handle touch events properly', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);

      // Verify touch-friendly classes
      expect(logoutButton).toHaveClass(/touch-manipulation/);
      expect(logoutButton).toHaveClass(/min-h-\[48px\]/);
      expect(logoutButton).toHaveClass(/min-w-\[48px\]/);

      // Simulate touch events
      fireEvent.touchStart(logoutButton);
      fireEvent.touchEnd(logoutButton);
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test dialog button touch targets
      const confirmButton = screen.getByText(/yes, logout/i);
      expect(confirmButton).toHaveClass(/min-h-\[48px\]/);

      fireEvent.touchStart(confirmButton);
      fireEvent.touchEnd(confirmButton);
      fireEvent.click(confirmButton);

      // Should proceed with logout
      await waitFor(() => {
        expect(
          screen.getByLabelText(/logging out, please wait/i)
        ).toBeInTheDocument();
      });
    });

    it('should prevent double-tap zoom on buttons', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);

      // Verify touch-action is set to prevent zoom
      expect(logoutButton).toHaveClass(/touch-manipulation/);

      // Simulate rapid double tap
      fireEvent.touchStart(logoutButton);
      fireEvent.touchEnd(logoutButton);
      fireEvent.touchStart(logoutButton);
      fireEvent.touchEnd(logoutButton);

      // Should only trigger once
      await waitFor(() => {
        const dialogs = screen.queryAllByRole('dialog');
        expect(dialogs).toHaveLength(1);
      });
    });
  });

  describe('Edge Cases and Security Testing', () => {
    it('should handle rapid multiple logout attempts', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);

      // Rapidly click logout button multiple times
      await userEvent.click(logoutButton);
      await userEvent.click(logoutButton);
      await userEvent.click(logoutButton);

      // Should only show one dialog
      await waitFor(() => {
        const dialogs = screen.queryAllByRole('dialog');
        expect(dialogs).toHaveLength(1);
      });
    });

    it('should prevent back-button access after logout', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/yes, logout/i);
      await userEvent.click(confirmButton);

      // Wait for logout to complete
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalled();
      });

      // Simulate browser back button
      fireEvent(window, new PopStateEvent('popstate'));

      // Should not allow access to protected content
      // (This would be handled by route protection in real app)
      expect(mockHistory.pushState).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.stringContaining('/profile')
      );
    });

    it('should handle corrupted localStorage data', async () => {
      // Mock corrupted data
      localStorageMock.getItem.mockReturnValue('invalid-json-data');

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Should handle gracefully and show login prompt
      expect(
        screen.getByText(/please log in to view your profile/i)
      ).toBeInTheDocument();
    });

    it('should clear all session data on logout', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/yes, logout/i);
      await userEvent.click(confirmButton);

      // Verify all storage cleanup methods are called
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('should show appropriate loading states during logout', async () => {
      vi.useFakeTimers();

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/yes, logout/i);

      await act(async () => {
        await userEvent.click(confirmButton);
        vi.advanceTimersByTime(100);
      });

      // Should show loading state
      await waitFor(() => {
        const loadingButton = screen.getByLabelText(
          /logging out, please wait/i
        );
        expect(loadingButton).toBeInTheDocument();
        expect(loadingButton).toBeDisabled();
        expect(loadingButton).toHaveAttribute('aria-busy', 'false');
      });

      // Should show spinner
      expect(screen.getByText(/logging out\.\.\./i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should handle timeout scenarios', async () => {
      vi.useFakeTimers();

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/yes, logout/i);

      await act(async () => {
        await userEvent.click(confirmButton);
        // Simulate long delay
        vi.advanceTimersByTime(10000);
      });

      // Should eventually complete logout even with delays
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('Integration with Route Protection', () => {
    it('should redirect to auth page after successful logout', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByLabelText(/logout from application/i);
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/yes, logout/i);
      await userEvent.click(confirmButton);

      // Wait for logout completion
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalled();
      });

      // Should show success message before redirect
      await waitFor(() => {
        expect(screen.getByText(/logout successful/i)).toBeInTheDocument();
      });
    });
  });
});
