import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Profile } from '../Profile';
import { AuthProvider } from '../../contexts/AuthContext';
import '@testing-library/jest-dom';

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue(
    JSON.stringify({
      uid: 'test-uid',
      displayName: 'Test User',
      phone: '9876543210',
      email: 'test@example.com',
      role: 'parent',
    })
  );

  // Mock console methods to avoid noise in tests
  console.error = jest.fn();
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

const renderProfileWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Profile />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Profile Error Handling and Recovery', () => {
  describe('localStorage Error Handling', () => {
    it('should handle localStorage.removeItem errors with fallback cleanup', async () => {
      // Mock localStorage.removeItem to throw an error
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      renderProfileWithAuth();

      // Click logout button
      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      // Confirm logout
      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText(/logout failed/i)).toBeInTheDocument();
      });

      // Verify fallback cleanup was attempted
      expect(mockLocalStorage.clear).not.toHaveBeenCalled(); // Should use targeted cleanup first
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'manualAuthUser'
      );
    });

    it('should show user-friendly error message for storage errors', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText(/unable to clear session data/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /try refreshing the page or clearing your browser cache/i
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Retry Logic', () => {
    it('should implement retry logic for failed logout attempts', async () => {
      let attemptCount = 0;
      mockLocalStorage.removeItem.mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('Network error');
        }
        // Succeed on third attempt
      });

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      // Should eventually succeed after retries
      await waitFor(
        () => {
          expect(screen.getByText(/logout successful/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      expect(attemptCount).toBe(3);
    });

    it('should show retry count in error message', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Persistent error');
      });

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText(/logout failed.*attempts/i)
        ).toBeInTheDocument();
      });
    });

    it('should provide retry button that works', async () => {
      let shouldFail = true;
      mockLocalStorage.removeItem.mockImplementation(() => {
        if (shouldFail) {
          throw new Error('Temporary error');
        }
      });

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/logout failed/i)).toBeInTheDocument();
      });

      // Fix the error condition
      shouldFail = false;

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText(/logout successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Force Logout Functionality', () => {
    it('should provide force logout option when normal logout fails', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Persistent error');
      });

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /force logout/i })
        ).toBeInTheDocument();
      });
    });

    it('should clear all storage when force logout is used', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Persistent error');
      });

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /force logout/i })
        ).toBeInTheDocument();
      });

      const forceLogoutButton = screen.getByRole('button', {
        name: /force logout/i,
      });
      fireEvent.click(forceLogoutButton);

      await waitFor(() => {
        expect(mockLocalStorage.clear).toHaveBeenCalled();
        expect(mockSessionStorage.clear).toHaveBeenCalled();
      });
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should show actionable guidance for different error types', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        const error = new Error('localStorage access denied');
        error.name = 'StorageError';
        throw error;
      });

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/having trouble\?/i)).toBeInTheDocument();
        expect(
          screen.getByText(/try refreshing the page/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/clear your browser cache/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/use "force logout"/i)).toBeInTheDocument();
      });
    });

    it('should show help text with recovery steps', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Test error');
      });

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText(/close your browser completely for security/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Protection', () => {
    it('should catch and handle critical errors in logout functionality', () => {
      // Mock a component that throws an error
      const ThrowError = () => {
        throw new Error('Critical logout error');
      };

      const { container } = render(
        <BrowserRouter>
          <AuthProvider>
            <ThrowError />
          </AuthProvider>
        </BrowserRouter>
      );

      // The error should be caught and not crash the app
      expect(container).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during retry attempts', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>(resolve => {
        resolvePromise = resolve;
      });

      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Test error');
      });

      renderProfileWithAuth();

      const logoutButton = screen.getByRole('button', {
        name: /logout from application/i,
      });
      fireEvent.click(logoutButton);

      const confirmButton = await screen.findByRole('button', {
        name: /yes, logout/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /try again/i })
        ).toBeInTheDocument();
      });

      // Mock a slow retry
      mockLocalStorage.removeItem.mockImplementation(() => promise);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      // Should show retrying state
      expect(screen.getByText(/retrying\.\.\./i)).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!();
    });
  });
});
