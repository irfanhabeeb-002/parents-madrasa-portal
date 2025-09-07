import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    malayalamLabel: 'হোম',
    path: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    id: 'classes',
    label: 'Classes',
    malayalamLabel: 'ক্লাস',
    path: '/live-class',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
  },
  {
    id: 'notes',
    label: 'Notes',
    malayalamLabel: 'নোট',
    path: '/notes-exercises',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    malayalamLabel: 'প্রোফাইল',
    path: '/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 max-w-md">
        <div className="flex justify-around items-center py-2">
          {navigationItems.map((item) => {
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.label)}
                className={`
                  touch-target flex flex-col items-center justify-center
                  px-2 py-2 rounded-lg transition-colors duration-200
                  focus-visible min-w-[60px]
                  ${active 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
                aria-label={`${item.label} - ${item.malayalamLabel}`}
                aria-current={active ? 'page' : undefined}
              >
                {/* Icon */}
                <div className="mb-1">
                  {active && item.activeIcon ? item.activeIcon : item.icon}
                </div>
                
                {/* Label */}
                <div className="text-center">
                  <span className="text-xs font-medium block leading-tight">
                    {item.label}
                  </span>
                  <span className="text-xs opacity-75 block leading-tight" lang="bn">
                    {item.malayalamLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};