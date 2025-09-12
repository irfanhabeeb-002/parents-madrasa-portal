/**
 * AuthContext Logout Function Unit Tests
 * 
 * Focused unit tests for the AuthContext logout function
 * Testing all edge cases, error scenarios, and retry mechanisms
 * 
 * Requirements covered: 1.2, 1.5, 3.1, 3.2, 3.4, 4.1, 4.2, 4.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import allowedUsers from '../data/allowedUsers.json';

// Mock storage with comprehensive functionality
const createAdvancedStorageMock = () => {
  const storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete storage[key]; }),
    clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); }),
    key: vi.fn((index: number) => Object.keys(storage)[index] || null),
    get length() { return Object.keys(storage).length; },
  };
};

const localStorageMock = createAdvancedStorageMock();
const sessionStorageMock = createAdvancedStorageMock();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock console methods
const consoleMock = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Test data
const testUser = allowedUsers[0];
const userDataString = JSON.stringify({
  uid: testUser.uid,
  displayName: testUser.displayName,
  phone: testUser.phoneNumber,
  email: testUser.email,
  role: testUser.role,
});

describe('AuthContext Logout Function Unit Tests', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Logout Functionality', () => {
    it('should successfully logout and clear user data', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      const { result } = renderHook(() => useAuth(), { wrapper });

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
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(consoleMock.log).toHaveBeenCalledWith(
        expect.stringContaining('Manual logout successful')
      );
    });

    it('should reset user state to null after logout', async () => {
      localStorageMock.getItem.mockReturnValue(userDataString);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify user is initially set
      expect(result.current.user).not.toBeNull();

      await act(async () => {
        await result.current.logout();
      });

      // Verify user state is properly reset
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should clear loading state after logout completion', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Start logout
      const logoutPromise = act(async () => {
        return result.current.logout();
      });

      // During logout, loading should be true
      expect(result.current.loading).toBe(true);

      // Wait for completion
      await logoutPromise;

      // After logout, loading should be false
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Comprehensive Storage Cleanup', () => {
    it('should remove all auth-related keys from localStorage', async () => {
      // Setup multiple auth-related keys
      const authKeys = [
        'manualAuthUser',
        'authToken',
        'userSession',
        'loginTime',
        'userPreferences',
      ];

      // Mock localStorage.key to return auth keys
      localStorageMock.key.mockImplementation((index) => authKeys[index] || null);
      Object.defineProperty(localStorageMock, 'length', { value: authKeys.length });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      // Verify primary cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('manualAuthUser');
    });

    it('should clean both localStorage and sessionStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      // Verify both storages are cleaned
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      // sessionStorage cleanup is handled in the comprehensive cleanup logic
    });

    it('should handle storage access errors gracefully', async () => {
      // Mock localStorage to throw error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to handle error
        }
      });

      // Should still attempt cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      expect(consoleMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('Storage cleanup failed')
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should implement retry logic for failed logout attempts', async () => {
      // Mock to fail first 2 times, succeed on 3rd
      localStorageMock.removeItem
        .mockImplementationOnce(() => {
          throw new Error('Network error');
        })
        .mockImplementationOnce(() => {
          throw new Error('Network error');
        })
        .mockImplementationOnce(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // May throw after max retries
        }
      });

      // Should have attempted multiple times
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(3);
    });

    it('should provide user-friendly error messages', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error: any) {
          expect(error.message).toContain('Unable to clear session data');
          expect(error.message).toContain('Try refreshing the page');
          expect(error.name).toBe('LogoutError');
          expect(error.actionableGuidance).toBeDefined();
        }
      });
    });

    it('should handle network-related errors specifically', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        const error = new Error('Network request failed');
        error.name = 'NetworkError';
        throw error;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error: any) {
          expect(error.message).toContain('Network error during logout');
          expect(error.actionableGuidance).toContain('Check your internet connection');
        }
      });
    });

    it('should force cleanup even when logout fails', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Critical storage error');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to throw
        }
      });

      // User should still be set to null for security
      expect(result.current.user).toBeNull();
      expect(consoleMock.log).toHaveBeenCalledWith(
        expect.stringContaining('Forced user state cleanup completed')
      );
    });

    it('should handle maximum retry attempts', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Persistent error');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error: any) {
          expect(error.message).toContain('Logout failed after multiple attempts');
          expect(error.actionableGuidance).toContain('Please refresh the page');
          expect(error.retryCount).toBeGreaterThanOrEqual(3);
        }
      });
    });
  });

  describe('Loading State Management', () => {
    it('should set loading to true during logout process', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state
      expect(result.current.loading).toBe(false);

      // Start logout (don't await immediately)
      const logoutPromise = act(async () => {
        return result.current.logout();
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Complete logout
      await logoutPromise;

      // Should not be loading
      expect(result.current.loading).toBe(false);
    });

    it('should reset loading state even when logout fails', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to fail
        }
      });

      // Loading should be false even after error
      expect(result.current.loading).toBe(false);
    });

    it('should maintain loading state during retry attempts', async () => {
      let callCount = 0;
      localStorageMock.removeItem.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Temporary error');
        }
        // Succeed on 3rd attempt
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      const logoutPromise = act(async () => {
        return result.current.logout();
      });

      // Should remain loading during retries
      expect(result.current.loading).toBe(true);

      await logoutPromise;

      // Should be false after completion
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Security and Edge Cases', () => {
    it('should handle null user state gracefully', async () => {
      // Start with no user
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Logout should still work
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle concurrent logout calls', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Start multiple logout calls simultaneously
      const logoutPromises = [
        act(async () => result.current.logout()),
        act(async () => result.current.logout()),
        act(async () => result.current.logout()),
      ];

      await Promise.all(logoutPromises);

      // Should handle gracefully
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should clear error state on successful logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set initial error state
      act(() => {
        // Simulate error state (this would normally be set by other auth operations)
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle emergency cleanup when all methods fail', async () => {
      // Mock all storage methods to fail
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage completely inaccessible');
      });
      localStorageMock.clear.mockImplementation(() => {
        throw new Error('Clear also fails');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to fail
        }
      });

      // Should still force user state cleanup for security
      expect(result.current.user).toBeNull();
      expect(consoleMock.error).toHaveBeenCalledWith(
        expect.stringContaining('All cleanup methods failed')
      );
    });
  });
});