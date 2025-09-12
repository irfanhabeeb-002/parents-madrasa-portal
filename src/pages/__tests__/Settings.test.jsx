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

describe('Settings Component', () => {
  it('renders with streamlined essential features only', () => {
    render(<Settings />);
    
    // Check that the main title is present
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Check that essential sections are present
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    
    // Check that font size settings are integrated
    expect(screen.getByTestId('font-size-toggle')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    
    // Check that essential options are present
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('does not include redundant or unnecessary options', () => {
    render(<Settings />);
    
    // Check that redundant options are removed
    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
    expect(screen.queryByText('Email Notifications')).not.toBeInTheDocument();
    expect(screen.queryByText('Push Notifications')).not.toBeInTheDocument();
    expect(screen.queryByText('Display Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Language')).not.toBeInTheDocument();
    expect(screen.queryByText('About')).not.toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    render(<Settings />);
    
    const layout = screen.getByTestId('layout');
    expect(layout).toHaveAttribute('data-title', 'Settings');
    expect(layout).toHaveAttribute('data-back-button', 'true');
    expect(layout).toHaveAttribute('data-bottom-nav', 'true');
  });

  it('integrates font size settings properly', () => {
    render(<Settings />);
    
    const fontSizeToggle = screen.getByTestId('font-size-toggle');
    expect(fontSizeToggle).toHaveAttribute('data-show-labels', 'false');
    
    // Check that font size is in the Display section
    const displaySection = screen.getByText('Display').closest('div');
    expect(displaySection).toContainElement(screen.getByText('Font Size'));
  });
});