import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { InstallPrompt } from '../InstallPrompt';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock the theme context
const mockThemeContext = {
  theme: 'light' as const,
  userTheme: 'light' as const,
  setTheme: vi.fn(),
  toggleTheme: vi.fn(),
  isHighContrast: false,
  prefersReducedMotion: false,
};

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => mockThemeContext,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock beforeinstallprompt event
const mockBeforeInstallPromptEvent = {
  preventDefault: vi.fn(),
  prompt: vi.fn().mockResolvedValue(undefined),
  userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
  platforms: ['web'],
};

describe('InstallPrompt Cross-Platform Compatibility', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock setTimeout with proper cleanup
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  const triggerInstallPrompt = () => {
    // Simulate beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    Object.assign(event, mockBeforeInstallPromptEvent);
    window.dispatchEvent(event);

    // Fast-forward timers to trigger banner display
    vi.advanceTimersByTime(30000);
  };

  const mockUserAgent = (userAgent: string) => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: userAgent,
      writable: true,
    });
  };

  const mockMatchMedia = (matches: boolean = false) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  describe('iOS Safari Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      );
      mockMatchMedia(false);
    });

    test('banner positioning works correctly on iOS Safari', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify iOS-specific positioning
        expect(banner).toHaveClass('z-60');
        expect(banner).toHaveClass('bottom-22');
        expect(banner).toHaveClass('fixed');

        // Verify safe area handling
        expect(banner.style.paddingBottom).toBe(
          'env(safe-area-inset-bottom, 0px)'
        );
        expect(banner.style.bottom).toBe(
          'calc(88px + env(safe-area-inset-bottom, 0px))'
        );
      });
    });

    test('banner styling is consistent on iOS Safari', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        // Verify styling works on iOS
        expect(bannerContent).toHaveClass('bg-primary-700');
        expect(bannerContent).toHaveClass('text-white');
        expect(bannerContent).toHaveClass('shadow-2xl');
        expect(bannerContent).toHaveClass('rounded-lg');
      });
    });

    test('touch targets are properly sized for iOS', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const dismissButton = screen.getByRole('button', {
          name: /dismiss install banner/i,
        });
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });

        // iOS requires minimum 44px touch targets
        expect(dismissButton).toHaveClass('min-h-[44px]');
        expect(dismissButton).toHaveClass('min-w-[44px]');
        expect(learnMoreButton).toHaveClass('min-h-[44px]');
        expect(installButton).toHaveClass('min-h-[44px]');
      });
    });

    test('PWA detection works correctly on iOS', async () => {
      // Mock standalone mode for iOS
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: true,
      });

      renderWithTheme(<InstallPrompt />);

      // Should not show banner when already in PWA mode
      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.queryByRole('banner');
        expect(banner).not.toBeInTheDocument();
      });
    });
  });

  describe('Android Chrome Compatibility', () => {
    beforeEach(() => {
      mockUserAgent(
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      );
      mockMatchMedia(false);

      // Reset navigator.standalone for Android
      Object.defineProperty(window.navigator, 'standalone', {
        value: undefined,
        writable: true,
      });
    });

    test('banner positioning works correctly on Android Chrome', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify Android-specific positioning
        expect(banner).toHaveClass('z-60');
        expect(banner).toHaveClass('bottom-22');
        expect(banner).toHaveClass('fixed');
        expect(banner).toHaveClass('left-4');
        expect(banner).toHaveClass('right-4');
      });
    });

    test('banner styling is consistent on Android Chrome', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        // Verify styling works on Android
        expect(bannerContent).toHaveClass('bg-primary-700');
        expect(bannerContent).toHaveClass('text-white');
        expect(bannerContent).toHaveClass('shadow-2xl');
        expect(bannerContent).toHaveClass('border');
      });
    });

    test('install prompt functionality works on Android', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });
        fireEvent.click(installButton);
      });

      // Verify prompt was called
      expect(mockBeforeInstallPromptEvent.prompt).toHaveBeenCalled();
    });

    test('PWA detection works correctly on Android', async () => {
      // Mock display-mode: standalone for Android PWA
      mockMatchMedia(true);

      renderWithTheme(<InstallPrompt />);

      // Should not show banner when already in PWA mode
      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.queryByRole('banner');
        expect(banner).not.toBeInTheDocument();
      });
    });
  });

  describe('Android Firefox Compatibility', () => {
    beforeEach(() => {
      mockUserAgent('Mozilla/5.0 (Mobile; rv:91.0) Gecko/91.0 Firefox/91.0');
      mockMatchMedia(false);
    });

    test('banner positioning works correctly on Android Firefox', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify positioning works on Firefox
        expect(banner).toHaveClass('z-60');
        expect(banner).toHaveClass('bottom-22');
        expect(banner).toHaveClass('fixed');
      });
    });

    test('banner styling is consistent on Android Firefox', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        // Verify styling works on Firefox
        expect(bannerContent).toHaveClass('bg-primary-700');
        expect(bannerContent).toHaveClass('text-white');
        expect(bannerContent).toHaveClass('shadow-2xl');
      });
    });
  });

  describe('Desktop Browser Compatibility', () => {
    describe('Desktop Chrome', () => {
      beforeEach(() => {
        mockUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );
        mockMatchMedia(false);
      });

      test('banner positioning works correctly on desktop Chrome', async () => {
        renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');

          // Verify desktop-specific positioning
          expect(banner).toHaveClass('z-60');
          expect(banner).toHaveClass('bottom-22');
          expect(banner).toHaveClass('md:left-1/2');
          expect(banner).toHaveClass('md:right-auto');
          expect(banner).toHaveClass('md:transform');
          expect(banner).toHaveClass('md:-translate-x-1/2');
        });
      });

      test('banner has proper desktop styling', async () => {
        renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');
          const bannerContent = banner.querySelector('div');

          // Verify desktop styling
          expect(bannerContent).toHaveClass('p-4');
          expect(bannerContent).toHaveClass('md:p-5');
          expect(banner).toHaveClass('max-w-md');
          expect(banner).toHaveClass('mx-auto');
        });
      });
    });

    describe('Desktop Firefox', () => {
      beforeEach(() => {
        mockUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0'
        );
        mockMatchMedia(false);
      });

      test('banner positioning works correctly on desktop Firefox', async () => {
        renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');

          // Verify positioning works on Firefox
          expect(banner).toHaveClass('z-60');
          expect(banner).toHaveClass('bottom-22');
          expect(banner).toHaveClass('fixed');
        });
      });
    });

    describe('Desktop Safari', () => {
      beforeEach(() => {
        mockUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
        );
        mockMatchMedia(false);
      });

      test('banner positioning works correctly on desktop Safari', async () => {
        renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');

          // Verify positioning works on Safari
          expect(banner).toHaveClass('z-60');
          expect(banner).toHaveClass('bottom-22');
          expect(banner).toHaveClass('fixed');
        });
      });
    });

    describe('Desktop Edge', () => {
      beforeEach(() => {
        mockUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
        );
        mockMatchMedia(false);
      });

      test('banner positioning works correctly on desktop Edge', async () => {
        renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');

          // Verify positioning works on Edge
          expect(banner).toHaveClass('z-60');
          expect(banner).toHaveClass('bottom-22');
          expect(banner).toHaveClass('fixed');
        });
      });
    });
  });

  describe('PWA Mode Compatibility', () => {
    test('component does not interfere with PWA functionality on iOS', async () => {
      mockUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      );

      // Mock PWA mode
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: true,
      });

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        // Should not show banner in PWA mode
        const banner = screen.queryByRole('banner');
        expect(banner).not.toBeInTheDocument();

        // But screen reader announcements should still be available
        const announcement = screen.getByRole('status');
        expect(announcement).toBeInTheDocument();
      });
    });

    test('component does not interfere with PWA functionality on Android', async () => {
      mockUserAgent(
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      );

      // Mock PWA mode with display-mode: standalone
      mockMatchMedia(true);

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        // Should not show banner in PWA mode
        const banner = screen.queryByRole('banner');
        expect(banner).not.toBeInTheDocument();

        // But screen reader announcements should still be available
        const announcement = screen.getByRole('status');
        expect(announcement).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Across Platforms', () => {
    test('banner adapts to different screen sizes on mobile platforms', async () => {
      const mobilePlatforms = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      ];

      for (const userAgent of mobilePlatforms) {
        mockUserAgent(userAgent);
        mockMatchMedia(false);

        const { unmount } = renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');
          const bannerContent = banner.querySelector('div');

          // Verify mobile-specific responsive classes
          expect(bannerContent).toHaveClass('p-4');
          expect(bannerContent).toHaveClass('md:p-5');
          expect(banner).toHaveClass('left-4');
          expect(banner).toHaveClass('right-4');
          expect(banner).toHaveClass('max-w-md');
        });

        unmount();
      }
    });

    test('banner adapts to different screen sizes on desktop platforms', async () => {
      const desktopPlatforms = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      ];

      for (const userAgent of desktopPlatforms) {
        mockUserAgent(userAgent);
        mockMatchMedia(false);

        const { unmount } = renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');

          // Verify desktop-specific responsive classes
          expect(banner).toHaveClass('md:left-1/2');
          expect(banner).toHaveClass('md:right-auto');
          expect(banner).toHaveClass('md:transform');
          expect(banner).toHaveClass('md:-translate-x-1/2');
          expect(banner).toHaveClass('max-w-md');
          expect(banner).toHaveClass('mx-auto');
        });

        unmount();
      }
    });
  });

  describe('Performance Across Platforms', () => {
    test('component renders efficiently on all platforms', async () => {
      const platforms = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ];

      for (const userAgent of platforms) {
        mockUserAgent(userAgent);
        mockMatchMedia(false);

        const startTime = performance.now();
        const { unmount } = renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');
          expect(banner).toBeInTheDocument();
        });

        const endTime = performance.now();
        const renderTime = endTime - startTime;

        // Verify reasonable render time (should be under 100ms)
        expect(renderTime).toBeLessThan(100);

        unmount();
      }
    });

    test('animations perform well across platforms', async () => {
      mockThemeContext.prefersReducedMotion = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify animation classes are applied
        expect(banner).toHaveClass('transition-all');
        expect(banner).toHaveClass('duration-300');
        expect(banner).toHaveClass('ease-in-out');

        // Verify animation style is set
        expect(banner.style.animation).toBe(
          'slideUpFadeIn 0.3s ease-out forwards'
        );
      });
    });
  });
});
