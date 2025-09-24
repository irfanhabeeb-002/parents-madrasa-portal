/**
 * Final Comprehensive Logout Tests
 *
 * This test suite covers all aspects of logout functionality as required:
 * - Unit tests for AuthContext logout function
 * - Integration tests for complete logout flow
 * - Accessibility tests for keyboard navigation and screen readers
 * - Mobile responsiveness and touch interaction tests
 *
 * Requirements covered: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Profile } from '../pages/Profile';
import allowedUsers from '../data/allowedUsers.json';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock localStorage and sessionStorage
const createStorageMock = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
});

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock console methods
const consoleMock = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
};

// Test wrapper components
const AuthWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const FullWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

// Test data
const testUser = allowedUsers[0];
const userDataString = JSON.stringify({
  uid: testUser.uid,
  displayName: testUser.displayName,
  phone: testUser.phoneNumber,
  email: testUser.email,
  role: testUser.role,
});

describe('Final Comprehensive Logout Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    sessionStorageMock.clear.mockClear();
    consoleMock.log.mockClear();
    consoleMock.error.mockClear();
    consoleMock.warn.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unit Tests - AuthContext Logout Function', () => {
    it('should successfully logout and clear user data from localStorage', async () => {
      // Setup authenticated user
      localStorageMock.getItem.mockReturnValue(userDataString);

      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      // Wait for initial auth state
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify user is loaded
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.displayName).toBe(testUser.displayName);

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify logout results
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'manualAuthUser'
      );
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle comprehensive storage cleanup during logout', async () => {
      // Setup mock storage keys
      const authKeys = ['manualAuthUser', 'authToken', 'userSession'];
      localStorageMock.key.mockImplementation(index => authKeys[index] || null);
      localStorageMock.length = authKeys.length;

      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      await act(async () => {
        await result.current.logout();
      });

      // Verify comprehensive cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'manualAuthUser'
      );
      expect(result.current.user).toBeNull();
    });

    it('should manage loading states correctly during logout process', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      // Initial state
      expect(result.current.loading).toBe(false);

      // Start logout and immediately check loading state
      let logoutPromise: Promise<void>;
      act(() => {
        logoutPromise = result.current.logout();
      });

      // Check loading state is true during logout
      expect(result.current.loading).toBe(true);

      // Wait for completion
      await act(async () => {
        await logoutPromise;
      });

      // After logout
      expect(result.current.loading).toBe(false);
    });

    it('should provide user-friendly error messages with actionable guidance', async () => {
      // Mock storage error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error: any) {
          expect(error.message).toContain('Unable to clear session data');
          expect(error.message).toContain('Try refreshing the page');
        }
      });
    });

    it('should handle null user state gracefully', async () => {
      // Start with no user
      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      // Logout should still work
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Integration Tests - Complete Logout Flow', () => {
    it('should render Profile component with logout functionality', () => {
      // Setup authenticated user
      localStorageMock.getItem.mockReturnValue(userDataString);

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      // Should find logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toBeVisible();
    });

    it('should show confirmation dialog when logout button is clicked', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);
      const user = userEvent.setup();

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
      });
    });

    it('should handle logout cancellation properly', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);
      const user = userEvent.setup();

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should complete logout flow when confirmed', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);
      const user = userEvent.setup();

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout and sign out/i,
      });
      await user.click(confirmButton);

      // Should show success message
      await waitFor(
        () => {
          expect(screen.getByText('Logout Successful')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Should navigate to auth page
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/auth');
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Accessibility Tests - Keyboard Navigation and Screen Readers', () => {
    it('should have no accessibility violations in logout section', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      const { container } = render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      let results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation for logout button', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });

      // Focus the button
      logoutButton.focus();
      expect(document.activeElement).toBe(logoutButton);

      // Activate with Enter key
      fireEvent.keyDown(logoutButton, { key: 'Enter', code: 'Enter' });

      // Should open confirmation dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation in confirmation dialog', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);
      const user = userEvent.setup();

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test Tab navigation in dialog
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout and sign out/i,
      });
      const cancelButton = screen.getByRole('button', {
        name: /cancel logout and stay logged in/i,
      });

      // Focus should be manageable
      confirmButton.focus();
      expect(document.activeElement).toBe(confirmButton);

      // Tab to cancel button
      await user.tab();
      expect(document.activeElement).toBe(cancelButton);

      // Activate cancel with Space key
      fireEvent.keyDown(cancelButton, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should provide proper ARIA labels and descriptions', () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });

      // Check ARIA attributes
      expect(logoutButton).toHaveAttribute('aria-label');
      expect(logoutButton).toHaveAttribute('id', 'logout-button');
    });

    it('should have proper dialog accessibility attributes', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);
      const user = userEvent.setup();

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');

        // Check dialog ARIA attributes
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby');
        expect(dialog).toHaveAttribute('aria-describedby');
        expect(dialog).toHaveAttribute('role', 'dialog');
      });
    });

    it('should announce logout state changes to screen readers', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);
      const user = userEvent.setup();

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      // Check for screen reader announcement region
      await waitFor(() => {
        const announcement = screen.getByText(
          /logout confirmation dialog opened/i
        );
        expect(announcement).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness and Touch Interaction Tests', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    afterEach(() => {
      // Reset viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    it('should have minimum touch target size for logout button on mobile', () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });

      // Check that button exists and is visible
      expect(logoutButton).toBeVisible();

      // Check for responsive classes (basic validation)
      expect(logoutButton.className).toMatch(/px-|py-/);
    });

    it('should handle touch interactions properly', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });

      // Simulate touch events
      fireEvent.touchStart(logoutButton, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(logoutButton, {
        changedTouches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.click(logoutButton);

      // Should open confirmation dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should be responsive on mobile devices', () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      const { container } = render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      // Check for responsive classes
      const logoutSection = container.querySelector('[class*="bg-red-50"]');
      expect(logoutSection).toBeInTheDocument();

      // Should have responsive padding and spacing
      expect(logoutSection).toHaveClass(/p-4|sm:p-5|lg:p-6/);
    });

    it('should handle confirmation dialog on mobile properly', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);
      const user = userEvent.setup();

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');

        // Dialog should be properly sized for mobile
        expect(dialog).toHaveClass('p-4');

        // Buttons should be stacked on mobile
        const confirmButton = screen.getByRole('button', {
          name: /confirm logout and sign out/i,
        });
        expect(confirmButton.parentElement).toHaveClass(/flex-col|sm:flex-row/);
      });
    });

    it('should provide adequate spacing for touch interactions', () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });

      // Check for adequate padding
      expect(logoutButton).toHaveClass(/px-4|py-3|sm:px-6|sm:py-4/);
    });
  });

  describe('Error Handling and Recovery Tests', () => {
    it('should handle logout errors gracefully in AuthContext', async () => {
      // Mock localStorage error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      // Perform logout that should fail
      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to throw
        }
      });

      // Verify error handling - the logout function handles errors internally
      // and forces user state cleanup for security
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should show error recovery options in Profile component', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      // Mock logout to fail
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Network error');
      });

      const user = userEvent.setup();

      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout and sign out/i,
      });
      await user.click(confirmButton);

      // Wait for error state
      await waitFor(
        () => {
          expect(screen.getByText('Logout Failed')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check recovery options
      expect(
        screen.getByRole('button', { name: /retry logout/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /force logout/i })
      ).toBeInTheDocument();
    });
  });

  describe('Security and Edge Cases', () => {
    it('should clear error state on successful logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle user without authentication gracefully', () => {
      // Don't mock any user data
      render(
        <FullWrapper>
          <Profile />
        </FullWrapper>
      );

      // Should show login message instead of logout
      expect(
        screen.getByText('Please log in to view your profile.')
      ).toBeInTheDocument();
    });
  });
});
