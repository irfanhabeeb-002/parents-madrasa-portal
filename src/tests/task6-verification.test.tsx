/**
 * Task 6 Verification Test
 * 
 * This test verifies that all requirements for task 6 have been implemented:
 * - Ensure complete removal of all user data from localStorage
 * - Verify AuthContext state is properly reset to null
 * - Test that protected routes redirect to auth after logout
 * - Add checks to prevent back-button access to protected pages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import allowedUsers from '../data/allowedUsers.json';

// Mock storage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock console
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Test components
const ProtectedPage: React.FC = () => <div data-testid="protected">Protected</div>;
const AuthPage: React.FC = () => <div data-testid="auth">Auth</div>;

const TestRouter: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<ProtectedRoute requireAuth={false}><AuthPage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><ProtectedPage /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

describe('Task 6: Session Cleanup and Security Measures - Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks
    Object.values(localStorageMock).forEach(mock => mock.mockClear());
    Object.values(sessionStorageMock).forEach(mock => mock.mockClear());
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
    
    localStorageMock.length = 0;
    sessionStorageMock.length = 0;
  });

  describe('✅ Requirement 4.1: Complete removal of all user data from localStorage', () => {
    it('should remove primary auth data and scan for additional auth-related keys', async () => {
      // Setup authenticated user
      const testUser = allowedUsers[0];
      const userData = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });
      
      localStorageMock.getItem.mockReturnValue(userData);
      
      // Mock storage with auth-related keys
      const authKeys = ['manualAuthUser', 'authToken', 'userSession', 'loginData'];
      localStorageMock.length = authKeys.length;
      localStorageMock.key.mockImplementation((index) => authKeys[index] || null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify comprehensive cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userSession');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('loginData');
      
      // Verify sessionStorage cleanup
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('authToken');

      console.log('✅ 4.1 VERIFIED: Complete removal of all user data from localStorage');
    });

    it('should use nuclear cleanup when individual removal fails', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to throw
        }
      });

      // Verify nuclear cleanup
      expect(localStorageMock.clear).toHaveBeenCalled();
      expect(sessionStorageMock.clear).toHaveBeenCalled();

      console.log('✅ 4.1 VERIFIED: Nuclear cleanup fallback mechanism');
    });
  });

  describe('✅ Requirement 4.2: AuthContext state properly reset to null', () => {
    it('should reset user state to null after logout', async () => {
      // Setup authenticated user
      const testUser = allowedUsers[0];
      const userData = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });
      
      localStorageMock.getItem.mockReturnValue(userData);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify user is initially loaded
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.uid).toBe(testUser.uid);

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify state reset
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);

      console.log('✅ 4.2 VERIFIED: AuthContext state properly reset to null');
    });

    it('should force state reset even on logout failure', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to throw
        }
      });

      // Verify forced state reset for security
      expect(result.current.user).toBeNull();

      console.log('✅ 4.2 VERIFIED: Forced state reset on failure');
    });
  });

  describe('✅ Requirement 4.3: Protected routes redirect to auth after logout', () => {
    it('should redirect unauthenticated users to auth page', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('auth')).toBeInTheDocument();
        expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      });

      console.log('✅ 4.3 VERIFIED: Protected routes redirect to auth');
    });

    it('should clear session data before redirect', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestRouter />);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
        expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      });

      console.log('✅ 4.3 VERIFIED: Session data cleared before redirect');
    });
  });

  describe('✅ Requirement 4.4: Prevent back-button access to protected pages', () => {
    it('should set up popstate listener for back-button protection', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestRouter />);

      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      });

      console.log('✅ 4.4 VERIFIED: Popstate listener setup for back-button protection');
    });

    it('should replace history state to prevent back navigation', async () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestRouter />);

      await waitFor(() => {
        expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/auth');
      });

      console.log('✅ 4.4 VERIFIED: History state replacement');
    });
  });

  describe('✅ Requirement 4.5: Additional security measures', () => {
    it('should verify user data integrity and force logout on corruption', async () => {
      // Mock corrupted user data
      localStorageMock.getItem.mockReturnValue('invalid-json');

      render(<TestRouter />);

      await waitFor(() => {
        // Should redirect to auth due to corrupted data
        expect(screen.getByTestId('auth')).toBeInTheDocument();
      });

      console.log('✅ 4.5 VERIFIED: User data integrity verification');
    });

    it('should handle comprehensive error scenarios', async () => {
      // Test multiple failure scenarios
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Critical failure');
      });
      localStorageMock.clear.mockImplementation(() => {
        throw new Error('Clear failed too');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to throw
        }
      });

      // Even with all failures, user state should be cleared for security
      expect(result.current.user).toBeNull();

      console.log('✅ 4.5 VERIFIED: Comprehensive error handling');
    });

    it('should provide enhanced error messages with actionable guidance', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error: any) {
          expect(error.message).toContain('Unable to clear session data');
          expect(error.message).toContain('Try refreshing the page');
          expect(error.actionableGuidance).toBeDefined();
        }
      });

      console.log('✅ 4.5 VERIFIED: Enhanced error messages with actionable guidance');
    });
  });

  describe('🎯 Integration Test: Complete Security Flow', () => {
    it('should perform complete security cleanup and protection flow', async () => {
      // Setup comprehensive test scenario
      const testUser = allowedUsers[0];
      const userData = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });
      
      localStorageMock.getItem.mockReturnValue(userData);
      
      // Mock comprehensive auth data
      const authKeys = [
        'manualAuthUser', 'authUser', 'userSession', 'authToken',
        'accessToken', 'refreshToken', 'loginTime', 'userPreferences'
      ];
      localStorageMock.length = authKeys.length;
      localStorageMock.key.mockImplementation((index) => authKeys[index] || null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state verification
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      expect(result.current.user).not.toBeNull();

      // Perform comprehensive logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify complete security cleanup
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
      
      // Verify all auth keys were removed
      authKeys.forEach(key => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
      });
      
      // Verify sessionStorage cleanup
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      
      // Verify success logging
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Manual logout successful - complete session cleanup performed')
      );

      console.log('🎯 INTEGRATION TEST PASSED: Complete security cleanup and protection flow');
    });
  });
});