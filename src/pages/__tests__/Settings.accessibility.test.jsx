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
    <div data-testid="font-size-toggle" data-show-labels={showLabels} role="group" aria-label="Font size options">
      Font Size Toggle
    </div>
  )
}));

describe('Settings Component - Accessibility', () => {
  it('has proper heading hierarchy', () => {
    render(<Settings />);
    
    // Check main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Settings');
    
    // Check section headings
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(sectionHeadings).toHaveLength(4);
    expect(sectionHeadings[0]).toHaveTextContent('Display');
    expect(sectionHeadings[1]).toHaveTextContent('Account');
    expect(sectionHeadings[2]).toHaveTextContent('Notifications');
    expect(sectionHeadings[3]).toHaveTextContent('Support');
  });

  it('has accessible buttons with proper descriptions', () => {
    render(<Settings />);
    
    // Check that all buttons have accessible text
    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
      // Each button should have either text content or aria-label
      const hasText = button.textContent && button.textContent.trim().length > 0;
      const hasAriaLabel = button.getAttribute('aria-label');
      expect(hasText || hasAriaLabel).toBe(true);
    });
  });

  it('has proper font size control accessibility', () => {
    render(<Settings />);
    
    const fontSizeToggle = screen.getByTestId('font-size-toggle');
    expect(fontSizeToggle).toHaveAttribute('role', 'group');
    expect(fontSizeToggle).toHaveAttribute('aria-label', 'Font size options');
  });

  it('maintains proper focus order', () => {
    render(<Settings />);
    
    // Get all interactive elements
    const buttons = screen.getAllByRole('button');
    
    // Check that buttons are in logical order
    expect(buttons[0]).toHaveTextContent('Profile Information');
    expect(buttons[1]).toHaveTextContent('Notification Preferences');
    expect(buttons[2]).toHaveTextContent('Help & Support');
  });

  it('has sufficient color contrast classes', () => {
    render(<Settings />);
    
    // Check that main heading uses proper contrast
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveClass('text-gray-900');
    
    // Check that section headings use proper contrast
    const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
    sectionHeadings.forEach(heading => {
      expect(heading).toHaveClass('text-gray-800');
    });
    
    // Check description text has proper contrast
    const descriptions = screen.getAllByText(/Update your|Manage your|Get help/);
    descriptions.forEach(desc => {
      expect(desc).toHaveClass('text-gray-500');
    });
  });
});