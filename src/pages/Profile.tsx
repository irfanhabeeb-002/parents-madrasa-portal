import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { Card } from '../components/ui/Card';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Profile</h1>
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
            <label className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 px-1">Name</label>
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 min-h-[44px] flex items-center">
              <p className="text-sm sm:text-base lg:text-lg text-gray-900 break-words word-wrap leading-relaxed w-full">
                {user.displayName || 'Not provided'}
              </p>
            </div>

          </div>

          {/* Phone Number */}
          {user.phone && (
            <div className="flex flex-col space-y-2 sm:space-y-3">
              <label className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 px-1">Phone Number</label>
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
              <label className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 px-1">Email</label>
              <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 min-h-[44px] flex items-center">
                <p className="text-sm sm:text-base lg:text-lg text-gray-900 break-words word-wrap leading-relaxed overflow-wrap-anywhere w-full">
                  {user.email}
                </p>
              </div>

            </div>
          )}

          {/* User ID */}
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <label className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 px-1">User ID</label>
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 min-h-[44px] flex items-center">
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-mono break-all word-wrap leading-relaxed overflow-wrap-anywhere w-full">
                {user.uid}
              </p>
            </div>

          </div>
        </div>
      </Card>

      {/* Logout Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-5 lg:p-6 mx-2 sm:mx-0">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg lg:text-xl font-medium text-red-900 mb-2 sm:mb-3">Logout</h3>
            <p className="text-sm sm:text-base lg:text-lg text-red-600 mb-4 sm:mb-5 lg:mb-6 leading-relaxed">
              Sign out of your account and return to the login page.
            </p>
            <AccessibleButton
              variant="danger"
              onClick={handleLogout}
              ariaLabel="Logout from application"
              className="!min-h-[48px] w-full px-4 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4"
              style={{ 
                backgroundColor: '#dc2626', 
                color: 'white',
                border: '2px solid #dc2626'
              }}
            >
              <div className="flex items-center justify-center space-x-2 lg:space-x-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm sm:text-base lg:text-lg font-medium">Logout</span>
              </div>
            </AccessibleButton>
          </div>
        </div>
      </div>
    </div>
  );
};