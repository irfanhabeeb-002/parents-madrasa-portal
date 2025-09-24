import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { AccessibleButton } from '../ui/AccessibleButton';

interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  className = '',
}) => {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  const settingsConfig = [
    {
      key: 'highContrast' as const,
      label: 'High Contrast Mode',
      malayalamLabel: 'ഉയർന്ന കോൺട്രാസ്റ്റ് മോഡ്',
      description: 'Increases contrast for better visibility',
      malayalamDescription:
        'മികച്ച ദൃശ്യതയ്ക്കായി കോൺട്രാസ്റ്റ് വർദ്ധിപ്പിക്കുന്നു',
    },
    {
      key: 'reducedMotion' as const,
      label: 'Reduce Motion',
      malayalamLabel: 'ചലനം കുറയ്ക്കുക',
      description: 'Minimizes animations and transitions',
      malayalamDescription: 'ആനിമേഷനുകളും ട്രാൻസിഷനുകളും കുറയ്ക്കുന്നു',
    },
    {
      key: 'keyboardNavigation' as const,
      label: 'Enhanced Keyboard Navigation',
      malayalamLabel: 'മെച്ചപ്പെട്ട കീബോർഡ് നാവിഗേഷൻ',
      description: 'Shows visible focus indicators',
      malayalamDescription: 'ദൃശ്യമായ ഫോക്കസ് സൂചകങ്ങൾ കാണിക്കുന്നു',
    },
    {
      key: 'screenReaderOptimized' as const,
      label: 'Screen Reader Optimization',
      malayalamLabel: 'സ്ക്രീൻ റീഡർ ഒപ്റ്റിമൈസേഷൻ',
      description: 'Optimizes content for screen readers',
      malayalamDescription:
        'സ്ക്രീൻ റീഡറുകൾക്കായി ഉള്ളടക്കം ഒപ്റ്റിമൈസ് ചെയ്യുന്നു',
    },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Accessibility Settings
        </h2>
        <p className="text-gray-600 text-sm" lang="ml">
          പ്രവേശനക്ഷമത ക്രമീകരണങ്ങൾ
        </p>
      </div>

      <div className="space-y-6">
        {settingsConfig.map(setting => (
          <div key={setting.key} className="flex items-start space-x-4">
            <div className="flex-shrink-0 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings[setting.key]}
                  onChange={e => updateSetting(setting.key, e.target.checked)}
                  aria-describedby={`${setting.key}-description`}
                />
                <div
                  className={`
                    w-11 h-6 rounded-full transition-colors duration-200 ease-in-out
                    ${settings[setting.key] ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out
                      ${
                        settings[setting.key]
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }
                    `}
                    style={{ marginTop: '2px', marginLeft: '2px' }}
                  />
                </div>
                <span className="sr-only">
                  {settings[setting.key] ? 'Disable' : 'Enable'} {setting.label}
                </span>
              </label>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {setting.label}
              </div>
              <div className="text-xs text-gray-600 mt-1" lang="ml">
                {setting.malayalamLabel}
              </div>
              <div
                id={`${setting.key}-description`}
                className="text-sm text-gray-500 mt-2"
              >
                {setting.description}
              </div>
              <div className="text-xs text-gray-400 mt-1" lang="ml">
                {setting.malayalamDescription}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <AccessibleButton
          variant="secondary"
          size="sm"
          onClick={resetSettings}
          ariaLabel="Reset all accessibility settings to default"
          className="w-full"
        >
          <span>Reset to Defaults</span>
          <span className="block text-xs opacity-75 mt-1" lang="ml">
            ഡിഫോൾട്ടിലേക്ക് പുനഃസജ്ജമാക്കുക
          </span>
        </AccessibleButton>
      </div>
    </div>
  );
};
