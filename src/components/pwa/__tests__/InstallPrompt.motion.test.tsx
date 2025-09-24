import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the theme context
const mockUseTheme = jest.fn();

jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

// Import after mocking
import { InstallPrompt } from '../InstallPrompt';

// Mock beforeinstallprompt event
const createMockInstallPromptEvent = () => {
  const mockEvent = new Event('beforeinstallprompt') as any;
  mockEvent.platforms = ['web'];
  mockEvent.userChoice = Promise.resolve({
    outcome: 'accepted',
    platform: 'web',
  });
  mockEvent.prompt = jest.fn().mockResolvedValue(undefined);
  return mockEvent;
};

describe('InstallPrompt Motion and Animation Preferences', () => {
  let mockEvent: any;

  beforeEach(() => {
    // Reset DOM
    document.documentElement.className = '';

    // Mock matchMedia for motion preferences
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce')
          ? false
          : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Create mock install prompt event
    mockEvent = createMockInstallPromptEvent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Motion Preferences Integration', () => {
    it('should integrate prefersReducedMotion from theme context', async () => {
      // Mock theme with reduced motion
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: true,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      // Wait for banner to appear
      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toBeInTheDocument();

        // Check that animation classes are not applied when motion is reduced
        expect(banner).not.toHaveClass('transition-all');
        expect(banner).not.toHaveClass('animate-slide-up-fade-in');
      });
    });

    it('should apply animation classes when motion is not reduced', async () => {
      // Mock theme without reduced motion
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: false,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toBeInTheDocument();

        // Check that animation classes are applied when motion is allowed
        expect(banner).toHaveClass('transition-all');
        expect(banner).toHaveClass('animate-slide-up-fade-in');
      });
    });
  });

  describe('Conditional Animation Classes', () => {
    it('should conditionally apply hover animations based on motion preferences', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: false,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });
        expect(installButton).toHaveClass('hover:scale-105');
        expect(installButton).toHaveClass('active:scale-95');
        expect(installButton).toHaveClass('transition-all');
      });
    });

    it('should not apply hover animations when motion is reduced', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: true,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });
        expect(installButton).not.toHaveClass('hover:scale-105');
        expect(installButton).not.toHaveClass('active:scale-95');
        expect(installButton).not.toHaveClass('transition-all');
      });
    });

    it('should conditionally apply close button animations', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: false,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', {
          name: /dismiss install banner/i,
        });
        expect(closeButton).toHaveClass('hover:scale-105');
        expect(closeButton).toHaveClass('active:scale-95');
        expect(closeButton).toHaveClass('transition-all');
      });
    });
  });

  describe('Modal Animation Preferences', () => {
    it('should apply modal button animations when motion is allowed', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: false,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more about installing/i,
        });
        fireEvent.click(learnMoreButton);
      });

      await waitFor(() => {
        const modalInstallButton = screen.getByRole('button', {
          name: /install madrasa portal app now on your device/i,
        });
        expect(modalInstallButton).toHaveClass('hover:scale-105');
        expect(modalInstallButton).toHaveClass('active:scale-95');
        expect(modalInstallButton).toHaveClass('transition-all');
      });
    });

    it('should not apply modal button animations when motion is reduced', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: true,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more about installing/i,
        });
        fireEvent.click(learnMoreButton);
      });

      await waitFor(() => {
        const modalInstallButton = screen.getByRole('button', {
          name: /install madrasa portal app now on your device/i,
        });
        expect(modalInstallButton).not.toHaveClass('hover:scale-105');
        expect(modalInstallButton).not.toHaveClass('active:scale-95');
        expect(modalInstallButton).not.toHaveClass('transition-all');
      });
    });

    it('should apply icon hover animations when motion is allowed', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: false,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more about installing/i,
        });
        fireEvent.click(learnMoreButton);
      });

      await waitFor(() => {
        const appIcon = screen.getByRole('img', { name: /mobile app icon/i });
        expect(appIcon).toHaveClass('hover:scale-110');
        expect(appIcon).toHaveClass('hover:shadow-xl');
        expect(appIcon).toHaveClass('transition-all');
      });
    });
  });

  describe('Theme Context Integration', () => {
    it('should properly integrate with theme context motion preferences', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        userTheme: 'dark',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: true,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify that the component respects the theme context motion preference
        expect(banner).not.toHaveClass('transition-all');
        expect(banner).not.toHaveClass('animate-slide-up-fade-in');
      });
    });

    it('should apply animations when motion preferences allow', async () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        userTheme: 'light',
        setTheme: jest.fn(),
        toggleTheme: jest.fn(),
        isHighContrast: false,
        prefersReducedMotion: false,
      });

      render(<InstallPrompt />);

      // Trigger the install prompt event
      fireEvent(window, mockEvent);

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify that animations are applied when motion is allowed
        expect(banner).toHaveClass('transition-all');
        expect(banner).toHaveClass('animate-slide-up-fade-in');
      });
    });
  });
});
