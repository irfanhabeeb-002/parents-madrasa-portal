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

// Mock install state detection utilities
vi.mock('../../../utils/installStateDetection', () => ({
  getInstallState: vi.fn(),
  createDisplayModeListener: vi.fn(() => () => {}), // Return cleanup function
}));

// Mock analytics service
vi.mock('../../../services/AnalyticsService', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  },
}));

// Mock AccessibleButton
vi.mock('../../ui/AccessibleButton', () => ({
  AccessibleButton: ({
    children,
    onClick,
    className,
    ariaLabel,
    ...props
  }: any) => (
    <button
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  ),
}));

const mockUseInstallPrompt = useInstallPrompt as any;
const mockUseTheme = useTheme as any;
const mockGetInstallState = getInstallState as any;

describe('InstallButton', () => {
  beforeEach(() => {
    // Default theme mock
    mockUseTheme.mockReturnValue({
      theme: 'light',
      isHighContrast: false,
      prefersReducedMotion: false,
    });

    // Default install state mock - installable and not installed
    mockGetInstallState.mockReturnValue({
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
    });
  });

  describe('Visibility Logic', () => {
    it('should render when installable and not installed', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        promptInstall: vi.fn(),
        wasRecentlyDismissed: false,
      });

      render(<InstallButton />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });

    it('should show not available status when not installable', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        installState: 'not-supported',
        promptInstall: vi.fn(),
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
          isChrome: false,
          isFirefox: true,
          isSafari: false,
          isEdge: false,
          supportsBeforeInstallPrompt: false,
          supportsServiceWorker: true,
        },
        confidence: 'low',
      });

      render(<InstallButton />);

      expect(screen.getByText('Install not available')).toBeInTheDocument();
    });

    it('should show installed status when already installed', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: false,
        isInstalled: true,
        installState: 'installed',
        promptInstall: vi.fn(),
        wasRecentlyDismissed: false,
      });

      mockGetInstallState.mockReturnValue({
        isInstallable: false,
        isInstalled: true,
        displayMode: 'standalone',
        installMethod: 'manual',
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
      });

      render(<InstallButton />);

      expect(screen.getByText('App Installed')).toBeInTheDocument();
      expect(screen.getByText('ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തു')).toBeInTheDocument();
    });
  });

  describe('Install Functionality', () => {
    it('should call promptInstall when clicked', async () => {
      const mockPromptInstall = vi.fn().mockResolvedValue(true);
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        promptInstall: mockPromptInstall,
        wasRecentlyDismissed: false,
      });

      render(<InstallButton />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPromptInstall).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onInstallStart and onInstallComplete callbacks', async () => {
      const mockPromptInstall = vi.fn().mockResolvedValue(true);
      const onInstallStart = vi.fn();
      const onInstallComplete = vi.fn();

      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        promptInstall: mockPromptInstall,
        wasRecentlyDismissed: false,
      });

      render(
        <InstallButton
          onInstallStart={onInstallStart}
          onInstallComplete={onInstallComplete}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onInstallStart).toHaveBeenCalledTimes(1);
        expect(onInstallComplete).toHaveBeenCalledWith(true);
      });
    });

    it('should handle install errors gracefully', async () => {
      const mockPromptInstall = vi
        .fn()
        .mockRejectedValue(new Error('Install failed'));
      const onInstallComplete = vi.fn();

      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        promptInstall: mockPromptInstall,
        wasRecentlyDismissed: false,
      });

      render(<InstallButton onInstallComplete={onInstallComplete} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onInstallComplete).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Styling and Variants', () => {
    beforeEach(() => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        promptInstall: vi.fn(),
        wasRecentlyDismissed: false,
      });
    });

    it('should apply primary variant styles by default', () => {
      render(<InstallButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
      expect(button).toHaveClass('text-white');
    });

    it('should apply secondary variant styles', () => {
      render(<InstallButton variant="secondary" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('text-blue-700');
    });

    it('should apply default variant styles when variant not recognized', () => {
      render(<InstallButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
      expect(button).toHaveClass('text-white');
    });

    it('should apply different size styles', () => {
      const { rerender } = render(<InstallButton size="sm" />);
      expect(screen.getByRole('button')).toHaveClass('min-h-[48px]');

      rerender(<InstallButton size="md" />);
      expect(screen.getByRole('button')).toHaveClass('min-h-[48px]');

      rerender(<InstallButton size="lg" />);
      expect(screen.getByRole('button')).toHaveClass('min-h-[56px]');
    });

    it('should apply high contrast styles', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        isHighContrast: true,
        prefersReducedMotion: false,
      });

      render(<InstallButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-black');
      expect(button).toHaveClass('text-white');
      expect(button).toHaveClass('border-2');
    });

    it('should apply dark theme styles', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        isHighContrast: false,
        prefersReducedMotion: false,
      });

      render(<InstallButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('should respect reduced motion preferences', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        isHighContrast: false,
        prefersReducedMotion: true,
      });

      render(<InstallButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('motion-reduce:transition-none');
      expect(button).toHaveClass('motion-reduce:transform-none');
    });
  });

  describe('Content and Accessibility', () => {
    beforeEach(() => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        installState: 'available',
        promptInstall: vi.fn(),
        wasRecentlyDismissed: false,
      });
    });

    it('should render default content with icon', () => {
      render(<InstallButton />);

      expect(screen.getByText('Install App')).toBeInTheDocument();
      const button = screen.getByRole('button');
      const ariaLabel = button.getAttribute('aria-label');
      expect(ariaLabel).toContain(
        'Install Madrasa Portal app on your device for quick access and offline functionality'
      );
      expect(ariaLabel).toContain('മദ്രസ പോർട്ടൽ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക');
    });

    it('should render custom children', () => {
      render(<InstallButton>Custom Install Text</InstallButton>);

      expect(screen.getByText('Custom Install Text')).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(<InstallButton showIcon={false} />);

      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeNull();
    });

    it('should apply custom className', () => {
      render(<InstallButton className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});
