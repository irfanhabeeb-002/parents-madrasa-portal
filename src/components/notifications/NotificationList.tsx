// Notification list component for displaying all notifications
import React from 'react';
import { AppNotification } from '../../types/notification';
import { AccessibleButton } from '../ui/AccessibleButton';
import { 
  ClockIcon, 
  VideoCameraIcon, 
  DocumentTextIcon, 
  AcademicCapIcon,
  SpeakerWaveIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface NotificationListProps {
  notifications: AppNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onRemove: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  className?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onRemove,
  onMarkAllAsRead,
  onClearAll,
  className = ''
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'class_reminder':
        return <ClockIcon className="w-5 h-5" />;
      case 'new_recording':
        return <VideoCameraIcon className="w-5 h-5" />;
      case 'new_notes':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'exam_reminder':
        return <AcademicCapIcon className="w-5 h-5" />;
      case 'announcement':
        return <SpeakerWaveIcon className="w-5 h-5" />;
      default:
        return <SpeakerWaveIcon className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'class_reminder':
        return 'text-blue-600 bg-blue-50';
      case 'new_recording':
        return 'text-purple-600 bg-purple-50';
      case 'new_notes':
        return 'text-green-600 bg-green-50';
      case 'exam_reminder':
        return 'text-orange-600 bg-orange-50';
      case 'announcement':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <SpeakerWaveIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
        <p className="text-gray-500">You're all caught up!</p>
        <p className="text-gray-400 text-sm mt-1" lang="ml">
          നിങ്ങൾക്ക് പുതിയ അറിയിപ്പുകളൊന്നുമില്ല
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Notifications
          </h3>
          <p className="text-sm text-gray-500" lang="ml">
            അറിയിപ്പുകൾ
          </p>
        </div>
        
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <AccessibleButton
              variant="secondary"
              size="sm"
              onClick={onMarkAllAsRead}
              ariaLabel="Mark all notifications as read"
              className="text-xs"
            >
              Mark all read
            </AccessibleButton>
          )}
          
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={onClearAll}
            ariaLabel="Clear all notifications"
            className="text-xs text-red-600 hover:text-red-700"
          >
            Clear all
          </AccessibleButton>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-3" role="list" aria-label="Notifications list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              relative p-4 rounded-lg border transition-all duration-200
              ${notification.read 
                ? 'bg-gray-50 border-gray-200 opacity-75' 
                : 'bg-white border-gray-300 shadow-sm'
              }
              hover:shadow-md
            `}
            role="listitem"
          >
            {/* Unread indicator */}
            {!notification.read && (
              <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full" />
            )}

            <div className="flex items-start space-x-3 ml-4">
              {/* Icon */}
              <div className={`
                flex-shrink-0 p-2 rounded-full
                ${getNotificationColor(notification.type)}
              `}>
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {notification.title}
                    </h4>
                    {notification.malayalamTitle && (
                      <p className="text-xs text-gray-600 truncate mt-0.5" lang="ml">
                        {notification.malayalamTitle}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTime(notification.timestamp)}
                    </span>
                    
                    <AccessibleButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onRemove(notification.id)}
                      ariaLabel="Remove notification"
                      className="!min-h-[24px] !min-w-[24px] !p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </AccessibleButton>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  {notification.message}
                </p>
                
                {notification.malayalamMessage && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed" lang="ml">
                    {notification.malayalamMessage}
                  </p>
                )}

                {/* Action button for unread notifications */}
                {!notification.read && (
                  <div className="mt-3">
                    <AccessibleButton
                      variant="primary"
                      size="sm"
                      onClick={() => onMarkAsRead(notification.id)}
                      ariaLabel="Mark as read"
                      className="text-xs"
                    >
                      Mark as read
                    </AccessibleButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};