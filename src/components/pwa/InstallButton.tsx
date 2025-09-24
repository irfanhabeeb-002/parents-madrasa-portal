import React from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { useInstallPrompt } from './InstallPrompt';
import { useTheme } from '../../contexts/ThemeContext';
import { analyticsService } from '../../services/AnalyticsService';

interface InstallButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
  onInstallStart?: () => void;
  onInstallComplete?: (success: boolean) => void;
  source?: string; // Track where the button was clicked from
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  showIcon = true,
  children,
  onInstallStart,
  onInstallComplete,
  source = 'unknown',
}) => {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const { theme, isHighContrast, prefersReducedMotion } = useTheme();

  // Don't render if not installable or already installed
  if (!isInstallable || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    try {
      // Track install button click
      analyticsService.trackEvent({
        action: 'install_button_clicked',
        category: 'pwa',
        label: source,
        custom_parameters: {
          source,
          button_variant: variant,
          button_size: size,
          session_time: Date.now() - (parseInt(sessionStorage.getItem('sessionStartTime') || '0') || Date.now()),
        },
      });

      onInstallStart?.();
      const success = await promptInstall();
      
      // Track install result
      analyticsService.trackEvent({
        action: 'install_button_result',
        category: 'pwa',
        label: success ? 'success' : 'failed',
        custom_parameters: {
          source,
          success,
          button_variant: variant,
        },
      });

      onInstallComplete?.(success);
    } catch (error) {
      console.error('Install button error:', error);
      
      // Track install error
      analyticsService.trackEvent({
        action: 'install_button_error',
        category: 'pwa',
        label: 'error',
        custom_parameters: {
          source,
          error_message: error.message,
          button_variant: variant,
        },
      });

      onInstallComplete?.(false);
    }
  };

  // Theme-aware styling
  const getVariantStyles = () => {
    if (isHighContrast) {
      switch (variant) {
        case 'primary':
          return 'bg-black text-white border-2 border-white hover:bg-gray-800';
        case 'secondary':
          return 'bg-white text-black border-2 border-black hover:bg-gray-200';
        case 'minimal':
          return 'text-white hover:text-gray-300 underline';
        default:
          return 'bg-black text-white border-2 border-white hover:bg-gray-800';
      }
    }

    const isDark = theme === 'dark';
    
    switch (variant) {
      case 'primary':
        return isDark
          ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
          : 'bg-primary-700 text-white hover:bg-primary-800 shadow-lg hover:shadow-xl';
      case 'secondary':
        return isDark
          ? 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600'
          : 'bg-white text-primary-700 border border-primary-300 hover:bg-primary-50';
      case 'minimal':
        return isDark
          ? 'text-primary-400 hover:text-primary-300'
          : 'text-primary-600 hover:text-primary-700';
      default:
        return isDark
          ? 'bg-primary-600 text-white hover:bg-primary-700'
          : 'bg-primary-700 text-white hover:bg-primary-800';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm min-h-[36px]';
      case 'md':
        return 'px-4 py-2 text-base min-h-[44px]';
      case 'lg':
        return 'px-6 py-3 text-lg min-h-[48px]';
      default:
        return 'px-4 py-2 text-base min-h-[44px]';
    }
  };

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500';
  const animationStyles = prefersReducedMotion 
    ? '' 
    : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95';
  
  const buttonStyles = `${baseStyles} ${getVariantStyles()} ${getSizeStyles()} ${animationStyles} ${className}`;

  const defaultContent = (
    <>
      {showIcon && (
        <svg
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} ${children ? 'mr-2' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      )}
      {children || 'Install App'}
    </>
  );

  return (
    <AccessibleButton
      onClick={handleInstall}
      className={buttonStyles}
      ariaLabel="Install Madrasa Portal app on your device for quick access and offline functionality"
      variant={variant}
      size={size}
    >
      {defaultContent}
    </AccessibleButton>
  );
};