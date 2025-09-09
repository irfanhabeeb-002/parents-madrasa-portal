import React, { useEffect, useRef, type ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  isActive: boolean;
  restoreFocus?: boolean;
  initialFocus?: string; // CSS selector for initial focus element
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive,
  restoreFocus = true,
  initialFocus
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Focus the initial element or first focusable element
    const focusInitialElement = () => {
      if (!containerRef.current) return;

      let elementToFocus: HTMLElement | null = null;

      if (initialFocus) {
        elementToFocus = containerRef.current.querySelector(initialFocus);
      }

      if (!elementToFocus) {
        const focusableElements = getFocusableElements(containerRef.current);
        elementToFocus = focusableElements[0] || containerRef.current;
      }

      if (elementToFocus) {
        elementToFocus.focus();
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(focusInitialElement, 10);

    return () => {
      clearTimeout(timeoutId);
      
      // Restore focus to previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, restoreFocus, initialFocus]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return (
    <div ref={containerRef} className="focus-trap-container">
      {children}
    </div>
  );
};

// Helper function to get all focusable elements
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  
  return elements.filter(element => {
    // Check if element is visible and not hidden
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  });
}