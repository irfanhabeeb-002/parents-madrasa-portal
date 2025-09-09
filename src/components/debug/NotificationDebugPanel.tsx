import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { notificationService } from '../../services/notificationService';
import { AccessibleButton } from '../ui/AccessibleButton';
import { NotificationTester } from '../../utils/notificationTester';
import '../../utils/notificationCustomizer';

export const NotificationDebugPanel: React.FC = () => {
    const { notifications, unreadCount, permission, requestPermission } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    };

    const testBrowserNotification = async () => {
        addLog('Testing browser notification...');
        try {
            if (permission.granted) {
                NotificationTester.testBrowserNotification();
                addLog('✅ Browser notification sent');
            } else {
                addLog('❌ Permission not granted');
                const granted = await requestPermission();
                if (granted) {
                    NotificationTester.testBrowserNotification();
                    addLog('✅ Permission granted and notification sent');
                }
            }
        } catch (error) {
            addLog(`❌ Error: ${error}`);
        }
    };

    const testClassReminder = () => {
        addLog('Testing class reminder...');
        notificationService.scheduleClassReminder(
            'debug-class-' + Date.now(),
            'Debug Test Class',
            new Date(Date.now() + 3000) // 3 seconds from now
        );
        addLog('✅ Class reminder scheduled for 3 seconds');
    };

    const testNewContent = () => {
        addLog('Testing new content notification...');
        notificationService.notifyNewRecording(
            'debug-recording-' + Date.now(),
            'Debug Test Recording'
        );
        addLog('✅ New content notification sent');
    };

    const testAnnouncement = () => {
        addLog('Testing announcement...');
        notificationService.notifyAnnouncement(
            'Debug Test Announcement',
            'This is a test announcement from the debug panel',
            'ഡീബഗ് ടെസ്റ്റ് പ്രഖ്യാപനം',
            'ഇത് ഡീബഗ് പാനലിൽ നിന്നുള്ള ഒരു പരീക്ഷണ പ്രഖ്യാപനമാണ്'
        );
        addLog('✅ Announcement sent');
    };

    const clearAllNotifications = () => {
        // Clear notifications (you'll need to implement this in the service)
        addLog('🗑️ Cleared all notifications');
    };

    if (!isVisible) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <AccessibleButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsVisible(true)}
                    ariaLabel="Open notification debug panel"
                    className="bg-yellow-500 text-white hover:bg-yellow-600"
                >
                    🔔 Debug
                </AccessibleButton>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            <div className="bg-yellow-500 text-white p-3 flex justify-between items-center">
                <h3 className="font-semibold">🔔 Notification Debug Panel</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-white hover:text-gray-200"
                    aria-label="Close debug panel"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Status */}
                <div className="text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <strong>Permission:</strong>
                            <span className={`ml-1 ${permission.granted ? 'text-green-600' : 'text-red-600'}`}>
                                {permission.granted ? '✅ Granted' : '❌ Denied'}
                            </span>
                        </div>
                        <div>
                            <strong>Total:</strong> {notifications.length}
                        </div>
                        <div>
                            <strong>Unread:</strong> {unreadCount}
                        </div>
                        <div>
                            <strong>Supported:</strong>
                            <span className={`ml-1 ${permission.supported ? 'text-green-600' : 'text-red-600'}`}>
                                {permission.supported ? '✅ Yes' : '❌ No'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Test Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <AccessibleButton
                        variant="primary"
                        size="sm"
                        onClick={testBrowserNotification}
                        ariaLabel="Test browser notification"
                        className="text-xs"
                    >
                        Browser Test
                    </AccessibleButton>

                    <AccessibleButton
                        variant="primary"
                        size="sm"
                        onClick={testClassReminder}
                        ariaLabel="Test class reminder"
                        className="text-xs"
                    >
                        Class Reminder
                    </AccessibleButton>

                    <AccessibleButton
                        variant="primary"
                        size="sm"
                        onClick={testNewContent}
                        ariaLabel="Test new content notification"
                        className="text-xs"
                    >
                        New Content
                    </AccessibleButton>

                    <AccessibleButton
                        variant="primary"
                        size="sm"
                        onClick={testAnnouncement}
                        ariaLabel="Test announcement"
                        className="text-xs"
                    >
                        Announcement
                    </AccessibleButton>
                </div>

                {/* Advanced Test Buttons */}
                <div className="border-t pt-3">
                    <div className="text-xs font-semibold mb-2">Advanced Tests:</div>
                    <div className="grid grid-cols-2 gap-2">
                        <AccessibleButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                addLog('Testing urgent notification...');
                                (window as any).NotificationCustomizer?.sendCustomNotification(
                                    '🚨 Urgent Test',
                                    'High priority notification',
                                    { priority: 'high', sound: true, vibration: true }
                                );
                            }}
                            className="text-xs"
                        >
                            🚨 Urgent
                        </AccessibleButton>

                        <AccessibleButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                addLog('Testing quiet notification...');
                                (window as any).NotificationCustomizer?.sendCustomNotification(
                                    '🔇 Quiet Test',
                                    'Silent notification',
                                    { priority: 'low', sound: false, autoClose: 3 }
                                );
                            }}
                            className="text-xs"
                        >
                            🔇 Quiet
                        </AccessibleButton>

                        <AccessibleButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                addLog('Testing custom class reminder...');
                                const classTime = new Date(Date.now() + 10000); // 10 seconds
                                (window as any).NotificationCustomizer?.scheduleCustomClassReminder(
                                    'custom-test',
                                    'Custom Test Class',
                                    classTime,
                                    5 // 5 minutes before (but will trigger in 10 seconds for demo)
                                );
                            }}
                            className="text-xs"
                        >
                            ⏰ Custom
                        </AccessibleButton>

                        <AccessibleButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                addLog('Testing notification styles...');
                                (window as any).NotificationCustomizer?.testNotificationStyles();
                            }}
                            className="text-xs"
                        >
                            🎨 Styles
                        </AccessibleButton>
                    </div>
                </div>

                {/* Logs */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <strong className="text-sm">Debug Logs:</strong>
                        <button
                            onClick={() => setLogs([])}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
                        {logs.length === 0 ? (
                            <div className="text-gray-500">No logs yet...</div>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className="mb-1 font-mono">
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Notifications */}
                <div>
                    <strong className="text-sm">Recent Notifications:</strong>
                    <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {notifications.slice(0, 3).map((notif) => (
                            <div key={notif.id} className="text-xs p-2 bg-gray-50 rounded">
                                <div className="font-semibold">[{notif.type}] {notif.title}</div>
                                <div className="text-gray-600 truncate">{notif.message}</div>
                                <div className="text-gray-400">
                                    {notif.timestamp.toLocaleTimeString()} - {notif.read ? 'Read' : 'Unread'}
                                </div>
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <div className="text-xs text-gray-500">No notifications yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};