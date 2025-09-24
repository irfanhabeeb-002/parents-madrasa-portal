import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessibleButton } from '../ui/AccessibleButton';
import { useAuth } from '../../contexts/AuthContext';
import { CompactSyncStatus } from '../pwa/SyncStatus';
import { InstallButton } from '../pwa/InstallButton';
import { AppIcons } from '../../assets/icons';
import { INSTALL_LOCALIZATION } from '../../constants/installLocalization';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
  onBack?: () => void;
  showLogout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showBackButton = false,
  title,
  onBack,
  showLogout = false, // Changed default to false since logout will be in Profile
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      role="banner"
    >
      {/* Mobile Header */}
      <div className="md:hidden container mx-auto px-4 py-3 max-w-md">
        <div className="flex items-center justify-between">
          {/* Left side - Back button or Logo */}
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <AccessibleButton
                variant="secondary"
                size="sm"
                onClick={handleBack}
                ariaLabel="Go back to previous page"
                className="!min-h-[40px] !min-w-[40px] !p-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </AccessibleButton>
            ) : (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={AppIcons.main}
                  alt="Parents Madrasa Portal"
                  className="w-8 h-8 object-cover"
                />
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {title || 'Parents Madrasa Portal'}
              </h1>
            </div>
          </div>

          {/* Right side - Install button, sync status and user menu */}
          <div className="flex items-center space-x-2">
            {/* Install Button - Mobile */}
            <InstallButton
              variant="secondary"
              size="sm"
              source="header_mobile"
              placement="navbar"
              fallbackBehavior="hide"
              showIcon={true}
              showLoadingState={false}
              showErrorState={false}
              className="!min-h-[44px] !min-w-[44px] !p-2 text-primary-600 hover:text-primary-700"
            />

            {/* Sync Status */}
            <CompactSyncStatus />

            {user && (
              <>
                {/* User avatar/initial */}
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>

                {/* Disabled hamburger menu button */}
                <button
                  disabled
                  aria-label="Menu (disabled)"
                  className="!min-h-[44px] !min-w-[44px] !p-2 rounded-md border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h8m-8 6h16"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block max-w-6xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4">
            {showBackButton ? (
              <AccessibleButton
                variant="secondary"
                size="lg"
                onClick={handleBack}
                ariaLabel="Go back to previous page"
                className="!min-h-[48px] !min-w-[48px] !p-3"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </AccessibleButton>
            ) : (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={AppIcons.main}
                  alt="Parents Madrasa Portal"
                  className="w-12 h-12 object-cover"
                />
              </div>
            )}

            {/* Title */}
            <div>
              <h1
                className="text-xl font-bold text-gray-900 font-inter"
                style={{ fontSize: '20px' }}
              >
                {title || 'Parents Madrasa Portal'}
              </h1>
            </div>
          </div>

          {/* Right side - Install button, user info and menu */}
          <div className="flex items-center space-x-4">
            {/* Install Button - Desktop */}
            <InstallButton
              variant="secondary"
              size="md"
              source="header_desktop"
              placement="navbar"
              fallbackBehavior="hide"
              showIcon={true}
              showLoadingState={true}
              showErrorState={false}
              className="!min-h-[48px] px-4 py-2 text-sm border border-primary-300 hover:border-primary-400 text-primary-700 hover:bg-primary-50"
            >
              {INSTALL_LOCALIZATION.english.buttonText}
            </InstallButton>

            {/* Sync Status - Desktop */}
            <CompactSyncStatus />

            {user && (
              <>
                {/* User avatar/initial */}
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-blue-700">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>

                {/* Disabled hamburger menu button */}
                <button
                  disabled
                  aria-label="Menu (disabled)"
                  className="!min-h-[48px] !min-w-[48px] !p-3 rounded-md border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h8m-8 6h16"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
