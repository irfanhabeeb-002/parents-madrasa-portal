import React from 'react';
import { useFontSize } from '../../contexts/FontSizeContext';
import { AccessibleButton } from './AccessibleButton';

interface FontSizeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const FontSizeToggle: React.FC<FontSizeToggleProps> = ({ 
  className = '', 
  showLabels = true 
}) => {
  const { fontSize, setFontSize } = useFontSize();

  const fontSizeOptions = [
    { 
      value: 'small' as const, 
      label: 'Small', 
      malayalamLabel: 'ചെറുത്',
      icon: 'A'
    },
    { 
      value: 'medium' as const, 
      label: 'Medium', 
      malayalamLabel: 'ഇടത്തരം',
      icon: 'A'
    },
    { 
      value: 'large' as const, 
      label: 'Large', 
      malayalamLabel: 'വലുത്',
      icon: 'A'
    }
  ];

  return (
    <div className={`flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-2 ${className}`} role="group" aria-label="Font size options">
      {showLabels && (
        <span className="text-xs sm:text-sm font-medium text-gray-700 text-center sm:text-left sm:mr-2">
          Font Size:
          <span className="block text-xs text-gray-500 font-normal" lang="ml">
            ഫോണ്ട് വലുപ്പം:
          </span>
        </span>
      )}
      
      <div className="flex bg-gray-100 rounded-lg p-1">
        {fontSizeOptions.map((option, index) => (
          <AccessibleButton
            key={option.value}
            variant={fontSize === option.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFontSize(option.value)}
            className={`
              !min-w-[48px] !min-h-[44px] relative px-3 sm:px-4
              ${fontSize === option.value ? 'bg-primary-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-200'}
              ${index === 0 ? 'rounded-l-md' : ''}
              ${index === fontSizeOptions.length - 1 ? 'rounded-r-md' : ''}
            `}
            ariaLabel={`Set font size to ${option.label} - ${option.malayalamLabel}`}
            aria-pressed={fontSize === option.value}
          >
            <span 
              className={`font-bold ${
                option.value === 'small' ? 'text-sm' : 
                option.value === 'medium' ? 'text-base' : 'text-lg'
              }`}
            >
              {option.icon}
            </span>
            {showLabels && (
              <span className="sr-only">
                {option.label} - {option.malayalamLabel}
              </span>
            )}
          </AccessibleButton>
        ))}
      </div>
      
      {/* Current selection indicator for screen readers */}
      <span className="sr-only" aria-live="polite">
        Current font size: {fontSizeOptions.find(opt => opt.value === fontSize)?.label}
      </span>
    </div>
  );
};