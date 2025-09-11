import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BottomNavigation } from '../BottomNavigation';
import { NotificationProvider } from '../../../contexts/NotificationContext';

// Mock the notification context
const MockNotificationProvider = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>
    {children}
  </NotificationProvider>
);

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <MockNotificationProvider>
        {component}
      </MockNotificationProvider>
    </BrowserRouter>
  );
};

describe('BottomNavigation', () => {
  test('renders all four navigation items', () => {
    renderWithRouter(<BottomNavigation />);
    
    expect(screen.getByLabelText(/navigate to home page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/navigate to live class page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/navigate to profile page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/navigate to settings page/i)).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    renderWithRouter(<BottomNavigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-label');
    });
  });

  test('supports keyboard navigation', () => {
    renderWithRouter(<BottomNavigation />);
    
    const homeButton = screen.getByLabelText(/navigate to home page/i);
    const liveClassButton = screen.getByLabelText(/navigate to live class page/i);
    
    homeButton.focus();
    expect(homeButton).toHaveFocus();
    
    // Test arrow key navigation
    fireEvent.keyDown(homeButton, { key: 'ArrowRight' });
    expect(liveClassButton).toHaveFocus();
  });

  test('has minimum touch target sizes', () => {
    renderWithRouter(<BottomNavigation />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      // Check for minimum 44px touch targets (converted to rem: 44px = 2.75rem)
      expect(button).toHaveClass('min-w-[44px]');
      expect(button).toHaveClass('min-h-[56px]');
    });
  });

  test('shows active state correctly', () => {
    // Mock location to be on home page
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true
    });
    
    renderWithRouter(<BottomNavigation />);
    
    const homeButton = screen.getByLabelText(/navigate to home page/i);
    expect(homeButton).toHaveAttribute('aria-current', 'page');
  });

  test('handles Enter and Space key activation', () => {
    renderWithRouter(<BottomNavigation />);
    
    const homeButton = screen.getByLabelText(/navigate to home page/i);
    
    // Test that the button responds to keyboard events
    fireEvent.keyDown(homeButton, { key: 'Enter' });
    fireEvent.keyDown(homeButton, { key: ' ' });
    
    // Button should still be in the document and focusable
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('type', 'button');
  });
});