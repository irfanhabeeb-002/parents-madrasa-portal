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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Profile</h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed" lang="ml">പ്രൊഫൈൽ</p>
      </div>

      {/* User Information Card */}
      <Card
        title="User Information"
        subtitle="Your account details"
        malayalamSubtitle="നിങ്ങളുടെ അക്കൗണ്ട് വിവരങ്ങൾ"
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
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 px-1 mt-1 sm:mt-2" lang="ml">പേര്</p>
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
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 px-1 mt-1 sm:mt-2" lang="ml">ഫോൺ നമ്പർ</p>
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
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 px-1 mt-1 sm:mt-2" lang="ml">ഇമെയിൽ</p>
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
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 px-1 mt-1 sm:mt-2" lang="ml">ഉപയോക്തൃ ഐഡി</p>
          </div>
        </div>
      </Card>

      {/* Settings Card */}
      <Card
        title="Settings"
        subtitle="Customize your experience"
        malayalamSubtitle="നിങ്ങളുടെ അനുഭവം ഇഷ്ടാനുസൃതമാക്കുക"
        icon={
          <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        onClick={() => {}}
        ariaLabel="Settings section"
        className="!cursor-default mx-0 sm:mx-0"
      >
        <div className="mt-3 sm:mt-4 lg:mt-6 space-y-4 sm:space-y-6 lg:space-y-8 px-1 sm:px-0">
          {/* Font Size Setting */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Font Size</h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600" lang="ml">ഫോണ്ട് വലുപ്പം</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg min-h-[60px] flex items-center">
              <FontSizeToggle showLabels={true} className="justify-center sm:justify-start w-full" />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Notifications</h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600" lang="ml">അറിയിപ്പുകൾ</p>
            </div>
            <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg space-y-4 sm:space-y-3">
              <div className="flex items-center justify-between py-2 sm:py-1 min-h-[44px]">
                <span className="text-sm sm:text-base lg:text-lg text-gray-700 pr-3 flex-1">Class Reminders</span>
                <button 
                  className="w-12 h-6 bg-blue-600 rounded-full relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[48px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                  aria-label="Toggle class reminders"
                  role="switch"
                  aria-checked="true"
                >
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                  </div>
                </button>
              </div>
              <div className="flex items-center justify-between py-2 sm:py-1 min-h-[44px]">
                <span className="text-sm sm:text-base lg:text-lg text-gray-700 pr-3 flex-1">New Content Alerts</span>
                <button 
                  className="w-12 h-6 bg-blue-600 rounded-full relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[48px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                  aria-label="Toggle new content alerts"
                  role="switch"
                  aria-checked="true"
                >
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                  </div>
                </button>
              </div>
              <div className="flex items-center justify-between py-2 sm:py-1 min-h-[44px]">
                <span className="text-sm sm:text-base lg:text-lg text-gray-700 pr-3 flex-1">Exam Reminders</span>
                <button 
                  className="w-12 h-6 bg-blue-600 rounded-full relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[48px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                  aria-label="Toggle exam reminders"
                  role="switch"
                  aria-checked="true"
                >
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                  </div>
                </button>
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
          <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        onClick={() => {}}
        ariaLabel="Account actions section"
        className="!cursor-default mx-0 sm:mx-0"
      >
        <div className="mt-3 sm:mt-4 lg:mt-6 space-y-4 sm:space-y-6 lg:space-y-8 px-1 sm:px-0">
          {/* Logout Button */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 lg:p-5">
            <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-red-900 mb-1 sm:mb-2">Logout</h3>
                <p className="text-xs sm:text-sm lg:text-base text-red-700 mb-1 sm:mb-2" lang="ml">പുറത്തുകടക്കുക</p>
                <p className="text-xs sm:text-sm lg:text-base text-red-600 mb-3 sm:mb-4 lg:mb-5 leading-relaxed">
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
      </Card>
    </div>
  );
};