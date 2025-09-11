import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { InstallPrompt } from '../InstallPrompt';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock the theme context
const mockThemeContext = {
  theme: 'light' as const,
  isHighContrast: false,
  prefersReducedMotion: false,
  setTheme: vi.fn(),
  toggleHighContrast: vi.fn(),
  toggleReducedMotion: vi.fn(),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider value={mockThemeContext}>
      {component}
    </ThemeProvider>
  );
};

describe('InstallPrompt Modal Enhancements', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock window.matchMedia for standalone mode detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock navigator.standalone
    Object.defineProperty(window.navigator, 'standalone', {
      writable: true,
      value: false,
    });

    // Clear session storage
    sessionStorage.clear();

    // Mock setTimeout to immediately execute callbacks for testing
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 1 as any;
    });
  });

  it('should display enhanced modal with gradient icon when Learn More is clicked', async () => {
    const { container, getByText } = renderWithTheme(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event to trigger banner display
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.preventDefault = vi.fn();
    mockEvent.prompt = vi.fn().mockResolvedValue(undefined);
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    mockEvent.platforms = ['web'];
    
    await act(async () => {
      window.dispatchEvent(mockEvent);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Click "Learn More" button to open modal
    const learnMoreButton = getByText('Learn More');
    await act(async () => {
      fireEvent.click(learnMoreButton);
    });

    const modalHTML = container.innerHTML;

    // Check for enhanced icon with gradient background
    expect(modalHTML).toContain('bg-gradient-to-br');
    expect(modalHTML).toContain('from-primary-500');
    expect(modalHTML).toContain('to-primary-700');
    expect(modalHTML).toContain('shadow-lg');

    // Check for improved header styling
    expect(modalHTML).toContain('text-xl');
    expect(modalHTML).toContain('md:text-2xl');
    expect(modalHTML).toContain('font-bold');

    // Check for enhanced benefits section with grid layout
    expect(modalHTML).toContain('grid');
    expect(modalHTML).toContain('grid-cols-1');
    expect(modalHTML).toContain('md:grid-cols-2');
    expect(modalHTML).toContain('gap-4');
    expect(modalHTML).toContain('md:gap-6');

    // Check for consistent checkmark icons in circular backgrounds
    expect(modalHTML).toContain('bg-green-100');
    expect(modalHTML).toContain('rounded-full');
    expect(modalHTML).toContain('text-green-600');

    // Check for enhanced button styling
    expect(modalHTML).toContain('bg-gradient-to-r');
    expect(modalHTML).toContain('from-primary-600');
    expect(modalHTML).toContain('to-primary-700');
    expect(modalHTML).toContain('shadow-lg');
    expect(modalHTML).toContain('hover:shadow-xl');

    // Check for improved spacing and padding
    expect(modalHTML).toContain('p-6');
    expect(modalHTML).toContain('md:p-8');
    expect(modalHTML).toContain('space-y-6');
  });

  it('should have proper button styling and spacing in modal footer', async () => {
    const { container, getByText } = renderWithTheme(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event and open modal
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.preventDefault = vi.fn();
    mockEvent.prompt = vi.fn().mockResolvedValue(undefined);
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    mockEvent.platforms = ['web'];
    
    await act(async () => {
      window.dispatchEvent(mockEvent);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const learnMoreButton = getByText('Learn More');
    await act(async () => {
      fireEvent.click(learnMoreButton);
    });

    const modalHTML = container.innerHTML;

    // Check for enhanced button footer styling
    expect(modalHTML).toContain('flex-col');
    expect(modalHTML).toContain('sm:flex-row');
    expect(modalHTML).toContain('gap-4');
    expect(modalHTML).toContain('pt-6');
    expect(modalHTML).toContain('border-t');
    expect(modalHTML).toContain('border-gray-200');

    // Check for improved button dimensions and styling
    expect(modalHTML).toContain('min-h-[48px]');
    expect(modalHTML).toContain('px-6');
    expect(modalHTML).toContain('py-3');
    expect(modalHTML).toContain('text-base');
    expect(modalHTML).toContain('font-medium');
    expect(modalHTML).toContain('rounded-lg');

    // Check for transition effects
    expect(modalHTML).toContain('transition-colors');
    expect(modalHTML).toContain('transition-all');
    expect(modalHTML).toContain('duration-200');
  });

  it('should display benefits in improved grid layout with consistent icons', async () => {
    const { container, getByText } = renderWithTheme(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event and open modal
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.preventDefault = vi.fn();
    mockEvent.prompt = vi.fn().mockResolvedValue(undefined);
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    mockEvent.platforms = ['web'];
    
    await act(async () => {
      window.dispatchEvent(mockEvent);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const learnMoreButton = getByText('Learn More');
    await act(async () => {
      fireEvent.click(learnMoreButton);
    });

    // Check that all benefit items are present
    expect(getByText('Quick access from home screen')).toBeInTheDocument();
    expect(getByText('Works offline for cached content')).toBeInTheDocument();
    expect(getByText('Push notifications for classes')).toBeInTheDocument();
    expect(getByText('Full-screen app experience')).toBeInTheDocument();

    const modalHTML = container.innerHTML;

    // Check for consistent checkmark icon styling across all benefits
    expect(modalHTML).toContain('bg-green-100');
    expect(modalHTML).toContain('rounded-full');
    expect(modalHTML).toContain('text-green-600');
    
    // Count the number of benefit items by counting checkmark icons
    const greenIconMatches = modalHTML.match(/bg-green-100/g);
    expect(greenIconMatches).toBeTruthy();
    expect(greenIconMatches!.length).toBeGreaterThanOrEqual(4); // Should have at least 4 benefit items

    // Check for improved benefit item layout
    expect(modalHTML).toContain('flex items-start space-x-4');
    expect(modalHTML).toContain('flex-shrink-0');
    expect(modalHTML).toContain('flex-1 min-w-0');
    expect(modalHTML).toContain('font-medium');
  });
});