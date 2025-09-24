import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
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
  type InstallabilityTestResult
} from '../../utils/pwaTestUtils';

/**
 * Comprehensive PWA Test Suite Component
 * Provides UI for testing and validating all PWA functionality
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

interface PWATestResults {
  manifest: ManifestValidationResult;
  serviceWorker: ServiceWorkerTestResult;
  installability: InstallabilityTestResult;
  offline: PWATestResult;
  performance: PWATestResult;
  notifications: PWATestResult;
  timestamp: string;
}

interface TestStatus {
  running: boolean;
  completed: boolean;
  passed: boolean;
  error?: string;
}

interface TestSuiteState {
  [key: string]: TestStatus;
}

export const PWATestSuite: React.FC = () => {
  const [results, setResults] = useState<Partial<PWATestResults>>({});
  const [testStates, setTestStates] = useState<TestSuiteState>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [offlineSimulation, setOfflineSimulation] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Initialize test states
  useEffect(() => {
    const initialStates: TestSuiteState = {
      manifest: { running: false, completed: false, passed: false },
      serviceWorker: { running: false, completed: false, passed: false },
      installability: { running: false, completed: false, passed: false },
      offline: { running: false, completed: false, passed: false },
      performance: { running: false, completed: false, passed: false },
      notifications: { running: false, completed: false, passed: false },
    };
    setTestStates(initialStates);
  }, []);

  const updateTestState = useCallback((testName: string, state: Partial<TestStatus>) => {
    setTestStates(prev => ({
      ...prev,
      [testName]: { ...prev[testName], ...state }
    }));
  }, []);

  const updateResult = useCallback((key: keyof PWATestResults, result: any) => {
    setResults(prev => ({
      ...prev,
      [key]: result,
      timestamp: new Date().toISOString()
    }));
  }, []);

  const runIndividualTest = useCallback(async (
    testName: keyof PWATestResults,
    testFunction: () => Promise<any>
  ) => {
    updateTestState(testName, { running: true, completed: false, error: undefined });
    
    try {
      const result = await testFunction();
      updateResult(testName, result);
      
      const passed = result.isValid !== undefined ? result.isValid : 
                    result.isInstallable !== undefined ? result.isInstallable :
                    result.isRegistered !== undefined ? result.isRegistered :
                    result.passed !== undefined ? result.passed : false;
      
      updateTestState(testName, { 
        running: false, 
        completed: true, 
        passed 
      });
    } catch (error) {
      updateTestState(testName, { 
        running: false, 
        completed: true, 
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [updateResult, updateTestState]);

  const runAllTests = useCallback(async () => {
    setIsRunningAll(true);
    
    try {
      const allResults = await runAllPWATests();
      
      // Update all results
      Object.entries(allResults).forEach(([key, result]) => {
        if (key !== 'timestamp') {
          updateResult(key as keyof PWATestResults, result);
          
          const passed = (result as any).isValid !== undefined ? (result as any).isValid : 
                        (result as any).isInstallable !== undefined ? (result as any).isInstallable :
                        (result as any).isRegistered !== undefined ? (result as any).isRegistered :
                        (result as any).passed !== undefined ? (result as any).passed : false;
          
          updateTestState(key, { 
            running: false, 
            completed: true, 
            passed 
          });
        }
      });
      
      // Test notifications separately
      await runIndividualTest('notifications', testNotifications);
      
    } catch (error) {
      console.error('Error running all PWA tests:', error);
    } finally {
      setIsRunningAll(false);
    }
  }, [runIndividualTest, updateResult, updateTestState]);

  const toggleOfflineSimulation = useCallback(() => {
    const newOfflineState = !offlineSimulation;
    setOfflineSimulation(newOfflineState);
    simulateOfflineMode(newOfflineState);
    
    if (newOfflineState) {
      console.log('🔌 Offline mode simulation enabled');
    } else {
      console.log('🌐 Online mode restored');
    }
  }, [offlineSimulation]);

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

  const getStatusIcon = (testName: string) => {
    const state = testStates[testName];
    if (!state) return '⚪';
    if (state.running) return '🔄';
    if (!state.completed) return '⚪';
    return state.passed ? '✅' : '❌';
  };

  const getStatusColor = (testName: string) => {
    const state = testStates[testName];
    if (!state) return 'text-gray-500';
    if (state.running) return 'text-blue-500';
    if (!state.completed) return 'text-gray-500';
    return state.passed ? 'text-green-600' : 'text-red-600';
  };

  const calculateOverallScore = () => {
    const completedTests = Object.values(testStates).filter(state => state.completed);
    if (completedTests.length === 0) return 0;
    
    const passedTests = completedTests.filter(state => state.passed);
    return Math.round((passedTests.length / completedTests.length) * 100);
  };

  const TestCard: React.FC<{
    title: string;
    testName: string;
    description: string;
    onTest: () => void;
    result?: any;
    requirements: string[];
  }> = ({ title, testName, description, onTest, result, requirements }) => {
    const state = testStates[testName];
    const isExpanded = expandedSections.has(testName);
    
    return (
      <Card className="p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStatusIcon(testName)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onTest}
              disabled={state?.running || isRunningAll}
              variant="outline"
              size="sm"
            >
              {state?.running ? 'Testing...' : 'Test'}
            </Button>
            <Button
              onClick={() => toggleSection(testName)}
              variant="ghost"
              size="sm"
              ariaLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${title} details`}
            >
              {isExpanded ? '▼' : '▶'}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {requirements.map(req => (
            <span 
              key={req}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
            >
              Req {req}
            </span>
          ))}
        </div>
        
        {state?.error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">Error: {state.error}</p>
          </div>
        )}
        
        {isExpanded && result && (
          <div className="mt-3 p-3 bg-gray-50 rounded">
            <h4 className="font-medium text-gray-900 mb-2">Test Results:</h4>
            <pre className="text-xs text-gray-700 overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    );
  };

  const overallScore = calculateOverallScore();
  const completedTests = Object.values(testStates).filter(state => state.completed).length;
  const totalTests = Object.keys(testStates).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          PWA Test Suite
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
          Comprehensive testing and validation of Progressive Web App functionality.
          Test offline capabilities, installation flow, performance, and cross-browser compatibility.
        </p>
        
        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{overallScore}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{completedTests}</div>
              <div className="text-sm text-gray-600">Tests Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-600">{totalTests}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Controls</h2>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={runAllTests}
            disabled={isRunningAll}
            variant="primary"
            ariaLabel="Run all PWA tests"
          >
            {isRunningAll ? 'Running All Tests...' : 'Run All Tests'}
          </Button>
          
          <Button
            onClick={toggleOfflineSimulation}
            variant={offlineSimulation ? "destructive" : "outline"}
            ariaLabel={`${offlineSimulation ? 'Disable' : 'Enable'} offline simulation`}
          >
            {offlineSimulation ? '🔌 Disable Offline Mode' : '🌐 Simulate Offline Mode'}
          </Button>
          
          <Button
            onClick={() => {
              setResults({});
              setTestStates(prev => {
                const reset: TestSuiteState = {};
                Object.keys(prev).forEach(key => {
                  reset[key] = { running: false, completed: false, passed: false };
                });
                return reset;
              });
            }}
            variant="outline"
            ariaLabel="Clear all test results"
          >
            Clear Results
          </Button>
        </div>
        
        {offlineSimulation && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ Offline simulation is active. Network requests will be blocked to test offline functionality.
            </p>
          </div>
        )}
      </Card>

      {/* Test Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TestCard
          title="Manifest Validation"
          testName="manifest"
          description="Validate web app manifest meets PWA requirements"
          onTest={() => runIndividualTest('manifest', testManifestValidation)}
          result={results.manifest}
          requirements={['6.1']}
        />
        
        <TestCard
          title="Service Worker"
          testName="serviceWorker"
          description="Test service worker registration and caching"
          onTest={() => runIndividualTest('serviceWorker', testServiceWorker)}
          result={results.serviceWorker}
          requirements={['6.2']}
        />
        
        <TestCard
          title="Installability"
          testName="installability"
          description="Verify app meets installation criteria"
          onTest={() => runIndividualTest('installability', testInstallability)}
          result={results.installability}
          requirements={['6.3']}
        />
        
        <TestCard
          title="Offline Functionality"
          testName="offline"
          description="Test offline capabilities and caching"
          onTest={() => runIndividualTest('offline', testOfflineFunctionality)}
          result={results.offline}
          requirements={['6.4']}
        />
        
        <TestCard
          title="Performance"
          testName="performance"
          description="Measure PWA performance metrics"
          onTest={() => runIndividualTest('performance', testPWAPerformance)}
          result={results.performance}
          requirements={['6.5']}
        />
        
        <TestCard
          title="Notifications"
          testName="notifications"
          description="Test push notification functionality"
          onTest={() => runIndividualTest('notifications', testNotifications)}
          result={results.notifications}
          requirements={['6.2', '6.3']}
        />
      </div>

      {/* Detailed Results */}
      {results.timestamp && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test Summary
          </h2>
          <div className="text-sm text-gray-600 mb-4">
            Last run: {new Date(results.timestamp).toLocaleString()}
          </div>
          
          <div className="space-y-4">
            {Object.entries(results).map(([key, result]) => {
              if (key === 'timestamp') return null;
              
              const state = testStates[key];
              if (!state?.completed) return null;
              
              return (
                <div key={key} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center space-x-2">
                    <span className={getStatusColor(key)}>
                      {getStatusIcon(key)}
                    </span>
                    <span className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-sm ${getStatusColor(key)}`}>
                      {state.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  
                  {!state.passed && state.error && (
                    <p className="text-sm text-red-600 mt-1">
                      {state.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Testing Guidelines */}
      <Card className="p-6 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Testing Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Manual Testing Steps</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Test installation on different browsers (Chrome, Edge, Firefox)</li>
              <li>• Verify offline functionality by disabling network</li>
              <li>• Test on mobile devices for touch interactions</li>
              <li>• Check app icon appears correctly when installed</li>
              <li>• Verify push notifications work across devices</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Performance Targets</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• First Contentful Paint: &lt; 1.5s</li>
              <li>• DOM Content Loaded: &lt; 2s</li>
              <li>• Cache hit ratio: &gt; 80%</li>
              <li>• Lighthouse PWA score: &gt; 90</li>
              <li>• Install prompt appears within 30s</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};