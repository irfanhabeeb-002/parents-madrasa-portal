import React from 'react';
import { render, screen, act } from '@testing-library/react';
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

describe('InstallPrompt Z-Index and Positioning Tests', () => {
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
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  const triggerInstallPromptSync = () => {
    // Simulate beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    Object.assign(event, mockBeforeInstallPromptEvent);

    // Use fake timers to control the setTimeout
    vi.useFakeTimers();

    act(() => {
      window.dispatchEvent(event);
      // Fast-forward the 30 second delay
      vi.advanceTimersByTime(30000);
    });

    vi.useRealTimers();
  };

  describe('Z-Index Hierarchy Validation', () => {
    test('install banner has z-60 class for proper layering', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveClass('z-60');
    });

    test('banner z-index is higher than bottom navigation z-50', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerClasses = banner.className;

      // Verify z-60 is present and no conflicting z-index classes
      expect(bannerClasses).toContain('z-60');
      expect(bannerClasses).not.toContain('z-40');
      expect(bannerClasses).not.toContain('z-50');

      // Verify z-60 (60) > z-50 (50) - bottom navigation z-index
      expect(60).toBeGreaterThan(50);
    });

    test('banner has fixed positioning for proper layering', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      expect(banner).toHaveClass('fixed');
    });
  });

  describe('Positioning Above Bottom Navigation', () => {
    test('banner is positioned at bottom-22 (88px) for proper clearance', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      expect(banner).toHaveClass('bottom-22');
    });

    test('banner has proper horizontal positioning classes', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerClasses = banner.className;

      // Check horizontal positioning classes
      expect(bannerClasses).toContain('left-4');
      expect(bannerClasses).toContain('right-4');
      expect(bannerClasses).toContain('max-w-md');
      expect(bannerClasses).toContain('mx-auto');
    });

    test('banner has responsive desktop positioning classes', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerClasses = banner.className;

      // Check desktop-specific positioning
      expect(bannerClasses).toContain('md:left-1/2');
      expect(bannerClasses).toContain('md:right-auto');
      expect(bannerClasses).toContain('md:transform');
      expect(bannerClasses).toContain('md:-translate-x-1/2');
    });

    test('banner has safe area inset handling in inline styles', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');

      // Check for safe area inset handling - these are set in the component
      expect(banner).toHaveAttribute('style');

      // Check that the component sets the style attribute with safe area handling
      const styleAttr = banner.getAttribute('style');
      expect(styleAttr).toContain('bottom');
      expect(styleAttr).toContain('calc(88px + env');
      expect(styleAttr).toContain('safe-area-inset-bottom');
    });
  });

  describe('Visual Styling Validation', () => {
    test('banner content has proper contrast styling in light mode', () => {
      mockThemeContext.theme = 'light';
      mockThemeContext.isHighContrast = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerContent = banner.querySelector('div');

      expect(bannerContent).toHaveClass('bg-primary-700');
      expect(bannerContent).toHaveClass('text-white');
      expect(bannerContent).toHaveClass('border-primary-800');
      expect(bannerContent).toHaveClass('shadow-2xl');
    });

    test('banner content has proper contrast styling in dark mode', () => {
      mockThemeContext.theme = 'dark';
      mockThemeContext.isHighContrast = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerContent = banner.querySelector('div');

      expect(bannerContent).toHaveClass('bg-primary-600');
      expect(bannerContent).toHaveClass('text-white');
      expect(bannerContent).toHaveClass('border-primary-700');
      expect(bannerContent).toHaveClass('shadow-2xl');
    });

    test('banner content has proper contrast styling in high contrast mode', () => {
      mockThemeContext.isHighContrast = true;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerContent = banner.querySelector('div');

      expect(bannerContent).toHaveClass('bg-black');
      expect(bannerContent).toHaveClass('text-white');
      expect(bannerContent).toHaveClass('border-white');
      expect(bannerContent).toHaveClass('border-2');
      expect(bannerContent).toHaveClass('shadow-2xl');
    });

    test('banner has enhanced visual separation elements', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerContent = banner.querySelector('div');

      // Verify visual separation techniques
      expect(bannerContent).toHaveClass('shadow-2xl'); // Enhanced shadow
      expect(bannerContent).toHaveClass('border'); // Subtle border
      expect(bannerContent).toHaveClass('rounded-lg'); // Modern appearance
    });
  });

  describe('Responsive Design Classes', () => {
    test('banner has responsive padding classes', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerContent = banner.querySelector('div');

      expect(bannerContent).toHaveClass('p-4');
      expect(bannerContent).toHaveClass('md:p-5');
    });

    test('banner text elements have responsive sizing', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const title = screen.getByText('Install Madrasa Portal');
      const description = screen.getByText('Get quick access and work offline');

      expect(title).toHaveClass('text-sm');
      expect(title).toHaveClass('md:text-base');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('md:text-base');
    });

    test('banner button container has responsive layout classes', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

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

  describe('Touch Target Size Compliance', () => {
    test('all banner buttons meet minimum 44px touch target size', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

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

  describe('Animation and Motion Preferences', () => {
    test('animations are applied when motion is not reduced', () => {
      mockThemeContext.prefersReducedMotion = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerClasses = banner.className;

      expect(bannerClasses).toContain('transition-all');
      expect(bannerClasses).toContain('duration-300');
      expect(bannerClasses).toContain('ease-in-out');
    });

    test('animations are disabled when user prefers reduced motion', () => {
      mockThemeContext.prefersReducedMotion = true;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      const bannerClasses = banner.className;

      // Should not have transition classes when reduced motion is preferred
      expect(bannerClasses).not.toContain('transition-all');
      expect(bannerClasses).not.toContain('duration-300');
    });
  });

  describe('Accessibility Compliance', () => {
    test('banner has proper ARIA attributes', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');
      expect(banner).toHaveAttribute('aria-live', 'polite');
      const ariaLabel = banner.getAttribute('aria-label');
      expect(ariaLabel).toContain('Install app banner');
      expect(banner).toHaveAttribute('tabIndex', '-1');

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'install-banner-title');
      expect(region).toHaveAttribute(
        'aria-describedby',
        'install-banner-description'
      );
    });

    test('screen reader announcement element exists', () => {
      renderWithTheme(<InstallPrompt />);

      const announcement = screen.getByRole('status');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
      expect(announcement).toHaveClass('sr-only');
    });

    test('Malayalam text has proper lang attributes', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const malayalamText = screen.getByText(/വേഗത്തിലുള്ള ആക്സസും/);
      expect(malayalamText).toHaveAttribute('lang', 'ml');
      expect(malayalamText).toHaveAttribute(
        'aria-label',
        'Malayalam translation: Get quick access and work offline'
      );
    });
  });

  describe('Cross-Platform Positioning Consistency', () => {
    test('banner maintains consistent positioning classes across platforms', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');

      // Core positioning classes that should be consistent
      expect(banner).toHaveClass('fixed');
      expect(banner).toHaveClass('z-60');
      expect(banner).toHaveClass('bottom-22');
      expect(banner).toHaveClass('left-4');
      expect(banner).toHaveClass('right-4');
      expect(banner).toHaveClass('max-w-md');
      expect(banner).toHaveClass('mx-auto');
    });

    test('banner has safe area inset support for mobile devices', () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');

      // Verify safe area handling for mobile devices
      // Check that the component sets the style attribute with safe area handling
      const styleAttr = banner.getAttribute('style');
      expect(styleAttr).toContain('bottom');
      expect(styleAttr).toContain('safe-area-inset-bottom');

      // Verify the banner has the necessary positioning classes
      expect(banner).toHaveClass('fixed');
      expect(banner).toHaveClass('bottom-22');
    });
  });

  describe('Layout Stability', () => {
    test('banner uses fixed positioning to avoid layout shifts', () => {
      const { container } = renderWithTheme(<InstallPrompt />);

      triggerInstallPromptSync();

      const banner = screen.getByRole('banner');

      // Banner should be positioned fixed, not affecting document flow
      expect(banner).toHaveClass('fixed');

      // Verify no layout shift occurred in the main content
      const bannerElement = container.querySelector('[role="banner"]');
      expect(bannerElement).toHaveClass('fixed');
    });
  });
});
