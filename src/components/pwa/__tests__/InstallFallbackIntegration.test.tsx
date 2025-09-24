import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InstallPrompt } from '../InstallPrompt';
import { FallbackInstallButton } from '../FallbackInstallButton';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock the hooks and services
vi.mock('../../../utils/performance', () => ({
  useInstallPromptPerformance: () => ({
    measureThemeChange: vi.fn(),
    measurePositioning: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useInstallPromptTiming', () => ({
  useInstallPromptTiming: () => ({
    canShowPrompt: true,
    promptDelay: 1000,
    handleDismissal: vi.fn(),
    handleInstallation: vi.fn(),
    handlePromptShown: vi.fn(),
    handlePromptInteraction: vi.fn(),
  }),
}));

vi.mock('../../../services/AnalyticsService', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  },
}));

vi.mock('../../../utils/installStateDetection', () => ({
  createInstallStateDetector: () => ({}),
  getInstallState: () => ({
    isInstalled: false,
    isInstallable: true,
    installMethod: 'beforeinstallprompt',
    displayMode: 'browser',
    confidence: 'high',
    browserInfo: { isChrome: true },
  }),
  createDisplayModeListener: () => () => {},
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Install Fallback Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock window.matchMedia
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

  it('should show fallback button when automatic prompt fails to appear', async () => {
    render(
      <TestWrapper>
        <InstallPrompt />
        <FallbackInstallButton showAfterDelay={100} placement="floating" />
      </TestWrapper>
    );

    // Initially, no install UI should be visible
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByText(/install app/i)).not.toBeInTheDocument();

    // Wait for fallback to appear
    await waitFor(
      () => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
      },
      { timeout: 200 }
    );

    // Verify fallback button content
    expect(screen.getByText('Install App')).toBeInTheDocument();
    expect(screen.getByText(/ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക/)).toBeInTheDocument();
  });

  it('should not show fallback when automatic prompt is working', async () => {
    // Mock a successful beforeinstallprompt event
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
      platforms: ['web'],
    };

    render(
      <TestWrapper>
        <InstallPrompt />
        <FallbackInstallButton showAfterDelay={100} placement="floating" />
      </TestWrapper>
    );

    // Simulate beforeinstallprompt event
    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), mockEvent)
      );
    });

    // Wait a bit to see if fallback appears (it shouldn't)
    await new Promise(resolve => setTimeout(resolve, 150));

    // Fallback should not appear since automatic prompt is working
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('should hide fallback when app becomes installed', async () => {
    render(
      <TestWrapper>
        <InstallPrompt />
        <FallbackInstallButton showAfterDelay={50} placement="floating" />
      </TestWrapper>
    );

    // Wait for fallback to appear
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // Simulate app installation
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    // Fallback should disappear
    await waitFor(() => {
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    });
  });

  it('should maintain consistent styling between components', async () => {
    render(
      <TestWrapper>
        <InstallPrompt />
        <FallbackInstallButton showAfterDelay={50} placement="floating" />
      </TestWrapper>
    );

    // Wait for fallback to appear
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    const installButton = screen.getByRole('button', { name: /install/i });

    // Check for consistent styling classes
    expect(installButton).toHaveClass('bg-blue-600');
    expect(installButton).toHaveClass('text-white');
    expect(installButton).toHaveClass('rounded-lg');
    expect(installButton).toHaveClass('min-h-[48px]');
  });
});
