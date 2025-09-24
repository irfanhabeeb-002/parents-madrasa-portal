import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FallbackInstallButton } from '../FallbackInstallButton';
import { useInstallPrompt } from '../InstallPrompt';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock the hooks
vi.mock('../InstallPrompt', () => ({
  useInstallPrompt: vi.fn(),
}));

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

const mockUseInstallPrompt = vi.mocked(useInstallPrompt);
const mockUseTheme = vi.mocked(useTheme);

describe('FallbackInstallButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default theme mock
    mockUseTheme.mockReturnValue({
      theme: 'light',
      isHighContrast: false,
      prefersReducedMotion: false,
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
      toggleHighContrast: vi.fn(),
      toggleReducedMotion: vi.fn(),
    });

    // Default install prompt mock
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      installState: 'available',
      deferredPrompt: {} as any,
      promptInstall: vi.fn().mockResolvedValue(true),
      checkInstallState: vi.fn(),
      wasRecentlyDismissed: false,
      automaticPromptFailed: false,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('should not show fallback button when app is installed', () => {
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: false,
      isInstalled: true,
      installState: 'installed',
      deferredPrompt: null,
      promptInstall: vi.fn(),
      checkInstallState: vi.fn(),
      wasRecentlyDismissed: false,
      automaticPromptFailed: false,
    });

    render(<FallbackInstallButton />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not show fallback button when not installable', () => {
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      installState: 'not-supported',
      deferredPrompt: null,
      promptInstall: vi.fn(),
      checkInstallState: vi.fn(),
      wasRecentlyDismissed: false,
      automaticPromptFailed: false,
    });

    render(<FallbackInstallButton />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should show fallback button after delay when installable', async () => {
    render(<FallbackInstallButton showAfterDelay={100} />);

    // Should not be visible initially
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    // Should appear after delay
    await waitFor(
      () => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it('should handle install button click', async () => {
    const mockPromptInstall = vi.fn().mockResolvedValue(true);
    mockUseInstallPrompt.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      installState: 'available',
      deferredPrompt: {} as any,
      promptInstall: mockPromptInstall,
      checkInstallState: vi.fn(),
      wasRecentlyDismissed: false,
      automaticPromptFailed: false,
    });

    render(<FallbackInstallButton showAfterDelay={0} />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const installButton = screen.getByRole('button');
    fireEvent.click(installButton);

    expect(mockPromptInstall).toHaveBeenCalled();
  });

  it('should handle dismiss button in floating placement', async () => {
    render(<FallbackInstallButton placement="floating" showAfterDelay={0} />);

    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    const dismissButton = screen.getByLabelText(/dismiss/i);
    fireEvent.click(dismissButton);

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('should apply correct styling for different themes', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      isHighContrast: false,
      prefersReducedMotion: false,
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
      toggleHighContrast: vi.fn(),
      toggleReducedMotion: vi.fn(),
    });

    render(<FallbackInstallButton showAfterDelay={0} />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('should apply high contrast styling when enabled', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      isHighContrast: true,
      prefersReducedMotion: false,
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
      toggleHighContrast: vi.fn(),
      toggleReducedMotion: vi.fn(),
    });

    render(<FallbackInstallButton showAfterDelay={0} />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'bg-black',
      'text-white',
      'border-2',
      'border-white'
    );
  });
});
