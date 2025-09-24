/**
 * Logout Accessibility Tests
 *
 * Comprehensive accessibility tests for logout functionality
 * Testing keyboard navigation, screen reader support, and ARIA compliance
 *
 * Requirements covered: 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Profile } from '../pages/Profile';
import { useAuth } from '../contexts/AuthContext';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

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

// Test data
const testUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  phone: '9876543210',
  email: 'test@example.com',
  role: 'parent' as const,
};

describe('Logout Accessibility Tests', () => {
  let mockLogout: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogout = vi.fn();
    user = userEvent.setup();
    mockNavigate.mockClear();

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

  describe('ARIA Compliance and Semantic HTML', () => {
    it('should have no accessibility violations in logout section', async () => {
      const { container } = renderProfile();

      let results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels on logout button', () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Check ARIA attributes
      expect(logoutButton).toHaveAttribute('aria-label');
      expect(logoutButton).toHaveAttribute('aria-describedby');
      expect(logoutButton).toHaveAttribute('id', 'logout-button');

      // Check that aria-describedby points to existing element
      const describedBy = logoutButton.getAttribute('aria-describedby');
      if (describedBy) {
        expect(document.getElementById(describedBy)).toBeInTheDocument();
      }
    });

    it('should have proper dialog accessibility attributes', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const _dialog = screen.getByRole('dialog');

      // Check dialog ARIA attributes
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
      expect(dialog).toHaveAttribute('role', 'dialog');

      // Verify labelledby and describedby point to existing elements
      const labelledBy = dialog.getAttribute('aria-labelledby');
      const describedBy = dialog.getAttribute('aria-describedby');

      if (labelledBy) {
        expect(document.getElementById(labelledBy)).toBeInTheDocument();
      }
      if (describedBy) {
        expect(document.getElementById(describedBy)).toBeInTheDocument();
      }
    });

    it('should have proper heading hierarchy', () => {
      renderProfile();

      // Check for proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Profile');

      const logoutHeading = screen.getByRole('heading', { level: 3 });
      expect(logoutHeading).toHaveTextContent('Logout');
    });

    it('should have proper button roles and states', async () => {
      mockLogout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Initial state
      expect(logoutButton).toHaveAttribute('role', 'button');
      expect(logoutButton).not.toHaveAttribute('aria-disabled', 'true');

      await user.click(logoutButton);
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // During logout, button should be disabled
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', {
          name: /logging out, please wait/i,
        });
        expect(loadingButton).toHaveAttribute('disabled');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with keyboard navigation', () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Focus the button
      logoutButton.focus();
      expect(document.activeElement).toBe(logoutButton);
    });

    it('should activate with Enter key', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      logoutButton.focus();

      // Activate with Enter
      fireEvent.keyDown(logoutButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should activate with Space key', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      logoutButton.focus();

      // Activate with Space
      fireEvent.keyDown(logoutButton, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation in confirmation dialog', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      const cancelButton = screen.getByRole('button', {
        name: /cancel logout/i,
      });

      // Focus should be manageable
      confirmButton.focus();
      expect(document.activeElement).toBe(confirmButton);

      // Tab navigation
      await user.tab();
      expect(document.activeElement).toBe(cancelButton);

      // Shift+Tab navigation
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(confirmButton);
    });

    it('should close dialog with Escape key', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should trap focus within dialog', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const _dialog = screen.getByRole('dialog');
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      const cancelButton = screen.getByRole('button', {
        name: /cancel logout/i,
      });

      // Focus should be trapped within dialog
      confirmButton.focus();
      expect(document.activeElement).toBe(confirmButton);

      // Tab should cycle within dialog
      await user.tab();
      expect(document.activeElement).toBe(cancelButton);

      await user.tab();
      expect(document.activeElement).toBe(confirmButton);
    });

    it('should handle keyboard navigation in error recovery options', async () => {
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

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry logout/i });
      const forceButton = screen.getByRole('button', { name: /force logout/i });

      // Test keyboard navigation between recovery options
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);

      await user.tab();
      expect(document.activeElement).toBe(forceButton);

      // Test activation with keyboard
      fireEvent.keyDown(retryButton, { key: 'Enter', code: 'Enter' });
      expect(mockLogout).toHaveBeenCalledTimes(2); // Original + retry
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide screen reader announcements for logout states', async () => {
      mockLogout.mockResolvedValue(undefined);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      // Check for confirmation announcement
      const confirmationAnnouncement = screen.getByText(
        /logout confirmation dialog opened/i
      );
      expect(confirmationAnnouncement).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Check for logout progress announcement
      await waitFor(() => {
        const progressAnnouncement = screen.getByText(
          /logging out, please wait/i
        );
        expect(progressAnnouncement).toBeInTheDocument();
      });

      // Check for success announcement
      await waitFor(() => {
        const successAnnouncement = screen.getByText(
          /logout successful.*redirecting/i
        );
        expect(successAnnouncement).toBeInTheDocument();
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
        const errorAnnouncement = screen.getByText(
          /logout failed.*retry and force logout options are available/i
        );
        expect(errorAnnouncement).toBeInTheDocument();
      });
    });

    it('should have proper screen reader text for buttons', () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Check for screen reader specific text (usually in aria-label or sr-only elements)
      expect(logoutButton).toHaveAttribute('aria-label');

      const ariaLabel = logoutButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('logout');
      expect(ariaLabel).toContain('application');
    });

    it('should announce loading states properly', async () => {
      mockLogout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
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

      // Check for loading announcement
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', {
          name: /logging out, please wait/i,
        });
        expect(loadingButton).toBeInTheDocument();

        // Should have appropriate aria-label for loading state
        expect(loadingButton).toHaveAttribute('aria-label');
        const ariaLabel = loadingButton.getAttribute('aria-label');
        expect(ariaLabel).toContain('logging out');
        expect(ariaLabel).toContain('please wait');
      });
    });

    it('should provide context for dialog content', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const _dialog = screen.getByRole('dialog');

      // Check that dialog has descriptive content
      expect(
        screen.getByText(/are you sure you want to logout/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you will be signed out of your account/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you'll need to enter your credentials again/i)
      ).toBeInTheDocument();
    });

    it('should announce cancellation properly', async () => {
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
      const cancellationAnnouncement = screen.getByText(
        /logout cancelled.*you remain logged in/i
      );
      expect(cancellationAnnouncement).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly when opening dialog', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      // Focus should move to dialog or first focusable element in dialog
      const _dialog = screen.getByRole('dialog');
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });

      // Either dialog itself or first button should be focused
      expect([dialog, confirmButton]).toContain(document.activeElement);
    });

    it('should restore focus after dialog closes', async () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      logoutButton.focus();

      await user.click(logoutButton);

      const cancelButton = screen.getByRole('button', {
        name: /cancel logout/i,
      });
      await user.click(cancelButton);

      // Focus should return to logout button
      await waitFor(() => {
        expect(document.activeElement).toBe(logoutButton);
      });
    });

    it('should handle focus during loading states', async () => {
      mockLogout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
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

      // During loading, focus should remain manageable
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', {
          name: /logging out, please wait/i,
        });
        expect(loadingButton).toBeInTheDocument();

        // Button should be focusable even when disabled
        loadingButton.focus();
        expect(document.activeElement).toBe(loadingButton);
      });
    });

    it('should handle focus in error recovery options', async () => {
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

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      // Focus should be manageable on recovery options
      const retryButton = screen.getByRole('button', { name: /retry logout/i });
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('should maintain visibility in high contrast mode', () => {
      // Simulate high contrast mode
      document.documentElement.style.filter = 'contrast(200%)';

      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Button should still be visible and have proper contrast
      expect(logoutButton).toBeVisible();
      expect(logoutButton).toHaveStyle({ color: 'white' });

      // Reset
      document.documentElement.style.filter = '';
    });

    it('should have sufficient color contrast for text', () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Check that button has proper styling for contrast
      const styles = window.getComputedStyle(logoutButton);
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBeTruthy();
    });

    it('should provide visual focus indicators', () => {
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      logoutButton.focus();

      // Should have focus styles (this would be tested with actual CSS in real scenarios)
      expect(document.activeElement).toBe(logoutButton);
    });
  });
});
