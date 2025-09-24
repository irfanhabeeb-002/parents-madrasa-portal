import React, { useState, useEffect, useCallback } from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { Card } from '../ui/Card';
import {
  runAllPWATests,
  testManifestValidation,
  testServiceWorker,
  testInstallability,
  testOfflineFunctionality,
  testPWAPerformance,
  testNotifications,
  simulateOfflineMode,
  type PWATestResult,
  type ManifestValidationResult,
  type ServiceWorkerTestResult,
  type InstallabilityTestResult,
} from '../../utils/pwaTestUtils';

interface PWATestResults {
  manifest: ManifestValidationResult;
  serviceWorker: ServiceWorkerTestResult;
  installability: InstallabilityTestResult;
  offline: PWATestResult;
  performance: PWATestResult;
  notifications: PWATestResult;
  timestamp: string;
}

interface ChecklistItemProps {
  title: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: any;
  onTest?: () => Promise<void>;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  title,
  description,
  status,
  details,
  onTest,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'passed':
        return (
          <svg
            className="w-5 h-5 text-green-600"
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
        );
      case 'failed':
        return (
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'running':
        return (
          <svg
            className="w-5 h-5 text-blue-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'passed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{description}</p>

            {details && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  View Details
                </summary>
                <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        {onTest && (
          <AccessibleButton
            onClick={onTest}
            size="sm"
            variant="secondary"
            disabled={status === 'running'}
            className="ml-3 flex-shrink-0"
            ariaLabel={`Test ${title}`}
          >
            {status === 'running' ? 'Testing...' : 'Test'}
          </AccessibleButton>
        )}
      </div>
    </div>
  );
};

export const PWAVerificationChecklist: React.FC = () => {
  const [results, setResults] = useState<Partial<PWATestResults>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [offlineSimulation, setOfflineSimulation] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const updateResult = useCallback((key: keyof PWATestResults, result: any) => {
    setResults(prev => ({
      ...prev,
      [key]: result,
      timestamp: new Date().toISOString(),
    }));
  }, []);

  const runIndividualTest = useCallback(
    async (
      testName: keyof PWATestResults,
      testFunction: () => Promise<any>
    ) => {
      updateResult(testName, { status: 'running' });

      try {
        const result = await testFunction();
        updateResult(testName, result);
      } catch (error) {
        updateResult(testName, {
          passed: false,
          message: `Test failed: ${error}`,
          error,
        });
      }
    },
    [updateResult]
  );

  const runAllTests = useCallback(async () => {
    setIsRunningAll(true);

    try {
      const allResults = await runAllPWATests();

      // Also test notifications separately
      const notificationResult = await testNotifications();

      setResults({
        ...allResults,
        notifications: notificationResult,
      });
    } catch (error) {
      console.error('Failed to run all tests:', error);
    } finally {
      setIsRunningAll(false);
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const toggleOfflineSimulation = useCallback(() => {
    const newState = !offlineSimulation;
    setOfflineSimulation(newState);
    simulateOfflineMode(newState);
  }, [offlineSimulation]);

  // Auto-run tests on component mount
  useEffect(() => {
    runAllTests();
  }, [runAllTests]);

  const getOverallStatus = () => {
    const testResults = [
      results.manifest,
      results.serviceWorker,
      results.installability,
      results.offline,
      results.performance,
      results.notifications,
    ];

    const completedTests = testResults.filter(
      result => result && result !== 'running'
    );
    const passedTests = completedTests.filter(
      result =>
        result &&
        (result.passed ||
          result.isValid ||
          result.isInstallable ||
          result.isRegistered)
    );

    return {
      total: testResults.length,
      completed: completedTests.length,
      passed: passedTests.length,
      percentage:
        completedTests.length > 0
          ? Math.round((passedTests.length / completedTests.length) * 100)
          : 0,
    };
  };

  const status = getOverallStatus();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          PWA Verification Checklist
        </h2>
        <p className="text-gray-600 mb-4">
          Comprehensive testing for Progressive Web App functionality
        </p>

        {/* Overall Status */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Status
            </span>
            <span className="text-sm text-gray-500">
              {status.passed}/{status.completed} tests passed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {status.percentage}% PWA compliance
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <AccessibleButton
            onClick={runAllTests}
            disabled={isRunningAll}
            variant="primary"
            ariaLabel="Run all PWA tests"
          >
            {isRunningAll ? 'Running Tests...' : 'Run All Tests'}
          </AccessibleButton>

          <AccessibleButton
            onClick={toggleOfflineSimulation}
            variant="secondary"
            className={offlineSimulation ? 'bg-orange-100 text-orange-800' : ''}
            ariaLabel={`${offlineSimulation ? 'Disable' : 'Enable'} offline simulation for testing`}
          >
            {offlineSimulation
              ? '🔌 Disable Offline Mode'
              : '📱 Simulate Offline'}
          </AccessibleButton>
        </div>
      </div>

      {/* Test Categories */}
      <div className="space-y-6">
        {/* Manifest Tests */}
        <Card className="p-6">
          <button
            onClick={() => toggleSection('manifest')}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={expandedSections.has('manifest')}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              📄 Web App Manifest
            </h3>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                expandedSections.has('manifest') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedSections.has('manifest') && (
            <div className="mt-4 space-y-3">
              <ChecklistItem
                title="Manifest Validation"
                description="Validates manifest.json structure and required fields"
                status={
                  !results.manifest
                    ? 'pending'
                    : results.manifest === 'running'
                      ? 'running'
                      : results.manifest.isValid
                        ? 'passed'
                        : 'failed'
                }
                details={results.manifest}
                onTest={() =>
                  runIndividualTest('manifest', testManifestValidation)
                }
              />
            </div>
          )}
        </Card>

        {/* Service Worker Tests */}
        <Card className="p-6">
          <button
            onClick={() => toggleSection('serviceWorker')}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={expandedSections.has('serviceWorker')}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              ⚙️ Service Worker
            </h3>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                expandedSections.has('serviceWorker') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedSections.has('serviceWorker') && (
            <div className="mt-4 space-y-3">
              <ChecklistItem
                title="Service Worker Registration"
                description="Checks if service worker is properly registered and active"
                status={
                  !results.serviceWorker
                    ? 'pending'
                    : results.serviceWorker === 'running'
                      ? 'running'
                      : results.serviceWorker.isRegistered
                        ? 'passed'
                        : 'failed'
                }
                details={results.serviceWorker}
                onTest={() =>
                  runIndividualTest('serviceWorker', testServiceWorker)
                }
              />
            </div>
          )}
        </Card>

        {/* Installability Tests */}
        <Card className="p-6">
          <button
            onClick={() => toggleSection('installability')}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={expandedSections.has('installability')}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              📱 App Installability
            </h3>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                expandedSections.has('installability') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedSections.has('installability') && (
            <div className="mt-4 space-y-3">
              <ChecklistItem
                title="Install Criteria"
                description="Verifies all requirements for app installation are met"
                status={
                  !results.installability
                    ? 'pending'
                    : results.installability === 'running'
                      ? 'running'
                      : results.installability.isInstallable
                        ? 'passed'
                        : 'failed'
                }
                details={results.installability}
                onTest={() =>
                  runIndividualTest('installability', testInstallability)
                }
              />
            </div>
          )}
        </Card>

        {/* Offline Functionality Tests */}
        <Card className="p-6">
          <button
            onClick={() => toggleSection('offline')}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={expandedSections.has('offline')}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              🔌 Offline Functionality
            </h3>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                expandedSections.has('offline') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedSections.has('offline') && (
            <div className="mt-4 space-y-3">
              <ChecklistItem
                title="Cache Functionality"
                description="Tests if essential resources are cached for offline use"
                status={
                  !results.offline
                    ? 'pending'
                    : results.offline === 'running'
                      ? 'running'
                      : results.offline.passed
                        ? 'passed'
                        : 'failed'
                }
                details={results.offline}
                onTest={() =>
                  runIndividualTest('offline', testOfflineFunctionality)
                }
              />
            </div>
          )}
        </Card>

        {/* Performance Tests */}
        <Card className="p-6">
          <button
            onClick={() => toggleSection('performance')}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={expandedSections.has('performance')}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              ⚡ Performance
            </h3>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                expandedSections.has('performance') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedSections.has('performance') && (
            <div className="mt-4 space-y-3">
              <ChecklistItem
                title="Performance Metrics"
                description="Measures key performance indicators for PWA"
                status={
                  !results.performance
                    ? 'pending'
                    : results.performance === 'running'
                      ? 'running'
                      : results.performance.passed
                        ? 'passed'
                        : 'failed'
                }
                details={results.performance}
                onTest={() =>
                  runIndividualTest('performance', testPWAPerformance)
                }
              />
            </div>
          )}
        </Card>

        {/* Notifications Tests */}
        <Card className="p-6">
          <button
            onClick={() => toggleSection('notifications')}
            className="w-full flex items-center justify-between text-left"
            aria-expanded={expandedSections.has('notifications')}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              🔔 Notifications
            </h3>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                expandedSections.has('notifications') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedSections.has('notifications') && (
            <div className="mt-4 space-y-3">
              <ChecklistItem
                title="Push Notifications"
                description="Tests notification permissions and functionality"
                status={
                  !results.notifications
                    ? 'pending'
                    : results.notifications === 'running'
                      ? 'running'
                      : results.notifications.passed
                        ? 'passed'
                        : 'failed'
                }
                details={results.notifications}
                onTest={() =>
                  runIndividualTest('notifications', testNotifications)
                }
              />
            </div>
          )}
        </Card>
      </div>

      {/* Development Tools */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            🛠️ Development Tools
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Offline Simulation
                </p>
                <p className="text-xs text-yellow-600">
                  Simulates network failures to test offline functionality
                </p>
              </div>
              <AccessibleButton
                onClick={toggleOfflineSimulation}
                size="sm"
                variant={offlineSimulation ? 'primary' : 'secondary'}
                className={
                  offlineSimulation ? 'bg-orange-600 hover:bg-orange-700' : ''
                }
              >
                {offlineSimulation ? 'Enabled' : 'Disabled'}
              </AccessibleButton>
            </div>
          </div>
        </Card>
      )}

      {/* Results Summary */}
      {results.timestamp && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Test Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Last Run</p>
              <p className="text-gray-600">
                {new Date(results.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Tests Passed</p>
              <p className="text-gray-600">
                {status.passed} of {status.total}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">PWA Score</p>
              <p
                className={`font-bold ${
                  status.percentage >= 90
                    ? 'text-green-600'
                    : status.percentage >= 70
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {status.percentage}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
