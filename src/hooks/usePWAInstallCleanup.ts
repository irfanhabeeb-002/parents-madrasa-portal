import { useEffect, useRef, useCallback } from 'react';
import { analyticsService } from '../services/AnalyticsService';

interface CleanupFunction {
  (): void;
}

interface TimerRef {
  id: NodeJS.Timeout | null;
  name: string;
}

interface EventListenerRef {
  element: EventTarget;
  event: string;
  handler: EventListener;
  options?: boolean | AddEventListenerOptions;
}

/**
 * Custom hook for managing cleanup and memory management in PWA install components
 * Provides utilities for proper event listener cleanup, timer management, and state cleanup
 */
export const usePWAInstallCleanup = (componentName: string) => {
  // Track all cleanup functions
  const cleanupFunctions = useRef<CleanupFunction[]>([]);

  // Track all timers for proper cleanup
  const timers = useRef<TimerRef[]>([]);

  // Track all event listeners for proper cleanup
  const eventListeners = useRef<EventListenerRef[]>([]);

  // Track component mount state to prevent cleanup after unmount
  const isMounted = useRef(true);

  // Register a cleanup function
  const registerCleanup = useCallback((cleanupFn: CleanupFunction) => {
    if (isMounted.current) {
      cleanupFunctions.current.push(cleanupFn);
    }
  }, []);

  // Enhanced timer management with automatic cleanup tracking
  const createTimer = useCallback(
    (
      callback: () => void,
      delay: number,
      name: string = 'unnamed'
    ): NodeJS.Timeout | null => {
      if (!isMounted.current) {
        console.warn(
          `${componentName}: Attempted to create timer "${name}" after component unmount`
        );
        return null;
      }

      const timerId = setTimeout(() => {
        if (isMounted.current) {
          try {
            callback();
          } catch (error) {
            console.error(`${componentName}: Error in timer "${name}":`, error);
            analyticsService.trackEvent({
              action: 'pwa_install_timer_error',
              category: 'pwa',
              label: 'timer_callback_error',
              custom_parameters: {
                component_name: componentName,
                timer_name: name,
                error_message:
                  error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
              },
            });
          }
        }

        // Remove timer from tracking after execution
        timers.current = timers.current.filter(timer => timer.id !== timerId);
      }, delay);

      // Track the timer
      const timerRef: TimerRef = { id: timerId, name };
      timers.current.push(timerRef);

      // Register cleanup function
      registerCleanup(() => {
        if (timerId) {
          clearTimeout(timerId);
        }
      });

      return timerId;
    },
    [componentName, registerCleanup]
  );

  // Enhanced event listener management with automatic cleanup tracking
  const addEventListener = useCallback(
    (
      element: EventTarget,
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions,
      name: string = `${event}_listener`
    ): boolean => {
      if (!isMounted.current) {
        console.warn(
          `${componentName}: Attempted to add event listener "${name}" after component unmount`
        );
        return false;
      }

      try {
        // Wrap handler to check mount state and handle errors
        const wrappedHandler: EventListener = e => {
          if (isMounted.current) {
            try {
              handler(e);
            } catch (error) {
              console.error(
                `${componentName}: Error in event handler "${name}":`,
                error
              );
              analyticsService.trackEvent({
                action: 'pwa_install_event_handler_error',
                category: 'pwa',
                label: 'event_handler_error',
                custom_parameters: {
                  component_name: componentName,
                  event_name: event,
                  handler_name: name,
                  error_message:
                    error instanceof Error ? error.message : 'Unknown error',
                  timestamp: new Date().toISOString(),
                },
              });
            }
          }
        };

        element.addEventListener(event, wrappedHandler, options);

        // Track the event listener
        const listenerRef: EventListenerRef = {
          element,
          event,
          handler: wrappedHandler,
          options,
        };
        eventListeners.current.push(listenerRef);

        // Register cleanup function
        registerCleanup(() => {
          try {
            element.removeEventListener(event, wrappedHandler, options);
          } catch (error) {
            console.warn(
              `${componentName}: Error removing event listener "${name}":`,
              error
            );
          }
        });

        return true;
      } catch (error) {
        console.error(
          `${componentName}: Error adding event listener "${name}":`,
          error
        );
        analyticsService.trackEvent({
          action: 'pwa_install_event_listener_error',
          category: 'pwa',
          label: 'add_event_listener_error',
          custom_parameters: {
            component_name: componentName,
            event_name: event,
            handler_name: name,
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        });
        return false;
      }
    },
    [componentName, registerCleanup]
  );

  // Clear a specific timer by reference
  const clearTimer = useCallback((timerId: NodeJS.Timeout | null) => {
    if (timerId) {
      clearTimeout(timerId);
      timers.current = timers.current.filter(timer => timer.id !== timerId);
    }
  }, []);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    timers.current.forEach(timer => {
      if (timer.id) {
        clearTimeout(timer.id);
      }
    });
    timers.current = [];
  }, []);

  // Remove a specific event listener
  const removeEventListener = useCallback(
    (
      element: EventTarget,
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions
    ) => {
      try {
        element.removeEventListener(event, handler, options);
        eventListeners.current = eventListeners.current.filter(
          listener =>
            !(
              listener.element === element &&
              listener.event === event &&
              listener.handler === handler
            )
        );
      } catch (error) {
        console.warn(
          `${componentName}: Error removing specific event listener:`,
          error
        );
      }
    },
    [componentName]
  );

  // Clear all event listeners
  const clearAllEventListeners = useCallback(() => {
    eventListeners.current.forEach(listener => {
      try {
        listener.element.removeEventListener(
          listener.event,
          listener.handler,
          listener.options
        );
      } catch (error) {
        console.warn(
          `${componentName}: Error removing event listener during cleanup:`,
          error
        );
      }
    });
    eventListeners.current = [];
  }, [componentName]);

  // Enhanced session storage cleanup with error handling
  const clearSessionStorage = useCallback(
    (keys: string[]) => {
      keys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn(
            `${componentName}: Error clearing session storage key "${key}":`,
            error
          );
        }
      });
    },
    [componentName]
  );

  // Enhanced local storage cleanup with error handling
  const clearLocalStorage = useCallback(
    (keys: string[]) => {
      keys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(
            `${componentName}: Error clearing local storage key "${key}":`,
            error
          );
        }
      });
    },
    [componentName]
  );

  // Manual cleanup function for immediate cleanup
  const performCleanup = useCallback(() => {
    if (!isMounted.current) {
      return; // Already cleaned up
    }

    console.log(`${componentName}: Performing manual cleanup`);

    // Execute all registered cleanup functions
    cleanupFunctions.current.forEach((cleanupFn, index) => {
      try {
        cleanupFn();
      } catch (error) {
        console.error(
          `${componentName}: Error in cleanup function ${index}:`,
          error
        );
      }
    });

    // Clear all timers
    clearAllTimers();

    // Clear all event listeners
    clearAllEventListeners();

    // Clear tracking arrays
    cleanupFunctions.current = [];
    timers.current = [];
    eventListeners.current = [];

    // Mark as unmounted
    isMounted.current = false;

    // Track cleanup completion
    analyticsService.trackEvent({
      action: 'pwa_install_cleanup_completed',
      category: 'pwa',
      label: 'manual_cleanup',
      custom_parameters: {
        component_name: componentName,
        timestamp: new Date().toISOString(),
      },
    });
  }, [componentName, clearAllTimers, clearAllEventListeners]);

  // Get cleanup status for debugging
  const getCleanupStatus = useCallback(() => {
    return {
      isMounted: isMounted.current,
      cleanupFunctionsCount: cleanupFunctions.current.length,
      activeTimersCount: timers.current.length,
      activeEventListenersCount: eventListeners.current.length,
      timers: timers.current.map(timer => ({
        name: timer.name,
        hasId: !!timer.id,
      })),
      eventListeners: eventListeners.current.map(listener => ({
        event: listener.event,
        element: listener.element.constructor.name,
      })),
    };
  }, []);

  // Automatic cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log(
        `${componentName}: Component unmounting, performing automatic cleanup`
      );

      // Track component unmount
      analyticsService.trackEvent({
        action: 'pwa_install_component_unmount',
        category: 'pwa',
        label: 'automatic_cleanup',
        custom_parameters: {
          component_name: componentName,
          cleanup_functions_count: cleanupFunctions.current.length,
          active_timers_count: timers.current.length,
          active_event_listeners_count: eventListeners.current.length,
          timestamp: new Date().toISOString(),
        },
      });

      // Execute all registered cleanup functions
      cleanupFunctions.current.forEach((cleanupFn, index) => {
        try {
          cleanupFn();
        } catch (error) {
          console.error(
            `${componentName}: Error in cleanup function ${index} during unmount:`,
            error
          );
        }
      });

      // Clear all timers
      timers.current.forEach(timer => {
        if (timer.id) {
          clearTimeout(timer.id);
        }
      });

      // Clear all event listeners
      eventListeners.current.forEach(listener => {
        try {
          listener.element.removeEventListener(
            listener.event,
            listener.handler,
            listener.options
          );
        } catch (error) {
          console.warn(
            `${componentName}: Error removing event listener during unmount:`,
            error
          );
        }
      });

      // Mark as unmounted
      isMounted.current = false;

      // Clear tracking arrays
      cleanupFunctions.current = [];
      timers.current = [];
      eventListeners.current = [];
    };
  }, [componentName]);

  return {
    // Registration functions
    registerCleanup,

    // Timer management
    createTimer,
    clearTimer,
    clearAllTimers,

    // Event listener management
    addEventListener,
    removeEventListener,
    clearAllEventListeners,

    // Storage cleanup
    clearSessionStorage,
    clearLocalStorage,

    // Manual cleanup
    performCleanup,

    // Status and debugging
    getCleanupStatus,
    isMounted: () => isMounted.current,
  };
};
