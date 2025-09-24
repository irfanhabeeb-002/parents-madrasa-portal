import React, { useEffect, useState } from 'react';

interface KeyboardNavigationIndicatorProps {
  className?: string;
}

export const KeyboardNavigationIndicator: React.FC<
  KeyboardNavigationIndicatorProps
> = ({ className = '' }) => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    let keyboardTimeout: number;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Detect keyboard navigation (Tab, Arrow keys, Enter, Space)
      if (
        [
          'Tab',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Enter',
          ' ',
        ].includes(event.key)
      ) {
        setIsKeyboardUser(true);
        setShowIndicator(true);

        // Clear any existing timeout
        if (keyboardTimeout) {
          window.clearTimeout(keyboardTimeout);
        }

        // Hide indicator after 3 seconds of no keyboard activity
        keyboardTimeout = window.setTimeout(() => {
          setShowIndicator(false);
        }, 3000);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      setShowIndicator(false);
      if (keyboardTimeout) {
        window.clearTimeout(keyboardTimeout);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      if (keyboardTimeout) {
        window.clearTimeout(keyboardTimeout);
      }
    };
  }, []);

  // Apply keyboard navigation class to body
  useEffect(() => {
    if (isKeyboardUser) {
      document.body.classList.add('keyboard-navigation-active');
    } else {
      document.body.classList.remove('keyboard-navigation-active');
    }
  }, [isKeyboardUser]);

  if (!showIndicator) {
    return null;
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-md
        text-sm font-medium shadow-lg transition-all duration-300
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center space-x-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Keyboard Navigation Active</span>
      </div>
      <div className="text-xs opacity-90 mt-1" lang="ml">
        കീബോർഡ് നാവിഗേഷൻ സജീവം
      </div>
    </div>
  );
};
