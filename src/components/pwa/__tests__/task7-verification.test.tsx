import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InstallButton } from '../InstallButton';
import { useInstallPrompt } from '../InstallPrompt';
import { useTheme } from '../../../contexts/ThemeContext';
import { getInstallState } from '../../../utils/installStateDetection';

// Mock the hooks
vi.mock('../InstallPrompt', () => ({
  useInstallPrompt: vi.fn(),
}));

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

vi.mock('../../../services/AnalyticsService', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  },
}));

vi.mock('../../../utils/installStateDetection', () => ({
  getInstallState: vi.fn(() => ({
    isInstallable: true,
    isInstalled: false,
    displayMode: 'browser',
    installMethod: 'beforeinstallprompt',
    browserInfo: {
      isIOS: false,
      isAndroid: false,
      isChrome: true,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
      supportsBeforeInstallPrompt: true,
      supportsServiceWorker: true,
    },
    confidence: 'high',
  })),
  createDisplayModeListener: vi.fn(() => () => {}),
}));

const mockUseInstallPrompt = vi.mocked(useInstallPrompt);
const mockUseTheme = vi.mocked(useTheme);
const mockGetInstallState = vi.mocked(getInstallState);

describe('Task 7: Install Button Availability and Placement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default theme mock
    mockUseTheme.mockReturnValue({
      theme: 'light',
      isHighContrast: false,
      prefersReducedMotion: false,
      toggleTheme: vi.fn(),
      setHighContrast: vi.fn(),
      setReducedMotion: vi.fn(),
    });

    // Default install prompt mock
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      installState: 'available',
      deferredPrompt: {},
      promptInstall: vi.fn().mockResolvedValue(true),
      checkInstallState: vi.fn(),
      wasRecentlyDismissed: false,
    });
  });

  describe('Requirement 6.1: Settings page install button availability', () => {
    it('should always show install button in settings when installation is possible', () => {
      render(
        <InstallButton
          placement="settings"
          fallbackBehavior="show-message"
          source="settings_test"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Install App');
    });

    it('should show informational message in settings when not installable', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        installState: 'not-supported',
        deferredPrompt: null,
        promptInstall: vi.fn(),
        checkInstallState: vi.fn(),
        wasRecentlyDismissed: false,
      });

      mockGetInstallState.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        displayMode: 'browser',
        installMethod: 'not-supported',
        browserInfo: {
          isIOS: false,
          isAndroid: false,
          isChrome: true,
          isFirefox: false,
          isSafari: false,
          isEdge: false,
          supportsBeforeInstallPrompt: false,
          supportsServiceWorker: true,
        },
        confidence: 'high',
      });

      render(
        <InstallButton
          placement="settings"
          fallbackBehavior="show-message"
          source="settings_test"
        />
      );

      expect(screen.getByText('Install not available')).toBeInTheDocument();
      expect(
        screen.getByText(/Check your browser settings/)
      ).toBeInTheDocument();
    });
  });

  describe('Requirement 6.2: Conditional rendering based on install state', () => {
    it('should hide button when fallbackBehavior is hide and not installable', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        installState: 'not-supported',
        deferredPrompt: null,
        promptInstall: vi.fn(),
        checkInstallState: vi.fn(),
        wasRecentlyDismissed: false,
      });

      mockGetInstallState.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        displayMode: 'browser',
        installMethod: 'not-supported',
        browserInfo: {
          isIOS: false,
          isAndroid: false,
          isChrome: true,
          isFirefox: false,
          isSafari: false,
          isEdge: false,
          supportsBeforeInstallPrompt: false,
          supportsServiceWorker: true,
        },
        confidence: 'high',
      });

      const { container } = render(
        <InstallButton
          placement="navbar"
          fallbackBehavior="hide"
          source="navbar_test"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should show installed status when app is already installed', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: false,
        isInstalled: true,
        installState: 'installed',
        deferredPrompt: null,
        promptInstall: vi.fn(),
        checkInstallState: vi.fn(),
        wasRecentlyDismissed: false,
      });

      render(
        <InstallButton
          placement="settings"
          fallbackBehavior="show-message"
          source="settings_test"
        />
      );

      expect(screen.getByText('App Installed')).toBeInTheDocument();
    });
  });

  describe('Requirement 6.3: Consistent behavior across UI contexts', () => {
    it('should apply different behaviors based on placement', () => {
      const placements = ['settings', 'navbar', 'inline'] as const;

      placements.forEach(placement => {
        const { unmount } = render(
          <InstallButton
            placement={placement}
            fallbackBehavior="hide"
            source={`${placement}_test`}
          />
        );

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();

        // Verify aria-label includes placement context
        const ariaLabel = button.getAttribute('aria-label');
        if (placement === 'settings') {
          expect(ariaLabel).toContain('Located in app settings');
        }

        unmount();
      });
    });
  });

  describe('Requirement 6.4: Loading states and error handling', () => {
    it('should show loading state when showLoadingState is true', async () => {
      const mockPromptInstall = vi
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );

      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        deferredPrompt: {},
        promptInstall: mockPromptInstall,
        checkInstallState: vi.fn(),
        wasRecentlyDismissed: false,
      });

      render(
        <InstallButton
          placement="settings"
          showLoadingState={true}
          source="loading_test"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveTextContent('Installing...');
      });

      await waitFor(
        () => {
          expect(button).not.toHaveTextContent('Installing...');
        },
        { timeout: 200 }
      );
    });

    it('should show error state and retry option when installation fails', async () => {
      const mockPromptInstall = vi
        .fn()
        .mockRejectedValue(new Error('Install failed'));

      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        deferredPrompt: {},
        promptInstall: mockPromptInstall,
        checkInstallState: vi.fn(),
        wasRecentlyDismissed: false,
      });

      render(
        <InstallButton
          placement="settings"
          showErrorState={true}
          source="error_test"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveTextContent(/Install Failed|Retry Install/);
      });

      // Verify retry functionality
      fireEvent.click(button);
      expect(mockPromptInstall).toHaveBeenCalledTimes(2);
    });

    it('should not show loading state when showLoadingState is false', async () => {
      const mockPromptInstall = vi
        .fn()
        .mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(true), 50))
        );

      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        deferredPrompt: {},
        promptInstall: mockPromptInstall,
        checkInstallState: vi.fn(),
        wasRecentlyDismissed: false,
      });

      render(
        <InstallButton
          placement="navbar"
          showLoadingState={false}
          source="no_loading_test"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should not show loading text
      expect(button).not.toHaveTextContent('Installing...');
    });
  });

  describe('Requirement 6.5: Alternative access methods', () => {
    it('should provide forceShow option for testing/debugging', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        installState: 'not-supported',
        deferredPrompt: null,
        promptInstall: vi.fn(),
        checkInstallState: vi.fn(),
        wasRecentlyDismissed: false,
      });

      mockGetInstallState.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        displayMode: 'browser',
        installMethod: 'not-supported',
        browserInfo: {
          isIOS: false,
          isAndroid: false,
          isChrome: true,
          isFirefox: false,
          isSafari: false,
          isEdge: false,
          supportsBeforeInstallPrompt: false,
          supportsServiceWorker: true,
        },
        confidence: 'high',
      });

      render(
        <InstallButton
          placement="settings"
          fallbackBehavior="hide"
          forceShow={true}
          source="force_show_test"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Install App');
    });

    it('should track different sources and placements in analytics', async () => {
      const { analyticsService } = await import(
        '../../../services/AnalyticsService'
      );

      render(<InstallButton placement="settings" source="analytics_test" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(analyticsService.trackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'install_button_clicked',
            custom_parameters: expect.objectContaining({
              source: 'analytics_test',
              placement: 'settings',
            }),
          })
        );
      });
    });
  });
});
