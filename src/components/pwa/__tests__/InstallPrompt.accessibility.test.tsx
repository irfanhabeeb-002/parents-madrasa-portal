import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('InstallPrompt Accessibility', () => {
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

  const triggerInstallPrompt = () => {
    // Simulate beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    Object.assign(event, mockBeforeInstallPromptEvent);
    window.dispatchEvent(event);
  };

  describe('ARIA Labels and Roles', () => {
    test('banner has proper ARIA labels and roles', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveAttribute('aria-live', 'polite');
        expect(banner).toHaveAttribute('aria-label', 'Install app banner');
        expect(banner).toHaveAttribute('tabIndex', '-1');
      });

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-labelledby', 'install-banner-title');
      expect(region).toHaveAttribute(
        'aria-describedby',
        'install-banner-description'
      );
    });

    test('modal has proper ARIA attributes', async () => {
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
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
        expect(modal).toHaveAttribute(
          'aria-describedby',
          'install-modal-content'
        );
      });
    });

    test('benefits list has proper list semantics', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const learnMoreButton = screen.getByRole('button', {
          name: /learn more/i,
        });
        fireEvent.click(learnMoreButton);
      });

      await waitFor(() => {
        const benefitsList = screen.getByRole('list', {
          name: /app installation benefits/i,
        });
        expect(benefitsList).toBeInTheDocument();

        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(4);
      });
    });

    test('Malayalam text has proper lang attributes and aria-labels', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const malayalamText = screen.getByText(/വേഗത്തിലുള്ള ആക്സസും/);
        expect(malayalamText).toHaveAttribute('lang', 'ml');
        expect(malayalamText).toHaveAttribute(
          'aria-label',
          'Malayalam translation: Get quick access and work offline'
        );
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('banner is focusable and keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(
        screen.getByRole('button', { name: /dismiss install banner/i })
      ).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /learn more/i })).toHaveFocus();

      await user.tab();
      expect(
        screen.getByRole('button', { name: /install madrasa portal app now/i })
      ).toHaveFocus();
    });

    test('modal keyboard navigation works correctly', async () => {
      const user = userEvent.setup();
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
      });

      // Test Escape key closes modal
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('dismiss button is keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const dismissButton = screen.getByRole('button', {
          name: /dismiss install banner/i,
        });
        dismissButton.focus();
        expect(dismissButton).toHaveFocus();
      });

      // Press Enter to dismiss
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Focus Management', () => {
    test('focus is managed when banner appears', async () => {
      renderWithTheme(<InstallPrompt />);

      // Store initial focus
      const initialFocus = document.activeElement;

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toHaveFocus();
      });
    });

    test('focus is restored when banner is dismissed', async () => {
      const user = userEvent.setup();
      renderWithTheme(<InstallPrompt />);

      // Create a focusable element to test focus restoration
      const testButton = document.createElement('button');
      testButton.textContent = 'Test Button';
      document.body.appendChild(testButton);
      testButton.focus();

      triggerInstallPrompt();

      await waitFor(() => {
        const dismissButton = screen.getByRole('button', {
          name: /dismiss install banner/i,
        });
        fireEvent.click(dismissButton);
      });

      await waitFor(() => {
        expect(testButton).toHaveFocus();
      });

      document.body.removeChild(testButton);
    });
  });

  describe('Screen Reader Announcements', () => {
    test('screen reader announcement element exists', () => {
      renderWithTheme(<InstallPrompt />);

      let announcement = screen.getByRole('status');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
      expect(announcement).toHaveClass('sr-only');
    });

    test('banner appearance is announced', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(
          'Install app banner appeared. You can install this app for a better experience.'
        );
      });
    });

    test('banner dismissal is announced', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const dismissButton = screen.getByRole('button', {
          name: /dismiss install banner/i,
        });
        fireEvent.click(dismissButton);
      });

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('Install banner dismissed');
      });
    });
  });

  describe('Touch Target Sizes', () => {
    test('all interactive elements meet minimum touch target size (44px)', async () => {
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

        // Check minimum height
        expect(dismissButton).toHaveClass('min-h-[44px]');
        expect(dismissButton).toHaveClass('min-w-[44px]');
        expect(learnMoreButton).toHaveClass('min-h-[44px]');
        expect(installButton).toHaveClass('min-h-[44px]');
      });
    });

    test('modal buttons meet minimum touch target size (48px)', async () => {
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

  describe('High Contrast Mode', () => {
    test('high contrast styles are applied correctly', async () => {
      // Mock high contrast preference
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
      });
    });
  });

  describe('Reduced Motion Preferences', () => {
    test('animations are disabled when user prefers reduced motion', async () => {
      // Mock reduced motion preference
      mockThemeContext.prefersReducedMotion = true;

      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');

        // Should not have transition classes when reduced motion is preferred
        expect(banner).not.toHaveClass('transition-all');
        expect(banner).not.toHaveClass('duration-300');
      });
    });
  });

  describe('Accessibility Compliance', () => {
    test('component follows accessibility best practices', async () => {
      renderWithTheme(<InstallPrompt />);

      triggerInstallPrompt();

      await waitFor(() => {
        const banner = screen.getByRole('banner');
        expect(banner).toBeInTheDocument();

        // Check for proper ARIA attributes
        expect(banner).toHaveAttribute('aria-live', 'polite');
        expect(banner).toHaveAttribute('aria-label', 'Install app banner');

        // Check for proper heading structure
        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading).toBeInTheDocument();

        // Check for proper button roles
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);

        buttons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
        });
      });
    });

    test('modal follows accessibility best practices', async () => {
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
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');

        // Check for proper list structure
        const list = screen.getByRole('list', {
          name: /app installation benefits/i,
        });
        expect(list).toBeInTheDocument();

        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBe(4);
      });
    });
  });
});
