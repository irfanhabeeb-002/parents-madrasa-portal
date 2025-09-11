import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BottomNavigation } from '../BottomNavigation';
import { NotificationProvider } from '../../../contexts/NotificationContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

describe('BottomNavigation Accessibility', () => {
  test('should not have any accessibility violations', async () => {
    const { container } = renderWithRouter(<BottomNavigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('has proper ARIA attributes', () => {
    const { container } = renderWithRouter(<BottomNavigation />);
    
    // Check navigation landmark
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('role', 'navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    
    // Check buttons have proper labels
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  test('supports keyboard navigation patterns', () => {
    const { container } = renderWithRouter(<BottomNavigation />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button, index) => {
      expect(button).toHaveAttribute('data-nav-index', index.toString());
    });
  });

  test('has sufficient color contrast', () => {
    const { container } = renderWithRouter(<BottomNavigation />);
    
    // Check that high contrast classes are applied
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button.className).toContain('high-contrast:');
    });
  });

  test('respects reduced motion preferences', () => {
    const { container } = renderWithRouter(<BottomNavigation />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button.className).toContain('motion-reduce:transition-none');
    });
  });

  test('has proper touch target sizes', () => {
    const { container } = renderWithRouter(<BottomNavigation />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      // Check minimum 44px touch targets
      expect(button.className).toContain('min-w-[44px]');
      expect(button.className).toContain('min-h-[56px]');
    });
  });

  test('provides screen reader announcements', () => {
    const { container } = renderWithRouter(<BottomNavigation />);
    
    // Check that buttons have descriptive labels
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      const ariaLabel = button.getAttribute('aria-label');
      expect(ariaLabel).toContain('Navigate to');
      expect(ariaLabel).toContain('page');
    });
  });
});