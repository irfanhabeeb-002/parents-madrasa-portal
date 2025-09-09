import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { Modal } from '../ui/Modal';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  className?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (iOS)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for PWA mode (Android)
      const isPWA = window.navigator.standalone === true;
      
      setIsInstalled(isStandalone || isPWA);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      
      // Show install banner after a delay (don't be too aggressive)
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallBanner(true);
        }
      }, 30000); // Show after 30 seconds
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setShowInstallModal(false);
      setDeferredPrompt(null);
      
      // Show success message
      console.log('PWA was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallModal(false);
      setShowInstallBanner(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    // Don't show again for this session
    sessionStorage.setItem('installBannerDismissed', 'true');
  };

  const handleShowModal = () => {
    setShowInstallModal(true);
    setShowInstallBanner(false);
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  // Check if banner was dismissed this session
  const bannerDismissed = sessionStorage.getItem('installBannerDismissed') === 'true';

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && !bannerDismissed && (
        <div className={`fixed bottom-20 left-4 right-4 z-40 ${className}`}>
          <div className="bg-primary-600 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  Install Madrasa Portal
                </h3>
                <p className="text-xs text-primary-100 mb-2">
                  Get quick access and work offline
                </p>
                <p className="text-xs text-primary-200" lang="ml">
                  വേഗത്തിലുള്ള ആക്സസും ഓഫ്‌ലൈൻ പ്രവർത്തനവും നേടുക
                </p>
              </div>
              <button
                onClick={handleDismissBanner}
                className="text-primary-200 hover:text-white p-1 ml-2"
                aria-label="Dismiss install banner"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex space-x-2 mt-3">
              <AccessibleButton
                variant="secondary"
                size="sm"
                onClick={handleShowModal}
                className="bg-white text-primary-600 hover:bg-primary-50"
              >
                Learn More
              </AccessibleButton>
              <AccessibleButton
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                className="bg-primary-700 hover:bg-primary-800"
              >
                Install
              </AccessibleButton>
            </div>
          </div>
        </div>
      )}

      {/* Install Modal */}
      <Modal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        title="Install Madrasa Portal"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
              <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Install as App
            </h3>
            <p className="text-gray-600 mb-1">
              Install Madrasa Portal on your device for a better experience
            </p>
            <p className="text-gray-500 text-sm" lang="ml">
              മികച്ച അനുഭവത്തിനായി നിങ്ങളുടെ ഉപകരണത്തിൽ മദ്രസ പോർട്ടൽ ഇൻസ്റ്റാൾ ചെയ്യുക
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Benefits:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span>Quick access from home screen</span>
                  <span className="block text-xs text-gray-500" lang="ml">ഹോം സ്ക്രീനിൽ നിന്ന് വേഗത്തിലുള്ള ആക്സസ്</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span>Works offline for cached content</span>
                  <span className="block text-xs text-gray-500" lang="ml">കാഷെ ചെയ്ത ഉള്ളടക്കത്തിനായി ഓഫ്‌ലൈൻ പ്രവർത്തിക്കുന്നു</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span>Push notifications for classes and updates</span>
                  <span className="block text-xs text-gray-500" lang="ml">ക്ലാസുകൾക്കും അപ്‌ഡേറ്റുകൾക്കുമായി പുഷ് അറിയിപ്പുകൾ</span>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span>Full-screen app experience</span>
                  <span className="block text-xs text-gray-500" lang="ml">പൂർണ്ണ സ്ക്രീൻ ആപ്പ് അനുഭവം</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <AccessibleButton
              variant="secondary"
              onClick={() => setShowInstallModal(false)}
              className="flex-1"
            >
              Maybe Later
              <span className="block text-xs mt-1" lang="ml">പിന്നീട്</span>
            </AccessibleButton>
            <AccessibleButton
              variant="primary"
              onClick={handleInstallClick}
              className="flex-1"
            >
              Install Now
              <span className="block text-xs mt-1" lang="ml">ഇപ്പോൾ ഇൻസ്റ്റാൾ ചെയ്യുക</span>
            </AccessibleButton>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Hook for install prompt functionality
export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isPWA = window.navigator.standalone === true;
    setIsInstalled(isStandalone || isPWA);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
};