import React, { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Enhanced security: Prevent back-button access to protected pages after logout
  useEffect(() => {
    if (requireAuth && !user && !loading) {
      // Clear browser history to prevent back-button access
      // This helps ensure users can't navigate back to protected pages after logout
      try {
        // Replace current history entry to prevent back navigation
        window.history.replaceState(null, '', '/auth');

        // Add a popstate listener to handle back button attempts
        const handlePopState = (event: PopStateEvent) => {
          // If user tries to go back and they're not authenticated, redirect to auth
          if (!user && location.pathname !== '/auth') {
            window.history.replaceState(null, '', '/auth');
            window.location.href = '/auth';
          }
        };

        window.addEventListener('popstate', handlePopState);

        // Cleanup listener on unmount
        return () => {
          window.removeEventListener('popstate', handlePopState);
        };
      } catch (error) {
        console.warn('Failed to set up back-button protection:', error);
      }
    }
  }, [user, loading, requireAuth, location.pathname]);

  // Additional security check: Verify user data integrity
  useEffect(() => {
    if (requireAuth && user) {
      // Verify that the user object has required properties
      if (!user.uid || !user.displayName) {
        console.warn('User object missing required properties, forcing logout');
        // Clear potentially corrupted user data
        localStorage.removeItem('manualAuthUser');
        sessionStorage.removeItem('manualAuthUser');
        window.location.href = '/auth';
        return;
      }

      // Verify localStorage consistency
      try {
        const storedUser = localStorage.getItem('manualAuthUser');
        if (!storedUser) {
          console.warn(
            'User in context but no localStorage data, forcing logout'
          );
          window.location.href = '/auth';
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.uid !== user.uid) {
          console.warn(
            'User data mismatch between context and localStorage, forcing logout'
          );
          localStorage.removeItem('manualAuthUser');
          sessionStorage.removeItem('manualAuthUser');
          window.location.href = '/auth';
          return;
        }
      } catch (error) {
        console.warn('Error verifying user data consistency:', error);
        localStorage.removeItem('manualAuthUser');
        sessionStorage.removeItem('manualAuthUser');
        window.location.href = '/auth';
        return;
      }
    }
  }, [user, requireAuth]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          role="status"
          aria-label="Loading authentication state"
        >
          <span className="sr-only">Verifying authentication...</span>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    // Enhanced security: Clear any remaining session data before redirect
    try {
      localStorage.removeItem('manualAuthUser');
      sessionStorage.removeItem('manualAuthUser');

      // Clear any other potential auth-related data
      const authKeys = ['authUser', 'user', 'userSession', 'sessionData'];
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Error clearing session data during redirect:', error);
    }

    // Redirect to auth page, saving the attempted location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is authenticated but trying to access auth page
  if (!requireAuth && user) {
    // Redirect to home page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
