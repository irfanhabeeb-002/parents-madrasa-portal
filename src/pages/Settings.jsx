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
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Account Settings</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Profile Information</div>
                  <div className="text-sm text-gray-500">Update your personal details</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Change Password</div>
                  <div className="text-sm text-gray-500">Update your account password</div>
                </button>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Notifications</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Push Notifications</div>
                  <div className="text-sm text-gray-500">Manage notification preferences</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Email Notifications</div>
                  <div className="text-sm text-gray-500">Configure email alerts</div>
                </button>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Accessibility</h2>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="font-medium text-gray-900 mb-3">Font Size</div>
                  <div className="text-sm text-gray-500 mb-4">Adjust the font size for better readability</div>
                  <FontSizeToggle showLabels={true} />
                </div>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Display Settings</div>
                  <div className="text-sm text-gray-500">Contrast and theme preferences</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Language</div>
                  <div className="text-sm text-gray-500">Choose your preferred language</div>
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Support</h2>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Help & Support</div>
                  <div className="text-sm text-gray-500">Get help and contact support</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">About</div>
                  <div className="text-sm text-gray-500">App version and information</div>
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