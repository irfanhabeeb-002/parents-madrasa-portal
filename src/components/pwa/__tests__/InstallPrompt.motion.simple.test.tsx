import React from 'react';
import { render } from '@testing-library/react';

// Mock the theme context
const mockUseTheme = jest.fn();

jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

// Import after mocking
import { InstallPrompt } from '../InstallPrompt';

describe('InstallPrompt Motion Preferences', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without errors when motion is reduced', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      userTheme: 'light',
      setTheme: jest.fn(),
      toggleTheme: jest.fn(),
      isHighContrast: false,
      prefersReducedMotion: true,
    });

    expect(() => {
      render(<InstallPrompt />);
    }).not.toThrow();
  });

  it('should render without errors when motion is allowed', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      userTheme: 'light',
      setTheme: jest.fn(),
      toggleTheme: jest.fn(),
      isHighContrast: false,
      prefersReducedMotion: false,
    });

    expect(() => {
      render(<InstallPrompt />);
    }).not.toThrow();
  });

  it('should integrate prefersReducedMotion from theme context', () => {
    const mockTheme = {
      theme: 'light' as const,
      userTheme: 'light' as const,
      setTheme: jest.fn(),
      toggleTheme: jest.fn(),
      isHighContrast: false,
      prefersReducedMotion: true,
    };

    mockUseTheme.mockReturnValue(mockTheme);

    const { container } = render(<InstallPrompt />);

    // Component should render successfully with motion preferences
    expect(container).toBeTruthy();
  });
});
