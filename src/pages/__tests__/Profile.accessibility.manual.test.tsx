import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Profile Accessibility Manual Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logout button has proper accessibility attributes', () => {
    renderProfileWithAuth();
    
    const logoutButton = screen.getByRole('button', { name: /logout from application/i });
    
    // Verify basic accessibility attributes
    expect(logoutButton).toHaveAttribute('aria-label', 'Logout from application');
    expect(logoutButton).toHaveAttribute('role', 'button');
    expect(logoutButton).toHaveAttribute('type', 'button');
    expect(logoutButton).toHaveAttribute('id', 'logout-button');
    
    // Verify touch target size (minimum 48px)
    expect(logoutButton).toHaveClass('min-h-[48px]');
    expect(logoutButton).toHaveClass('min-w-[48px]');
    
    // Verify touch manipulation
    expect(logoutButton).toHaveClass('touch-manipulation');
    expect(logoutButton).toHaveClass('tap-highlight-transparent');
    
    // Verify focus styles
    expect(logoutButton).toHaveClass('focus-visible:outline-2');
    expect(logoutButton).toHaveClass('focus-visible:ring-4');
    
    // Verify motion reduction support
    expect(logoutButton).toHaveClass('motion-reduce:transition-none');
    expect(logoutButton).toHaveClass('motion-reduce:active:scale-100');
    
    // Verify forced colors mode support
    expect(logoutButton).toHaveClass('forced-colors:border-2');
    expect(logoutButton).toHaveClass('forced-colors:border-ButtonText');
  });

  test('screen reader announcement component is present', () => {
    renderProfileWithAuth();
    
    // Check for screen reader announcement container
    const announcement = screen.getByRole('status');
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveAttribute('aria-live', 'assertive');
    expect(announcement).toHaveAttribute('aria-atomic', 'true');
    expect(announcement).toHaveClass('sr-only');
  });

  test('logout button has descriptive screen reader text', () => {
    renderProfileWithAuth();
    
    const logoutButton = screen.getByRole('button', { name: /logout from application/i });
    expect(logoutButton).toHaveAttribute('aria-describedby');
    
    // Check for screen reader text element
    const screenReaderText = document.querySelector('#logout-button-sr-text');
    expect(screenReaderText).toBeInTheDocument();
    expect(screenReaderText).toHaveClass('sr-only');
    expect(screenReaderText).toHaveTextContent('Click to logout and return to login page');
  });

  test('confirmation dialog has proper ARIA attributes', async () => {
    renderProfileWithAuth();
    
    const logoutButton = screen.getByRole('button', { name: /logout from application/i });
    fireEvent.click(logoutButton);
    
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'logout-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'logout-dialog-description');
    
    // Check dialog title and description
    expect(screen.getByText('Confirm Logout')).toHaveAttribute('id', 'logout-dialog-title');
    expect(screen.getByText(/Are you sure you want to logout/)).toHaveAttribute('id', 'logout-dialog-description');
  });

  test('confirmation dialog buttons have proper accessibility', async () => {
    renderProfileWithAuth();
    
    const logoutButton = screen.getByRole('button', { name: /logout from application/i });
    fireEvent.click(logoutButton);
    
    const confirmButton = await screen.findByRole('button', { name: /confirm logout and sign out/i });
    const cancelButton = await screen.findByRole('button', { name: /cancel logout and stay logged in/i });
    
    // Check touch targets
    expect(confirmButton).toHaveClass('min-h-[48px]');
    expect(cancelButton).toHaveClass('min-h-[48px]');
    
    // Check IDs for focus management
    expect(confirmButton).toHaveAttribute('id', 'confirm-logout-button');
    expect(cancelButton).toHaveAttribute('id', 'cancel-logout-button');
    
    // Check screen reader text
    const confirmSrText = document.querySelector('#confirm-logout-button-sr-text');
    const cancelSrText = document.querySelector('#cancel-logout-button-sr-text');
    
    expect(confirmSrText).toHaveTextContent('Click to confirm logout and sign out of your account');
    expect(cancelSrText).toHaveTextContent('Click to cancel logout and remain logged in');
  });

  test('error recovery buttons have proper accessibility when logout fails', async () => {
    mockAuthContext.logout.mockRejectedValue(new Error('Network error'));
    renderProfileWithAuth();
    
    const logoutButton = screen.getByRole('button', { name: /logout from application/i });
    fireEvent.click(logoutButton);
    
    const confirmButton = await screen.findByRole('button', { name: /confirm logout/i });
    fireEvent.click(confirmButton);
    
    // Wait for error state
    const retryButton = await screen.findByRole('button', { name: /retry logout/i });
    const forceButton = await screen.findByRole('button', { name: /force logout/i });
    
    // Check touch targets
    expect(retryButton).toHaveClass('min-h-[48px]');
    expect(forceButton).toHaveClass('min-h-[48px]');
    
    // Check IDs
    expect(retryButton).toHaveAttribute('id', 'retry-logout-button');
    expect(forceButton).toHaveAttribute('id', 'force-logout-button');
    
    // Check screen reader text
    const retrySrText = document.querySelector('#retry-logout-button-sr-text');
    const forceSrText = document.querySelector('#force-logout-button-sr-text');
    
    expect(retrySrText).toHaveTextContent('Click to retry the logout process');
    expect(forceSrText).toHaveTextContent('Click to force logout and clear all stored session data. This will immediately log you out.');
  });

  test('logout description has proper ID for aria-describedby', () => {
    renderProfileWithAuth();
    
    const description = screen.getByText(/Sign out of your account and return to the login page/);
    expect(description).toHaveAttribute('id', 'logout-description');
    
    const logoutButton = screen.getByRole('button', { name: /logout from application/i });
    expect(logoutButton.getAttribute('aria-describedby')).toContain('logout-description');
  });

  test('all buttons support keyboard navigation', () => {
    renderProfileWithAuth();
    
    const logoutButton = screen.getByRole('button', { name: /logout from application/i });
    
    // Test focus
    logoutButton.focus();
    expect(logoutButton).toHaveFocus();
    
    // Test keyboard activation
    fireEvent.keyDown(logoutButton, { key: 'Enter', code: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('buttons have proper responsive sizing', () => {
    renderProfileWithAuth();
    
    const logoutButton = screen.getByRole('button', { name: /logout from application/i });
    
    // Check responsive padding classes
    expect(logoutButton).toHaveClass('px-4', 'py-3', 'sm:px-6', 'sm:py-4', 'lg:px-8', 'lg:py-5');
  });
});