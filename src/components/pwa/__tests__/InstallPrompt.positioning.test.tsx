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

describe('InstallPrompt Positioning and Styling', () => {
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

    // Mock matchMedia for PWA detection
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

    // Mock setTimeout to control timing - use fake timers instead
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  const triggerInstallPrompt = async () => {
    // Simulate beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    Object.assign(event, mockBeforeInstallPromptEvent);
    window.dispatchEvent(event);

    // Fast-forward the 30 second delay
    vi.advanceTimersByTime(30000);
  };

  describe('Z-Index Hierarchy Validation', () => {
    test('install banner has higher z-index than bottom navigation (z-60 > z-50)', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveClass('z-60');
      });
    });

    test('z-index hierarchy is correctly implemented', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerClasses = banner.className;

        // Verify z-60 is present and no conflicting z-index classes
        expect(bannerClasses).toContain('z-60');
        expect(bannerClasses).not.toContain('z-40');
        expect(bannerClasses).not.toContain('z-50');
      });
    });

    test('modal maintains proper z-index when opened', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        fireEvent.click(learnMoreButton);
      });

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        // Modal should use default z-50 which works with backdrop
        const modalContainer = modal.closest('[class*="z-"]');
        expect(modalContainer).toBeTruthy();
      });
    });
  });

  describe('Positioning Above Bottom Navigation', () => {
    test('banner is positioned at bottom-22 (88px) for proper clearance', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toHaveClass('bottom-22');
      });
    });

    test('banner has proper horizontal positioning', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerClasses = banner.className;

        // Check horizontal positioning classes
        expect(bannerClasses).toContain('left-4');
        expect(bannerClasses).toContain('right-4');
        expect(bannerClasses).toContain('max-w-md');
        expect(bannerClasses).toContain('mx-auto');
      });
    });

    test('banner has responsive desktop positioning', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerClasses = banner.className;

        // Check desktop-specific positioning
        expect(bannerClasses).toContain('md:left-1/2');
        expect(bannerClasses).toContain('md:right-auto');
        expect(bannerClasses).toContain('md:transform');
        expect(bannerClasses).toContain('md:-translate-x-1/2');
      });
    });

    test('banner accounts for safe area insets', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerStyle = banner.style;

        // Check for safe area inset handling
        expect(bannerStyle.paddingBottom).toBe(
          'env(safe-area-inset-bottom, 0px)'
        );
        expect(bannerStyle.bottom).toBe(
          'calc(88px + env(safe-area-inset-bottom, 0px))'
        );
      });
    });

    test('banner maintains proper spacing from bottom navigation', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify positioning provides clearance for:
        // - Bottom navigation height (64px)
        // - Safe margin (24px)
        // Total: 88px (bottom-22 in Tailwind)
        expect(banner).toHaveClass('bottom-22');

        // Verify fixed positioning
        expect(banner).toHaveClass('fixed');
      });
    });
  });

  describe('Visual Contrast and Visibility', () => {
    test('banner has proper contrast in light mode', async () => {
      mockThemeContext.theme = 'light';
      mockThemeContext.isHighContrast = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        expect(bannerContent).toHaveClass('bg-primary-700');
        expect(bannerContent).toHaveClass('text-white');
        expect(bannerContent).toHaveClass('border-primary-800');
        expect(bannerContent).toHaveClass('shadow-2xl');
      });
    });

    test('banner has proper contrast in dark mode', async () => {
      mockThemeContext.theme = 'dark';
      mockThemeContext.isHighContrast = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        expect(bannerContent).toHaveClass('bg-primary-600');
        expect(bannerContent).toHaveClass('text-white');
        expect(bannerContent).toHaveClass('border-primary-700');
        expect(bannerContent).toHaveClass('shadow-2xl');
      });
    });

    test('banner has proper contrast in high contrast mode', async () => {
      mockThemeContext.isHighContrast = true;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        expect(bannerContent).toHaveClass('bg-black');
        expect(bannerContent).toHaveClass('text-white');
        expect(bannerContent).toHaveClass('border-white');
        expect(bannerContent).toHaveClass('border-2');
        expect(bannerContent).toHaveClass('shadow-2xl');
      });
    });

    test('banner has enhanced shadow for better visual separation', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        expect(bannerContent).toHaveClass('shadow-2xl');
        expect(bannerContent).toHaveClass('border');
      });
    });

    test('banner has proper rounded corners for modern appearance', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        expect(bannerContent).toHaveClass('rounded-lg');
      });
    });
  });

  describe('Responsive Behavior Across Screen Sizes', () => {
    test('banner has responsive padding', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        expect(bannerContent).toHaveClass('p-4');
        expect(bannerContent).toHaveClass('md:p-5');
      });
    });

    test('banner has responsive text sizing', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const title = screen.getByText('Install Madrasa Portal');
        const description = screen.getByText(
          'Get quick access and work offline'
        );

        expect(title).toHaveClass('text-sm');
        expect(title).toHaveClass('md:text-base');
        expect(description).toHaveClass('text-sm');
        expect(description).toHaveClass('md:text-base');
      });
    });

    test('banner buttons have responsive layout', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const buttonContainer = screen
          .getByRole('banner')
          .querySelector('.flex.flex-col');

        expect(buttonContainer).toHaveClass('flex-col');
        expect(buttonContainer).toHaveClass('sm:flex-row');
        expect(buttonContainer).toHaveClass('space-y-2');
        expect(buttonContainer).toHaveClass('sm:space-y-0');
        expect(buttonContainer).toHaveClass('sm:space-x-3');
      });
    });

    test('banner maintains proper width constraints', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        expect(banner).toHaveClass('max-w-md');
        expect(banner).toHaveClass('mx-auto');
      });
    });

    test('banner adapts to different screen orientations', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerClasses = banner.className;

        // Check for responsive classes that handle orientation changes
        expect(bannerClasses).toContain('left-4');
        expect(bannerClasses).toContain('right-4');
        expect(bannerClasses).toContain('max-w-md');
        expect(bannerClasses).toContain('mx-auto');
      });
    });
  });

  describe('Touch Target Size Compliance', () => {
    test('all banner buttons meet minimum 44px touch target size', async () => {
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

        // Check minimum touch target sizes
        expect(dismissButton).toHaveClass('min-h-[44px]');
        expect(dismissButton).toHaveClass('min-w-[44px]');
        expect(learnMoreButton).toHaveClass('min-h-[44px]');
        expect(installButton).toHaveClass('min-h-[44px]');
      });
    });

    test('modal buttons meet minimum 48px touch target size', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        fireEvent.click(learnMoreButton);
      });

      await waitFor(() => {
        const modalButtons = screen.getAllByRole('button');
        const actionButtons = modalButtons.filter(
          button =>
            button.textContent?.includes('Maybe Later') ||
            button.textContent?.includes('Install Now')
        );

        actionButtons.forEach(button => {
          expect(button).toHaveClass('min-h-[48px]');
        });
      });
    });
  });

  describe('Animation and Motion Preferences', () => {
    test('animations are applied when motion is not reduced', async () => {
      mockThemeContext.prefersReducedMotion = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerClasses = banner.className;

        expect(bannerClasses).toContain('transition-all');
        expect(bannerClasses).toContain('duration-300');
        expect(bannerClasses).toContain('ease-in-out');
      });
    });

    test('animations are disabled when user prefers reduced motion', async () => {
      mockThemeContext.prefersReducedMotion = true;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerClasses = banner.className;

        // Should not have transition classes when reduced motion is preferred
        expect(bannerClasses).not.toContain('transition-all');
        expect(bannerClasses).not.toContain('duration-300');
      });
    });

    test('button hover animations respect motion preferences', async () => {
      mockThemeContext.prefersReducedMotion = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });

        expect(learnMoreButton).toHaveClass('transition-all');
        expect(learnMoreButton).toHaveClass('duration-200');
        expect(learnMoreButton).toHaveClass('hover:scale-105');

        expect(installButton).toHaveClass('transition-all');
        expect(installButton).toHaveClass('duration-200');
        expect(installButton).toHaveClass('hover:scale-105');
      });
    });
  });

  describe('Cross-Platform Positioning Consistency', () => {
    test('banner positioning works on iOS Safari', async () => {
      // Mock iOS Safari environment
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        writable: true,
      });

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify safe area handling for iOS
        expect(banner.style.paddingBottom).toBe(
          'env(safe-area-inset-bottom, 0px)'
        );
        expect(banner.style.bottom).toBe(
          'calc(88px + env(safe-area-inset-bottom, 0px))'
        );
        expect(banner).toHaveClass('z-60');
        expect(banner).toHaveClass('bottom-22');
      });
    });

    test('banner positioning works on Android Chrome', async () => {
      // Mock Android Chrome environment
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        writable: true,
      });

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify positioning works on Android
        expect(banner).toHaveClass('z-60');
        expect(banner).toHaveClass('bottom-22');
        expect(banner).toHaveClass('fixed');
      });
    });

    test('banner positioning works on desktop browsers', async () => {
      // Mock desktop Chrome environment
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true,
      });

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify desktop positioning
        expect(banner).toHaveClass('md:left-1/2');
        expect(banner).toHaveClass('md:right-auto');
        expect(banner).toHaveClass('md:transform');
        expect(banner).toHaveClass('md:-translate-x-1/2');
      });
    });
  });

  describe('Layout Stability and Performance', () => {
    test('banner appearance does not cause layout shifts', async () => {
      const { container } = renderWithTheme(<InstallPrompt />);

      // Capture initial layout
      const initialHTML = container.innerHTML;

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toBeInTheDocument();

        // Banner should be positioned fixed, not affecting document flow
        expect(banner).toHaveClass('fixed');
      });

      // Verify no layout shift occurred in the main content
      const bannerElement = container.querySelector('[role="banner"]');
      expect(bannerElement).toHaveClass('fixed');
    });

    test('theme switching does not cause positioning issues', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toHaveClass('z-60');
        expect(banner).toHaveClass('bottom-22');
      });

      // Simulate theme change
      mockThemeContext.theme = 'dark';

      // Re-render with new theme
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        // Positioning should remain consistent
        expect(banner).toHaveClass('z-60');
        expect(banner).toHaveClass('bottom-22');
      });
    });
  });
});
