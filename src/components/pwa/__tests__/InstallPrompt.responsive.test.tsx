import React from 'react';
import { render, act } from '@testing-library/react';
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

describe('InstallPrompt Responsive Design', () => {
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

  it('should contain responsive design classes in component structure', async () => {
    const { container } = renderWithTheme(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event to trigger banner display
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.preventDefault = vi.fn();
    mockEvent.prompt = vi.fn().mockResolvedValue(undefined);
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    mockEvent.platforms = ['web'];
    
    await act(async () => {
      window.dispatchEvent(mockEvent);
      // Wait for setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Check that the component contains the responsive classes we implemented
    const componentHTML = container.innerHTML;
    
    // Check for responsive padding classes
    expect(componentHTML).toContain('p-4');
    expect(componentHTML).toContain('md:p-5');
    
    // Check for responsive text sizing classes
    expect(componentHTML).toContain('text-sm');
    expect(componentHTML).toContain('md:text-base');
    
    // Check for horizontal centering classes
    expect(componentHTML).toContain('max-w-md');
    expect(componentHTML).toContain('mx-auto');
    
    // Check for responsive button layout classes
    expect(componentHTML).toContain('flex-col');
    expect(componentHTML).toContain('sm:flex-row');
    
    // Check for minimum touch target sizes
    expect(componentHTML).toContain('min-h-[44px]');
  });

  it('should verify responsive design implementation is complete', async () => {
    const { container } = renderWithTheme(<InstallPrompt />);
    
    // Simulate beforeinstallprompt event to trigger banner display
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.preventDefault = vi.fn();
    mockEvent.prompt = vi.fn().mockResolvedValue(undefined);
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    mockEvent.platforms = ['web'];
    
    await act(async () => {
      window.dispatchEvent(mockEvent);
      // Wait for setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const componentHTML = container.innerHTML;
    
    // Verify all task requirements are implemented:
    
    // 1. Horizontal centering with max-width constraints for desktop (max-w-md mx-auto)
    expect(componentHTML).toContain('max-w-md');
    expect(componentHTML).toContain('mx-auto');
    expect(componentHTML).toContain('md:left-1/2');
    expect(componentHTML).toContain('md:transform');
    expect(componentHTML).toContain('md:-translate-x-1/2');
    
    // 2. Responsive padding (p-4 on mobile, p-5 on desktop)
    expect(componentHTML).toContain('p-4');
    expect(componentHTML).toContain('md:p-5');
    
    // 3. Responsive text sizing (text-sm on mobile, text-base on desktop)
    expect(componentHTML).toContain('text-sm');
    expect(componentHTML).toContain('md:text-base');
    
    // 4. Proper spacing and sizing across different screen orientations
    expect(componentHTML).toContain('flex-col');
    expect(componentHTML).toContain('sm:flex-row');
    expect(componentHTML).toContain('space-y-2');
    expect(componentHTML).toContain('sm:space-y-0');
    expect(componentHTML).toContain('sm:space-x-3');
    
    // 5. Minimum touch target sizes (44px)
    expect(componentHTML).toContain('min-h-[44px]');
    expect(componentHTML).toContain('min-w-[44px]');
  });
});