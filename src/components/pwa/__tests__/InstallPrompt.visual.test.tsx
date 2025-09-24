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

describe('InstallPrompt Visual Regression Tests', () => {
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

    // Mock setTimeout to control timing
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 1 as any;
    });
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  const triggerInstallPrompt = () => {
    // Simulate beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    Object.assign(event, mockBeforeInstallPromptEvent);
    window.dispatchEvent(event);
  };

  describe('Contrast and Visibility Tests', () => {
    test('light mode banner has sufficient contrast ratio', async () => {
      mockThemeContext.theme = 'light';
      mockThemeContext.isHighContrast = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        // Light mode: bg-primary-700 with text-white should provide high contrast
        expect(bannerContent).toHaveClass('bg-primary-700');
        expect(bannerContent).toHaveClass('text-white');

        // Verify enhanced visual separation
        expect(bannerContent).toHaveClass('shadow-2xl');
        expect(bannerContent).toHaveClass('border');
        expect(bannerContent).toHaveClass('border-primary-800');
      });
    });

    test('dark mode banner has sufficient contrast ratio', async () => {
      mockThemeContext.theme = 'dark';
      mockThemeContext.isHighContrast = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        // Dark mode: bg-primary-600 with text-white should provide high contrast
        expect(bannerContent).toHaveClass('bg-primary-600');
        expect(bannerContent).toHaveClass('text-white');

        // Verify enhanced visual separation
        expect(bannerContent).toHaveClass('shadow-2xl');
        expect(bannerContent).toHaveClass('border');
        expect(bannerContent).toHaveClass('border-primary-700');
      });
    });

    test('high contrast mode provides maximum visibility', async () => {
      mockThemeContext.isHighContrast = true;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        // High contrast: black background with white text and border
        expect(bannerContent).toHaveClass('bg-black');
        expect(bannerContent).toHaveClass('text-white');
        expect(bannerContent).toHaveClass('border-white');
        expect(bannerContent).toHaveClass('border-2');
        expect(bannerContent).toHaveClass('shadow-2xl');
      });
    });

    test('banner text remains readable in all theme modes', async () => {
      const themes = [
        { theme: 'light', isHighContrast: false },
        { theme: 'dark', isHighContrast: false },
        { theme: 'light', isHighContrast: true },
      ];

      for (const themeConfig of themes) {
        mockThemeContext.theme = themeConfig.theme as 'light' | 'dark';
        mockThemeContext.isHighContrast = themeConfig.isHighContrast;

        const { unmount } = renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const title = screen.getByText('Install Madrasa Portal');
          const description = screen.getByText(
            'Get quick access and work offline'
          );

          // Verify text is visible and properly styled
          expect(title).toBeInTheDocument();
          expect(description).toBeInTheDocument();

          // All themes should use white text for readability
          const banner = screen.getByRole('banner');
          const bannerContent = banner.querySelector('div');
          expect(bannerContent).toHaveClass('text-white');
        });

        unmount();
      }
    });

    test('banner has no transparency that affects readability', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        // Verify no opacity classes that could make text unreadable
        const bannerClasses = bannerContent?.className || '';
        expect(bannerClasses).not.toContain('opacity-');
        expect(bannerClasses).not.toContain('bg-opacity-');

        // Verify solid background colors are used
        expect(bannerContent).toHaveClass(/bg-primary-\d+|bg-black/);
      });
    });

    test('banner stands out from background content', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        const bannerContent = banner.querySelector('div');

        // Verify visual separation techniques
        expect(bannerContent).toHaveClass('shadow-2xl'); // Enhanced shadow
        expect(bannerContent).toHaveClass('border'); // Subtle border
        expect(bannerContent).toHaveClass('rounded-lg'); // Modern appearance

        // Verify proper z-index for layering
        expect(banner).toHaveClass('z-60');
      });
    });
  });

  describe('Button Contrast and Visibility', () => {
    test('banner buttons have proper contrast in light mode', async () => {
      mockThemeContext.theme = 'light';
      mockThemeContext.isHighContrast = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });

        // Learn More button (secondary)
        expect(learnMoreButton).toHaveClass('bg-white');
        expect(learnMoreButton).toHaveClass('text-primary-600');

        // Install button (primary)
        expect(installButton).toHaveClass('bg-primary-700');
        expect(installButton).toHaveClass('hover:bg-primary-800');
      });
    });

    test('banner buttons have proper contrast in dark mode', async () => {
      mockThemeContext.theme = 'dark';
      mockThemeContext.isHighContrast = false;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });

        // Learn More button (secondary)
        expect(learnMoreButton).toHaveClass('bg-white');
        expect(learnMoreButton).toHaveClass('text-primary-600');

        // Install button (primary)
        expect(installButton).toHaveClass('bg-primary-600');
        expect(installButton).toHaveClass('hover:bg-primary-700');
      });
    });

    test('banner buttons have proper contrast in high contrast mode', async () => {
      mockThemeContext.isHighContrast = true;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });

        // High contrast secondary button
        expect(learnMoreButton).toHaveClass('bg-white');
        expect(learnMoreButton).toHaveClass('text-black');
        expect(learnMoreButton).toHaveClass('border-2');
        expect(learnMoreButton).toHaveClass('border-black');

        // High contrast primary button
        expect(installButton).toHaveClass('bg-black');
        expect(installButton).toHaveClass('text-white');
        expect(installButton).toHaveClass('border-2');
        expect(installButton).toHaveClass('border-white');
      });
    });

    test('dismiss button has proper contrast and visibility', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const dismissButton = screen.getByRole('button', {
          name: /dismiss install banner/i,
        });

        // Verify dismiss button styling
        expect(dismissButton).toHaveClass('p-1');
        expect(dismissButton).toHaveClass('min-h-[44px]');
        expect(dismissButton).toHaveClass('min-w-[44px]');

        // Verify hover states for visibility
        const buttonClasses = dismissButton.className;
        expect(buttonClasses).toContain('hover:');
      });
    });
  });

  describe('Modal Visual Consistency', () => {
    test('modal maintains visual consistency with banner', async () => {
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

        // Verify modal has proper backdrop and styling
        const modalContainer = modal.closest('[class*="backdrop"]');
        expect(modalContainer).toBeTruthy();
      });
    });

    test('modal content has proper contrast and readability', async () => {
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

        // Verify modal content is readable
        const heading = screen.getByText('Install as App');
        const description = screen.getByText(
          /Install Madrasa Portal on your device/
        );

        expect(heading).toBeInTheDocument();
        expect(description).toBeInTheDocument();

        // Verify benefits section has proper styling
        const benefitsList = screen.getByRole('list', {
          name: /app installation benefits/i,
        });
        expect(benefitsList).toBeInTheDocument();

        // Check for proper grid layout
        const benefitsContainer = benefitsList.closest('.bg-gray-50');
        expect(benefitsContainer).toHaveClass('rounded-xl');
      });
    });

    test('modal buttons have enhanced styling', async () => {
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
          expect(button).toHaveClass('px-6');
          expect(button).toHaveClass('py-3');
          expect(button).toHaveClass('rounded-lg');
        });

        // Verify Install Now button has gradient
        const installNowButton = actionButtons.find(button =>
          button.textContent?.includes('Install Now')
        );
        if (installNowButton) {
          expect(installNowButton).toHaveClass('bg-gradient-to-r');
          expect(installNowButton).toHaveClass('from-primary-600');
          expect(installNowButton).toHaveClass('to-primary-700');
        }
      });
    });
  });

  describe('Typography and Text Rendering', () => {
    test('text hierarchy is properly implemented', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const title = screen.getByText('Install Madrasa Portal');
        const description = screen.getByText(
          'Get quick access and work offline'
        );
        const malayalamText = screen.getByText(/വേഗത്തിലുള്ള ആക്സസും/);

        // Verify title styling
        expect(title).toHaveClass('font-semibold');
        expect(title).toHaveClass('text-sm');
        expect(title).toHaveClass('md:text-base');

        // Verify description styling
        expect(description).toHaveClass('text-sm');
        expect(description).toHaveClass('md:text-base');

        // Verify Malayalam text has proper attributes
        expect(malayalamText).toHaveAttribute('lang', 'ml');
      });
    });

    test('button text is properly sized and readable', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        const installButton = screen.getByRole('button', {
          name: /install madrasa portal app now/i,
        });

        // Verify button text sizing
        const learnMoreText = learnMoreButton.querySelector('span');
        const installText = installButton.querySelector('span');

        expect(learnMoreText).toHaveClass('text-sm');
        expect(learnMoreText).toHaveClass('md:text-base');
        expect(installText).toHaveClass('text-sm');
        expect(installText).toHaveClass('md:text-base');
      });
    });
  });

  describe('Visual Consistency Across Themes', () => {
    test('banner maintains consistent layout across all themes', async () => {
      const themes = [
        { theme: 'light', isHighContrast: false },
        { theme: 'dark', isHighContrast: false },
        { theme: 'light', isHighContrast: true },
      ];

      for (const themeConfig of themes) {
        mockThemeContext.theme = themeConfig.theme as 'light' | 'dark';
        mockThemeContext.isHighContrast = themeConfig.isHighContrast;

        const { unmount } = renderWithTheme(<InstallPrompt />);

        triggerInstallPrompt();

        await waitFor(() => {
          const banner = screen.getByRole('banner');
          const bannerContent = banner.querySelector('div');

          // Verify consistent layout classes across themes
          expect(bannerContent).toHaveClass('p-4');
          expect(bannerContent).toHaveClass('md:p-5');
          expect(bannerContent).toHaveClass('rounded-lg');
          expect(bannerContent).toHaveClass('shadow-2xl');
          expect(bannerContent).toHaveClass('border');

          // Verify positioning remains consistent
          expect(banner).toHaveClass('fixed');
          expect(banner).toHaveClass('bottom-22');
          expect(banner).toHaveClass('z-60');
        });

        unmount();
      }
    });

    test('visual elements scale properly on different screen sizes', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Verify responsive classes are present
        expect(banner).toHaveClass('left-4');
        expect(banner).toHaveClass('right-4');
        expect(banner).toHaveClass('max-w-md');
        expect(banner).toHaveClass('mx-auto');
        expect(banner).toHaveClass('md:left-1/2');
        expect(banner).toHaveClass('md:right-auto');
        expect(banner).toHaveClass('md:transform');
        expect(banner).toHaveClass('md:-translate-x-1/2');
      });
    });
  });
});
