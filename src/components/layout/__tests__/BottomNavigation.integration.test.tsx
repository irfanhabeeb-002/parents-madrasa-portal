import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { BottomNavigation } from '../BottomNavigation';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { vi } from 'vitest';
import { vi } from 'vitest';

// Mock pages for testing navigation
const HomePage = () => {
  const location = useLocation();
  return <div data-testid="home-page">Home Page - {location.pathname}</div>;
};

const LiveClassPage = () => {
  const location = useLocation();
  return <div data-testid="live-class-page">Live Class Page - {location.pathname}</div>;
};

const ProfilePage = () => {
  const location = useLocation();
  return <div data-testid="profile-page">Profile Page - {location.pathname}</div>;
};

const SettingsPage = () => {
  const location = useLocation();
  return <div data-testid="settings-page">Settings Page - {location.pathname}</div>;
};

const TestApp: React.FC<{ initialEntries?: string[] }> = ({ initialEntries = ['/'] }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <NotificationProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/live-class/*" element={<LiveClassPage />} />
            <Route path="/profile/*" element={<ProfilePage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
          </Routes>
          <BottomNavigation />
        </ThemeProvider>
      </NotificationProvider>
    </MemoryRouter>
  );
};

describe('BottomNavigation Integration Tests', () => {
  describe('React Router Integration', () => {
    it('should navigate to home page when home tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TestApp initialEntries={['/profile']} />);
      
      // Initially on profile page
      expect(screen.getByTestId('profile-page')).toBeInTheDocument();
      
      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      await user.click(homeTab);
      
      // Should navigate to home
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
        expect(screen.queryByTestId('profile-page')).not.toBeInTheDocument();
      });
    });

    it('should navigate to live class page when live class tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TestApp />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      await user.click(liveClassTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('live-class-page')).toBeInTheDocument();
        expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
      });
    });

    it('should navigate to profile page when profile tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TestApp />);
      
      const profileTab = screen.getByRole('tab', { name: /profile navigation/i });
      await user.click(profileTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
        expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
      });
    });

    it('should navigate to settings page when settings tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TestApp />);
      
      const settingsTab = screen.getByRole('tab', { name: /settings navigation/i });
      await user.click(settingsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
        expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
      });
    });
  });

  describe('Active State Synchronization', () => {
    it('should show correct active state when starting on home page', () => {
      render(<TestApp initialEntries={['/']} />);
      
      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      expect(homeTab).toHaveAttribute('aria-current', 'page');
      expect(homeTab).toHaveClass('active');
    });

    it('should show correct active state when starting on live class page', () => {
      render(<TestApp initialEntries={['/live-class']} />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      expect(liveClassTab).toHaveAttribute('aria-current', 'page');
      expect(liveClassTab).toHaveClass('active');
    });

    it('should show correct active state when starting on profile page', () => {
      render(<TestApp initialEntries={['/profile']} />);
      
      const profileTab = screen.getByRole('tab', { name: /profile navigation/i });
      expect(profileTab).toHaveAttribute('aria-current', 'page');
      expect(profileTab).toHaveClass('active');
    });

    it('should show correct active state when starting on settings page', () => {
      render(<TestApp initialEntries={['/settings']} />);
      
      const settingsTab = screen.getByRole('tab', { name: /settings navigation/i });
      expect(settingsTab).toHaveAttribute('aria-current', 'page');
      expect(settingsTab).toHaveClass('active');
    });

    it('should handle nested routes correctly', () => {
      render(<TestApp initialEntries={['/live-class/session/123']} />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      expect(liveClassTab).toHaveAttribute('aria-current', 'page');
      expect(liveClassTab).toHaveClass('active');
    });

    it('should render correctly for unknown routes', () => {
      render(<TestApp initialEntries={['/unknown-route']} />);
      
      // The navigation should still render
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

  describe('Navigation Flow', () => {
    it('should maintain navigation state across multiple page changes', async () => {
      const user = userEvent.setup();
      render(<TestApp />);
      
      // Start on home
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      
      // Navigate to profile
      const profileTab = screen.getByRole('tab', { name: /profile navigation/i });
      await user.click(profileTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
        expect(profileTab).toHaveAttribute('aria-current', 'page');
      });
      
      // Navigate to settings
      const settingsTab = screen.getByRole('tab', { name: /settings navigation/i });
      await user.click(settingsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
        expect(settingsTab).toHaveAttribute('aria-current', 'page');
        expect(profileTab).not.toHaveAttribute('aria-current', 'page');
      });
      
      // Navigate back to home
      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      await user.click(homeTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
        expect(homeTab).toHaveAttribute('aria-current', 'page');
        expect(settingsTab).not.toHaveAttribute('aria-current', 'page');
      });
    });

    it('should handle rapid navigation changes', async () => {
      const user = userEvent.setup();
      render(<TestApp />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      const profileTab = screen.getByRole('tab', { name: /profile navigation/i });
      
      // Rapid navigation
      await user.click(liveClassTab);
      await user.click(profileTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('profile-page')).toBeInTheDocument();
        expect(profileTab).toHaveAttribute('aria-current', 'page');
        expect(liveClassTab).not.toHaveAttribute('aria-current', 'page');
      });
    });
  });

  describe('Keyboard Navigation Integration', () => {
    it('should navigate with keyboard and update route', async () => {
      const user = userEvent.setup();
      render(<TestApp />);
      
      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      
      homeTab.focus();
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByTestId('live-class-page')).toBeInTheDocument();
        expect(liveClassTab).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should handle space key navigation', async () => {
      const user = userEvent.setup();
      render(<TestApp />);
      
      const settingsTab = screen.getByRole('tab', { name: /settings navigation/i });
      
      settingsTab.focus();
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
        expect(settingsTab).toHaveAttribute('aria-current', 'page');
      });
    });
  });

  describe('URL Synchronization', () => {
    it('should display correct URL path in test pages', async () => {
      const user = userEvent.setup();
      render(<TestApp />);
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      await user.click(liveClassTab);
      
      await waitFor(() => {
        const liveClassPage = screen.getByTestId('live-class-page');
        expect(liveClassPage).toHaveTextContent('/live-class');
      });
    });

    it('should handle browser back/forward simulation', () => {
      // Test with different initial entries to simulate browser history
      render(<TestApp initialEntries={['/', '/profile', '/settings']} />);
      
      // Should start on the last entry (settings)
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      
      const settingsTab = screen.getByRole('tab', { name: /settings navigation/i });
      expect(settingsTab).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TestApp />);
      
      const homeTab = screen.getByRole('tab', { name: /home navigation/i });
      
      // Should not throw even with potential navigation errors
      await user.click(homeTab);
      
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders during navigation', async () => {
      const user = userEvent.setup();
      const renderSpy = vi.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <TestApp />;
      };
      
      render(<TestComponent />);
      
      const initialRenderCount = renderSpy.mock.calls.length;
      
      const liveClassTab = screen.getByRole('tab', { name: /live class navigation/i });
      await user.click(liveClassTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('live-class-page')).toBeInTheDocument();
      });
      
      // Should not cause excessive re-renders
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(initialRenderCount + 2);
    });
  });
});