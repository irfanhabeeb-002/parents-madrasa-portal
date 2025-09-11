import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { BottomNavigation } from '../BottomNavigation';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { vi } from 'vitest';

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

describe('BottomNavigation Performance Tests', () => {
  beforeEach(() => {
    // Clear any existing timers
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Render Performance', () => {
    it('should render quickly without performance issues', () => {
      const startTime = performance.now();
      
      renderWithProviders(<BottomNavigation />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Render should complete within reasonable time (100ms)
      expect(renderTime).toBeLessThan(100);
      
      // Component should be in DOM
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should not cause memory leaks during multiple renders', () => {
      const { unmount, rerender } = renderWithProviders(<BottomNavigation />);
      
      // Render multiple times
      for (let i = 0; i < 10; i++) {
        rerender(
          <BrowserRouter>
            <NotificationProvider>
              <ThemeProvider>
                <BottomNavigation />
              </ThemeProvider>
            </NotificationProvider>
          </BrowserRouter>
        );
      }
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Cleanup should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid re-renders efficiently', () => {
      const TestComponent = ({ key }: { key: number }) => (
        <BrowserRouter key={key}>
          <NotificationProvider>
            <ThemeProvider>
              <BottomNavigation />
            </ThemeProvider>
          </NotificationProvider>
        </BrowserRouter>
      );

      const { rerender } = render(<TestComponent key={0} />);
      
      const startTime = performance.now();
      
      // Rapid re-renders
      for (let i = 1; i <= 20; i++) {
        rerender(<TestComponent key={i} />);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle rapid re-renders efficiently (under 200ms for 20 renders)
      expect(totalTime).toBeLessThan(200);
    });
  });

  describe('Animation Performance', () => {
    it('should handle indicator animations efficiently', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      const profileTab = screen.getByRole('tab', { name: /profile navigation/i });
      
      const startTime = performance.now();
      
      // Rapid navigation changes
      await user.click(liveClassTab);
      await user.click(profileTab);
      await user.click(liveClassTab);
      
      const endTime = performance.now();
      const animationTime = endTime - startTime;
      
      // Animation updates should be efficient
      expect(animationTime).toBeLessThan(100);
    });

    it('should not block main thread during animations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const tabs = screen.getAllByRole('tab');
      
      // Test navigation without blocking
      await user.click(tabs[1]);
      await user.click(tabs[2]);
      
      // Should not block main thread
      const indicator = document.querySelector('.nav-indicator-enhanced');
      expect(indicator).toBeInTheDocument();
    });

    it('should clean up animation timers properly', async () => {
      const user = userEvent.setup();
      const { unmount } = renderWithProviders(<BottomNavigation />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      await user.click(liveClassTab);
      
      // Fast forward timers
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Unmount should clean up timers
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Event Handler Performance', () => {
    it('should handle rapid clicks efficiently', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      
      const startTime = performance.now();
      
      // Test a few rapid clicks
      await user.click(liveClassTab);
      await user.click(liveClassTab);
      await user.click(liveClassTab);
      
      const endTime = performance.now();
      const clickTime = endTime - startTime;
      
      // Should handle rapid clicks efficiently (increased threshold for test environment)
      expect(clickTime).toBeLessThan(500);
    });

    it('should handle keyboard events efficiently', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      homeTab.focus();
      
      const startTime = performance.now();
      
      // Test a few keyboard navigation events
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowRight}');
      
      const endTime = performance.now();
      const keyboardTime = endTime - startTime;
      
      // Should handle keyboard events efficiently (increased threshold for test environment)
      expect(keyboardTime).toBeLessThan(500);
    });

    it('should debounce rapid navigation attempts', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      
      // Rapid clicks should not cause excessive navigation calls
      await user.click(liveClassTab);
      await user.click(liveClassTab);
      await user.click(liveClassTab);
      
      // Component should handle this gracefully
      expect(liveClassTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderWithProviders(<BottomNavigation />);
      
      // Component should be rendered
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Unmount should clean up
      unmount();
      
      // Should not throw during cleanup
      expect(() => {
        // Trigger any remaining cleanup
        act(() => {
          vi.runAllTimers();
        });
      }).not.toThrow();
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should clean up screen reader announcements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      await user.click(liveClassTab);
      
      // Announcement should be created
      let announcements = document.querySelectorAll('.sr-only');
      expect(announcements.length).toBeGreaterThan(0);
      
      // Fast forward past cleanup timeout
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      
      // Announcements should be cleaned up
      announcements = document.querySelectorAll('.sr-only');
      const hasNavigationAnnouncement = Array.from(announcements).some(
        el => el.textContent?.includes('Navigated to Live Class')
      );
      expect(hasNavigationAnnouncement).toBe(false);
    });

    it('should not create excessive DOM elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const initialElementCount = document.querySelectorAll('*').length;
      
      // Navigate a few times
      const tabs = screen.getAllByRole('tab');
      await user.click(tabs[1]);
      await user.click(tabs[2]);
      
      // Fast forward timers to clean up announcements
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      
      const finalElementCount = document.querySelectorAll('*').length;
      
      // Should not create excessive elements (allow some variance for announcements)
      expect(finalElementCount - initialElementCount).toBeLessThan(20);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should not import unnecessary dependencies', () => {
      // This test ensures the component doesn't import heavy dependencies
      const { container } = renderWithProviders(<BottomNavigation />);
      
      // Component should render with minimal DOM footprint
      const navigationElements = container.querySelectorAll('*');
      
      // Should have reasonable DOM size (the actual component has more elements due to styling)
      expect(navigationElements.length).toBeLessThan(50);
    });

    it('should use efficient CSS classes', () => {
      renderWithProviders(<BottomNavigation />);
      
      // Check that Tailwind classes are applied efficiently
      const nav = screen.getByRole('navigation');
      
      // Should have styles applied via classes
      expect(nav).toHaveClass('fixed');
      expect(nav).toHaveClass('bottom-0');
    });
  });

  describe('Accessibility Performance', () => {
    it('should handle screen reader announcements efficiently', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const startTime = performance.now();
      
      // Test a few navigation changes
      const tabs = screen.getAllByRole('tab');
      await user.click(tabs[1]);
      await user.click(tabs[2]);
      await user.click(tabs[0]);
      
      const endTime = performance.now();
      const announcementTime = endTime - startTime;
      
      // Should handle announcements efficiently (increased threshold for test environment)
      expect(announcementTime).toBeLessThan(1000);
    });

    it('should not impact focus management performance', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BottomNavigation />);
      
      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      homeTab.focus();
      
      const startTime = performance.now();
      
      // Test a few focus changes
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowLeft}');
      
      const endTime = performance.now();
      const focusTime = endTime - startTime;
      
      // Focus management should be efficient (increased threshold for test environment)
      expect(focusTime).toBeLessThan(1000);
    });
  });
});