import React, { useEffect, useRef, useState } from 'react';

interface LiveRegionProps {
  message: string;
  malayalamMessage?: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number; // Clear message after X milliseconds
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  malayalamMessage,
  priority = 'polite',
  clearAfter = 5000,
  className = '',
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentMalayalamMessage, setCurrentMalayalamMessage] = useState('');
  const timeoutRef = useRef<number>();

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setCurrentMalayalamMessage(malayalamMessage || '');

      // Clear previous timeout
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      // Set new timeout to clear message
      if (clearAfter > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setCurrentMessage('');
          setCurrentMalayalamMessage('');
        }, clearAfter);
      }
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [message, malayalamMessage, clearAfter]);

  if (!currentMessage) {
    return null;
  }

  return (
    <div
      className={`sr-only ${className}`}
      aria-live={priority}
      aria-atomic="true"
      role="status"
    >
      <span>{currentMessage}</span>
      {currentMalayalamMessage && (
        <span lang="ml" className="ml-2">
          {currentMalayalamMessage}
        </span>
      )}
    </div>
  );
};

// Hook for managing live region announcements
export const useLiveRegion = () => {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    malayalamMessage?: string;
    priority?: 'polite' | 'assertive';
  } | null>(null);

  const announce = (
    message: string,
    malayalamMessage?: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    setAnnouncement({ message, malayalamMessage, priority });
  };

  const clear = () => {
    setAnnouncement(null);
  };

  return {
    announcement,
    announce,
    clear,
    LiveRegionComponent: announcement ? (
      <LiveRegion
        message={announcement.message}
        malayalamMessage={announcement.malayalamMessage}
        priority={announcement.priority}
      />
    ) : null,
  };
};
