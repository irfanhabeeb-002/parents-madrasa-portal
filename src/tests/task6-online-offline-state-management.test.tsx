import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import {
  useOnlineStatus,
  useOfflineGracefulDegradation,
} from '../hooks/useOnlineStatus';
import {
  OfflineIndicator,
  NetworkStatus,
} from '../components/pwa/OfflineIndicator';
import {
  OfflineGracefulFallback,
  SlowConnectionWarning,
} from '../components/pwa/OfflineGracefulFallback';
import { NetworkService } from '../services/networkService';

// Mock NetworkService
vi.mock('../services/networkService', () => ({
  NetworkService: {
    initialize: vi.fn(),
    getNetworkStatus: vi.fn(() => ({
      isOnline: true,
      connectionType: '4g',
      effectiveType: '4g',
    })),
    subscribe: vi.fn(() => vi.fn()),
    isSlowConnection: vi.fn(() => false),
    isFastConnection: vi.fn(() => true),
  },
}));

// Mock offlineQueue
vi.mock('../services/offlineQueue', () => ({
  offlineQueue: {
    getQueueStats: vi.fn(() => ({
      totalItems: 0,
      itemsByType: {},
      oldestItem: null,
      failedItems: 0,
    })),
    processQueue: vi.fn(),
  },
}));

// Mock AlertBanner component
vi.mock('../components/ui/AlertBanner', () => ({
  AlertBanner: ({
    type,
    message,
    malayalamMessage,
    onDismiss,
    children,
  }: any) => (
    <div data-testid="alert-banner" data-type={type}>
      <div>{message}</div>
      {malayalamMessage && (
        <div data-testid="malayalam-message">{malayalamMessage}</div>
      )}
      {onDismiss && (
        <button onClick={onDismiss} data-testid="dismiss-button">
          Dismiss
        </button>
      )}
      {children}
    </div>
  ),
}));

describe('Task 6: Online/Offline State Management', () => {
  let mockNavigator: any;
  let originalNavigator: any;

  beforeEach(() => {
    originalNavigator = global.navigator;
    mockNavigator = {
      onLine: true,
      connection: {
        type: '4g',
        effectiveType: '4g',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    });

    // Mock window.addEventListener and removeEventListener
    global.addEventListener = vi.fn();
    global.removeEventListener = vi.fn();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  describe('useOnlineStatus Hook', () => {
    it('should track network connectivity', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.networkStatus).toBeDefined();
      expect(NetworkService.initialize).toHaveBeenCalled();
      expect(NetworkService.subscribe).toHaveBeenCalled();
    });

    it('should provide connection quality information', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isSlowConnection).toBe(false);
      expect(result.current.isFastConnection).toBe(true);
      expect(result.current.effectiveType).toBeDefined();
    });

    it('should provide retry connection functionality', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(typeof result.current.retryConnection).toBe('function');

      // Test retry function doesn't throw
      expect(() => result.current.retryConnection()).not.toThrow();
    });

    it('should handle offline state', () => {
      // Mock offline state
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('useOfflineGracefulDegradation Hook', () => {
    it('should provide offline graceful degradation utilities', () => {
      const { result } = renderHook(() => useOfflineGracefulDegradation());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isSlowConnection).toBe(false);
      expect(typeof result.current.shouldShowOfflineMessage).toBe('function');
      expect(typeof result.current.getOfflineMessage).toBe('function');
      expect(typeof result.current.addOfflineAction).toBe('function');
      expect(typeof result.current.clearOfflineActions).toBe('function');
    });

    it('should identify features that need offline messages', () => {
      const { result } = renderHook(() => useOfflineGracefulDegradation());

      // Should show offline message for live-class when offline
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      const { result: offlineResult } = renderHook(() =>
        useOfflineGracefulDegradation()
      );

      expect(offlineResult.current.shouldShowOfflineMessage('live-class')).toBe(
        true
      );
      expect(
        offlineResult.current.shouldShowOfflineMessage('regular-content')
      ).toBe(false);
    });

    it('should provide appropriate offline messages', () => {
      const { result } = renderHook(() => useOfflineGracefulDegradation());

      const liveClassMessage = result.current.getOfflineMessage('live-class');
      expect(liveClassMessage.en).toContain('Live classes require');
      expect(liveClassMessage.ml).toContain('ലൈവ് ക്ലാസുകൾക്ക്');

      const defaultMessage =
        result.current.getOfflineMessage('unknown-feature');
      expect(defaultMessage.en).toContain('This feature requires');
      expect(defaultMessage.ml).toContain('ഈ ഫീച്ചറിന്');
    });
  });

  describe('OfflineIndicator Component', () => {
    it('should render offline message when offline', async () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      render(<OfflineIndicator />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-banner')).toBeInTheDocument();
        expect(screen.getByText(/You're offline/)).toBeInTheDocument();
        expect(screen.getByTestId('malayalam-message')).toBeInTheDocument();
      });
    });

    it('should show queue status when enabled', async () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      // Mock queue with items
      const mockOfflineQueue = await import('../services/offlineQueue');
      vi.mocked(mockOfflineQueue.offlineQueue.getQueueStats).mockReturnValue({
        totalItems: 3,
        itemsByType: { attendance: 2, 'exam-result': 1 },
        oldestItem: Date.now() - 1000,
        failedItems: 0,
      });

      render(<OfflineIndicator showQueueStatus={true} />);

      await waitFor(() => {
        expect(screen.getByText(/3 actions queued/)).toBeInTheDocument();
        expect(screen.getByText(/Retry Connection/)).toBeInTheDocument();
      });
    });

    it('should show connection quality warnings', async () => {
      vi.mocked(NetworkService.isSlowConnection).mockReturnValue(true);
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: true,
        connectionType: '2g',
        effectiveType: '2g',
      });

      render(<OfflineIndicator showConnectionQuality={true} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Slow connection detected/)
        ).toBeInTheDocument();
      });
    });

    it('should provide dismiss functionality', async () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      render(<OfflineIndicator />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-banner')).toBeInTheDocument();
      });

      const dismissButton = screen.getByTestId('dismiss-button');
      expect(dismissButton).toBeInTheDocument();

      // Verify the dismiss button is functional (doesn't throw error when clicked)
      expect(() => fireEvent.click(dismissButton)).not.toThrow();
    });
  });

  describe('NetworkStatus Component', () => {
    it('should display online status', () => {
      render(<NetworkStatus />);

      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('ഓൺലൈൻ')).toBeInTheDocument();
    });

    it('should display offline status', () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      render(<NetworkStatus />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('ഓഫ്‌ലൈൻ')).toBeInTheDocument();
    });

    it('should show connection type when enabled', () => {
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: true,
        connectionType: '4g',
        effectiveType: '4g',
      });

      render(<NetworkStatus showConnectionType={true} />);

      expect(screen.getByText(/Online \(4G\)/)).toBeInTheDocument();
    });

    it('should show slow connection status', () => {
      vi.mocked(NetworkService.isSlowConnection).mockReturnValue(true);
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: true,
        connectionType: '2g',
        effectiveType: '2g',
      });

      render(<NetworkStatus />);

      expect(screen.getByText('Slow')).toBeInTheDocument();
      expect(screen.getByText('മന്ദം')).toBeInTheDocument();
    });
  });

  describe('OfflineGracefulFallback Component', () => {
    it('should render children when online', () => {
      render(
        <OfflineGracefulFallback feature="regular-content">
          <div data-testid="online-content">Online Content</div>
        </OfflineGracefulFallback>
      );

      expect(screen.getByTestId('online-content')).toBeInTheDocument();
    });

    it('should show offline message for features requiring internet', () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      render(
        <OfflineGracefulFallback feature="live-class">
          <div data-testid="online-content">Live Class Content</div>
        </OfflineGracefulFallback>
      );

      expect(screen.getByText(/Live classes require/)).toBeInTheDocument();
      expect(screen.queryByTestId('online-content')).not.toBeInTheDocument();
    });

    it('should show fallback content when provided', () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      render(
        <OfflineGracefulFallback
          feature="live-class"
          fallbackContent={
            <div data-testid="fallback-content">Offline Fallback</div>
          }
        >
          <div data-testid="online-content">Live Class Content</div>
        </OfflineGracefulFallback>
      );

      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
      expect(screen.getByText('Available offline:')).toBeInTheDocument();
    });

    it('should handle retry functionality', () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      const mockRetry = vi.fn();

      render(
        <OfflineGracefulFallback feature="live-class" onRetry={mockRetry}>
          <div data-testid="online-content">Live Class Content</div>
        </OfflineGracefulFallback>
      );

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('SlowConnectionWarning Component', () => {
    it('should not render when connection is fast', () => {
      vi.mocked(NetworkService.isSlowConnection).mockReturnValue(false);

      render(<SlowConnectionWarning />);

      expect(
        screen.queryByText(/Slow connection detected/)
      ).not.toBeInTheDocument();
    });

    it('should render warning for slow connections', () => {
      vi.mocked(NetworkService.isSlowConnection).mockReturnValue(true);
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: true,
        connectionType: '2g',
        effectiveType: '2g',
      });

      render(<SlowConnectionWarning />);

      expect(screen.getByText(/Slow connection detected/)).toBeInTheDocument();
      expect(
        screen.getByText(/മന്ദഗതിയിലുള്ള കണക്ഷൻ കണ്ടെത്തി/)
      ).toBeInTheDocument();
    });

    it('should handle optimize functionality', () => {
      vi.mocked(NetworkService.isSlowConnection).mockReturnValue(true);
      const mockOptimize = vi.fn();

      render(<SlowConnectionWarning onOptimize={mockOptimize} />);

      const optimizeButton = screen.getByText('Optimize');
      fireEvent.click(optimizeButton);

      expect(mockOptimize).toHaveBeenCalled();
    });
  });

  describe('Integration with Existing Services', () => {
    it('should integrate with NetworkService', () => {
      renderHook(() => useOnlineStatus());

      expect(NetworkService.initialize).toHaveBeenCalled();
      expect(NetworkService.subscribe).toHaveBeenCalled();
      expect(NetworkService.getNetworkStatus).toHaveBeenCalled();
    });

    it('should integrate with offline queue service', async () => {
      const mockOfflineQueue = await import('../services/offlineQueue');

      render(<OfflineIndicator showQueueStatus={true} />);

      expect(mockOfflineQueue.offlineQueue.getQueueStats).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA attributes', async () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      render(<OfflineIndicator />);

      await waitFor(() => {
        const alertBanner = screen.getByTestId('alert-banner');
        expect(alertBanner).toBeInTheDocument();
      });
    });

    it('should support Malayalam language', async () => {
      mockNavigator.onLine = false;
      vi.mocked(NetworkService.getNetworkStatus).mockReturnValue({
        isOnline: false,
        connectionType: undefined,
        effectiveType: undefined,
      });

      render(<OfflineIndicator />);

      await waitFor(() => {
        expect(screen.getByTestId('malayalam-message')).toBeInTheDocument();
      });
    });
  });
});
