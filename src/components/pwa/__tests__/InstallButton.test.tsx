import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InstallButton } from '../InstallButton';
import { useInstallPrompt } from '../InstallPrompt';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock the hooks
vi.mock('../InstallPrompt', () => ({
  useInstallPrompt: vi.fn(),
}));

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

// Mock AccessibleButton
vi.mock('../../ui/AccessibleButton', () => ({
  AccessibleButton: ({ children, onClick, className, ariaLabel, ...props }: any) => (
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

describe('InstallButton', () => {
  beforeEach(() => {
    // Default theme mock
    mockUseTheme.mockReturnValue({
      theme: 'light',
      isHighContrast: false,
      prefersReducedMotion: false,
    });
  });

  describe('Visibility Logic', () => {
    it('should render when installable and not installed', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn(),
      });

      render(<InstallButton />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });

    it('should not render when not installable', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        promptInstall: vi.fn(),
      });

      const { container } = render(<InstallButton />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should not render when already installed', () => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: true,
        promptInstall: vi.fn(),
      });

      const { container } = render(<InstallButton />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Install Functionality', () => {
    it('should call promptInstall when clicked', async () => {
      const mockPromptInstall = vi.fn().mockResolvedValue(true);
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: mockPromptInstall,
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
        promptInstall: mockPromptInstall,
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
      const mockPromptInstall = vi.fn().mockRejectedValue(new Error('Install failed'));
      const onInstallComplete = vi.fn();

      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: mockPromptInstall,
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
        promptInstall: vi.fn(),
      });
    });

    it('should apply primary variant styles by default', () => {
      render(<InstallButton />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-700');
      expect(button).toHaveClass('text-white');
    });

    it('should apply secondary variant styles', () => {
      render(<InstallButton variant="secondary" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('text-primary-700');
    });

    it('should apply minimal variant styles', () => {
      render(<InstallButton variant="minimal" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-600');
    });

    it('should apply different size styles', () => {
      const { rerender } = render(<InstallButton size="sm" />);
      expect(screen.getByRole('button')).toHaveClass('min-h-[36px]');

      rerender(<InstallButton size="md" />);
      expect(screen.getByRole('button')).toHaveClass('min-h-[44px]');

      rerender(<InstallButton size="lg" />);
      expect(screen.getByRole('button')).toHaveClass('min-h-[48px]');
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
      expect(button).toHaveClass('bg-primary-600');
    });

    it('should respect reduced motion preferences', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        isHighContrast: false,
        prefersReducedMotion: true,
      });

      render(<InstallButton />);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('transition-all');
      expect(button).not.toHaveClass('hover:scale-105');
    });
  });

  describe('Content and Accessibility', () => {
    beforeEach(() => {
      mockUseInstallPrompt.mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn(),
      });
    });

    it('should render default content with icon', () => {
      render(<InstallButton />);
      
      expect(screen.getByText('Install App')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Install Madrasa Portal app on your device for quick access and offline functionality'
      );
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