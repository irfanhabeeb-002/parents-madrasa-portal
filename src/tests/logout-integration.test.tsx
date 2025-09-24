/**
 * Logout Integration Tests
 *
 * End-to-end integration tests for the complete logout flow
 * Testing the interaction between Profile component and AuthContext
 *
 * Requirements covered: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, _fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Profile } from '../pages/Profile';
import { useAuth } from '../contexts/AuthContext';

// Mock the AuthContext
vi.mock('../contexts/AuthContext');
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.location
const mockLocation = {
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Test data
const testUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  phone: '9876543210',
  email: 'test@example.com',
  role: 'parent' as const,
};

describe('Logout Integration Tests', () => {
  let mockLogout: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogout = vi.fn();
    user = userEvent.setup();
    mockNavigate.mockClear();
    mockLocation.href = '';
    mockLocation.assign.mockClear();

    // Default mock implementation
    mockUseAuth.mockReturnValue({
      user: testUser,
      loading: false,
      error: null,
      loginWithPhone: vi.fn(),
      logout: mockLogout,
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderProfile = () => {
    return render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
  };

  describe('Complete Logout Flow', () => {
    it('should complete successful logout flow from start to finish', async () => {
      mockLogout.mockResolvedValue(undefined);
      renderProfile();

      // Step 1: Click logout button
      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      expect(logoutButton).toBeInTheDocument();
      await user.click(logoutButton);

      // Step 2: Verify confirmation dialog appears
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to logout/i)
      ).toBeInTheDocument();

      // Step 3: Confirm logout
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Step 4: Verify logout function is called
      expect(mockLogout).toHaveBeenCalledTimes(1);

      // Step 5: Verify success message appears
      await waitFor(() => {
        expect(screen.getByText('Logout Successful')).toBeInTheDocument();
      });

      // Step 6: Verify navigation occurs
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/auth');
        },
        { timeout: 2000 }
      );
    });

    it('should handle logout cancellation properly', async () => {
      renderProfile();

      // Click logout button
      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      // Verify dialog is open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cancel logout
      const cancelButton = screen.getByRole('button', {
        name: /cancel logout/i,
      });
      await user.click(cancelButton);

      // Verify dialog is closed and logout was not called
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockLogout).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading states during logout process', async () => {
      // Mock logout with delay
      mockLogout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      );
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });

      // Verify loading button state
      const loadingButton = screen.getByRole('button', {
        name: /logging out, please wait/i,
      });
      expect(loadingButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Logout Successful')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should display error message when logout fails', async () => {
      let errorMessage = 'Network connection failed';
      mockLogout.mockRejectedValue(new Error(errorMessage));
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Verify recovery options are available
      expect(
        screen.getByRole('button', { name: /retry logout/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /force logout/i })
      ).toBeInTheDocument();
    });

    it('should handle retry functionality', async () => {
      // Mock to fail first time, succeed second time
      mockLogout
        .mockRejectedValueOnce(new Error('Temporary network error'))
        .mockResolvedValueOnce(undefined);

      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry logout/i });
      await user.click(retryButton);

      // Verify success after retry
      await waitFor(() => {
        expect(screen.getByText('Logout Successful')).toBeInTheDocument();
      });

      expect(mockLogout).toHaveBeenCalledTimes(2);
    });

    it('should handle force logout functionality', async () => {
      mockLogout.mockRejectedValue(new Error('Persistent error'));
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      // Click force logout
      const forceButton = screen.getByRole('button', { name: /force logout/i });
      await user.click(forceButton);

      // Verify force logout success
      await waitFor(() => {
        expect(screen.getByText('Logout Successful')).toBeInTheDocument();
      });

      // Should redirect via window.location.href
      await waitFor(() => {
        expect(mockLocation.href).toBe('/auth');
      });
    });

    it('should display enhanced error messages with actionable guidance', async () => {
      const enhancedError = new Error(
        'Unable to clear session data from your browser. Try refreshing the page or clearing your browser cache, then attempt logout again.'
      );
      enhancedError.name = 'LogoutError';
      (enhancedError as any).actionableGuidance =
        'Try refreshing the page or clearing your browser cache, then attempt logout again.';
      (enhancedError as any).retryCount = 2;

      mockLogout.mockRejectedValue(enhancedError);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Verify enhanced error display
      await waitFor(() => {
        expect(
          screen.getByText('Logout Failed (3 attempts)')
        ).toBeInTheDocument();
        expect(
          screen.getByText(/unable to clear session data/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/try refreshing the page/i)
        ).toBeInTheDocument();
      });

      // Verify help section
      expect(screen.getByText('Having trouble?')).toBeInTheDocument();
      expect(screen.getByText(/clear your browser cache/i)).toBeInTheDocument();
    });
  });

  describe('User Experience Integration', () => {
    it('should provide proper confirmation dialog messaging', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      // Verify comprehensive dialog content
      expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
      expect(
        screen.getByText(/are you sure you want to logout/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you will be signed out of your account/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you'll need to enter your credentials again/i)
      ).toBeInTheDocument();

      // Verify button labels
      expect(
        screen.getByRole('button', { name: /yes, logout/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('should handle multiple rapid clicks gracefully', async () => {
      mockLogout.mockResolvedValue(undefined);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Rapid clicks
      await user.click(logoutButton);
      await user.click(logoutButton);
      await user.click(logoutButton);

      // Should only open one dialog
      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs).toHaveLength(1);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });

      // Rapid confirm clicks
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      // Should only call logout once
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('should maintain proper button states throughout the flow', async () => {
      mockLogout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Initial state
      expect(logoutButton).not.toBeDisabled();
      expect(logoutButton).toHaveTextContent('Logout');

      await user.click(logoutButton);
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // During logout
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', {
          name: /logging out, please wait/i,
        });
        expect(loadingButton).toBeDisabled();
        expect(loadingButton).toHaveTextContent('Logging out...');
      });

      // After success
      await waitFor(() => {
        const successButton = screen.getByRole('button', {
          name: /logout successful/i,
        });
        expect(successButton).toBeDisabled();
        expect(successButton).toHaveTextContent('Success!');
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate to auth page after successful logout', async () => {
      mockLogout.mockResolvedValue(undefined);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Wait for navigation
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/auth');
        },
        { timeout: 2000 }
      );
    });

    it('should not navigate when logout fails', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'));
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should use window.location.href for force logout', async () => {
      mockLogout.mockRejectedValue(new Error('Force logout needed'));
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      const forceButton = screen.getByRole('button', { name: /force logout/i });
      await user.click(forceButton);

      // Should use window.location.href instead of navigate
      await waitFor(() => {
        expect(mockLocation.href).toBe('/auth');
      });
    });
  });

  describe('Screen Reader Integration', () => {
    it('should provide screen reader announcements throughout the flow', async () => {
      mockLogout.mockResolvedValue(undefined);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      // Check for confirmation announcement
      expect(
        screen.getByText(/logout confirmation dialog opened/i)
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Check for logout progress announcement
      await waitFor(() => {
        expect(
          screen.getByText(/logging out, please wait/i)
        ).toBeInTheDocument();
      });

      // Check for success announcement
      await waitFor(() => {
        expect(
          screen.getByText(/logout successful.*redirecting/i)
        ).toBeInTheDocument();
      });
    });

    it('should announce error states to screen readers', async () => {
      mockLogout.mockRejectedValue(new Error('Network error'));
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Check for error announcement
      await waitFor(() => {
        expect(
          screen.getByText(
            /logout failed.*retry and force logout options are available/i
          )
        ).toBeInTheDocument();
      });
    });

    it('should announce cancellation to screen readers', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const cancelButton = screen.getByRole('button', {
        name: /cancel logout/i,
      });
      await user.click(cancelButton);

      // Check for cancellation announcement
      expect(
        screen.getByText(/logout cancelled.*you remain logged in/i)
      ).toBeInTheDocument();
    });
  });
});
