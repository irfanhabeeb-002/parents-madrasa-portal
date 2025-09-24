import React from 'react';
import { PWAVerificationChecklist } from '../components/pwa/PWAVerificationChecklist';
import { Layout } from '../components/layout/Layout';

/**
 * PWA Test Page - Development utility for testing PWA functionality
 * This page should only be accessible in development mode
 */
export const PWATestPage: React.FC = () => {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Page Not Available
            </h1>
            <p className="text-gray-600">
              This page is only available in development mode.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              PWA Development Testing
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              This page provides comprehensive testing tools for Progressive Web
              App functionality. Use these tools to verify that all PWA features
              are working correctly during development.
            </p>

            {/* Development Notice */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-yellow-800">
                    Development Mode Only
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This page is only accessible during development and will not
                    be available in production.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PWA Verification Checklist */}
          <PWAVerificationChecklist />

          {/* Additional Development Information */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🛠️ Development Guidelines
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Testing Checklist
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Run all PWA tests and ensure they pass
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Test offline functionality by simulating network failures
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Verify install prompt appears on supported browsers
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Test app installation and standalone mode
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Validate manifest.json and service worker registration
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Check notification permissions and functionality
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Build Commands
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded p-3">
                    <code className="text-sm text-gray-800">
                      npm run build:pwa
                    </code>
                    <p className="text-xs text-gray-600 mt-1">
                      Build with PWA validation
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <code className="text-sm text-gray-800">
                      npm run build:pwa:full
                    </code>
                    <p className="text-xs text-gray-600 mt-1">
                      Build with PWA validation and Lighthouse audit
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <code className="text-sm text-gray-800">
                      npm run test:pwa
                    </code>
                    <p className="text-xs text-gray-600 mt-1">
                      Run PWA-specific unit tests
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <code className="text-sm text-gray-800">
                      npm run lighthouse:pwa
                    </code>
                    <p className="text-xs text-gray-600 mt-1">
                      Run Lighthouse PWA audit only
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Browser Testing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 rounded p-3">
                  <h4 className="font-medium text-blue-900">Chrome/Edge</h4>
                  <p className="text-blue-700 mt-1">
                    Full PWA support including install prompt and notifications
                  </p>
                </div>
                <div className="bg-orange-50 rounded p-3">
                  <h4 className="font-medium text-orange-900">Firefox</h4>
                  <p className="text-orange-700 mt-1">
                    Service worker and manifest support, limited install
                    features
                  </p>
                </div>
                <div className="bg-purple-50 rounded p-3">
                  <h4 className="font-medium text-purple-900">Safari</h4>
                  <p className="text-purple-700 mt-1">
                    Basic PWA support, focus on web app meta tags
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
