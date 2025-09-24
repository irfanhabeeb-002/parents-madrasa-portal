import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { BottomNavigation } from '../BottomNavigation';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { vi } from 'vitest';

const renderWithProviders = (
  component: React.ReactElement,
  initialEntries: string[] = ['/']
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <NotificationProvider>
        <ThemeProvider>{component}</ThemeProvider>
      </NotificationProvider>
    </MemoryRouter>
  );
};

describe('BottomNavigation Unit Tests', () => {
  beforeEach(() => {
    // Clear any existing announcements
    document.querySelectorAll('[aria-live]').forEach(el => el.remove());
    document.querySelectorAll('.sr-only').forEach(el => el.remove());
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<BottomNavigation />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      renderWithProviders(<BottomNavigation />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Live Class')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render with correct initial active state', () => {
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      expect(homeTab).toHaveAttribute('aria-current', 'page');
      expect(homeTab).toHaveClass('active');
    });

    it('should render sliding indicator', () => {
      renderWithProviders(<BottomNavigation />);

      const indicator = document.querySelector('.nav-indicator-enhanced');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Navigation Functionality', () => {
    it('should handle click navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const liveClassTab = screen.getByRole('tab', {
        name: /live class navigation/i,
      });

      await user.click(liveClassTab);

      expect(liveClassTab).toHaveAttribute('aria-current', 'page');
      expect(liveClassTab).toHaveClass('active');
    });

    it('should update active state based on route', () => {
      renderWithProviders(<BottomNavigation />, ['/profile']);

      const profileTab = screen.getByRole('tab', {
        name: /profile navigation/i,
      });
      expect(profileTab).toHaveAttribute('aria-current', 'page');
      expect(profileTab).toHaveClass('active');
    });

    it('should handle keyboard navigation with Enter key', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const settingsTab = screen.getByRole('tab', {
        name: /settings navigation/i,
      });

      settingsTab.focus();
      await user.keyboard('{Enter}');

      expect(settingsTab).toHaveAttribute('aria-current', 'page');
    });

    it('should handle keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const profileTab = screen.getByRole('tab', {
        name: /profile navigation/i,
      });

      profileTab.focus();
      await user.keyboard(' ');

      expect(profileTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle arrow key navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      const liveClassTab = screen.getByRole('tab', {
        name: /live class navigation/i,
      });

      homeTab.focus();
      await user.keyboard('{ArrowRight}');

      expect(liveClassTab).toHaveFocus();
    });

    it('should wrap around with arrow keys', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      const settingsTab = screen.getByRole('tab', {
        name: /settings navigation/i,
      });

      homeTab.focus();
      await user.keyboard('{ArrowLeft}');

      expect(settingsTab).toHaveFocus();
    });

    it('should handle Home key navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      const settingsTab = screen.getByRole('tab', {
        name: /settings navigation/i,
      });

      settingsTab.focus();
      await user.keyboard('{Home}');

      expect(homeTab).toHaveFocus();
    });

    it('should handle End key navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      const settingsTab = screen.getByRole('tab', {
        name: /settings navigation/i,
      });

      homeTab.focus();
      await user.keyboard('{End}');

      expect(settingsTab).toHaveFocus();
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

      // Wait for announcement to be created
      await waitFor(() => {
        const announcements = document.querySelectorAll('.sr-only');
        const hasAnnouncement = Array.from(announcements).some(el =>
          el.textContent?.includes('Navigated to Live Class')
        );
        expect(hasAnnouncement).toBe(true);
      });
    });

    it('should clean up announcements after timeout', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const profileTab = screen.getByRole('tab', {
        name: /profile navigation/i,
      });

      await user.click(profileTab);

      // Wait for announcement to be created and then removed
      await waitFor(() => {
        const announcements = document.querySelectorAll('.sr-only');
        const hasAnnouncement = Array.from(announcements).some(el =>
          el.textContent?.includes('Navigated to Profile')
        );
        expect(hasAnnouncement).toBe(true);
      });

      // Wait for cleanup (1000ms timeout in component)
      await waitFor(
        () => {
          const announcements = document.querySelectorAll('.sr-only');
          const hasAnnouncement = Array.from(announcements).some(el =>
            el.textContent?.includes('Navigated to Profile')
          );
          expect(hasAnnouncement).toBe(false);
        },
        { timeout: 1500 }
      );
    });
  });

  describe('Indicator Animation', () => {
    it('should position indicator correctly for active tab', () => {
      renderWithProviders(<BottomNavigation />);

      const indicator = document.querySelector('.nav-indicator-enhanced');
      expect(indicator).toHaveStyle('transform: translateX(0%)'); // Home tab (index 0)
    });

    it('should update indicator position when tab changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const liveClassTab = screen.getByRole('tab', {
        name: /live class navigation/i,
      });

      await user.click(liveClassTab);

      const indicator = document.querySelector('.nav-indicator-enhanced');
      expect(indicator).toHaveStyle('transform: translateX(100%)'); // Live Class tab (index 1)
    });
  });

  describe('Route Matching', () => {
    it('should match exact home route', () => {
      renderWithProviders(<BottomNavigation />, ['/']);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      expect(homeTab).toHaveAttribute('aria-current', 'page');
    });

    it('should match nested routes', () => {
      renderWithProviders(<BottomNavigation />, ['/live-class/session/123']);

      const liveClassTab = screen.getByRole('tab', {
        name: /live class navigation/i,
      });
      expect(liveClassTab).toHaveAttribute('aria-current', 'page');
    });

    it('should render correctly for unknown routes', () => {
      // For unknown routes, the component should still render
      renderWithProviders(<BottomNavigation />, ['/unknown-route']);

      // The component should render
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Should have 4 tabs
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);

      // All navigation items should be present
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Live Class')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should prevent default behavior for keyboard events', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const homeTab = screen.getByRole('tab', { name: /home navigation/i });

      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(keydownEvent, 'preventDefault');

      homeTab.focus();
      fireEvent(homeTab, keydownEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should handle multiple rapid clicks gracefully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);

      const liveClassTab = screen.getByRole('tab', {
        name: /live class navigation/i,
      });

      // Rapid clicks
      await user.click(liveClassTab);
      await user.click(liveClassTab);
      await user.click(liveClassTab);

      expect(liveClassTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Component Structure', () => {
    it('should have correct DOM structure', () => {
      renderWithProviders(<BottomNavigation />);

      const nav = screen.getByRole('navigation');
      const tablist = nav.querySelector('[role="tablist"]');
      const tabs = tablist?.querySelectorAll('[role="tab"]');
      const indicator = nav.querySelector('.nav-indicator-enhanced');

      expect(tablist).toBeInTheDocument();
      expect(tabs).toHaveLength(4);
      expect(indicator).toBeInTheDocument();
    });

    it('should have correct CSS classes', () => {
      renderWithProviders(<BottomNavigation />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('nav-button-enhanced');

        const icon = tab.querySelector('.nav-icon-enhanced');
        expect(icon).toBeInTheDocument();
      });
    });
  });
});
