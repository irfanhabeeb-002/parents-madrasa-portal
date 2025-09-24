import React from 'react';
import { UpdateNotification, ManualUpdateTrigger } from './UpdateNotification';
import { useServiceWorkerUpdate } from '../../hooks/useServiceWorkerUpdate';

/**
 * Example component demonstrating PWA update notification functionality
 * This shows how to integrate update notifications in different scenarios
 */
export const UpdateNotificationExample: React.FC = () => {
  const {
    updateAvailable,
    isUpdating,
    updateError,
    offlineReady,
  } = useServiceWorkerUpdate();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          PWA Update System Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This demonstrates the PWA update notification system with automatic detection
          and manual update triggers.
        </p>

        {/* Status Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Current Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Update Available:</span>
              <span className={updateAvailable ? 'text-green-600' : 'text-gray-500'}>
                {updateAvailable ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Updating:</span>
              <span className={isUpdating ? 'text-blue-600' : 'text-gray-500'}>
                {isUpdating ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Offline Ready:</span>
              <span className={offlineReady ? 'text-green-600' : 'text-gray-500'}>
                {offlineReady ? 'Yes' : 'No'}
              </span>
            </div>
            {updateError && (
              <div className="flex justify-between">
                <span>Error:</span>
                <span className="text-red-600 text-xs">{updateError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Manual Update Triggers */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Manual Update Controls</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">Button Style</h4>
              <ManualUpdateTrigger 
                variant="button"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md"
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">Menu Item Style</h4>
              <div className="border border-gray-200 rounded-md">
                <ManualUpdateTrigger 
                  variant="menu-item"
                  className="hover:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How to Test</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Deploy a new version of the app to trigger update detection</li>
            <li>• Use the manual update buttons to check for updates</li>
            <li>• The automatic notification will appear when updates are available</li>
            <li>• Updates can be dismissed and will reappear after 5 minutes</li>
          </ul>
        </div>
      </div>

      {/* The actual update notification component */}
      <UpdateNotification />
    </div>
  );
};