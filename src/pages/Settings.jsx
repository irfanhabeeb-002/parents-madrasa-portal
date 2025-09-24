import React from 'react';
import { Layout } from '../components/layout';
import { FontSizeToggle } from '../components/ui/FontSizeToggle';
import { ManualUpdateTrigger, InstallButton } from '../components/pwa';
import { INSTALL_LOCALIZATION } from '../constants/installLocalization';

const Settings = () => {
  return (
    <Layout showBackButton={true} title="Settings" showBottomNav={true}>
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          <div className="space-y-6">
            {/* Font Size Settings - Essential feature moved from hamburger menu */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Display
              </h2>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="font-medium text-gray-900 mb-2">Font Size</div>
                <div className="text-sm text-gray-500 mb-4">
                  Adjust the font size for better readability
                </div>
                <FontSizeToggle showLabels={false} />
              </div>
            </div>

            {/* Account Settings - Essential features only */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Account
              </h2>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">
                    Profile Information
                  </div>
                  <div className="text-sm text-gray-500">
                    Update your personal details
                  </div>
                </button>
              </div>
            </div>

            {/* Notifications - Simplified to essential only */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Notifications
              </h2>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">
                    Notification Preferences
                  </div>
                  <div className="text-sm text-gray-500">
                    Manage your notification settings
                  </div>
                </button>
              </div>
            </div>

            {/* App Installation - PWA install functionality */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                App Installation
              </h2>
              <div className="space-y-2">
                <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-blue-600 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-2">
                        {INSTALL_LOCALIZATION.english.buttonText}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {INSTALL_LOCALIZATION.english.description}
                      </div>
                      <div className="text-xs text-gray-500 mb-4" lang="ml">
                        {INSTALL_LOCALIZATION.malayalam.description}
                      </div>

                      {/* Benefits list */}
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-700 mb-2">
                          Benefits:
                        </div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {INSTALL_LOCALIZATION.english.benefits.map(
                            (benefit, index) => (
                              <li key={index} className="flex items-center">
                                <svg
                                  className="w-3 h-3 text-green-500 mr-2"
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
                                {benefit}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <InstallButton
                        variant="primary"
                        size="md"
                        source="settings_page"
                        placement="settings"
                        fallbackBehavior="show-message"
                        className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                        showIcon={true}
                        showLoadingState={true}
                        showErrorState={true}
                        onInstallStart={() =>
                          console.log('Install started from settings')
                        }
                        onInstallComplete={success => {
                          if (success) {
                            console.log(
                              'Install completed successfully from settings'
                            );
                          } else {
                            console.log(
                              'Install failed or was cancelled from settings'
                            );
                          }
                        }}
                      ></InstallButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* App Updates - PWA update functionality */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                App Updates
              </h2>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-gray-200">
                  <div className="font-medium text-gray-900 mb-2">
                    Check for Updates
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    Keep your app up to date with the latest features and
                    improvements
                  </div>
                  <ManualUpdateTrigger
                    variant="menu-item"
                    className="!p-2 !text-sm rounded-md border border-gray-300 hover:border-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Support - Essential help options only */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Support
              </h2>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">
                    Help & Support
                  </div>
                  <div className="text-sm text-gray-500">
                    Get help and contact support
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
