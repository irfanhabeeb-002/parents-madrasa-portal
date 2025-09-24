// Mobile-optimized notification manager for Parents Madrasa Portal
import { INSTALL_LOCALIZATION } from '../constants/installLocalization';

export class MobileNotificationManager {
  private static instance: MobileNotificationManager;
  private isIOS: boolean;
  private isAndroid: boolean;
  private isPWA: boolean;
  private isStandalone: boolean;

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isAndroid = /Android/.test(navigator.userAgent);
    this.isPWA = window.matchMedia('(display-mode: standalone)').matches;
    this.isStandalone = (window.navigator as any).standalone === true;
  }

  static getInstance(): MobileNotificationManager {
    if (!MobileNotificationManager.instance) {
      MobileNotificationManager.instance = new MobileNotificationManager();
    }
    return MobileNotificationManager.instance;
  }

  // Check if device supports proper notifications
  canSendNotifications(): boolean {
    if (this.isPWA || this.isStandalone) {
      return true; // PWA has better notification support
    }

    if (this.isIOS) {
      return this.isStandalone; // iOS needs PWA installation
    }

    if (this.isAndroid) {
      return 'Notification' in window; // Android browsers have better support
    }

    return 'Notification' in window;
  }

  // Get mobile-specific notification strategy
  getNotificationStrategy():
    | 'pwa'
    | 'browser'
    | 'in-app-only'
    | 'install-prompt' {
    if (this.isPWA || this.isStandalone) {
      return 'pwa';
    }

    if (this.isIOS && !this.isStandalone) {
      return 'install-prompt'; // iOS needs PWA installation
    }

    if (this.isAndroid && 'Notification' in window) {
      return 'browser';
    }

    return 'in-app-only';
  }

  // Send mobile-optimized notification
  async sendMobileNotification(
    title: string,
    message: string,
    options: {
      malayalamTitle?: string;
      malayalamMessage?: string;
      priority?: 'high' | 'medium' | 'low';
      vibrate?: boolean;
      sound?: boolean;
      persistent?: boolean;
    } = {}
  ): Promise<boolean> {
    const strategy = this.getNotificationStrategy();

    switch (strategy) {
      case 'pwa':
        return this.sendPWANotification(title, message, options);

      case 'browser':
        return this.sendBrowserNotification(title, message, options);

      case 'install-prompt':
        this.showInstallPrompt();
        return this.sendInAppNotification(title, message, options);

      case 'in-app-only':
      default:
        return this.sendInAppNotification(title, message, options);
    }
  }

  // PWA notifications (best mobile experience)
  private async sendPWANotification(
    title: string,
    message: string,
    options: any
  ): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(title, {
          body: message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `mobile-${Date.now()}`,
          requireInteraction: options.priority === 'high',
          silent: !options.sound,
          vibrate: options.vibrate ? [200, 100, 200, 100, 200] : undefined,
          data: {
            malayalamTitle: options.malayalamTitle,
            malayalamMessage: options.malayalamMessage,
            timestamp: new Date().toISOString(),
          },
          actions: [
            {
              action: 'view',
              title: 'View',
              icon: '/icons/view-icon.png',
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
              icon: '/icons/dismiss-icon.png',
            },
          ],
        });

        console.warn('✅ PWA notification sent successfully');
        return true;
      }
    } catch (error) {
      console.error('PWA notification failed:', error);
    }

    return false;
  }

  // Browser notifications (Android Chrome)
  private async sendBrowserNotification(
    title: string,
    message: string,
    options: any
  ): Promise<boolean> {
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `mobile-browser-${Date.now()}`,
          requireInteraction: options.priority === 'high',
          silent: !options.sound,
          vibrate: options.vibrate ? [200, 100, 200] : undefined,
        });

        // Mobile-specific: shorter auto-close time
        if (options.priority !== 'high') {
          setTimeout(() => notification.close(), 4000);
        }

        console.warn('✅ Mobile browser notification sent');
        return true;
      }
    } catch (error) {
      console.error('Mobile browser notification failed:', error);
    }

    return false;
  }

  // In-app notifications (fallback for all mobile)
  private sendInAppNotification(
    title: string,
    message: string,
    options: any
  ): boolean {
    // Create mobile-optimized in-app notification
    this.createMobileToast(title, message, options);

    // Vibrate if supported and enabled
    if (options.vibrate && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Play sound if supported and enabled
    if (options.sound) {
      this.playNotificationSound();
    }

    console.warn('✅ Mobile in-app notification shown');
    return true;
  }

  // Create mobile-optimized toast notification
  private createMobileToast(
    title: string,
    message: string,
    options: any
  ): void {
    const toast = document.createElement('div');
    toast.className = `
      fixed top-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg
      transform transition-all duration-300 ease-out translate-y-[-100px] opacity-0
      md:max-w-sm md:left-auto md:right-4
    `;

    toast.innerHTML = `
      <div class="p-4">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-gray-900 mb-1">${title}</h4>
            <p class="text-sm text-gray-600 leading-relaxed">${message}</p>
            ${
              options.malayalamTitle
                ? `
              <h5 class="text-xs font-medium text-gray-700 mt-2" lang="ml">${options.malayalamTitle}</h5>
              <p class="text-xs text-gray-500 mt-1" lang="ml">${options.malayalamMessage || ''}</p>
            `
                : ''
            }
          </div>
          <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-y-[-100px]', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    }, 100);

    // Auto-remove
    const autoRemoveTime = options.priority === 'high' ? 8000 : 5000;
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('translate-y-[-100px]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }
    }, autoRemoveTime);
  }

  // Show PWA installation prompt
  private showInstallPrompt(): void {
    const installBanner = document.createElement('div');
    installBanner.className = `
      fixed bottom-4 left-4 right-4 bg-blue-600 text-white rounded-lg shadow-lg z-50
      transform transition-all duration-300 ease-out translate-y-full
    `;

    installBanner.innerHTML = `
      <div class="p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h4 class="font-semibold text-sm mb-1">${INSTALL_LOCALIZATION.english.buttonText} for Better Notifications</h4>
            <p class="text-xs opacity-90">Get reliable class reminders and updates</p>
            <p class="text-xs opacity-75 mt-1" lang="ml">${INSTALL_LOCALIZATION.malayalam.description}</p>
          </div>
          <div class="flex space-x-2 ml-3">
            <button class="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
              Later
            </button>
            <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium" onclick="window.location.reload()">
              Install
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(installBanner);

    setTimeout(() => {
      installBanner.classList.remove('translate-y-full');
    }, 100);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (installBanner.parentElement) {
        installBanner.classList.add('translate-y-full');
        setTimeout(() => installBanner.remove(), 300);
      }
    }, 10000);
  }

  // Play notification sound
  private playNotificationSound(): void {
    try {
      // Create audio context for mobile
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Audio not supported on this device');
    }
  }

  // Get mobile device info
  getMobileInfo(): {
    isIOS: boolean;
    isAndroid: boolean;
    isPWA: boolean;
    canNotify: boolean;
    strategy: string;
  } {
    return {
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      isPWA: this.isPWA,
      canNotify: this.canSendNotifications(),
      strategy: this.getNotificationStrategy(),
    };
  }
}

// Export singleton instance
export const mobileNotificationManager =
  MobileNotificationManager.getInstance();
