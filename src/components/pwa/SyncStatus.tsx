import React, { useState, useEffect } from 'react';
import { useOfflineQueue } from '../../services/offlineQueue';
import { AccessibleButton } from '../ui/AccessibleButton';
import { Modal } from '../ui/Modal';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  className = '',
  showDetails = false,
}) => {
  const { queueStats, isOnline, processQueue, clearQueue } = useOfflineQueue();
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSync = async () => {
    if (!isOnline) return;

    setIsProcessing(true);
    try {
      await processQueue();
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearQueue = () => {
    clearQueue();
    setShowModal(false);
  };

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600';
    if (queueStats.totalItems > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (queueStats.totalItems > 0) return `${queueStats.totalItems} pending`;
    return 'Synced';
  };

  const getStatusTextMalayalam = () => {
    if (!isOnline) return 'ഓഫ്‌ലൈൻ';
    if (queueStats.totalItems > 0)
      return `${queueStats.totalItems} കാത്തിരിക്കുന്നു`;
    return 'സിങ്ക് ചെയ്തു';
  };

  if (!showDetails && queueStats.totalItems === 0 && isOnline) {
    return null; // Don't show when everything is synced
  }

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Status Indicator */}
        <div className="flex items-center space-x-1">
          <div
            className={`w-2 h-2 rounded-full ${
              !isOnline
                ? 'bg-red-500'
                : queueStats.totalItems > 0
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-green-500'
            }`}
            aria-hidden="true"
          />
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Sync Button */}
        {isOnline && queueStats.totalItems > 0 && (
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={handleSync}
            disabled={isProcessing}
            ariaLabel="Sync pending data"
            className="text-xs px-2 py-1"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                <span>Syncing...</span>
              </div>
            ) : (
              'Sync'
            )}
          </AccessibleButton>
        )}

        {/* Details Button */}
        {showDetails && queueStats.totalItems > 0 && (
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={() => setShowModal(true)}
            ariaLabel="View sync details"
            className="text-xs px-2 py-1"
          >
            Details
          </AccessibleButton>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Sync Status"
        size="md"
      >
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Connection Status</h3>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {isOnline ? 'Connected to internet' : 'No internet connection'}
            </p>
            <p className="text-xs text-gray-500 mt-1" lang="ml">
              {isOnline
                ? 'ഇന്റർനെറ്റിലേക്ക് കണക്റ്റ് ചെയ്തു'
                : 'ഇന്റർനെറ്റ് കണക്ഷൻ ഇല്ല'}
            </p>
          </div>

          {/* Queue Statistics */}
          {queueStats.totalItems > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-3">
                Pending Items
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-800">Total items:</span>
                  <span className="font-medium">{queueStats.totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-800">Failed items:</span>
                  <span className="font-medium">{queueStats.failedItems}</span>
                </div>
                {queueStats.oldestItem && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-800">Oldest item:</span>
                    <span className="font-medium text-xs">
                      {formatTimestamp(queueStats.oldestItem)}
                    </span>
                  </div>
                )}
              </div>

              {/* Items by Type */}
              {Object.keys(queueStats.itemsByType).length > 0 && (
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">
                    By Type:
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(queueStats.itemsByType).map(
                      ([type, count]) => (
                        <div
                          key={type}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-yellow-800 capitalize">
                            {type.replace('-', ' ')}:
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Pending Items */}
          {queueStats.totalItems === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-600 mb-2">
                <svg
                  className="w-8 h-8 mx-auto"
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
              </div>
              <h3 className="font-medium text-green-900 mb-1">All Synced</h3>
              <p className="text-sm text-green-700">
                All data has been synchronized successfully
              </p>
              <p className="text-xs text-green-600 mt-1" lang="ml">
                എല്ലാ ഡാറ്റയും വിജയകരമായി സിങ്ക്രൊണൈസ് ചെയ്തു
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            {isOnline && queueStats.totalItems > 0 && (
              <AccessibleButton
                variant="primary"
                onClick={handleSync}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Syncing...</span>
                  </div>
                ) : (
                  'Sync Now'
                )}
              </AccessibleButton>
            )}

            {queueStats.totalItems > 0 && (
              <AccessibleButton
                variant="secondary"
                onClick={handleClearQueue}
                className="flex-1"
              >
                Clear Queue
              </AccessibleButton>
            )}

            <AccessibleButton
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Close
            </AccessibleButton>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
            <p>
              <strong>Note:</strong> Data will be automatically synced when
              you're back online. Pending items are stored locally and will not
              be lost.
            </p>
            <p lang="ml" className="mt-1">
              <strong>കുറിപ്പ്:</strong> നിങ്ങൾ വീണ്ടും ഓൺലൈനിൽ വരുമ്പോൾ ഡാറ്റ
              സ്വയമേവ സിങ്ക് ചെയ്യപ്പെടും.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Compact sync status for header/footer
export const CompactSyncStatus: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { queueStats, isOnline } = useOfflineQueue();

  if (queueStats.totalItems === 0 && isOnline) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          !isOnline
            ? 'bg-red-500'
            : queueStats.totalItems > 0
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-green-500'
        }`}
        aria-hidden="true"
      />
      {queueStats.totalItems > 0 && (
        <span className="text-xs text-gray-600">{queueStats.totalItems}</span>
      )}
    </div>
  );
};
