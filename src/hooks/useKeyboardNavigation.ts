import { useEffect, useState, useCallback } from 'react';

interface KeyboardNavigationState {
  isKeyboardUser: boolean;
  lastKeyPressed: string | null;
  focusedElement: HTMLElement | null;
}

export const useKeyboardNavigation = () => {
  const [state, setState] = useState<KeyboardNavigationState>({
    isKeyboardUser: false,
    lastKeyPressed: null,
    focusedElement: null,
  });

  // Track keyboard usage
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const navigationKeys = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape'];
      
      if (navigationKeys.includes(event.key)) {
        setState(prev => ({
          ...prev,
          isKeyboardUser: true,
          lastKeyPressed: event.key,
        }));
        
        // Add keyboard navigation class to body
        document.body.classList.add('keyboard-navigation-active');
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({
        ...prev,
        isKeyboardUser: false,
        lastKeyPressed: null,
      }));
      
      // Remove keyboard navigation class from body
      document.body.classList.remove('keyboard-navigation-active');
    };

    const handleFocusIn = (event: FocusEvent) => {
      setState(prev => ({
        ...prev,
        focusedElement: event.target as HTMLElement,
      }));
    };

    const handleFocusOut = () => {
      setState(prev => ({
        ...prev,
        focusedElement: null,
      }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  // Focus management utilities
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }, []);

  const focusFirstFocusable = useCallback((container?: HTMLElement) => {
    const root = container || document;
    const focusableElements = root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
      return true;
    }
    return false;
  }, []);

  const focusLastFocusable = useCallback((container?: HTMLElement) => {
    const root = container || document;
    const focusableElements = root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (lastElement) {
      lastElement.focus();
      return true;
    }
    return false;
  }, []);

  const trapFocus = useCallback((container: HTMLElement, event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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
  }, []);

  return {
    ...state,
    focusElement,
    focusFirstFocusable,
    focusLastFocusable,
    trapFocus,
  };
};