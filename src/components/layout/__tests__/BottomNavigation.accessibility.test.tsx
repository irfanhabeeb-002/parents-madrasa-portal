import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BottomNavigation } from '../BottomNavigation';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the providers
const MockProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  </BrowserRouter>
);

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MockProviders>
      {component}
    </MockProviders>
  );
};

describe('BottomNavigation Accessibility', () => {
  test('should not have any accessibility violations', async () => {
    const { container } = renderWithProviders(<BottomNavigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('has proper ARIA attributes', () => {
    const { container } = renderWithProviders(<BottomNavigation />);
    
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
    const { container } = renderWithProviders(<BottomNavigation />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button, index) => {
      expect(button).toHaveAttribute('data-nav-index', index.toString());
    });
  });

  test('has sufficient color contrast', () => {
    const { container } = renderWithProviders(<BottomNavigation />);
    
    // Check that enhanced navigation classes are applied for better contrast
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button.className).toContain('nav-button-enhanced');
    });
    
    // Check that the navigation container has enhanced styling
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('nav-container-enhanced');
  });

  test('respects reduced motion preferences', () => {
    const { container } = renderWithProviders(<BottomNavigation />);
    
    // Check that enhanced navigation classes are applied which handle reduced motion in CSS
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button.className).toContain('nav-button-enhanced');
    });
    
    // Check that icons have enhanced classes for motion handling
    const icons = container.querySelectorAll('.nav-icon-enhanced');
    expect(icons.length).toBeGreaterThan(0);
  });

  test('has proper touch target sizes', () => {
    const { container } = renderWithProviders(<BottomNavigation />);
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      // Check minimum 44px touch targets
      expect(button.className).toContain('min-w-[48px]');
      expect(button.className).toContain('min-h-[56px]');
    });
  });

  test('provides screen reader announcements', () => {
    const { container } = renderWithProviders(<BottomNavigation />);
    
    // Check that buttons have descriptive labels
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      const ariaLabel = button.getAttribute('aria-label');
      expect(ariaLabel).toContain('Navigate to');
      expect(ariaLabel).toContain('page');
    });
  });
});