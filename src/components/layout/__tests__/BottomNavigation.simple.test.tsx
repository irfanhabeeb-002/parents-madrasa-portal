import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BottomNavigation } from '../BottomNavigation';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <NotificationProvider>
        <ThemeProvider>
          {component}
        </ThemeProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

describe('BottomNavigation Accessibility Features', () => {
  it('should render with proper navigation role and aria-label', () => {
    renderWithProviders(<BottomNavigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation menu with 4 sections: Home, Live Class, Profile, and Settings');
  });

  it('should have proper tab roles for navigation items', () => {
    renderWithProviders(<BottomNavigation />);
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('type', 'button');
      expect(tab).toHaveAttribute('data-nav-index', index.toString());
    });
  });

  it('should have descriptive aria-labels for each navigation item', () => {
    renderWithProviders(<BottomNavigation />);
    
    expect(screen.getByRole('tab', { name: /home navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /live class navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /profile navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /settings navigation/i })).toBeInTheDocument();
  });

  it('should indicate current page with aria-current', () => {
    renderWithProviders(<BottomNavigation />);
    
    const homeTab = screen.getByRole('tab', { name: /home navigation/i });
    expect(homeTab).toHaveAttribute('aria-current', 'page');
  });

  it('should have proper minimum touch target sizes', () => {
    renderWithProviders(<BottomNavigation />);
    
    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => {
      // Check that the tab has minimum size classes
      expect(tab.className).toMatch(/min-w-\[48px\]/);
      expect(tab.className).toMatch(/min-h-\[56px\]/);
    });
  });

  it('should have icons with aria-hidden attribute', () => {
    renderWithProviders(<BottomNavigation />);
    
    // Check that SVG icons have aria-hidden
    const svgIcons = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgIcons.length).toBe(4);
  });

  it('should render all navigation items with correct labels', () => {
    renderWithProviders(<BottomNavigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Live Class')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should have tablist role for navigation container', () => {
    renderWithProviders(<BottomNavigation />);
    
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('should provide skip link for keyboard users', () => {
    renderWithProviders(<BottomNavigation />);
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });
});