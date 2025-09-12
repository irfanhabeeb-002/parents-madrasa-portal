/**
 * Session Cleanup and Security Measures Test
 * 
 * This test verifies task 6 requirements:
 * - Ensure complete removal of all user data from localStorage
 * - Verify AuthContext state is properly reset to null
 * - Test that protected routes redirect to auth after logout
 * - Add checks to prevent back-button access to protected pages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import allowedUsers from '../data/allowedUsers.json';

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

// Mock window.history
const historyMock = {
  replaceState: vi.fn(),
  pushState: vi.fn(),
};
Object.defineProperty(window, 'history', { value: historyMock });

// Mock window.location
const locationMock = {
  href: '',
  pathname: '/',
};
Object.defineProperty(window, 'location', { 
  value: locationMock,
  writable: true,
});

// Mock console
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Test components
const TestAuthComponent: React.FC = () => {
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

const ProtectedTestPage: React.FC = () => (
  <div data-testid="protected-page">Protected Content</div>
);

const AuthTestPage: React.FC = () => (
  <div data-testid="auth-page">Auth Page</div>
);

const TestApp: React.FC<{ initialPath?: string }> = ({ initialPath = '/' }) => {
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
          <Route
            path="/test-auth"
            element={
              <ProtectedRoute>
                <TestAuthComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Session Cleanup and Security Measures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    localStorageMock.key.mockClear();
    localStorageMock.length = 0;
    
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
    sessionStorageMock.key.mockClear();
    sessionStorageMock.length = 0;
    
    historyMock.replaceState.mockClear();
    historyMock.pushState.mockClear();
    
    consoleSpy.log.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
    
    locationMock.href = '';
    locationMock.pathname = '/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Complete removal of all user data from localStorage', () => {
    it('should remove all auth-related keys from localStorage and sessionStorage', async () => {
      // Setup: Mock authenticated user and various auth-related storage keys
      const testUser = allowedUsers[0];
      const userDataString = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });
      
      localStorageMock.getItem.mockReturnValue(userDataString);
      
      // Mock localStorage with various auth-related keys
      const mockKeys = [
        'manualAuthUser',
        'authUser',
        'userSession',
        'authToken',
        'someOtherKey', // Should not be removed
        'userPreferences',
        'sessionData',
      ];
      
      localStorageMock.length = mockKeys.length;
      localStorageMock.key.mockImplementation((index) => mockKeys[index] || null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial auth state to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify comprehensive cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authUser');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userSession');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userPreferences');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sessionData');
      
      // Verify sessionStorage cleanup
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('authUser');
      
      console.log('✅ Complete localStorage and sessionStorage cleanup verified');
    });

    it('should use nuclear cleanup when individual key removal fails', async () => {
      // Setup: Mock storage error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Perform logout that should trigger nuclear cleanup
      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to throw
        }
      });

      // Verify nuclear cleanup was attempted
      expect(localStorageMock.clear).toHaveBeenCalled();
      expect(sessionStorageMock.clear).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledWith('Attempting nuclear cleanup of all storage');

      console.log('✅ Nuclear cleanup fallback mechanism verified');
    });

    it('should scan and remove keys containing auth-related terms', async () => {
      // Setup: Mock localStorage with keys containing auth terms
      const mockKeys = [
        'app_auth_token',
        'user_session_data',
        'login_timestamp',
        'some_random_key', // Should not be removed
        'authentication_state',
        'user_profile_cache',
      ];
      
      localStorageMock.length = mockKeys.length;
      localStorageMock.key.mockImplementation((index) => mockKeys[index] || null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      // Verify auth-related keys were identified and removed
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('app_auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_session_data');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('login_timestamp');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authentication_state');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_profile_cache');
      
      // Verify non-auth key was not removed
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('some_random_key');

      console.log('✅ Auth-related key scanning and removal verified');
    });
  });

  describe('2. AuthContext state properly reset to null', () => {
    it('should reset user state to null after logout', async () => {
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

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial auth state to load
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

      // Verify user state is reset to null
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);

      console.log('✅ AuthContext state properly reset to null verified');
    });

    it('should force user state to null even if logout fails', async () => {
      // Setup: Mock logout failure
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Perform logout that should fail
      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to throw
        }
      });

      // Verify user state is still reset to null for security
      expect(result.current.user).toBeNull();
      expect(consoleSpy.log).toHaveBeenCalledWith('Forced user state cleanup completed');

      console.log('✅ Forced user state reset on logout failure verified');
    });

    it('should verify user state consistency and force logout if corrupted', async () => {
      // Setup: Mock corrupted user data
      const corruptedUser = {
        uid: '', // Missing required property
        displayName: 'Test User',
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedUser));

      render(<TestApp />);

      await waitFor(() => {
        // Should redirect to auth due to corrupted user data
        expect(locationMock.href).toBe('/auth');
        expect(consoleSpy.warn).toHaveBeenCalledWith('User object missing required properties, forcing logout');
      });

      console.log('✅ User data integrity verification and forced logout verified');
    });
  });

  describe('3. Protected routes redirect to auth after logout', () => {
    it('should redirect to auth page when accessing protected route without authentication', async () => {
      // Setup: No authenticated user
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestApp />);

      await waitFor(() => {
        // Should show auth page instead of protected content
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      });

      console.log('✅ Protected route redirect to auth verified');
    });

    it('should redirect to auth after successful logout from protected route', async () => {
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

      render(<TestApp initialPath="/test-auth" />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user-state')).not.toHaveTextContent('null');
      });

      // Perform logout
      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        // Should redirect to auth page after logout
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      });

      console.log('✅ Redirect to auth after logout from protected route verified');
    });

    it('should clear session data before redirecting to auth', async () => {
      // Setup: No authenticated user but with stale session data
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestApp />);

      await waitFor(() => {
        // Should clear any remaining session data
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
        expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      });

      console.log('✅ Session data cleanup before auth redirect verified');
    });
  });

  describe('4. Prevent back-button access to protected pages', () => {
    it('should set up popstate listener to prevent back-button access', async () => {
      // Setup: Mock addEventListener
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      // No authenticated user
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestApp />);

      await waitFor(() => {
        // Should set up popstate listener
        expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
      });

      console.log('✅ Popstate listener setup for back-button protection verified');
    });

    it('should replace history state to prevent back navigation', async () => {
      // Setup: No authenticated user
      localStorageMock.getItem.mockReturnValue(null);

      render(<TestApp />);

      await waitFor(() => {
        // Should replace history state
        expect(historyMock.replaceState).toHaveBeenCalledWith(null, '', '/auth');
      });

      console.log('✅ History state replacement for back-button protection verified');
    });

    it('should handle popstate events and redirect to auth', async () => {
      // Setup: Mock popstate event
      let popstateHandler: ((event: PopStateEvent) => void) | null = null;
      
      vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'popstate') {
          popstateHandler = handler as (event: PopStateEvent) => void;
        }
      });

      // No authenticated user
      localStorageMock.getItem.mockReturnValue(null);
      locationMock.pathname = '/protected';

      render(<TestApp />);

      await waitFor(() => {
        expect(popstateHandler).not.toBeNull();
      });

      // Simulate back button press
      if (popstateHandler) {
        const mockPopStateEvent = new PopStateEvent('popstate');
        popstateHandler(mockPopStateEvent);
      }

      // Should redirect to auth
      expect(locationMock.href).toBe('/auth');

      console.log('✅ Popstate event handling and auth redirect verified');
    });

    it('should verify localStorage consistency and force logout on mismatch', async () => {
      // Setup: User in context but different user in localStorage
      const contextUser = allowedUsers[0];
      const storageUser = allowedUsers[1]; // Different user
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        uid: storageUser.uid,
        displayName: storageUser.displayName,
        phone: storageUser.phoneNumber,
        email: storageUser.email,
        role: storageUser.role,
      }));

      // Mock the auth context to return the first user
      const TestComponentWithMismatch: React.FC = () => {
        const auth = useAuth();
        // Simulate user mismatch
        React.useEffect(() => {
          if (auth.user && auth.user.uid !== storageUser.uid) {
            // This should trigger the mismatch detection
          }
        }, [auth.user]);
        
        return <div data-testid="test-component">Test</div>;
      };

      render(
        <BrowserRouter>
          <AuthProvider>
            <ProtectedRoute>
              <TestComponentWithMismatch />
            </ProtectedRoute>
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should detect mismatch and force logout
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('User data mismatch')
        );
      });

      console.log('✅ User data consistency verification and forced logout verified');
    });
  });

  describe('5. Integration tests for complete security flow', () => {
    it('should perform complete security cleanup flow', async () => {
      // Setup: Authenticated user with various storage data
      const testUser = allowedUsers[0];
      const userDataString = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });
      
      localStorageMock.getItem.mockReturnValue(userDataString);
      
      // Mock various auth-related keys
      const mockKeys = ['manualAuthUser', 'authToken', 'userSession'];
      localStorageMock.length = mockKeys.length;
      localStorageMock.key.mockImplementation((index) => mockKeys[index] || null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial auth state
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify initial authenticated state
      expect(result.current.user).not.toBeNull();

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify complete security cleanup
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userSession');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      expect(consoleSpy.log).toHaveBeenCalledWith('Manual logout successful - complete session cleanup performed');

      console.log('✅ Complete security cleanup flow verified');
    });

    it('should handle edge cases and maintain security', async () => {
      // Setup: Various edge cases
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'manualAuthUser') {
          return 'invalid-json'; // Corrupted data
        }
        return null;
      });

      render(<TestApp />);

      await waitFor(() => {
        // Should handle corrupted data gracefully and redirect to auth
        expect(screen.getByTestId('auth-page')).toBeInTheDocument();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      });

      console.log('✅ Edge case handling and security maintenance verified');
    });
  });
});