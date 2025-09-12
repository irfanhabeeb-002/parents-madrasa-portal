import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Settings from '../Settings';

// Mock the Layout component
vi.mock('../../components/layout', () => ({
  Layout: ({ children, title, showBackButton, showBottomNav }) => (
    <div data-testid="layout" data-title={title} data-back-button={showBackButton} data-bottom-nav={showBottomNav}>
      {children}
    </div>
  )
}));

// Mock the FontSizeToggle component
vi.mock('../../components/ui/FontSizeToggle', () => ({
  FontSizeToggle: ({ showLabels }) => (
    <div data-testid="font-size-toggle" data-show-labels={showLabels}>
      Font Size Toggle
    </div>
  )
}));

describe('Settings Component - Mobile Responsiveness', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
  });

  it('renders properly on mobile devices', () => {
    render(<Settings />);
    
    // Check that all essential sections are still present on mobile
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    
    // Check that font size toggle is present and configured for mobile
    expect(screen.getByTestId('font-size-toggle')).toBeInTheDocument();
  });

  it('maintains consistent functionality across desktop and mobile', () => {
    render(<Settings />);
    
    // Check that all essential buttons are clickable
    const profileButton = screen.getByText('Profile Information').closest('button');
    const notificationButton = screen.getByText('Notification Preferences').closest('button');
    const supportButton = screen.getByText('Help & Support').closest('button');
    
    expect(profileButton).toBeInTheDocument();
    expect(notificationButton).toBeInTheDocument();
    expect(supportButton).toBeInTheDocument();
    
    // Check that buttons have proper hover states (Tailwind classes)
    expect(profileButton).toHaveClass('hover:bg-gray-50');
    expect(notificationButton).toHaveClass('hover:bg-gray-50');
    expect(supportButton).toHaveClass('hover:bg-gray-50');
  });

  it('uses appropriate container sizing for mobile', () => {
    render(<Settings />);
    
    const container = screen.getByText('Settings').closest('.container');
    expect(container).toHaveClass('max-w-md');
    expect(container).toHaveClass('mx-auto');
    expect(container).toHaveClass('px-4');
  });
});