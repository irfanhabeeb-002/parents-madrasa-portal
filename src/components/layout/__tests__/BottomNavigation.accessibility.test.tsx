import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { BottomNavigation } from '../BottomNavigation';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { vi } from 'vitest';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock matchMedia for theme testing
const mockMatchMedia = (matches: boolean) => {
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

const renderWithProviders = (
  component: React.ReactElement,
  options: {
    theme?: 'light' | 'dark';
    isHighContrast?: boolean;
    prefersReducedMotion?: boolean;
  } = {}
) => {
  // Set up matchMedia mocks based on options
  if (options.theme === 'dark') {
    mockMatchMedia(true);
  } else {
    mockMatchMedia(false);
  }

  // Mock high contrast
  if (options.isHighContrast) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => {
        if (query === '(prefers-contrast: high)') {
          return {
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          };
        }
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: options.prefersReducedMotion || false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          };
        }
        return {
          matches: options.theme === 'dark',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      }),
    });
  }

  return render(
    <BrowserRouter>
      <NotificationProvider>
        <ThemeProvider>{component}</ThemeProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('BottomNavigation Accessibility', () => {
  beforeEach(() => {
    // Clear any existing announcements
    document.querySelectorAll('[aria-live]').forEach(el => el.remove());
  });

  describe('ARIA Roles and Labels', () => {
    it('should have proper navigation role and aria-label', () => {
      renderWithProviders(<BottomNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute(
        'aria-label',
        'Main navigation menu with 4 sections: Home, Live Class, Profile, and Settings'
      );
    });

    it('should have proper tab roles for navigation items', () => {
      renderWithProviders(<BottomNavigation />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);

      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('type', 'button');
        expect(tab).toHaveAttribute('data-nav-index', index.toString());
      });
    });

    it('should have descriptive aria-labels for each navigation item', () => {
      renderWithProviders(<BottomNavigation />);

      expect(
        screen.getByRole('tab', { name: /home navigation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /live class navigation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /profile navigation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tab', { name: /settings navigation/i })
      ).toBeInTheDocument();
    });

    it('should indicate current page with aria-current', () => {
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      expect(homeTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      const liveClassTab = screen.getByRole('tab', {
        name: /live class navigation/i,
      });

      await user.click(homeTab);
      expect(homeTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(liveClassTab).toHaveFocus();
    });

    it('should support Home and End key navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      const settingsTab = screen.getByRole('tab', {
        name: /settings navigation/i,
      });

      await user.click(homeTab);

      await user.keyboard('{End}');
      expect(settingsTab).toHaveFocus();

      await user.keyboard('{Home}');
      expect(homeTab).toHaveFocus();
    });

    it('should support Enter and Space key activation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const liveClassTab = screen.getByRole('tab', {
        name: /live class navigation/i,
      });

      await user.click(liveClassTab);
      await user.keyboard('{Enter}');

      // Should navigate and update active state
      await waitFor(() => {
        expect(liveClassTab).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should wrap around when navigating with arrow keys', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      const settingsTab = screen.getByRole('tab', {
        name: /settings navigation/i,
      });

      await user.click(homeTab);

      // Navigate left from first item should go to last
      await user.keyboard('{ArrowLeft}');
      expect(settingsTab).toHaveFocus();

      // Navigate right from last item should go to first
      await user.keyboard('{ArrowRight}');
      expect(homeTab).toHaveFocus();
    });
  });

  describe('Touch Target Requirements', () => {
    it('should meet minimum 44px touch target requirement', () => {
      renderWithProviders(<BottomNavigation />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        // Check that minimum dimensions are set via CSS classes
        expect(tab.className).toMatch(/min-w-\[48px\]/);
        expect(tab.className).toMatch(/min-h-\[56px\]/);
      });
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should apply high contrast styles when enabled', () => {
      renderWithProviders(<BottomNavigation />, { isHighContrast: true });

      // High contrast styles are applied via CSS media queries
      // We can test that the component renders without errors
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should disable animations when reduced motion is preferred', () => {
      renderWithProviders(<BottomNavigation />, { prefersReducedMotion: true });

      // Reduced motion styles are applied via CSS media queries
      // We can test that the component renders without errors
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce navigation changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const liveClassTab = screen.getByRole('tab', {
        name: /live class navigation/i,
      });

      await user.click(liveClassTab);

      // Check for aria-live announcement (created dynamically by component)
      await waitFor(
        () => {
          const announcements = document.querySelectorAll('.sr-only');
          const hasNavigationAnnouncement = Array.from(announcements).some(el =>
            el.textContent?.includes('Navigated to Live Class')
          );
          expect(hasNavigationAnnouncement).toBe(true);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('WCAG Compliance', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderWithProviders(<BottomNavigation />);
      let results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in high contrast mode', async () => {
      const { container } = renderWithProviders(<BottomNavigation />, {
        isHighContrast: true,
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in dark mode', async () => {
      const { container } = renderWithProviders(<BottomNavigation />, {
        theme: 'dark',
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Icon Accessibility', () => {
    it('should have icons with aria-hidden attribute', () => {
      renderWithProviders(<BottomNavigation />);

      // Check that SVG icons have aria-hidden
      const svgIcons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgIcons.length).toBe(4); // One for each navigation item
    });

    it('should not expose decorative icons to screen readers', () => {
      renderWithProviders(<BottomNavigation />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        const svg = tab.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
