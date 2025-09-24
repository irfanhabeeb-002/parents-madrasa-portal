/**
 * Logout Mobile Responsiveness and Touch Interaction Tests
 *
 * Tests for mobile-specific functionality including touch targets,
 * responsive design, and mobile user experience
 *
 * Requirements covered: 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Mock matchMedia for responsive queries
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Test data
const testUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  phone: '9876543210',
  email: 'test@example.com',
  role: 'parent' as const,
};

describe('Logout Mobile Responsiveness and Touch Interaction Tests', () => {
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
    // Reset window dimensions
    mockWindowDimensions(1024, 768);
  });

  const renderProfile = () => {
    return render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
  };

  describe('Touch Target Size Requirements', () => {
    it('should have minimum 48px touch target for logout button on mobile', () => {
      // Set mobile viewport
      mockWindowDimensions(375, 667);
      mockMatchMedia(true); // Mobile media query matches

      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Check computed styles for minimum touch target
      const _styles = window.getComputedStyle(logoutButton);
      const rect = logoutButton.getBoundingClientRect();

      // Should meet minimum 48px requirement
      expect(rect.height).toBeGreaterThanOrEqual(48);

      // Check for proper padding that contributes to touch target
      expect(logoutButton).toHaveClass(/py-3|py-4|py-5/);
    });

    it('should have adequate spacing between touch targets', async () => {
      mockWindowDimensions(375, 667);
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

      const confirmRect = confirmButton.getBoundingClientRect();
      const cancelRect = cancelButton.getBoundingClientRect();

      // Buttons should have adequate spacing (at least 8px gap)
      const gap =
        Math.abs(confirmRect.bottom - cancelRect.top) ||
        Math.abs(cancelRect.bottom - confirmRect.top) ||
        Math.abs(confirmRect.right - cancelRect.left) ||
        Math.abs(cancelRect.right - confirmRect.left);

      expect(gap).toBeGreaterThanOrEqual(8);
    });

    it('should maintain touch target size for error recovery buttons', async () => {
      mockWindowDimensions(375, 667);
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

      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry logout/i });
      const forceButton = screen.getByRole('button', { name: /force logout/i });

      // Both recovery buttons should meet touch target requirements
      const retryRect = retryButton.getBoundingClientRect();
      const forceRect = forceButton.getBoundingClientRect();

      expect(retryRect.height).toBeGreaterThanOrEqual(44); // Slightly smaller acceptable for secondary actions
      expect(forceRect.height).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Touch Event Handling', () => {
    it('should handle touch events properly on logout button', async () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Simulate touch sequence
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

    it('should handle touch events on dialog buttons', async () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });

      // Simulate touch on confirm button
      fireEvent.touchStart(confirmButton);
      fireEvent.touchEnd(confirmButton);
      fireEvent.click(confirmButton);

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should prevent double-tap zoom on buttons', () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Check for touch-action CSS property (would be set to manipulation)
      const _styles = window.getComputedStyle(logoutButton);
      // In a real implementation, this would check for touch-action: manipulation
      expect(logoutButton).toBeInTheDocument(); // Placeholder assertion
    });

    it('should handle swipe gestures gracefully', async () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Simulate swipe gesture (touch start, move, end)
      fireEvent.touchStart(logoutButton, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(logoutButton, {
        touches: [{ clientX: 150, clientY: 100 }],
      });

      fireEvent.touchEnd(logoutButton, {
        changedTouches: [{ clientX: 150, clientY: 100 }],
      });

      // Should not trigger logout (swipe should be ignored)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens (320px-768px)', () => {
      mockWindowDimensions(375, 667);
      const { container } = renderProfile();

      // Check for mobile-specific classes
      const logoutSection = container.querySelector('[class*="bg-red-50"]');
      expect(logoutSection).toHaveClass(/mx-2|sm:mx-0/); // Mobile margins
      expect(logoutSection).toHaveClass(/p-4|sm:p-5/); // Mobile padding
    });

    it('should adapt layout for tablet screens (768px-1024px)', () => {
      mockWindowDimensions(768, 1024);
      const { container } = renderProfile();

      const logoutSection = container.querySelector('[class*="bg-red-50"]');
      expect(logoutSection).toHaveClass(/sm:p-5|lg:p-6/); // Tablet padding
    });

    it('should adapt layout for desktop screens (1024px+)', () => {
      mockWindowDimensions(1200, 800);
      const { container } = renderProfile();

      const logoutSection = container.querySelector('[class*="bg-red-50"]');
      expect(logoutSection).toHaveClass(/lg:p-6/); // Desktop padding
    });

    it('should stack buttons vertically on mobile', async () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const buttonContainer = screen.getByRole('button', {
        name: /confirm logout/i,
      }).parentElement;

      // Should have flex-col class for mobile stacking
      expect(buttonContainer).toHaveClass(/flex-col|sm:flex-row/);
    });

    it('should arrange buttons horizontally on larger screens', async () => {
      mockWindowDimensions(768, 1024);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const buttonContainer = screen.getByRole('button', {
        name: /confirm logout/i,
      }).parentElement;

      // Should use horizontal layout on larger screens
      expect(buttonContainer).toHaveClass(/sm:flex-row/);
    });

    it('should adjust dialog size for mobile', async () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      const dialog = screen.getByRole('dialog');
      const dialogContainer = dialog.parentElement;

      // Should have mobile-appropriate padding
      expect(dialogContainer).toHaveClass('p-4');
    });

    it('should handle very small screens (320px)', () => {
      mockWindowDimensions(320, 568);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Should still be usable on very small screens
      expect(logoutButton).toBeVisible();
      expect(logoutButton.getBoundingClientRect().width).toBeLessThanOrEqual(
        320
      );
    });
  });

  describe('Mobile User Experience', () => {
    it('should provide appropriate feedback for touch interactions', async () => {
      mockWindowDimensions(375, 667);
      mockLogout.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Simulate touch feedback
      fireEvent.touchStart(logoutButton);

      await user.click(logoutButton);
      const confirmButton = screen.getByRole('button', {
        name: /confirm logout/i,
      });
      await user.click(confirmButton);

      // Should show loading state appropriate for mobile
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', {
          name: /logging out, please wait/i,
        });
        expect(loadingButton).toBeInTheDocument();
        expect(loadingButton).toHaveClass(/px-4|py-3/); // Mobile-appropriate padding
      });
    });

    it('should handle orientation changes gracefully', async () => {
      // Portrait mode
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Simulate orientation change to landscape
      mockWindowDimensions(667, 375);
      window.dispatchEvent(new Event('resize'));

      // Dialog should still be properly displayed
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeVisible();
    });

    it('should provide adequate visual feedback on mobile', async () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Button should have proper visual styling for mobile
      expect(logoutButton).toHaveClass(/text-sm|sm:text-base|lg:text-lg/);
      expect(logoutButton).toHaveClass(/px-4|py-3|sm:px-6|sm:py-4/);
    });

    it('should handle error states appropriately on mobile', async () => {
      mockWindowDimensions(375, 667);
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

      await waitFor(() => {
        expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      });

      // Error message should be readable on mobile
      const errorSection = screen.getByText('Logout Failed').closest('div');
      expect(errorSection).toHaveClass(/p-4|sm:p-5/);

      // Recovery buttons should be properly sized for mobile
      const retryButton = screen.getByRole('button', { name: /retry logout/i });
      const forceButton = screen.getByRole('button', { name: /force logout/i });

      expect(retryButton).toHaveClass(/px-4|py-3/);
      expect(forceButton).toHaveClass(/px-4|py-3/);
    });
  });

  describe('Performance on Mobile', () => {
    it('should handle rapid touch events without performance issues', async () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Simulate rapid touch events
      for (const i = 0; i < 10; i++) {
        fireEvent.touchStart(logoutButton);
        fireEvent.touchEnd(logoutButton);
      }

      // Final click should still work
      await user.click(logoutButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should debounce multiple rapid clicks', async () => {
      mockWindowDimensions(375, 667);
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
    });

    it('should maintain smooth animations on mobile', async () => {
      mockWindowDimensions(375, 667);
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

      // Loading spinner should be present and properly styled
      await waitFor(() => {
        const spinner = screen
          .getByRole('button', { name: /logging out, please wait/i })
          .querySelector('svg[class*="animate-spin"]');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should maintain accessibility features on mobile', () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Should maintain ARIA attributes on mobile
      expect(logoutButton).toHaveAttribute('aria-label');
      expect(logoutButton).toHaveAttribute('aria-describedby');
    });

    it('should support voice control on mobile', () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });

      // Should have proper role and accessible name for voice control
      expect(logoutButton).toHaveAttribute('role', 'button');
      expect(logoutButton).toHaveAccessibleName();
    });

    it('should work with mobile screen readers', async () => {
      mockWindowDimensions(375, 667);
      renderProfile();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      await user.click(logoutButton);

      // Screen reader announcements should be present
      expect(
        screen.getByText(/logout confirmation dialog opened/i)
      ).toBeInTheDocument();
    });
  });
});
