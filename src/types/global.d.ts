/**
 * Global type definitions for PWA and browser APIs
 */

// Node.js types for browser environment
declare namespace NodeJS {
  interface Timeout {
    _id: number;
    _destroyed: boolean;
  }
}

// Service Worker types
declare interface ServiceWorkerUpdateViaCache {
  imports: 'imports';
  all: 'all';
  none: 'none';
}

declare interface ServiceWorkerRegistrationEventMap {
  updatefound: Event;
}

declare interface AddEventListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

declare interface EventListener {
  (evt: Event): void;
}

declare interface NotificationOptions {
  actions?: NotificationAction[];
  badge?: string;
  body?: string;
  data?: any;
  dir?: NotificationDirection;
  icon?: string;
  image?: string;
  lang?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  timestamp?: number;
  vibrate?: VibratePattern;
}

declare interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

declare type NotificationDirection = 'auto' | 'ltr' | 'rtl';

declare type VibratePattern = number | number[];

// Service Worker Global Scope
declare interface ServiceWorkerGlobalScope extends WorkerGlobalScope {
  registration: ServiceWorkerRegistration;
  skipWaiting(): Promise<void>;
  clients: Clients;
}

// Process environment for browser
declare const process: {
  env: {
    NODE_ENV: string;
    [key: string]: string | undefined;
  };
};

// PWA Install Event
declare interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Window extensions for PWA
declare interface Window {
  onbeforeinstallprompt: ((this: Window, ev: BeforeInstallPromptEvent) => any) | null;
}

// Navigator extensions
declare interface Navigator {
  standalone?: boolean;
}

// Global error types for testing
declare const error: Error;
declare const notification: Notification;
declare const user: any;
declare const styles: any;
declare const dialog: HTMLDialogElement;
declare const focusableElements: NodeList;
declare const startTime: number;
declare const userId: string;
declare const backupData: any;
declare const registration: ServiceWorkerRegistration;
declare const cancelButton: HTMLElement;
declare const renderProfile: () => void;
declare const mockUseAuth: any;

// Test globals
declare const beforeEach: (fn: () => void) => void;
declare const describe: (name: string, fn: () => void) => void;
declare const React: any;

// Service Worker Registration extensions
declare interface ServiceWorkerRegistration {
  addEventListener<K extends keyof ServiceWorkerRegistrationEventMap>(
    type: K,
    listener: (this: ServiceWorkerRegistration, ev: ServiceWorkerRegistrationEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
}