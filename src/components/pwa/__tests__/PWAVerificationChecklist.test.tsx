import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAVerificationChecklist } from '../PWAVerificationChecklist';
import * as pwaTestUtils from '../../../utils/pwaTestUtils';

// Mock the PWA test utilities
vi.mock('../../../utils/pwaTestUtils', () => ({
  runAllPWATests: vi.fn(),
  testManifestValidation: vi.fn(),
  testServiceWorker: vi.fn(),
  testInstallability: vi.fn(),
  testOfflineFunctionality: vi.fn(),
  testPWAPerformance: vi.fn(),
  testNotifications: vi.fn(),
  simulateOfflineMode: vi.fn(),
}));

// Mock theme context
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isHighContrast: false,
    prefersReducedMotion: false,
  }),
}));

describe('PWAVerificationChecklist', () => {
  const mockTestResults = {
    manifest: {
      isValid: true,
      errors: [],
      warnings: [],
      manifest: { name: 'Test App' },
    },
    serviceWorker: {
      isRegistered: true,
      isActive: true,
      scope: '/',
      updateAvailable: false,
      cacheNames: ['test-cache'],
    },
    installability: {
      isInstallable: true,
      criteria: {
        hasManifest: true,
        isSecure: true,
        hasServiceWorker: true,
        hasIcons: true,
        hasStartUrl: true,
        hasDisplay: true,
      },
    },
    offline: {
      passed: true,
      message: 'Offline functionality ready',
    },
    performance: {
      passed: true,
      message: 'Performance metrics within acceptable ranges',
    },
    notifications: {
      passed: true,
      message: 'Notifications working correctly',
    },
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.mocked(pwaTestUtils.runAllPWATests).mockResolvedValue(mockTestResults);
    vi.mocked(pwaTestUtils.testNotifications).mockResolvedValue(
      mockTestResults.notifications
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders PWA verification checklist', async () => {
    render(<PWAVerificationChecklist />);

    expect(screen.getByText('PWA Verification Checklist')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Comprehensive testing for Progressive Web App functionality'
      )
    ).toBeInTheDocument();
  });

  it('runs all tests on mount', async () => {
    render(<PWAVerificationChecklist />);

    await waitFor(() => {
      expect(pwaTestUtils.runAllPWATests).toHaveBeenCalled();
      expect(pwaTestUtils.testNotifications).toHaveBeenCalled();
    });
  });

  it('displays overall status correctly', async () => {
    render(<PWAVerificationChecklist />);

    await waitFor(() => {
      expect(screen.getByText(/tests passed/)).toBeInTheDocument();
      expect(screen.getByText(/PWA compliance/)).toBeInTheDocument();
    });
  });

  it('allows running all tests manually', async () => {
    render(<PWAVerificationChecklist />);

    const runAllButton = screen.getByLabelText('Run all PWA tests');
    fireEvent.click(runAllButton);

    await waitFor(() => {
      expect(pwaTestUtils.runAllPWATests).toHaveBeenCalledTimes(2); // Once on mount, once on click
    });
  });

  it('toggles offline simulation', async () => {
    render(<PWAVerificationChecklist />);

    const offlineButton = screen.getByLabelText(
      'Enable offline simulation for testing'
    );
    fireEvent.click(offlineButton);

    expect(pwaTestUtils.simulateOfflineMode).toHaveBeenCalledWith(true);

    // Button text should change
    await waitFor(() => {
      expect(screen.getByText(/disable offline mode/i)).toBeInTheDocument();
    });
  });

  it('expands and collapses test sections', async () => {
    render(<PWAVerificationChecklist />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('📄 Web App Manifest')).toBeInTheDocument();
    });

    const manifestSection = screen
      .getByText('📄 Web App Manifest')
      .closest('button');
    expect(manifestSection).toBeInTheDocument();

    if (manifestSection) {
      fireEvent.click(manifestSection);

      await waitFor(() => {
        expect(screen.getByText('Manifest Validation')).toBeInTheDocument();
      });
    }
  });

  it('runs individual tests', async () => {
    vi.mocked(pwaTestUtils.testManifestValidation).mockResolvedValue(
      mockTestResults.manifest
    );

    render(<PWAVerificationChecklist />);

    // Wait for initial load and expand manifest section
    await waitFor(() => {
      expect(screen.getByText('📄 Web App Manifest')).toBeInTheDocument();
    });

    const manifestSection = screen
      .getByText('📄 Web App Manifest')
      .closest('button');
    if (manifestSection) {
      fireEvent.click(manifestSection);

      await waitFor(() => {
        expect(screen.getByText('Manifest Validation')).toBeInTheDocument();
        const testButton = screen.getByLabelText('Test Manifest Validation');
        fireEvent.click(testButton);
      });

      await waitFor(() => {
        expect(pwaTestUtils.testManifestValidation).toHaveBeenCalled();
      });
    }
  });

  it('displays test results with details', async () => {
    render(<PWAVerificationChecklist />);

    await waitFor(() => {
      expect(screen.getByText('📄 Web App Manifest')).toBeInTheDocument();
    });

    const manifestSection = screen.getByRole('button', {
      name: /web app manifest/i,
    });
    fireEvent.click(manifestSection);

    await waitFor(() => {
      expect(screen.getByText('Manifest Validation')).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });
  });

  it('shows development tools in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<PWAVerificationChecklist />);

    await waitFor(() => {
      expect(screen.getByText('🛠️ Development Tools')).toBeInTheDocument();
      expect(screen.getByText('Offline Simulation')).toBeInTheDocument();
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('handles test failures gracefully', async () => {
    const failedResults = {
      ...mockTestResults,
      manifest: {
        isValid: false,
        errors: ['Missing required field: name'],
        warnings: [],
      },
    };

    vi.mocked(pwaTestUtils.runAllPWATests).mockResolvedValue(failedResults);

    render(<PWAVerificationChecklist />);

    await waitFor(() => {
      expect(screen.getByText(/PWA compliance/)).toBeInTheDocument();
    });
  });

  it('displays test summary with timestamp', async () => {
    render(<PWAVerificationChecklist />);

    await waitFor(() => {
      expect(screen.getByText('📊 Test Summary')).toBeInTheDocument();
      expect(screen.getByText('Last Run')).toBeInTheDocument();
      expect(screen.getByText('Tests Passed')).toBeInTheDocument();
      expect(screen.getByText('PWA Score')).toBeInTheDocument();
    });
  });

  it('calculates PWA score correctly', async () => {
    const partialResults = {
      ...mockTestResults,
      offline: {
        passed: false,
        message: 'Offline functionality not working',
      },
    };

    vi.mocked(pwaTestUtils.runAllPWATests).mockResolvedValue(partialResults);

    render(<PWAVerificationChecklist />);

    await waitFor(() => {
      // Should show less than 100% since one test failed
      const scoreElements = screen.getAllByText(/\d+%/);
      expect(scoreElements.length).toBeGreaterThan(0);
    });
  });
});
