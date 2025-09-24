import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const NavigationDemo: React.FC = () => {
  const {
    theme,
    userTheme,
    setTheme,
    toggleTheme,
    isHighContrast,
    prefersReducedMotion,
  } = useTheme();

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Navigation Theme Demo
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme Settings
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                userTheme === 'light'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                userTheme === 'dark'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('auto')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                userTheme === 'auto'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={toggleTheme}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
          >
            Toggle Theme
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>
            Current Theme: <span className="font-medium">{theme}</span>
          </div>
          <div>
            User Preference: <span className="font-medium">{userTheme}</span>
          </div>
          <div>
            High Contrast:{' '}
            <span className="font-medium">{isHighContrast ? 'Yes' : 'No'}</span>
          </div>
          <div>
            Reduced Motion:{' '}
            <span className="font-medium">
              {prefersReducedMotion ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div className="border-t pt-4 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enhanced Features
          </h3>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>✓ Smooth sliding indicator animation</li>
            <li>✓ Enhanced color contrast (WCAG AA)</li>
            <li>✓ Improved hover effects for 40+ users</li>
            <li>✓ Light/Dark/Auto theme support</li>
            <li>✓ High contrast mode support</li>
            <li>✓ Reduced motion preferences</li>
            <li>✓ Enhanced touch targets (48px+)</li>
            <li>✓ Better typography and spacing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
