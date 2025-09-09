import React, { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { AccessibleButton } from './AccessibleButton';
import { FocusTrap } from '../accessibility/FocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  malayalamTitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  ariaDescribedBy?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  malayalamTitle,
  children,
  size = 'md',
  ariaDescribedBy,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-4xl',
  };

  // Body scroll management
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard event handling for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={ariaDescribedBy}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <FocusTrap isActive={isOpen} initialFocus="button, [href], input, select, textarea">
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}
            max-h-[90vh] overflow-y-auto focus:outline-none
          `}
          tabIndex={-1}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            {malayalamTitle && (
              <p className="text-sm text-gray-600 mt-1" lang="bn">
                {malayalamTitle}
              </p>
            )}
          </div>
          
          {showCloseButton && (
            <AccessibleButton
              variant="secondary"
              size="sm"
              onClick={onClose}
              ariaLabel="Close modal"
              className="ml-4 !min-h-[36px] !min-w-[36px] !p-2"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </AccessibleButton>
          )}
        </div>
        
        {/* Body */}
        <div className="p-4" id={ariaDescribedBy}>
          {children}
        </div>
        </div>
      </FocusTrap>
    </div>
  );
};