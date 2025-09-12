/**
 * Debug Test for Logout Functionality
 * 
 * This test file is designed to verify and debug the current logout functionality
 * as specified in task 1 of the logout-functionality-fix spec.
 * 
 * Test Coverage:
 * - Test the existing logout flow in Profile component
 * - Check for JavaScript errors during logout
 * - Verify localStorage operations and user state management
 * - Test navigation to /auth page after logout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Profile } from '../pages/Profile';
import allowedUsers from '../data/allowedUsers.json';

// Mock console methods to capture logs and errors
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
};

// Mock window.confirm
const confirmSpy = vi.spyOn(window, 'confirm');

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

// Helper component to test AuthContext directly
const AuthTestComponent: React.FC = () => {
  const { user, logout, loading, error } = useAuth();
  
  return (
    <div>
      <div data-testid="user-state">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="loading-state">{loading.toString()}</div>
      <div data-testid="error-state">{error || 'null'}</div>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('Logout Functionality Debug Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
    mockNavigate.mockClear();
    confirmSpy.mockClear();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('1. Test existing logout flow in Profile component', () => {
    it('should render logout button with proper accessibility attributes', () => {
      // Setup: Mock authenticated user
      const testUser = allowedUsers[0];
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      }));

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      // Verify logout button exists and has proper attributes
      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveAttribute('aria-label', 'Logout from application');
      
      // Check minimum touch target size (48px)
      const buttonStyles = window.getComputedStyle(logoutButton);
      expect(logoutButton.style.minHeight).toBe('48px');
      
      console.log('✓ Logout button rendered with proper accessibility attributes');
    });

    it('should show confirmation dialog when logout button is clicked', async () => {
      // Setup: Mock authenticated user and confirm dialog
      const testUser = allowedUsers[0];
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      }));
      confirmSpy.mockReturnValue(false); // User cancels

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);

      // Verify confirmation dialog was called
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to logout?');
      
      console.log('✓ Confirmation dialog shown when logout button clicked');
    });

    it('should handle user cancellation of logout', async () => {
      // Setup: Mock authenticated user and user cancels logout
      const testUser = allowedUsers[0];
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      }));
      confirmSpy.mockReturnValue(false); // User cancels

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        // Verify user cancellation was logged
        expect(consoleSpy.log).toHaveBeenCalledWith('User cancelled logout');
        // Verify no navigation occurred
        expect(mockNavigate).not.toHaveBeenCalled();
        // Verify localStorage was not cleared
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      });

      console.log('✓ User cancellation handled correctly');
    });
  });

  describe('2. Check for JavaScript errors during logout', () => {
    it('should complete logout without JavaScript errors', async () => {
      // Setup: Mock authenticated user and user confirms logout
      const testUser = allowedUsers[0];
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      }));
      confirmSpy.mockReturnValue(true); // User confirms

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        // Verify no errors were logged
        expect(consoleSpy.error).not.toHaveBeenCalled();
        // Verify success was logged
        expect(consoleSpy.log).toHaveBeenCalledWith('Logout successful');
      });

      console.log('✓ Logout completed without JavaScript errors');
    });

    it('should handle and log logout errors properly', async () => {
      // Setup: Mock authenticated user and force logout error
      const testUser = allowedUsers[0];
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      }));
      confirmSpy.mockReturnValue(true);
      
      // Mock localStorage.removeItem to throw an error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        // Verify error was logged
        expect(consoleSpy.error).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      });

      console.log('✓ Logout errors handled and logged properly');
    });
  });

  describe('3. Verify localStorage operations and user state management', () => {
    it('should properly clear localStorage on successful logout', async () => {
      // Setup: Mock authenticated user
      const testUser = allowedUsers[0];
      const userDataString = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });
      localStorageMock.getItem.mockReturnValue(userDataString);

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // Verify user is initially loaded
      expect(screen.getByTestId('user-state')).not.toHaveTextContent('null');

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        // Verify localStorage.removeItem was called with correct key
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
        // Verify user state was reset to null
        expect(screen.getByTestId('user-state')).toHaveTextContent('null');
      });

      console.log('✓ localStorage cleared and user state reset properly');
    });

    it('should handle localStorage errors gracefully', async () => {
      // Setup: Mock localStorage error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        // Verify error was handled
        expect(consoleSpy.error).toHaveBeenCalled();
        // Verify error state was set
        expect(screen.getByTestId('error-state')).toHaveTextContent('Failed to logout');
      });

      console.log('✓ localStorage errors handled gracefully');
    });
  });

  describe('4. Test navigation to /auth page after logout', () => {
    it('should navigate to /auth page after successful logout from Profile', async () => {
      // Setup: Mock authenticated user and successful logout
      const testUser = allowedUsers[0];
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      }));
      confirmSpy.mockReturnValue(true); // User confirms logout

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        // Verify navigation to /auth was called
        expect(mockNavigate).toHaveBeenCalledWith('/auth');
      });

      console.log('✓ Navigation to /auth page works correctly');
    });

    it('should not navigate if logout fails', async () => {
      // Setup: Mock logout failure
      const testUser = allowedUsers[0];
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      }));
      confirmSpy.mockReturnValue(true);
      
      // Force logout to fail
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Logout failed');
      });

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout from application/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        // Verify error was logged
        expect(consoleSpy.error).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
        // Verify navigation was not called
        expect(mockNavigate).not.toHaveBeenCalled();
      });

      console.log('✓ Navigation prevented when logout fails');
    });
  });

  describe('5. Additional debugging checks', () => {
    it('should verify AuthContext logout function behavior', async () => {
      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      
      // Check initial loading state
      expect(screen.getByTestId('loading-state')).toHaveTextContent('false');
      
      fireEvent.click(logoutButton);

      // Verify loading state changes during logout
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('true');
      });

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('false');
      });

      console.log('✓ AuthContext logout function loading states work correctly');
    });

    it('should verify logout timing and delays', async () => {
      const startTime = Date.now();

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('false');
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify logout takes reasonable time (should include 500ms delay)
      expect(duration).toBeGreaterThan(400); // Allow some margin
      expect(duration).toBeLessThan(1000); // Should not take too long

      console.log(`✓ Logout timing verified: ${duration}ms`);
    });
  });
});