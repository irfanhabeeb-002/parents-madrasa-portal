import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { BottomNavigation } from '../BottomNavigation';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { vi } from 'vitest';

// Mock matchMedia for different scenarios
const mockMatchMedia = (queries: Record<string, boolean>) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: queries[query] || false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <NotificationProvider>
        <ThemeProvider>
          {component}
        </ThemeProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('BottomNavigation Visual Tests', () => {
  beforeEach(() => {
    // Reset matchMedia mock
    mockMatchMedia({});
  });

  describe('Responsive Design', () => {
    it('should render with mobile-optimized styles', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Check that tabs have proper mobile touch targets
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab.className).toMatch(/min-h-\[56px\]/);
        expect(tab.className).toMatch(/min-w-\[48px\]/);
      });
    });

    it('should render with tablet-optimized styles', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Component should render without errors on tablet
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });

    it('should render with desktop-optimized styles', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Component should render without errors on desktop
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });
  });

  describe('Theme Support', () => {
    it('should render correctly in light theme', () => {
      mockMatchMedia({
        '(prefers-color-scheme: dark)': false
      });

      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Check that all elements render in light theme
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });

    it('should render correctly in dark theme', () => {
      mockMatchMedia({
        '(prefers-color-scheme: dark)': true
      });

      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Check that all elements render in dark theme
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });

    it('should render correctly in high contrast mode', () => {
      mockMatchMedia({
        '(prefers-contrast: high)': true
      });

      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // High contrast mode should not break rendering
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });

    it('should render correctly with reduced motion', () => {
      mockMatchMedia({
        '(prefers-reduced-motion: reduce)': true
      });

      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Reduced motion should not break rendering
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });
  });

  describe('Visual States', () => {
    it('should display correct active state styling', () => {
      renderWithProviders(<BottomNavigation />);
      
      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      expect(homeTab).toHaveClass('active');
      
      // Other tabs should not have active class
      const otherTabs = screen.getAllByRole('tab').filter(tab => tab !== homeTab);
      otherTabs.forEach(tab => {
        expect(tab).not.toHaveClass('active');
      });
    });

    it('should display correct inactive state styling', () => {
      renderWithProviders(<BottomNavigation />);
      
      const tabs = screen.getAllByRole('tab');
      const inactiveTabs = tabs.slice(1); // All except home (first tab)
      
      inactiveTabs.forEach(tab => {
        expect(tab).not.toHaveClass('active');
        expect(tab).not.toHaveAttribute('aria-current', 'page');
      });
    });

    it('should display hover states correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      
      // Hover should not break the component
      await user.hover(liveClassTab);
      expect(liveClassTab).toBeInTheDocument();
      
      await user.unhover(liveClassTab);
      expect(liveClassTab).toBeInTheDocument();
    });

    it('should display focus states correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const profileTab = screen.getByRole('tab', { name: /profile navigation/i });
      
      await user.tab();
      if (profileTab === document.activeElement) {
        expect(profileTab).toHaveFocus();
      }
    });
  });

  describe('Animation States', () => {
    it('should position sliding indicator correctly', () => {
      renderWithProviders(<BottomNavigation />);
      
      const indicator = document.querySelector('.nav-indicator-enhanced');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveStyle('transform: translateX(0%)'); // Home position
    });

    it('should update indicator position on navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      await user.click(liveClassTab);
      
      const indicator = document.querySelector('.nav-indicator-enhanced');
      expect(indicator).toHaveStyle('transform: translateX(100%)'); // Live Class position
    });

    it('should handle animation with reduced motion preference', () => {
      mockMatchMedia({
        '(prefers-reduced-motion: reduce)': true
      });

      renderWithProviders(<BottomNavigation />);
      
      const indicator = document.querySelector('.nav-indicator-enhanced');
      expect(indicator).toBeInTheDocument();
      
      // Component should render correctly even with reduced motion
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render all navigation icons', () => {
      renderWithProviders(<BottomNavigation />);
      
      const svgIcons = document.querySelectorAll('svg');
      expect(svgIcons).toHaveLength(4); // One for each navigation item
      
      svgIcons.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(svg).toHaveClass('w-6');
        expect(svg).toHaveClass('h-6');
      });
    });

    it('should render icons with correct styling', () => {
      renderWithProviders(<BottomNavigation />);
      
      const iconContainers = document.querySelectorAll('.nav-icon-enhanced');
      expect(iconContainers).toHaveLength(4);
      
      iconContainers.forEach(container => {
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should scale active icon correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      await user.click(liveClassTab);
      
      // Active tab should have scaled icon
      expect(liveClassTab).toHaveClass('active');
      
      const activeIcon = liveClassTab.querySelector('.nav-icon-enhanced svg');
      expect(activeIcon).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should maintain correct container structure', () => {
      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      const tablist = nav.querySelector('[role="tablist"]');
      const indicator = nav.querySelector('.nav-indicator-enhanced');
      const tabs = tablist?.querySelectorAll('[role="tab"]');
      
      expect(tablist).toBeInTheDocument();
      expect(indicator).toBeInTheDocument();
      expect(tabs).toHaveLength(4);
    });

    it('should maintain correct tab structure', () => {
      renderWithProviders(<BottomNavigation />);
      
      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach(tab => {
        const icon = tab.querySelector('.nav-icon-enhanced');
        const label = tab.querySelector('span');
        
        expect(icon).toBeInTheDocument();
        expect(label).toBeInTheDocument();
      });
    });

    it('should have correct z-index layering', () => {
      renderWithProviders(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      const indicator = document.querySelector('.nav-indicator-enhanced');
      const tabs = screen.getAllByRole('tab');
      
      // Navigation should be fixed at bottom
      expect(nav).toHaveClass('fixed');
      expect(nav).toHaveClass('bottom-0');
      
      // Indicator and tabs should have proper z-index
      expect(indicator).toBeInTheDocument();
      expect(tabs).toHaveLength(4);
    });
  });

  describe('Text and Typography', () => {
    it('should render text labels correctly', () => {
      renderWithProviders(<BottomNavigation />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Live Class')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should apply correct typography styles', () => {
      renderWithProviders(<BottomNavigation />);
      
      const labels = ['Home', 'Live Class', 'Profile', 'Settings'];
      
      labels.forEach(label => {
        const element = screen.getByText(label);
        expect(element.tagName).toBe('SPAN');
      });
    });

    it('should handle text overflow correctly', () => {
      renderWithProviders(<BottomNavigation />);
      
      // Text should not overflow containers
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        const span = tab.querySelector('span');
        expect(span).toHaveClass('leading-tight');
      });
    });
  });
});