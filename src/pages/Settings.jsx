import React from 'react';
import { Layout } from '../components/layout';
import { FontSizeToggle } from '../components/ui/FontSizeToggle';

const Settings = () => {
  return (
    <Layout 
      showBackButton={true}
      title="Settings"
      showBottomNav={true}
    >
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
          
          <div className="space-y-6">
            {/* Font Size Settings - Essential feature moved from hamburger menu */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Display</h2>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="font-medium text-gray-900 mb-2">Font Size</div>
                <div className="text-sm text-gray-500 mb-4">Adjust the font size for better readability</div>
                <FontSizeToggle showLabels={false} />
              </div>
            </div>

            {/* Account Settings - Essential features only */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account</h2>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Profile Information</div>
                  <div className="text-sm text-gray-500">Update your personal details</div>
                </button>
              </div>
            </div>

            {/* Notifications - Simplified to essential only */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h2>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Notification Preferences</div>
                  <div className="text-sm text-gray-500">Manage your notification settings</div>
                </button>
              </div>
            </div>

            {/* Support - Essential help options only */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Support</h2>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Help & Support</div>
                  <div className="text-sm text-gray-500">Get help and contact support</div>
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