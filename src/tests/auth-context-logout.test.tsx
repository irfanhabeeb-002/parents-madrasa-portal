/**
 * AuthContext Logout Function Test
 *
 * This test verifies the AuthContext logout function behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import allowedUsers from '../data/allowedUsers.json';

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

// Mock console
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext Logout Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  it('should successfully logout and clear user data', async () => {
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
    expect(consoleSpy.log).toHaveBeenCalledWith('Manual logout successful');

    console.warn('✅ AuthContext logout function works correctly');
  });

  it('should handle logout errors properly', async () => {
    // Setup: Mock localStorage error
    localStorageMock.removeItem.mockImplementation(() => {
      throw new Error('localStorage access denied');
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

    // Verify error handling
    expect(consoleSpy.error).toHaveBeenCalledWith(
      'Logout error:',
      expect.any(Error)
    );
    expect(result.current.error).toBe('Failed to logout');
    expect(result.current.loading).toBe(false);

    console.warn('✅ AuthContext logout error handling works correctly');
  });

  it('should manage loading states during logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initial state should not be loading
    expect(result.current.loading).toBe(false);

    // Start logout and check loading state
    const logoutPromise = act(async () => {
      return result.current.logout();
    });

    // During logout, loading should be true
    expect(result.current.loading).toBe(true);

    // Wait for logout to complete
    await logoutPromise;

    // After logout, loading should be false
    expect(result.current.loading).toBe(false);

    console.warn('✅ AuthContext loading states work correctly during logout');
  });
});
