import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export interface WhatsAppButtonProps {
  /** Teacher's phone number in international format (e.g., "+919876543210") */
  teacherNumber: string;
  /** Position of the floating button */
  position?: 'bottom-right' | 'bottom-left';
  /** Custom message template or context-specific message */
  message?: string;
  /** Message context for predefined templates */
  context?:
    | 'general'
    | 'class_help'
    | 'technical_support'
    | 'homework_help'
    | 'exam_query';
  /** Custom aria label for accessibility */
  ariaLabel?: string;
  /** Malayalam label for the button */
  malayalamLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the button text on hover/focus */
  showLabel?: boolean;
  /** Custom icon component */
  icon?: React.ReactNode;
  /** Callback when button is clicked */
  onClick?: () => void;
}

// Predefined message templates for different contexts
const MESSAGE_TEMPLATES = {
  general: 'السلام عليكم، أحتاج مساعدة في دراستي.',
  class_help: 'السلام عليكم، لدي سؤال حول درس اليوم.',
  technical_support: 'السلام عليكم، أواجه مشاكل تقنية في البوابة.',
  homework_help: 'السلام عليكم، أحتاج مساعدة في الواجب المنزلي.',
  exam_query: 'السلام عليكم، لدي سؤال حول الامتحان القادم.',
} as const;

// Malayalam translations for message templates
const MALAYALAM_TEMPLATES = {
  general: 'അസ്സലാമു അലൈകും, എനിക്ക് പഠനത്തിൽ സഹായം വേണം.',
  class_help:
    'അസ്സലാമു അലൈകും, ഇന്നത്തെ ക്ലാസിനെക്കുറിച്ച് എനിക്ക് ഒരു ചോദ്യമുണ്ട്.',
  technical_support:
    'അസ്സലാമു അലൈകും, പോർട്ടലിൽ എനിക്ക് സാങ്കേതിക പ്രശ്നങ്ങളുണ്ട്.',
  homework_help: 'അസ്സലാമു അലൈകും, ഗൃഹപാഠത്തിൽ എനിക്ക് സഹായം വേണം.',
  exam_query:
    'അസ്സലാമു അലൈകും, വരാനിരിക്കുന്ന പരീക്ഷയെക്കുറിച്ച് എനിക്ക് ഒരു ചോദ്യമുണ്ട്.',
} as const;

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  teacherNumber,
  position = 'bottom-right',
  message,
  context = 'general',
  ariaLabel,
  malayalamLabel,
  className = '',
  showLabel = false,
  icon,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get the appropriate message
  const getWhatsAppMessage = (): string => {
    if (message) return message;
    return MESSAGE_TEMPLATES[context];
  };

  // Get Malayalam message for accessibility
  const getMalayalamMessage = (): string => {
    return MALAYALAM_TEMPLATES[context];
  };

  // Handle WhatsApp link opening
  const handleWhatsAppClick = () => {
    const whatsappMessage = getWhatsAppMessage();
    const encodedMessage = encodeURIComponent(whatsappMessage);

    // Clean phone number (remove any non-digit characters except +)
    const cleanNumber = teacherNumber.replace(/[^\d+]/g, '');

    // Construct WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    // Call custom onClick if provided
    if (onClick) {
      onClick();
    }

    // Open WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleWhatsAppClick();
    }
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-24 right-4 md:bottom-8 md:right-8',
    'bottom-left': 'bottom-24 left-4 md:bottom-8 md:left-8',
  };

  // Base classes for the button
  const baseClasses = [
    'fixed',
    'bg-green-500',
    'hover:bg-green-600',
    'active:bg-green-700',
    'text-white',
    'rounded-full',
    'shadow-lg',
    'hover:shadow-xl',
    'transition-all',
    'duration-200',
    'z-50',
    'touch-target', // Ensures 44px minimum touch target
    'focus-visible', // Custom focus styles
    'group',
    'transform',
    'hover:scale-105',
    'active:scale-95',
    positionClasses[position],
  ];

  // Button size classes (ensuring 44px minimum)
  const sizeClasses = 'w-14 h-14 md:w-16 md:h-16 p-3 md:p-4';

  const combinedClasses = [...baseClasses, sizeClasses, className].join(' ');

  // Generate accessible label
  const accessibleLabel =
    ariaLabel || `Ask teacher on WhatsApp - ${getWhatsAppMessage()}`;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleWhatsAppClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={combinedClasses}
        aria-label={accessibleLabel}
        title="Ask Teacher"
        role="button"
        tabIndex={0}
      >
        {/* Icon */}
        {icon || <ChatBubbleLeftRightIcon className="w-6 h-6 md:w-8 md:h-8" />}

        {/* Screen reader text */}
        <span className="sr-only">
          Contact teacher via WhatsApp. Message: {getWhatsAppMessage()}
          {malayalamLabel && ` (${getMalayalamMessage()})`}
        </span>

        {/* Pulse animation for attention */}
        <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping"></span>
      </button>

      {/* Floating label on hover/focus */}
      {showLabel && (isHovered || isFocused) && (
        <div
          className={`fixed z-40 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg transition-opacity duration-200 pointer-events-none ${
            position === 'bottom-right'
              ? 'bottom-24 right-20 md:bottom-8 md:right-24'
              : 'bottom-24 left-20 md:bottom-8 md:left-24'
          }`}
          role="tooltip"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center">
            <span className="whitespace-nowrap">Ask Teacher</span>
            {malayalamLabel && (
              <span
                className="text-xs opacity-80 mt-1 whitespace-nowrap"
                lang="ml"
              >
                {malayalamLabel}
              </span>
            )}
          </div>

          {/* Tooltip arrow */}
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 ${
              position === 'bottom-right' ? '-right-1' : '-left-1'
            }`}
          />
        </div>
      )}
    </>
  );
};

// Export message templates for external use
export { MESSAGE_TEMPLATES, MALAYALAM_TEMPLATES };
