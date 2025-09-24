import React from 'react';
import { 
  OfflineIndicator, 
  NetworkStatus, 
  OfflineGracefulFallback, 
  SlowConnectionWarning 
} from './index';
import { useOnlineStatus, useOfflineGracefulDegradation } from '../../hooks/useOnlineStatus';

/**
 * Example component demonstrating online/offline state management features
 * This shows how to integrate the PWA offline functionality into your app
 */
export const OfflineStateExample: React.FC = () => {
  const { isOnline, isSlowConnection, retryConnection } = useOnlineStatus();
  const { addOfflineAction, offlineActions } = useOfflineGracefulDegradation();

  const handleOfflineAction = () => {
    addOfflineAction('User attempted to submit form while offline');
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Online/Offline State Management Demo
      </h2>
      
      {/* Global offline indicator */}
      <OfflineIndicator 
        showConnectionQuality={true}
        showQueueStatus={true}
      />
      
      {/* Slow connection warning */}
      <SlowConnectionWarning />
      
      {/* Network status display */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">Network Status</h3>
        <NetworkStatus showConnectionType={true} />
        
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600">
            Connection Status: <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </p>
          {isSlowConnection && (
            <p className="text-sm text-yellow-600">
              ⚠️ Slow connection detected - some features may be limited
            </p>
          )}
          <button
            onClick={retryConnection}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* Feature that requires internet */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">Live Class Feature</h3>
        <OfflineGracefulFallback 
          feature="live-class"
          fallbackContent={
            <div className="text-center py-4">
              <p className="text-gray-600">
                📚 You can still access downloaded materials and notes while offline
              </p>
            </div>
          }
        >
          <div className="text-center py-8 bg-green-50 rounded">
            <p className="text-green-800">
              🎥 Live class is available! Join now to participate.
            </p>
            <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Join Live Class
            </button>
          </div>
        </OfflineGracefulFallback>
      </div>

      {/* Feature that works offline */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">Notes & Exercises</h3>
        <div className="text-center py-4 bg-blue-50 rounded">
          <p className="text-blue-800">
            📝 Access your downloaded notes and practice exercises
          </p>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            View Notes
          </button>
        </div>
      </div>

      {/* Form with offline handling */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">Submit Assignment</h3>
        <OfflineGracefulFallback 
          feature="file-upload"
          fallbackContent={
            <div className="text-center py-4">
              <p className="text-gray-600">
                💾 Your work will be saved locally and uploaded when you're back online
              </p>
              <button
                onClick={handleOfflineAction}
                className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Save Offline
              </button>
            </div>
          }
        >
          <form className="space-y-4">
            <textarea
              className="w-full p-2 border rounded"
              placeholder="Enter your assignment..."
              rows={4}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Assignment
            </button>
          </form>
        </OfflineGracefulFallback>
      </div>

      {/* Offline actions log */}
      {offlineActions.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800">
            Offline Actions Log
          </h3>
          <ul className="space-y-1">
            {offlineActions.map((action, index) => (
              <li key={index} className="text-sm text-yellow-700">
                • {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Usage instructions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">How to Test</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Open browser developer tools (F12)</li>
          <li>Go to Network tab and set to "Offline" to simulate offline state</li>
          <li>Observe how different features behave when offline</li>
          <li>Set back to "Online" to see reconnection behavior</li>
          <li>Try "Slow 3G" to test slow connection warnings</li>
        </ol>
      </div>
    </div>
  );
};