import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithPhoneNumber: vi.fn(),
    signOut: vi.fn(),
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
  storage: {
    ref: vi.fn(),
  },
}));

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock PWA APIs
Object.defineProperty(window, 'caches', {
  writable: true,
  value: {
    keys: vi.fn().mockResolvedValue([]),
    open: vi.fn().mockResolvedValue({
      keys: vi.fn().mockResolvedValue([]),
      match: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue(undefined),
      addAll: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(false),
    }),
    delete: vi.fn().mockResolvedValue(false),
    has: vi.fn().mockResolvedValue(false),
    match: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      scope: '/',
      active: { state: 'activated' },
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(true),
      showNotification: vi.fn().mockResolvedValue(undefined),
    }),
    getRegistration: vi.fn().mockResolvedValue(null),
    getRegistrations: vi.fn().mockResolvedValue([]),
    ready: Promise.resolve({
      scope: '/',
      active: { state: 'activated' },
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(true),
      showNotification: vi.fn().mockResolvedValue(undefined),
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Mock beforeinstallprompt event
Object.defineProperty(window, 'BeforeInstallPromptEvent', {
  writable: true,
  value: class BeforeInstallPromptEvent extends Event {
    platforms = ['web'];
    userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });
    prompt = vi.fn().mockResolvedValue(undefined);
  },
});

// Mock performance API for PWA testing
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    ...window.performance,
    getEntriesByType: vi.fn().mockImplementation((type) => {
      if (type === 'navigation') {
        return [{
          domContentLoadedEventStart: 100,
          domContentLoadedEventEnd: 200,
          loadEventStart: 300,
          loadEventEnd: 400,
        }];
      }
      if (type === 'paint') {
        return [
          { name: 'first-paint', startTime: 150 },
          { name: 'first-contentful-paint', startTime: 200 },
        ];
      }
      return [];
    }),
  },
});
