import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdateNotification, ManualUpdateTrigger } from '../UpdateNotification';
import { useServiceWorkerUpdate } from '../../../hooks/useServiceWorkerUpdate';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock the service worker update hook
jest.mock('../../../hooks/useServiceWorkerUpdate');
const mockUseServiceWorkerUpdate = useServiceWorkerUpdate as jest.MockedFunction<typeof useServiceWorkerUpdate>;

// Mock theme context
const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('UpdateNotification', () => {
  const mockUpdateServiceWorker = jest.fn();
  const mockDismissUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: false,
      isUpdating: false,
      updateError: null,
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });
  });

  it('should not render when no update is available', () => {
    render(
      <MockThemeProvider>
        <UpdateNotification />
      </MockThemeProvider>
    );

    expect(screen.queryByText('App Update Available')).not.toBeInTheDocument();
  });

  it('should render update notification when update is available', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: true,
      isUpdating: false,
      updateError: null,
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });

    render(
      <MockThemeProvider>
        <UpdateNotification />
      </MockThemeProvider>
    );

    expect(screen.getByText('App Update Available')).toBeInTheDocument();
    expect(screen.getByText('A new version is ready with improvements and bug fixes')).toBeInTheDocument();
    expect(screen.getByText('Later')).toBeInTheDocument();
    expect(screen.getByText('Update Now')).toBeInTheDocument();
  });

  it('should call updateServiceWorker when Update Now is clicked', async () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: true,
      isUpdating: false,
      updateError: null,
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });

    render(
      <MockThemeProvider>
        <UpdateNotification />
      </MockThemeProvider>
    );

    const updateButton = screen.getByText('Update Now');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockUpdateServiceWorker).toHaveBeenCalledTimes(1);
    });
  });

  it('should call dismissUpdate when Later is clicked', async () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: true,
      isUpdating: false,
      updateError: null,
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });

    render(
      <MockThemeProvider>
        <UpdateNotification />
      </MockThemeProvider>
    );

    const laterButton = screen.getByText('Later');
    fireEvent.click(laterButton);

    await waitFor(() => {
      expect(mockDismissUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it('should show updating state', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: true,
      isUpdating: true,
      updateError: null,
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });

    render(
      <MockThemeProvider>
        <UpdateNotification />
      </MockThemeProvider>
    );

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.getByLabelText(/Update app now/)).toBeDisabled();
  });

  it('should show error message when update fails', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: true,
      isUpdating: false,
      updateError: 'Failed to update',
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });

    render(
      <MockThemeProvider>
        <UpdateNotification />
      </MockThemeProvider>
    );

    expect(screen.getByText('Update Error:')).toBeInTheDocument();
    expect(screen.getByText('Failed to update')).toBeInTheDocument();
  });
});

describe('ManualUpdateTrigger', () => {
  const mockUpdateServiceWorker = jest.fn();
  const mockDismissUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: false,
      isUpdating: false,
      updateError: null,
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });
  });

  it('should render button variant correctly', () => {
    render(
      <MockThemeProvider>
        <ManualUpdateTrigger variant="button" />
      </MockThemeProvider>
    );

    expect(screen.getByText('Check Updates')).toBeInTheDocument();
  });

  it('should render menu-item variant correctly', () => {
    render(
      <MockThemeProvider>
        <ManualUpdateTrigger variant="menu-item" />
      </MockThemeProvider>
    );

    expect(screen.getByText('Check for Updates')).toBeInTheDocument();
  });

  it('should show update available state', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: true,
      isUpdating: false,
      updateError: null,
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });

    render(
      <MockThemeProvider>
        <ManualUpdateTrigger variant="button" />
      </MockThemeProvider>
    );

    expect(screen.getByText('Update Now')).toBeInTheDocument();
  });

  it('should show updating state', () => {
    mockUseServiceWorkerUpdate.mockReturnValue({
      updateAvailable: true,
      isUpdating: true,
      updateError: null,
      updateServiceWorker: mockUpdateServiceWorker,
      dismissUpdate: mockDismissUpdate,
      offlineReady: false,
    });

    render(
      <MockThemeProvider>
        <ManualUpdateTrigger variant="button" />
      </MockThemeProvider>
    );

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});