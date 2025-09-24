import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { Card } from '../components/ui/Card';
import { LogoutErrorBoundary } from '../components/ErrorBoundary';
import { ScreenReaderAnnouncement } from '../components/ui/ScreenReaderAnnouncement';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State for logout process
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [screenReaderMessage, setScreenReaderMessage] = useState<string>('');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  const handleLogoutClick = () => {
    console.warn('Logout button clicked');
    setLogoutError(null);
    setShowConfirmDialog(true);
    setScreenReaderMessage(
      'Logout confirmation dialog opened. Please confirm if you want to logout.'
    );
  };

  const handleConfirmLogout = async () => {
    console.warn('User confirmed logout');
    setShowConfirmDialog(false);
    setIsLoggingOut(true);
    setLogoutError(null);
    setIsRetrying(false);
    setScreenReaderMessage('Logging out, please wait...');

    try {
      await logout();
      console.warn('Logout successful');

      // Show success feedback
      setShowSuccess(true);
      setScreenReaderMessage('Logout successful! Redirecting to login page...');

      // Navigate after a brief delay to show success message
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (error: any) {
      console.error('Logout failed:', error);

      // Extract actionable guidance from enhanced error
      let errorMessage = 'Failed to logout. Please try again.';
      let actionableGuidance = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        if ((error as any).actionableGuidance) {
          actionableGuidance = (error as any).actionableGuidance;
        }
        if ((error as any).retryCount !== undefined) {
          setRetryCount((error as any).retryCount);
        }
      }

      setLogoutError(errorMessage);
      setIsLoggingOut(false);
      setScreenReaderMessage(
        `Logout failed: ${errorMessage}. Retry and force logout options are available.`
      );
    }
  };

  const handleCancelLogout = () => {
    console.warn('User cancelled logout');
    setShowConfirmDialog(false);
    setLogoutError(null);
    setScreenReaderMessage('Logout cancelled. You remain logged in.');
  };

  const handleRetryLogout = async () => {
    setLogoutError(null);
    setIsRetrying(true);
    setScreenReaderMessage('Retrying logout...');

    try {
      await handleConfirmLogout();
    } catch (error) {
      console.error('Retry logout failed:', error);
      setScreenReaderMessage(
        'Retry logout failed. Please try force logout or refresh the page.'
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const handleForceLogout = () => {
    console.warn('Force logout initiated');
    setIsLoggingOut(true);
    setLogoutError(null);
    setScreenReaderMessage(
      'Force logout initiated. Clearing all session data...'
    );

    try {
      // Force cleanup of all storage
      localStorage.clear();
      sessionStorage.clear();

      // Show success and redirect
      setShowSuccess(true);
      setScreenReaderMessage(
        'Force logout successful! All session data cleared. Redirecting to login page...'
      );
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    } catch (error) {
      console.error('Force logout failed:', error);
      setScreenReaderMessage(
        'Force logout completed. Redirecting to login page...'
      );
      // If even force logout fails, redirect immediately
      window.location.href = '/auth';
    }
  };

  const handleLogoutError = (error: Error) => {
    console.error('Logout Error Boundary triggered:', error);
    setLogoutError(
      'A critical error occurred during logout. Please use the force logout option for security.'
    );
    setIsLoggingOut(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0 max-w-4xl mx-auto">
      {/* Screen Reader Announcements */}
      <ScreenReaderAnnouncement
        message={screenReaderMessage}
        priority="assertive"
        clearAfter={3000}
      />
      {/* Page Header */}
      <div className="text-center px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
          Profile
        </h1>
      </div>

      {/* User Information Card */}
      <Card
        title="User Information"
        subtitle="Your account details"
        icon={
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        }
        onClick={() => {}}
        ariaLabel="User information section"
        className="!cursor-default mx-0 sm:mx-0"
      >
        <div className="mt-3 sm:mt-4 lg:mt-6 space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Name */}
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <label className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 px-1">
              Name
            </label>
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 min-h-[44px] flex items-center">
              <p className="text-sm sm:text-base lg:text-lg text-gray-900 break-words word-wrap leading-relaxed w-full">
                {user.displayName || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Phone Number */}
          {user.phone && (
            <div className="flex flex-col space-y-2 sm:space-y-3">
              <label className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 px-1">
                Phone Number
              </label>
              <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 min-h-[44px] flex items-center">
                <p className="text-sm sm:text-base lg:text-lg text-gray-900 break-words word-wrap leading-relaxed w-full">
                  {user.phone}
                </p>
              </div>
            </div>
          )}

          {/* Email */}
          {user.email && (
            <div className="flex flex-col space-y-2 sm:space-y-3">
              <label className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 px-1">
                Email
              </label>
              <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 min-h-[44px] flex items-center">
                <p className="text-sm sm:text-base lg:text-lg text-gray-900 break-words word-wrap leading-relaxed overflow-wrap-anywhere w-full">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* User ID */}
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <label className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 px-1">
              User ID
            </label>
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 min-h-[44px] flex items-center">
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-mono break-all word-wrap leading-relaxed overflow-wrap-anywhere w-full">
                {user.uid}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-5 lg:p-6 mx-2 sm:mx-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg lg:text-xl font-medium text-green-900 mb-1">
                Logout Successful
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-green-700">
                You have been successfully logged out. Redirecting to login
                page...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Error Message with Recovery Options */}
      {logoutError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-5 lg:p-6 mx-2 sm:mx-0">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-medium text-red-900 mb-2">
                Logout Failed {retryCount > 0 && `(${retryCount + 1} attempts)`}
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-red-700 mb-4 leading-relaxed">
                {logoutError}
              </p>

              {/* Recovery Options */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <AccessibleButton
                  variant="danger"
                  size="md"
                  onClick={handleRetryLogout}
                  ariaLabel={
                    isRetrying ? 'Retrying logout, please wait' : 'Retry logout'
                  }
                  screenReaderText={
                    isRetrying
                      ? 'Logout retry in progress'
                      : 'Click to retry the logout process'
                  }
                  className="px-4 py-3 sm:px-6 sm:py-3"
                  disabled={isLoggingOut || isRetrying}
                  id="retry-logout-button"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isRetrying ? (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                    <span className="text-sm sm:text-base font-medium">
                      {isRetrying ? 'Retrying...' : 'Try Again'}
                    </span>
                  </div>
                </AccessibleButton>

                <AccessibleButton
                  variant="secondary"
                  size="md"
                  onClick={handleForceLogout}
                  ariaLabel="Force logout and clear all session data"
                  screenReaderText="Click to force logout and clear all stored session data. This will immediately log you out."
                  className="px-4 py-3 sm:px-6 sm:py-3"
                  disabled={isLoggingOut}
                  id="force-logout-button"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span className="text-sm sm:text-base font-medium">
                      Force Logout
                    </span>
                  </div>
                </AccessibleButton>
              </div>

              {/* Additional Help Text */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Having trouble?</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Try refreshing the page and logging out again</li>
                      <li>Clear your browser cache and cookies</li>
                      <li>Use "Force Logout" to clear all session data</li>
                      <li>Close your browser completely for security</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Section with Error Boundary Protection */}
      <LogoutErrorBoundary onLogoutError={handleLogoutError}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-5 lg:p-6 mx-2 sm:mx-0">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-medium text-red-900 mb-2 sm:mb-3">
                Logout
              </h3>
              <p
                id="logout-description"
                className="text-sm sm:text-base lg:text-lg text-red-600 mb-4 sm:mb-5 lg:mb-6 leading-relaxed"
              >
                Sign out of your account and return to the login page. You will
                need to log in again to access your account.
              </p>
              <AccessibleButton
                variant="danger"
                size="md"
                onClick={handleLogoutClick}
                ariaLabel={
                  isLoggingOut
                    ? 'Logging out, please wait'
                    : showSuccess
                      ? 'Logout successful'
                      : 'Logout from application'
                }
                ariaDescribedBy="logout-description"
                screenReaderText={
                  isLoggingOut
                    ? 'Logout in progress'
                    : showSuccess
                      ? 'Logout completed successfully'
                      : 'Click to logout and return to login page'
                }
                className="w-full px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5"
                style={{
                  backgroundColor: isLoggingOut ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: `2px solid ${isLoggingOut ? '#9ca3af' : '#dc2626'}`,
                }}
                disabled={isLoggingOut || showSuccess}
                id="logout-button"
              >
                <div className="flex items-center justify-center space-x-2 lg:space-x-3">
                  {isLoggingOut ? (
                    <>
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="text-sm sm:text-base lg:text-lg font-medium">
                        Logging out...
                      </span>
                    </>
                  ) : showSuccess ? (
                    <>
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm sm:text-base lg:text-lg font-medium">
                        Success!
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="text-sm sm:text-base lg:text-lg font-medium">
                        Logout
                      </span>
                    </>
                  )}
                </div>
              </AccessibleButton>
            </div>
          </div>
        </div>
      </LogoutErrorBoundary>

      {/* Enhanced Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          aria-describedby="logout-dialog-description"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3
                  id="logout-dialog-title"
                  className="text-lg font-medium text-gray-900 mb-2"
                >
                  Confirm Logout
                </h3>
                <p
                  id="logout-dialog-description"
                  className="text-sm text-gray-600 mb-6 leading-relaxed"
                >
                  Are you sure you want to logout? You will be signed out of
                  your account and redirected to the login page. You'll need to
                  enter your credentials again to access your account.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <AccessibleButton
                    variant="danger"
                    size="md"
                    onClick={handleConfirmLogout}
                    ariaLabel="Confirm logout and sign out"
                    screenReaderText="Click to confirm logout and sign out of your account"
                    className="flex-1 px-4 py-3 order-2 sm:order-1"
                    id="confirm-logout-button"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="font-medium">Yes, Logout</span>
                    </div>
                  </AccessibleButton>
                  <AccessibleButton
                    variant="secondary"
                    size="md"
                    onClick={handleCancelLogout}
                    ariaLabel="Cancel logout and stay logged in"
                    screenReaderText="Click to cancel logout and remain logged in"
                    className="flex-1 px-4 py-3 order-1 sm:order-2"
                    id="cancel-logout-button"
                  >
                    <span className="font-medium">Cancel</span>
                  </AccessibleButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
