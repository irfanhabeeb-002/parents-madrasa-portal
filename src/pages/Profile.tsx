import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { FontSizeToggle } from '../components/ui/FontSizeToggle';
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Page Header */}
      <div className="text-center px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-sm sm:text-base text-gray-600" lang="ml">പ്രൊഫൈൽ</p>
      </div>

      {/* User Information Card */}
      <Card
        title="User Information"
        subtitle="Your account details"
        malayalamSubtitle="നിങ്ങളുടെ അക്കൗണ്ട് വിവരങ്ങൾ"
        icon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-blue-700">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        }
        onClick={() => {}}
        ariaLabel="User information section"
        className="!cursor-default mx-2 sm:mx-0"
      >
        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          {/* Name */}
          <div className="flex flex-col space-y-1 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700">Name</label>
            <p className="text-sm sm:text-base text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-lg break-words">
              {user.displayName || 'Not provided'}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1" lang="ml">പേര്</p>
          </div>

          {/* Phone Number */}
          {user.phone && (
            <div className="flex flex-col space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Phone Number</label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-lg break-words">
                {user.phone}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1" lang="ml">ഫോൺ നമ്പർ</p>
            </div>
          )}

          {/* Email */}
          {user.email && (
            <div className="flex flex-col space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-lg break-words overflow-hidden">
                {user.email}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1" lang="ml">ഇമെയിൽ</p>
            </div>
          )}

          {/* User ID */}
          <div className="flex flex-col space-y-1 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700">User ID</label>
            <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 sm:p-3 rounded-lg font-mono break-all overflow-hidden">
              {user.uid}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1" lang="ml">ഉപയോക്തൃ ഐഡി</p>
          </div>
        </div>
      </Card>

      {/* Settings Card */}
      <Card
        title="Settings"
        subtitle="Customize your experience"
        malayalamSubtitle="നിങ്ങളുടെ അനുഭവം ഇഷ്ടാനുസൃതമാക്കുക"
        icon={
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        onClick={() => {}}
        ariaLabel="Settings section"
        className="!cursor-default"
      >
        <div className="mt-4 space-y-4">
          {/* Font Size Setting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900">Font Size</h3>
                <p className="text-sm text-gray-600" lang="ml">ഫോണ്ട് വലുപ്പം</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <FontSizeToggle showLabels={true} />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-medium text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600" lang="ml">അറിയിപ്പുകൾ</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Class Reminders</span>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">New Content Alerts</span>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Exam Reminders</span>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Actions Card */}
      <Card
        title="Account Actions"
        subtitle="Manage your account"
        malayalamSubtitle="നിങ്ങളുടെ അക്കൗണ്ട് കൈകാര്യം ചെയ്യുക"
        icon={
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        onClick={() => {}}
        ariaLabel="Account actions section"
        className="!cursor-default"
      >
        <div className="mt-4 space-y-4">
          {/* Logout Button */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <div className="flex-1">
                <h3 className="text-base font-medium text-red-900 mb-1">Logout</h3>
                <p className="text-sm text-red-700 mb-1" lang="ml">പുറത്തുകടക്കുക</p>
                <p className="text-sm text-red-600 mb-4">
                  Sign out of your account and return to the login page.
                </p>
                <AccessibleButton
                  variant="danger"
                  onClick={handleLogout}
                  ariaLabel="Logout from application"
                  className="!min-h-[48px] w-full"
                  style={{ 
                    backgroundColor: '#dc2626', 
                    color: 'white',
                    border: '2px solid #dc2626'
                  }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </div>
                </AccessibleButton>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};