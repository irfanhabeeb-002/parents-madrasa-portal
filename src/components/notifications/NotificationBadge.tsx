// Notification badge component for navigation items with unread counts
import React from 'react';

interface NotificationBadgeProps {
  count: number;
  visible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'blue' | 'green' | 'yellow';
  className?: string;
  ariaLabel?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  visible = true,
  size = 'sm',
  color = 'red',
  className = '',
  ariaLabel,
}) => {
  if (!visible || count <= 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  const colorClasses = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black',
  };

  // Format count display (show 99+ for counts over 99)
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <span
      className={`
        inline-flex items-center justify-center
        ${sizeClasses[size]} ${colorClasses[color]}
        rounded-full font-medium leading-none
        absolute -top-1 -right-1 z-10
        min-w-[16px] px-1
        ${className}
      `}
      aria-label={ariaLabel || `${count} unread notifications`}
      role="status"
    >
      {displayCount}
    </span>
  );
};
