/**
 * Comprehensive Logout Functionality Tests
 *
 * This test suite covers all aspects of logout functionality:
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
import _allowedUsers from '../data/_allowedUsers.json';

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

const _FullWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

// Test data
const testUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  phone: '9876543210',
  email: 'test@example.com',
  role: 'parent' as const,
};

describe('Comprehensive Logout Functionality Tests', () => {
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
      const userDataString = JSON.stringify(testUser);
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

    it('should implement retry logic for failed logout attempts', async () => {
      // Mock localStorage to fail first time, succeed second time
      localStorageMock.removeItem
        .mockImplementationOnce(() => {
          throw new Error('Storage access denied');
        })
        .mockImplementationOnce(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to eventually succeed after retry
        }
      });

      // Verify retry was attempted
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
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

    it('should manage loading states correctly during logout process', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

      // Initial state
      expect(result.current.loading).toBe(false);

      // Start logout
      const logoutPromise = act(async () => {
        return result.current.logout();
      });

      // During logout
      expect(result.current.loading).toBe(true);

      // Wait for completion
      await logoutPromise;

      // After logout
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Integration Tests - Complete Logout Flow', () => {
    it('should complete full logout flow from Profile page', async () => {
      const mockLogout = vi.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: mockLogout,
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      // Click logout button
      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      // Confirm logout
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await userEvent.click(confirmButton);

      // Verify logout was called
      expect(mockLogout).toHaveBeenCalled();

      // Wait for success message and navigation
      await waitFor(() => {
        expect(screen.getByText('Logout Successful')).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/auth');
        },
        { timeout: 2000 }
      );
    });

    it('should display confirmation dialog with proper messaging', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      // Verify dialog content
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to logout/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/you will be signed out/i)).toBeInTheDocument();
    });

    it('should handle logout cancellation properly', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      const _cancelButton = screen.getByRole('button', {
        name: /cancel logout/i,
      });
      await userEvent.click(cancelButton);

      // Dialog should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should show loading state during logout process', async () => {
      const mockLogout = vi
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(resolve, 100))
        );

      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: mockLogout,
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await userEvent.click(confirmButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });
    });

    it('should provide error recovery options when logout fails', async () => {
      const mockLogout = vi.fn().mockRejectedValue(new Error('Network error'));

      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: mockLogout,
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await userEvent.click(confirmButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      // Check recovery options
      expect(
        screen.getByRole('button', { name: /retry logout/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /force logout/i })
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests - Keyboard Navigation and Screen Readers', () => {
    it('should have no accessibility violations in logout section', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { container } = render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      let results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation for logout button', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

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
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      // Test Tab navigation in dialog
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      const _cancelButton = screen.getByRole('button', {
        name: /cancel logout/i,
      });

      // Focus should be manageable
      confirmButton.focus();
      expect(document.activeElement).toBe(confirmButton);

      // Tab to cancel button
      await userEvent.tab();
      expect(document.activeElement).toBe(cancelButton);

      // Activate cancel with Space key
      fireEvent.keyDown(cancelButton, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should provide proper ARIA labels and descriptions', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Check ARIA attributes
      expect(logoutButton).toHaveAttribute('aria-label');
      expect(logoutButton).toHaveAttribute('aria-describedby');
      expect(logoutButton).toHaveAttribute('id', 'logout-button');
    });

    it('should announce logout state changes to screen readers', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn().mockResolvedValue(undefined),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      // Check for screen reader announcement region
      const announcement = screen.getByText(
        /logout confirmation dialog opened/i
      );
      expect(announcement).toBeInTheDocument();
    });

    it('should have proper dialog accessibility attributes', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      const dialog = screen.getByRole('dialog');

      // Check dialog ARIA attributes
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
      expect(dialog).toHaveAttribute('role', 'dialog');
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

    it('should have minimum touch target size (48px) for logout button', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      const _styles = window.getComputedStyle(logoutButton);

      // Check minimum touch target size
      const height = parseInt(styles.height) || parseInt(styles.minHeight) || 0;
      expect(height).toBeGreaterThanOrEqual(48);
    });

    it('should handle touch interactions properly', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Simulate touch events
      fireEvent.touchStart(logoutButton);
      fireEvent.touchEnd(logoutButton);
      fireEvent.click(logoutButton);

      // Should open confirmation dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should be responsive on mobile devices', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      const { container } = render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      // Check for responsive classes
      const logoutSection = container.querySelector('[class*="bg-red-50"]');
      expect(logoutSection).toBeInTheDocument();

      // Should have responsive padding and spacing
      expect(logoutSection).toHaveClass(/p-4|sm:p-5|lg:p-6/);
    });

    it('should handle confirmation dialog on mobile properly', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      const dialog = screen.getByRole('dialog');

      // Dialog should be properly sized for mobile
      expect(dialog.parentElement).toHaveClass('p-4');

      // Buttons should be stacked on mobile
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      const _cancelButton = screen.getByRole('button', {
        name: /cancel logout/i,
      });

      expect(confirmButton.parentElement).toHaveClass(/flex-col|sm:flex-row/);
    });

    it('should provide adequate spacing for touch interactions', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Check for adequate padding
      const _styles = window.getComputedStyle(logoutButton);
      expect(logoutButton).toHaveClass(/px-4|py-3|sm:px-6|sm:py-4/);
    });

    it('should handle error recovery buttons on mobile', async () => {
      const mockLogout = vi.fn().mockRejectedValue(new Error('Network error'));

      vi.mocked(useAuth).mockReturnValue({
        user: testUser,
        loading: false,
        error: null,
        loginWithPhone: vi.fn(),
        logout: mockLogout,
        clearError: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Profile />
        </BrowserRouter>
      );

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await userEvent.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await userEvent.click(confirmButton);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      // Check recovery buttons are properly sized for mobile
      const retryButton = screen.getByRole('button', { name: /retry logout/i });
      const forceButton = screen.getByRole('button', { name: /force logout/i });

      expect(retryButton).toHaveClass(/px-4|py-3|sm:px-6|sm:py-3/);
      expect(forceButton).toHaveClass(/px-4|py-3|sm:px-6|sm:py-3/);
    });
  });
});
