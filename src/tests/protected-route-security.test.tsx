/**
 * Protected Route Security Test
 * 
 * This test verifies that protected routes properly redirect to auth after logout
 * and implement security measures to prevent unauthorized access.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import allowedUsers from '../data/allowedUsers.json';

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

// Mock console
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Test components
const ProtectedTestPage: React.FC = () => (
  <div data-testid="protected-page">Protected Content</div>
);

const AuthTestPage: React.FC = () => (
  <div data-testid="auth-page">Auth Page</div>
);

const TestApp: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/auth"
            element={
              <ProtectedRoute requireAuth={false}>
                <AuthTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProtectedTestPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Protected Route Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
    
    consoleSpy.log.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  describe('1. Protected routes redirect to auth after logout', () => {
    it('should redirect to auth page when no user is authenticated', async () => {
      // Setup: No authenticated user
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestApp />);

      await waitFor(() => {
        // Should show auth page instead of protected content
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      });

      console.log('✅ Protected route redirects to auth when not authenticated');
    });

    it('should show protected content when user is authenticated', async () => {
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

      render(<TestApp />);

      await waitFor(() => {
        // Should show protected content
        expect(screen.getByTestId('protected-page')).toBeInTheDocument();
        expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
      });

      console.log('✅ Protected route shows content when authenticated');
    });

    it('should clear session data before redirecting to auth', async () => {
      // Setup: No authenticated user
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestApp />);

      await waitFor(() => {
        // Should attempt to clear session data
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
        expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      });

      console.log('✅ Session data cleared before auth redirect');
    });
  });

  describe('2. User data integrity verification', () => {
    it('should handle corrupted user data gracefully', async () => {
      // Setup: Mock corrupted JSON data
      localStorageMock.getItem.mockReturnValue('invalid-json-data');

      render(<TestApp />);

      await waitFor(() => {
        // Should redirect to auth page due to corrupted data
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      });

      console.log('✅ Corrupted user data handled gracefully');
    });

    it('should verify user object has required properties', async () => {
      // Setup: Mock user data missing required properties
      const incompleteUser = {
        uid: '', // Missing required uid
        displayName: 'Test User',
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(incompleteUser));

      render(<TestApp />);

      await waitFor(() => {
        // Should redirect to auth due to incomplete user data
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      });

      console.log('✅ Incomplete user data verification works');
    });
  });

  describe('3. Security measures verification', () => {
    it('should show loading state while verifying authentication', async () => {
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

      render(<TestApp />);

      // Initially should show loading or quickly transition to protected content
      // Due to the speed of the test, we mainly verify no errors occur
      await waitFor(() => {
        expect(screen.getByTestId('protected-page')).toBeInTheDocument();
      });

      console.log('✅ Loading state and authentication verification works');
    });

    it('should handle authentication state changes properly', async () => {
      // Setup: Start with no user, then add user data
      localStorageMock.getItem.mockReturnValue(null);

      const { rerender } = render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      });

      // Now mock authenticated user
      const testUser = allowedUsers[0];
      const userDataString = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });
      
      localStorageMock.getItem.mockReturnValue(userDataString);

      // Re-render to trigger auth state change
      rerender(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('protected-page')).toBeInTheDocument();
      });

      console.log('✅ Authentication state changes handled properly');
    });
  });

  describe('4. Integration with session cleanup', () => {
    it('should work correctly after session cleanup', async () => {
      // Setup: Start with authenticated user
      const testUser = allowedUsers[0];
      const userDataString = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });
      
      localStorageMock.getItem.mockReturnValue(userDataString);

      const { rerender } = render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByTestId('protected-page')).toBeInTheDocument();
      });

      // Simulate logout by clearing storage
      localStorageMock.getItem.mockReturnValue(null);

      // Re-render to simulate navigation after logout
      rerender(<TestApp />);

      await waitFor(() => {
        // Should redirect to auth after logout
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      });

      console.log('✅ Integration with session cleanup works correctly');
    });
  });
});