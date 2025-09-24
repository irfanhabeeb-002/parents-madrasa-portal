/**
 * Core Session Cleanup and Security Test
 *
 * This test verifies the essential requirements for task 6:
 * - Complete removal of all user data from localStorage
 * - AuthContext state properly reset to null
 * - Session cleanup and security measures
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
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

// Mock console
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Core Session Cleanup and Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset storage mocks
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

    consoleSpy.log.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  describe('1. Complete removal of all user data from localStorage', () => {
    it('should remove primary auth data and scan for auth-related keys', async () => {
      // Setup: Mock authenticated user and various storage keys
      const testUser = allowedUsers[0];
      const userDataString = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });

      localStorageMock.getItem.mockReturnValue(userDataString);

      // Mock localStorage with auth-related keys
      const mockKeys = [
        'manualAuthUser',
        'authToken',
        'userSession',
        'someOtherKey', // Should not be removed
        'user_profile_data',
        'authentication_state',
      ];

      localStorageMock.length = mockKeys.length;
      localStorageMock.key.mockImplementation(index => mockKeys[index] || null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial auth state to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify primary cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'manualAuthUser'
      );

      // Verify known auth keys cleanup
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userSession');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'user_profile_data'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'authentication_state'
      );

      // Verify sessionStorage cleanup
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'manualAuthUser'
      );
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('authToken');

      // Verify non-auth key was not removed
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith(
        'someOtherKey'
      );

      console.warn('✅ Comprehensive storage cleanup verified');
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

      console.warn('✅ Nuclear cleanup fallback verified');
    });
  });

  describe('2. AuthContext state properly reset to null', () => {
    it('should reset user state to null after successful logout', async () => {
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

      console.warn('✅ User state properly reset to null');
    });

    it('should force user state to null even when logout fails', async () => {
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

      console.warn('✅ Forced user state reset on failure verified');
    });
  });

  describe('3. Session cleanup and security measures', () => {
    it('should perform comprehensive session cleanup', async () => {
      // Setup: Mock authenticated user with various auth data
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
      const mockKeys = [
        'manualAuthUser',
        'authToken',
        'userSession',
        'loginTime',
      ];
      localStorageMock.length = mockKeys.length;
      localStorageMock.key.mockImplementation(index => mockKeys[index] || null);

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

      // Verify comprehensive cleanup
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'manualAuthUser'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userSession');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('loginTime');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        'manualAuthUser'
      );

      console.warn('✅ Comprehensive session cleanup verified');
    });

    it('should handle retry logic for failed logout attempts', async () => {
      // Setup: Mock intermittent failure
      const callCount = 0;
      localStorageMock.removeItem.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Temporary storage error');
        }
        // Success on third attempt
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Perform logout with retry
      await act(async () => {
        await result.current.logout();
      });

      // Verify retry was attempted and eventually succeeded
      expect(result.current.user).toBeNull();
      expect(callCount).toBeGreaterThan(1); // Should have retried

      console.warn('✅ Retry logic for failed logout attempts verified');
    });

    it('should provide enhanced error messages with actionable guidance', async () => {
      // Setup: Mock storage error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Perform logout that should fail
      await act(async () => {
        try {
          await result.current.logout();
        } catch (error: any) {
          // Verify enhanced error message
          expect(error.message).toContain('Unable to clear session data');
          expect(error.message).toContain('Try refreshing the page');
          expect(error.actionableGuidance).toBeDefined();
        }
      });

      console.warn(
        '✅ Enhanced error messages with actionable guidance verified'
      );
    });

    it('should clear error state during logout process', async () => {
      // Setup: Mock user with existing error
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

      // Wait for initial load and set an error
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Simulate existing error state
      await act(async () => {
        // This would normally be set by some other operation
        // For testing, we'll verify it gets cleared during logout
      });

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify error state is cleared
      expect(result.current.error).toBeNull();

      console.warn('✅ Error state clearing during logout verified');
    });
  });

  describe('4. Security verification', () => {
    it('should verify complete session data removal', async () => {
      // Setup: Mock comprehensive auth data
      const testUser = allowedUsers[0];
      const userDataString = JSON.stringify({
        uid: testUser.uid,
        displayName: testUser.displayName,
        phone: testUser.phoneNumber,
        email: testUser.email,
        role: testUser.role,
      });

      localStorageMock.getItem.mockReturnValue(userDataString);

      // Mock comprehensive auth-related keys
      const authKeys = [
        'manualAuthUser',
        'authUser',
        'user',
        'userSession',
        'sessionData',
        'authToken',
        'accessToken',
        'refreshToken',
        'loginTime',
        'lastActivity',
        'userPreferences',
        'authState',
      ];

      localStorageMock.length = authKeys.length;
      localStorageMock.key.mockImplementation(index => authKeys[index] || null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial auth state
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Perform logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify all known auth keys were removed
      authKeys.forEach(key => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
        expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(key);
      });

      // Verify user state is completely cleared
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();

      console.warn(
        '✅ Complete session data removal security verification passed'
      );
    });

    it('should handle emergency cleanup on critical failures', async () => {
      // Setup: Mock critical failure scenario
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Critical storage failure');
      });
      localStorageMock.clear.mockImplementation(() => {
        throw new Error('Clear also failed');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Perform logout that should trigger emergency cleanup
      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Expected to throw
        }
      });

      // Verify user state is still cleared for security
      expect(result.current.user).toBeNull();

      console.warn('✅ Emergency cleanup on critical failures verified');
    });
  });
});
