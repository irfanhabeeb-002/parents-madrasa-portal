import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessibleButton } from '../ui/AccessibleButton';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
  malayalamTitle?: string;
  onBack?: () => void;
  showLogout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showBackButton = false,
  title,
  malayalamTitle,
  onBack,
  showLogout = true,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
      <div className="container mx-auto px-4 py-3 max-w-md">
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
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
            )}
            
            {/* Title */}
            <div>
              {title ? (
                <>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h1>
                  {malayalamTitle && (
                    <p className="text-sm text-gray-600" lang="bn">
                      {malayalamTitle}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Parents Madrasa Portal
                  </h1>
                  <p className="text-sm text-gray-600" lang="bn">
                    অভিভাবক মাদ্রাসা পোর্টাল
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right side - User info and logout */}
          {showLogout && user && (
            <div className="flex items-center space-x-2">
              {/* User avatar/initial */}
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              
              {/* Logout button */}
              <AccessibleButton
                variant="error"
                size="sm"
                onClick={logout}
                ariaLabel="Logout from application"
                className="!min-h-[36px] text-xs"
              >
                Logout
              </AccessibleButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};