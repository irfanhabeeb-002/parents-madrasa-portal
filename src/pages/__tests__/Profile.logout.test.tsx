import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Profile } from '../Profile';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
vi.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Profile Logout Functionality', () => {
  const mockUser = {
    uid: 'test-uid',
    displayName: 'Test User',
    phone: '9876543210',
    email: 'test@example.com',
    role: 'parent' as const,
  };

  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      loginWithPhone: vi.fn(),
      logout: mockLogout,
      clearError: vi.fn(),
    });
  });

  const renderProfile = () => {
    return render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
  };

  it('should show logout button', () => {
    renderProfile();

    const logoutButton = screen.getByRole('button', {
      name: /logout from application/i,
    });
    expect(logoutButton).toBeInTheDocument();
  });

  it('should show confirmation dialog when logout button is clicked', () => {
    renderProfile();

    const logoutButton = screen.getByRole('button', {
      name: /logout from application/i,
    });
    fireEvent.click(logoutButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to logout/i)
    ).toBeInTheDocument();
  });

  it('should close confirmation dialog when cancel is clicked', () => {
    renderProfile();

    const logoutButton = screen.getByRole('button', {
      name: /logout from application/i,
    });
    fireEvent.click(logoutButton);

    const cancelButton = screen.getByRole('button', { name: /cancel logout/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call logout function when confirmed', async () => {
    mockLogout.mockResolvedValue();
    renderProfile();

    const logoutButton = screen.getByRole('button', {
      name: /logout from application/i,
    });
    fireEvent.click(logoutButton);

    const confirmButton = screen.getByRole('button', {
      name: /confirm logout/i,
    });
    fireEvent.click(confirmButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should show loading state during logout', async () => {
    mockLogout.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    renderProfile();

    const logoutButton = screen.getByRole('button', {
      name: /logout from application/i,
    });
    fireEvent.click(logoutButton);

    const confirmButton = screen.getByRole('button', {
      name: /confirm logout/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
    });
  });

  it('should show success message and navigate after successful logout', async () => {
    mockLogout.mockResolvedValue();
    renderProfile();

    const logoutButton = screen.getByRole('button', {
      name: /logout from application/i,
    });
    fireEvent.click(logoutButton);

    const confirmButton = screen.getByRole('button', {
      name: /confirm logout/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Logout Successful')).toBeInTheDocument();
    });

    // Wait for navigation
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth');
      },
      { timeout: 2000 }
    );
  });

  it('should show error message when logout fails', async () => {
    let errorMessage = 'Network error';
    mockLogout.mockRejectedValue(new Error(errorMessage));
    renderProfile();

    const logoutButton = screen.getByRole('button', {
      name: /logout from application/i,
    });
    fireEvent.click(logoutButton);

    const confirmButton = screen.getByRole('button', {
      name: /confirm logout/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Logout Failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should allow retry when logout fails', async () => {
    mockLogout
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce();
    renderProfile();

    const logoutButton = screen.getByRole('button', {
      name: /logout from application/i,
    });
    fireEvent.click(logoutButton);

    const confirmButton = screen.getByRole('button', {
      name: /confirm logout/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Logout Failed')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry logout/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Logout Successful')).toBeInTheDocument();
    });
  });
});
