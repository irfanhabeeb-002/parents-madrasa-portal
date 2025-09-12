// Scrolling announcements banner for dashboard bottom section
import React, { useEffect, useState } from 'react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { truncateAnnouncement } from '../../utils/textUtils';

interface Announcement {
  id: string;
  message: string;
  malayalamMessage?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  expiresAt?: Date;
}

interface AnnouncementsBannerProps {
  announcements: Announcement[];
  className?: string;
  autoScroll?: boolean;
  scrollSpeed?: number; // milliseconds per character
}

export const AnnouncementsBanner: React.FC<AnnouncementsBannerProps> = ({
  announcements,
  className = '',
  autoScroll = true,
  scrollSpeed = 100
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Filter active announcements (not expired)
  const activeAnnouncements = announcements.filter(announcement => {
    if (!announcement.expiresAt) return true;
    return new Date() < announcement.expiresAt;
  });

  // Auto-scroll through announcements
  useEffect(() => {
    if (!autoScroll || activeAnnouncements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        (prevIndex + 1) % activeAnnouncements.length
      );
    }, 5000); // Change announcement every 5 seconds

    return () => clearInterval(interval);
  }, [autoScroll, activeAnnouncements.length]);

  // Handle scroll animation
  useEffect(() => {
    if (activeAnnouncements.length === 0) return;

    setIsScrolling(true);
    const timer = setTimeout(() => {
      setIsScrolling(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentIndex, activeAnnouncements.length]);

  if (activeAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = activeAnnouncements[currentIndex];
  const priorityColors = {
    high: 'bg-red-50 border-red-200 text-red-800',
    medium: 'bg-blue-50 border-blue-200 text-blue-800',
    low: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const priorityIcons = {
    high: 'text-red-500',
    medium: 'text-blue-500',
    low: 'text-gray-500'
  };

  return (
    <div
      className={`
        ${priorityColors[currentAnnouncement.priority]}
        border rounded-lg p-3 shadow-sm
        ${className}
      `}
      role="region"
      aria-label="Announcements"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <SpeakerWaveIcon
            className={`w-5 h-5 ${priorityIcons[currentAnnouncement.priority]}`}
            aria-hidden="true"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium">
              Announcement
            </h4>
            <span className="text-xs opacity-75">
              {currentAnnouncement.createdAt.toLocaleDateString()}
            </span>
          </div>

          <div
            className={`
              transition-all duration-300 ease-in-out
              ${isScrolling ? 'opacity-75 transform translate-x-1' : 'opacity-100 transform translate-x-0'}
            `}
          >
            <p className="text-sm leading-relaxed">
              {truncateAnnouncement(currentAnnouncement.message, 'mobile')}
            </p>

            {currentAnnouncement.malayalamMessage && (
              <p className="text-sm leading-relaxed mt-1 opacity-90" lang="ml">
                {truncateAnnouncement(currentAnnouncement.malayalamMessage, 'mobile')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      {activeAnnouncements.length > 1 && (
        <div className="flex justify-center mt-3 space-x-1">
          {activeAnnouncements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${index === currentIndex
                  ? 'bg-current opacity-100 scale-110'
                  : 'bg-current opacity-40 hover:opacity-60'
                }
              `}
              aria-label={`Go to announcement ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Priority indicator */}
      {currentAnnouncement.priority === 'high' && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Important
          </span>
        </div>
      )}
    </div>
  );
};