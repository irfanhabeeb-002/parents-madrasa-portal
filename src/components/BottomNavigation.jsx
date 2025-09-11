import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

// Navigation items configuration
const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    ariaLabel: 'Navigate to Home page',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    )
  },
  {
    id: 'live-class',
    label: 'Live Class',
    path: '/live-class',
    ariaLabel: 'Navigate to Live Class page',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
      </svg>
    )
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    ariaLabel: 'Navigate to Profile page',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    ariaLabel: 'Navigate to Settings page',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
      </svg>
    )
  }
];

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  // Determine active tab based on current route
  const getActiveTabIndex = useCallback(() => {
    const currentPath = location.pathname;
    const index = navigationItems.findIndex(item => {
      if (item.path === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(item.path);
    });
    return index >= 0 ? index : 0;
  }, [location.pathname]);

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabIndex());
  }, [getActiveTabIndex]);

  // Handle navigation
  const handleNavigation = (path, label, index) => {
    setActiveTab(index);
    navigate(path);
    
    // Announce navigation to screen readers
    const announcement = `Navigated to ${label}`;
    const ariaLiveRegion = document.createElement('div');
    ariaLiveRegion.setAttribute('aria-live', 'polite');
    ariaLiveRegion.setAttribute('aria-atomic', 'true');
    ariaLiveRegion.className = 'sr-only';
    ariaLiveRegion.textContent = announcement;
    ariaLiveRegion.style.position = 'absolute';
    ariaLiveRegion.style.left = '-10000px';
    ariaLiveRegion.style.width = '1px';
    ariaLiveRegion.style.height = '1px';
    ariaLiveRegion.style.overflow = 'hidden';
    document.body.appendChild(ariaLiveRegion);
    
    setTimeout(() => {
      if (document.body.contains(ariaLiveRegion)) {
        document.body.removeChild(ariaLiveRegion);
      }
    }, 1000);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event, path, label, index) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleNavigation(path, label, index);
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

  // Focus navigation item with wrapping
  const focusNavigationItem = (index) => {
    const adjustedIndex = ((index % navigationItems.length) + navigationItems.length) % navigationItems.length;
    const button = document.querySelector(`[data-nav-index="${adjustedIndex}"]`);
    if (button) {
      button.focus();
    }
  };

  return (
    <StyledWrapper role="navigation" aria-label="Main navigation">
      <div className="tab-container">
        {navigationItems.map((item, index) => (
          <button
            key={item.id}
            data-nav-index={index}
            className={`tab_button ${activeTab === index ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path, item.label, index)}
            onKeyDown={(e) => handleKeyDown(e, item.path, item.label, index)}
            aria-label={item.ariaLabel}
            aria-current={activeTab === index ? 'page' : undefined}
            type="button"
          >
            <div className="tab_icon">
              {item.icon}
            </div>
            <span>{item.label}</span>
          </button>
        ))}
        <div 
          className="indicator" 
          style={{ left: `calc(${activeTab * 25}% + 4px)` }}
          aria-hidden="true"
        />
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px;

  .tab-container {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 4px;
    background-color: #f8fafc;
    border-radius: 12px;
    max-width: 500px;
    margin: 0 auto;
  }

  .indicator {
    content: "";
    width: calc(25% - 4px);
    height: 56px;
    background: #3b82f6;
    position: absolute;
    top: 4px;
    z-index: 9;
    border-radius: 8px;
    transition: all 0.3s ease-out;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  .tab_button {
    width: 25%;
    min-height: 56px;
    min-width: 44px; /* Minimum touch target size */
    position: relative;
    z-index: 999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 8px;
    gap: 2px;
    padding: 8px 4px;

    /* Focus styles for accessibility */
    &:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    /* Focus visible for keyboard navigation */
    &:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    &:hover:not(.active) {
      color: #475569;
      background-color: rgba(148, 163, 184, 0.1);
    }

    &.active {
      color: #ffffff;
      font-weight: 600;
      
      .tab_icon svg {
        transform: scale(1.1);
      }
    }

    span {
      font-size: 11px;
      font-weight: inherit;
      line-height: 1;
      white-space: nowrap;
    }
  }

  .tab_icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
    
    svg {
      width: 20px;
      height: 20px;
      transition: transform 0.2s ease;
    }
  }

  /* Screen reader only class */
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    padding: 12px 16px;
    
    .tab-container {
      padding: 6px;
    }
    
    .indicator {
      height: 60px;
    }
    
    .tab_button {
      min-height: 60px;
      min-width: 48px; /* Larger touch target on mobile */
      font-size: 12px;
      padding: 10px 4px;
      
      span {
        font-size: 12px;
      }
    }
    
    .tab_icon svg {
      width: 22px;
      height: 22px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    background: #1f2937;
    border-top-color: #374151;
    
    .tab-container {
      background-color: #374151;
    }
    
    .indicator {
      background: #60a5fa;
    }
    
    .tab_button {
      color: #9ca3af;
      
      &:hover:not(.active) {
        color: #d1d5db;
        background-color: rgba(156, 163, 175, 0.1);
      }

      &:focus {
        outline-color: #60a5fa;
      }

      &:focus-visible {
        outline-color: #60a5fa;
        box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.1);
      }
      
      &.active {
        color: #ffffff;
      }
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    border-top: 2px solid #000000;
    
    .indicator {
      background: #000000;
    }
    
    .tab_button {
      color: #000000;
      
      &:focus {
        outline: 3px solid #000000;
        outline-offset: 2px;
      }

      &:focus-visible {
        outline: 3px solid #000000;
        outline-offset: 2px;
        box-shadow: none;
      }
      
      &.active {
        color: #ffffff;
      }
    }

    @media (prefers-color-scheme: dark) {
      .indicator {
        background: #ffffff;
      }
      
      .tab_button {
        color: #ffffff;
        
        &:focus,
        &:focus-visible {
          outline-color: #ffffff;
        }
        
        &.active {
          color: #000000;
        }
      }
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .indicator,
    .tab_button,
    .tab_icon svg {
      transition: none;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .tab_button {
      min-height: 60px;
      min-width: 48px;
      
      &:hover {
        background-color: transparent;
        color: inherit;
      }
      
      &:active:not(.active) {
        background-color: rgba(148, 163, 184, 0.2);
        transform: scale(0.98);
      }
    }
  }
`;

export default BottomNavigation;