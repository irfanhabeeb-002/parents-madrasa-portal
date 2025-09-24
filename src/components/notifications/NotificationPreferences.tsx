import React from 'react';
import { NotificationPreferences as NotificationPrefsType } from '../../types/notification';
import { AccessibleButton } from '../ui/AccessibleButton';
import {
  BellIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  SpeakerWaveIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

interface NotificationPreferencesProps {
  preferences: NotificationPrefsType;
  onUpdatePreferences: (preferences: Partial<NotificationPrefsType>) => void;
  permissionGranted: boolean;
  onRequestPermission: () => Promise<boolean>;
  className?: string;
}

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onChange,
  disabled = false,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${enabled ? 'bg-primary-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
};

export const NotificationPreferences: React.FC<
  NotificationPreferencesProps
> = ({
  preferences,
  onUpdatePreferences,
  permissionGranted,
  onRequestPermission,
  className = '',
}) => {
  const handleToggle = (key: keyof NotificationPrefsType) => {
    onUpdatePreferences({ [key]: !preferences[key] });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {!permissionGranted && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <BellIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Enable Notifications
              </h3>
              <p className="text-sm text-yellow-700 mt-2">
                Allow notifications to receive class reminders and important
                updates.
              </p>
              <div className="mt-3">
                <AccessibleButton
                  variant="primary"
                  size="sm"
                  onClick={onRequestPermission}
                  ariaLabel="Enable notifications"
                >
                  Enable Notifications
                </AccessibleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notification Types
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3 flex-1">
              <BellIcon className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Class Reminders
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get notified 15 minutes before your class starts
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.classReminders}
              onChange={() => handleToggle('classReminders')}
              disabled={!permissionGranted}
              ariaLabel="Toggle class reminder notifications"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3 flex-1">
              <DocumentTextIcon className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  New Content
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Notifications for new recordings, notes, and exercises
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.newContent}
              onChange={() => handleToggle('newContent')}
              disabled={!permissionGranted}
              ariaLabel="Toggle new content notifications"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3 flex-1">
              <AcademicCapIcon className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Exam Reminders
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get reminded about upcoming exams and tests
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.examReminders}
              onChange={() => handleToggle('examReminders')}
              disabled={!permissionGranted}
              ariaLabel="Toggle exam reminder notifications"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3 flex-1">
              <SpeakerWaveIcon className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Announcements
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Important announcements from the madrasa
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.announcements}
              onChange={() => handleToggle('announcements')}
              disabled={!permissionGranted}
              ariaLabel="Toggle announcement notifications"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Device Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3 flex-1">
              <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Vibration</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Vibrate device for notifications
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.vibration}
              onChange={() => handleToggle('vibration')}
              disabled={!permissionGranted}
              ariaLabel="Toggle vibration"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3 flex-1">
              <SpeakerWaveIcon className="w-5 h-5 text-gray-600 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Sound</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Play sound for notifications
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={preferences.sound}
              onChange={() => handleToggle('sound')}
              disabled={!permissionGranted}
              ariaLabel="Toggle sound"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
