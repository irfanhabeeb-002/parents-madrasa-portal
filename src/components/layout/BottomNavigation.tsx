import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotificationBadge } from '../../contexts/NotificationContext';
import { NotificationBadge } from '../notifications/NotificationBadge';
import { useTheme } from '../../contexts/ThemeContext';
import '../../styles/navigation-theme.css';

interface NavItem {
  id: string;
  label: string;
  malayalamLabel: string;
  path: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

const navigationItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    malayalamLabel: 'ഹോം',
    path: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    id: 'live-class',
    label: 'Live Class',
    malayalamLabel: 'ലൈവ് ക്ലാസ്',
    path: '/live-class',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    malayalamLabel: 'പ്രൊഫൈൽ',
    path: '/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    malayalamLabel: 'ക്രമീകരണങ്ങൾ',
    path: '/settings',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, isHighContrast, prefersReducedMotion } = useTheme();
  
  // Get notification badges for different sections
  const classBadge = useNotificationBadge('class_reminder');

  // Active tab state for smooth indicator animation
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Update active tab index when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    const index = navigationItems.findIndex(item => {
      if (item.path === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(item.path);
    });
    setActiveTabIndex(index >= 0 ? index : 0);
  }, [location.pathname]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, path: string, label: string, index: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleNavigation(path, label);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusNavigationItem(index - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusNavigationItem(index + 1);
        break;
      case 'Home':
        event.preventDefault();
        focusNavigationItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusNavigationItem(navigationItems.length - 1);
        break;
    }
  };

  const focusNavigationItem = (index: number) => {
    const adjustedIndex = ((index % navigationItems.length) + navigationItems.length) % navigationItems.length;
    const button = document.querySelector(`[data-nav-index="${adjustedIndex}"]`) as HTMLButtonElement;
    if (button) {
      button.focus();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string, label: string) => {
    navigate(path);
    
    // Announce navigation to screen readers
    const announcement = `Navigated to ${label}`;
    const ariaLiveRegion = document.createElement('div');
    ariaLiveRegion.setAttribute('aria-live', 'polite');
    ariaLiveRegion.setAttribute('aria-atomic', 'true');
    ariaLiveRegion.className = 'sr-only';
    ariaLiveRegion.textContent = announcement;
    document.body.appendChild(ariaLiveRegion);
    
    setTimeout(() => {
      document.body.removeChild(ariaLiveRegion);
    }, 1000);
  };

  return (
    <nav 
      className="nav-container-enhanced fixed bottom-0 left-0 right-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-2 max-w-md sm:px-4">
        <div className="relative">
          {/* Enhanced Sliding Indicator with smooth animations */}
          <div 
            className="nav-indicator-enhanced absolute top-1 left-0 w-1/4 h-14 sm:h-16 transition-all ease-out duration-300"
            style={{ 
              transform: `translateX(${activeTabIndex * 100}%)`,
              marginLeft: '0.125rem',
              marginRight: '0.125rem',
              width: 'calc(25% - 0.25rem)'
            }}
            aria-hidden="true"
          />
          
          {/* Navigation Items */}
          <div className="flex justify-around items-center py-1 sm:py-2 relative z-10">
            {navigationItems.map((item, index) => {
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  data-nav-index={index}
                  onClick={() => handleNavigation(item.path, item.label)}
                  onKeyDown={(e) => handleKeyDown(e, item.path, item.label, index)}
                  className={`
                    nav-button-enhanced flex flex-col items-center justify-center relative
                    px-3 py-3 rounded-xl group touch-manipulation
                    min-w-[48px] min-h-[56px] sm:min-w-[60px] sm:min-h-[64px] 
                    focus:outline-none
                    ${active 
                      ? 'text-white font-semibold active' 
                      : `font-medium ${theme === 'dark' 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80'
                        }`
                    }
                    ${isHighContrast 
                      ? 'border-2 border-transparent ' + 
                        (active 
                          ? (theme === 'dark' ? 'text-black' : 'text-white')
                          : (theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-black hover:bg-gray-200')
                        )
                      : ''
                    }
                    sm:px-4 sm:py-4
                  `}
                  aria-label={`Navigate to ${item.label} page`}
                  aria-current={active ? 'page' : undefined}
                  type="button"
                >
                  {/* Icon with enhanced animations and badge */}
                  <div className="mb-1 relative">
                    <div className={`nav-icon-enhanced ${active ? 'active' : ''}`}>
                      {active && item.activeIcon ? item.activeIcon : item.icon}
                    </div>
                    
                    {/* Notification Badges */}
                    {item.id === 'live-class' && classBadge.visible && (
                      <NotificationBadge
                        count={classBadge.count}
                        visible={classBadge.visible}
                        size="sm"
                        color="blue"
                        ariaLabel={`${classBadge.count} class reminder${classBadge.count > 1 ? 's' : ''}`}
                      />
                    )}
                  </div>
                  
                  {/* Enhanced Label with better typography for 40+ users */}
                  <div className="text-center">
                    <span className={`
                      nav-label-enhanced block leading-tight
                      text-xs sm:text-sm
                      ${active ? 'active' : ''}
                    `}>
                      {item.label}
                    </span>
                  </div>

                  {/* Subtle hover effect for non-active items - optimized for older users */}
                  {!active && !isHighContrast && (
                    <div className={`
                      absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 ease-out
                      group-hover:opacity-100
                      ${theme === 'dark' 
                        ? 'bg-gradient-to-t from-gray-700/30 to-transparent' 
                        : 'bg-gradient-to-t from-gray-200/40 to-transparent'
                      }
                    `} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced bottom padding for better thumb reach */}
      <div className="h-2 sm:h-3" aria-hidden="true" />
    </nav>
  );
};