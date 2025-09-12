import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Profile } from '../Profile';
import { AuthContext } from '../../contexts/AuthContext';
import '@testing-library/jest-dom';

// Mock the AuthContext
const mockAuthContext = {
  user: {
    uid: 'test-uid',
    displayName: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
  },
  logout: jest.fn(),
  login: jest.fn(),
  loading: false,
};

const renderProfileWithAuth = (authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <Profile />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Profile Accessibility and Mobile Responsiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Touch Target Requirements (WCAG AA)', () => {
    test('logout button meets minimum 48px touch target requirement', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      const styles = window.getComputedStyle(logoutButton);
      
      // Check minimum height and width
      expect(logoutButton).toHaveClass('min-h-[48px]');
      expect(logoutButton).toHaveClass('min-w-[48px]');
    });

    test('retry and force logout buttons meet touch target requirements', async () => {
      mockAuthContext.logout.mockRejectedValue(new Error('Network error'));
      renderProfileWithAuth();
      
      // Trigger logout to show error state
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm logout/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry logout/i });
        const forceButton = screen.getByRole('button', { name: /force logout/i });
        
        expect(retryButton).toHaveClass('min-h-[48px]');
        expect(forceButton).toHaveClass('min-h-[48px]');
      });
    });

    test('confirmation dialog buttons meet touch target requirements', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm logout/i });
        const cancelButton = screen.getByRole('button', { name: /cancel logout/i });
        
        expect(confirmButton).toHaveClass('min-h-[48px]');
        expect(cancelButton).toHaveClass('min-h-[48px]');
      });
    });
  });

  describe('ARIA Labels and Screen Reader Support', () => {
    test('logout button has proper aria-label', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      expect(logoutButton).toHaveAttribute('aria-label', 'Logout from application');
    });

    test('logout button aria-label updates based on state', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm logout/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const updatedButton = screen.getByRole('button', { name: /logging out, please wait/i });
        expect(updatedButton).toHaveAttribute('aria-label', 'Logging out, please wait');
      });
    });

    test('confirmation dialog has proper ARIA attributes', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'logout-dialog-title');
        expect(dialog).toHaveAttribute('aria-describedby', 'logout-dialog-description');
      });
    });

    test('screen reader announcements are present', () => {
      renderProfileWithAuth();
      
      // Check for screen reader announcement container
      const announcement = screen.getByRole('status');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'assertive');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
      expect(announcement).toHaveClass('sr-only');
    });

    test('buttons have descriptive screen reader text', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      expect(logoutButton).toHaveAttribute('aria-describedby');
      
      // Check for screen reader text element
      const screenReaderText = document.querySelector('#logout-button-sr-text');
      expect(screenReaderText).toBeInTheDocument();
      expect(screenReaderText).toHaveClass('sr-only');
    });
  });

  describe('Keyboard Navigation Support', () => {
    test('logout button is focusable and activatable with keyboard', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      
      // Test focus
      logoutButton.focus();
      expect(logoutButton).toHaveFocus();
      
      // Test keyboard activation
      fireEvent.keyDown(logoutButton, { key: 'Enter', code: 'Enter' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('confirmation dialog buttons support keyboard navigation', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm logout/i });
        const cancelButton = screen.getByRole('button', { name: /cancel logout/i });
        
        // Test focus
        confirmButton.focus();
        expect(confirmButton).toHaveFocus();
        
        // Test tab navigation
        fireEvent.keyDown(confirmButton, { key: 'Tab', code: 'Tab' });
        expect(cancelButton).toHaveFocus();
      });
    });

    test('buttons have proper focus styles', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      
      // Check for focus-visible classes
      expect(logoutButton).toHaveClass('focus-visible:outline-2');
      expect(logoutButton).toHaveClass('focus-visible:outline-blue-600');
      expect(logoutButton).toHaveClass('focus-visible:ring-4');
    });
  });

  describe('Mobile Responsiveness', () => {
    test('logout button has responsive padding and sizing', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      
      // Check responsive classes
      expect(logoutButton).toHaveClass('px-4', 'py-3', 'sm:px-6', 'sm:py-4', 'lg:px-8', 'lg:py-5');
    });

    test('confirmation dialog is responsive', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const dialogContent = dialog.querySelector('div');
        
        expect(dialogContent).toHaveClass('max-w-md', 'w-full', 'p-6', 'sm:p-8');
      });
    });

    test('error recovery buttons stack properly on mobile', async () => {
      mockAuthContext.logout.mockRejectedValue(new Error('Network error'));
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm logout/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const buttonContainer = screen.getByRole('button', { name: /retry logout/i }).parentElement;
        expect(buttonContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-3');
      });
    });
  });

  describe('Touch and Interaction Enhancements', () => {
    test('buttons have touch manipulation and tap highlight removal', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      
      expect(logoutButton).toHaveClass('touch-manipulation');
      expect(logoutButton).toHaveClass('tap-highlight-transparent');
    });

    test('buttons have active state scaling for touch feedback', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      
      expect(logoutButton).toHaveClass('active:scale-95');
      expect(logoutButton).toHaveClass('motion-reduce:active:scale-100');
    });

    test('loading states disable pointer events', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm logout/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /logging out, please wait/i });
        expect(loadingButton).toBeDisabled();
        expect(loadingButton).toHaveClass('disabled:pointer-events-none');
      });
    });
  });

  describe('Reduced Motion Support', () => {
    test('animations respect reduced motion preferences', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      
      expect(logoutButton).toHaveClass('motion-reduce:transition-none');
      expect(logoutButton).toHaveClass('motion-reduce:transform-none');
    });

    test('loading spinner respects reduced motion', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm logout/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toHaveClass('motion-reduce:animate-none');
      });
    });
  });

  describe('High Contrast and Forced Colors Support', () => {
    test('buttons have forced colors mode support', () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      
      expect(logoutButton).toHaveClass('forced-colors:border-2');
      expect(logoutButton).toHaveClass('forced-colors:border-ButtonText');
      expect(logoutButton).toHaveClass('forced-colors:focus-visible:outline-ButtonText');
    });
  });

  describe('Screen Reader State Announcements', () => {
    test('announces logout confirmation dialog opening', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('Logout confirmation dialog opened. Please confirm if you want to logout.');
      });
    });

    test('announces logout process states', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm logout/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('Logging out, please wait...');
      });
    });

    test('announces logout cancellation', async () => {
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      const cancelButton = await screen.findByRole('button', { name: /cancel logout/i });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('Logout cancelled. You remain logged in.');
      });
    });

    test('announces logout errors with recovery options', async () => {
      mockAuthContext.logout.mockRejectedValue(new Error('Network error'));
      renderProfileWithAuth();
      
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);
      
      const confirmButton = await screen.findByRole('button', { name: /confirm logout/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/Logout failed.*Retry and force logout options are available/);
      });
    });
  });
});