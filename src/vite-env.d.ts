/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// PWA related types
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  appinstalled: Event;
}

// Extended Navigator interface for PWA features
interface Navigator {
  standalone?: boolean; // iOS Safari PWA detection
}

// Service Worker related types
interface ServiceWorkerRegistration {
  readonly installing: ServiceWorker | null;
  readonly waiting: ServiceWorker | null;
  readonly active: ServiceWorker | null;
  readonly scope: string;
  readonly updateViaCache: ServiceWorkerUpdateViaCache;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
  addEventListener<K extends keyof ServiceWorkerRegistrationEventMap>(
    type: K,
    listener: (
      this: ServiceWorkerRegistration,
      ev: ServiceWorkerRegistrationEventMap[K]
    ) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
}

// PWA Display modes
type PWADisplayMode = 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';

// PWA Manifest types
interface WebAppManifest {
  name?: string;
  short_name?: string;
  description?: string;
  start_url?: string;
  display?: PWADisplayMode;
  background_color?: string;
  theme_color?: string;
  orientation?: 'portrait' | 'landscape' | 'any';
  scope?: string;
  icons?: ManifestIcon[];
  categories?: string[];
  lang?: string;
}

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}
