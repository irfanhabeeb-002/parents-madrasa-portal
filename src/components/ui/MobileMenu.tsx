import React, { useEffect, useRef } from 'react';
import { AccessibleButton } from './AccessibleButton';
import { FontSizeToggle } from './FontSizeToggle';

interface MenuItem {
  label: string;
  malayalamLabel?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
  ariaLabel: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  showFontToggle?: boolean;
  onToggleFontSize?: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  showFontToggle = true,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Handle escape key and focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the first focusable element when menu opens
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);

      // Handle escape key
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      // Handle click outside
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const menuItems: MenuItem[] = [
    {
      label: 'Font Size',
      malayalamLabel: 'ഫോണ്ട് വലുപ്പം',
      onClick: () => {}, // Handled by FontSizeToggle component
      ariaLabel: 'Adjust font size settings',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h8m-8 6h16"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {/* User avatar */}
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-blue-700">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            {/* User info */}
            <div>
              <p className="font-medium text-gray-900">
                {user?.displayName || 'User'}
              </p>
              <p className="text-sm text-gray-600">
                {user?.phone || user?.email}
              </p>
            </div>
          </div>

          {/* Close button */}
          <AccessibleButton
            ref={firstFocusableRef}
            variant="secondary"
            size="sm"
            onClick={onClose}
            ariaLabel="Close menu"
            className="!min-h-[40px] !min-w-[40px] !p-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </AccessibleButton>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col h-full">
          {/* Menu Items */}
          <div className="flex-1 p-4 space-y-4">
            {/* Font Size Section */}
            {showFontToggle && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-gray-600">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h8m-8 6h16"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Font Size</p>
                    <p className="text-sm text-gray-600" lang="ml">
                      ഫോണ്ട് വലുപ്പം
                    </p>
                  </div>
                </div>

                {/* Font Size Toggle Component */}
                <div className="pl-8">
                  <FontSizeToggle showLabels={true} />
                </div>
              </div>
            )}
          </div>

          {/* Logout Button at Bottom */}
          <div className="p-4 border-t border-gray-200">
            <AccessibleButton
              variant="danger"
              onClick={() => {
                onLogout();
                onClose();
              }}
              ariaLabel="Logout from application"
              className="w-full flex items-center justify-center space-x-3 !min-h-[48px] text-base font-medium"
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: '2px solid #dc2626',
                padding: '12px 16px',
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
              <span className="text-sm opacity-90" lang="ml">
                പുറത്തുകടക്കുക
              </span>
            </AccessibleButton>
          </div>
        </div>
      </div>
    </>
  );
};
