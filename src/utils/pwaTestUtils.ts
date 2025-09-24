/**
 * PWA Testing Utilities
 * Provides utility functions to test PWA functionality in development
 */

export interface PWATestResult {
  passed: boolean;
  message: string;
  details?: any;
}

export interface ManifestValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: any;
}

export interface ServiceWorkerTestResult {
  isRegistered: boolean;
  isActive: boolean;
  scope: string;
  updateAvailable: boolean;
  cacheNames: string[];
}

export interface InstallabilityTestResult {
  isInstallable: boolean;
  criteria: {
    hasManifest: boolean;
    isSecure: boolean;
    hasServiceWorker: boolean;
    hasIcons: boolean;
    hasStartUrl: boolean;
    hasDisplay: boolean;
  };
}

/**
 * Test if the app manifest is valid and meets PWA requirements
 */
export async function testManifestValidation(): Promise<ManifestValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Fetch the manifest
    const manifestResponse = await fetch('/manifest.json');
    if (!manifestResponse.ok) {
      errors.push('Manifest file not found or not accessible');
      return { isValid: false, errors, warnings };
    }

    const manifest = await manifestResponse.json();

    // Required fields validation
    const requiredFields = [
      'name',
      'short_name',
      'start_url',
      'display',
      'icons',
    ];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Icons validation
    if (manifest.icons && Array.isArray(manifest.icons)) {
      const hasRequiredSizes = manifest.icons.some(
        (icon: any) =>
          icon.sizes &&
          (icon.sizes.includes('192x192') || icon.sizes.includes('512x512'))
      );
      if (!hasRequiredSizes) {
        errors.push(
          'Manifest must include icons with sizes 192x192 or 512x512'
        );
      }

      // Check for maskable icons
      const hasMaskableIcon = manifest.icons.some(
        (icon: any) => icon.purpose && icon.purpose.includes('maskable')
      );
      if (!hasMaskableIcon) {
        warnings.push(
          'Consider adding maskable icons for better Android integration'
        );
      }
    } else {
      errors.push('Manifest must include an icons array');
    }

    // Display mode validation
    const validDisplayModes = [
      'fullscreen',
      'standalone',
      'minimal-ui',
      'browser',
    ];
    if (manifest.display && !validDisplayModes.includes(manifest.display)) {
      errors.push(`Invalid display mode: ${manifest.display}`);
    }

    // Theme color validation
    if (
      manifest.theme_color &&
      !/^#[0-9A-Fa-f]{6}$/.test(manifest.theme_color)
    ) {
      warnings.push('Theme color should be a valid hex color');
    }

    // Start URL validation
    if (manifest.start_url && !manifest.start_url.startsWith('/')) {
      warnings.push('Start URL should be relative to the origin');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      manifest,
    };
  } catch (error) {
    errors.push(`Failed to validate manifest: ${error}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Test service worker registration and functionality
 */
export async function testServiceWorker(): Promise<ServiceWorkerTestResult> {
  const result: ServiceWorkerTestResult = {
    isRegistered: false,
    isActive: false,
    scope: '',
    updateAvailable: false,
    cacheNames: [],
  };

  if (!('serviceWorker' in navigator)) {
    return result;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      result.isRegistered = true;
      result.scope = registration.scope;
      result.isActive = registration.active !== null;
      result.updateAvailable = registration.waiting !== null;
    }

    // Get cache names
    if ('caches' in window) {
      result.cacheNames = await caches.keys();
    }

    return result;
  } catch (error) {
    console.error('Service worker test failed:', error);
    return result;
  }
}

/**
 * Test app installability criteria
 */
export async function testInstallability(): Promise<InstallabilityTestResult> {
  const criteria = {
    hasManifest: false,
    isSecure: false,
    hasServiceWorker: false,
    hasIcons: false,
    hasStartUrl: false,
    hasDisplay: false,
  };

  // Check if served over HTTPS
  criteria.isSecure =
    location.protocol === 'https:' || location.hostname === 'localhost';

  // Check for service worker
  criteria.hasServiceWorker = 'serviceWorker' in navigator;

  // Check manifest
  try {
    const manifestValidation = await testManifestValidation();
    criteria.hasManifest = manifestValidation.isValid;

    if (manifestValidation.manifest) {
      criteria.hasIcons =
        manifestValidation.manifest.icons &&
        manifestValidation.manifest.icons.length > 0;
      criteria.hasStartUrl = !!manifestValidation.manifest.start_url;
      criteria.hasDisplay = !!manifestValidation.manifest.display;
    }
  } catch (error) {
    console.error('Manifest check failed:', error);
  }

  const isInstallable = Object.values(criteria).every(Boolean);

  return {
    isInstallable,
    criteria,
  };
}

/**
 * Test offline functionality by checking cache availability
 */
export async function testOfflineFunctionality(): Promise<PWATestResult> {
  if (!('caches' in window)) {
    return {
      passed: false,
      message: 'Cache API not supported',
    };
  }

  try {
    const cacheNames = await caches.keys();

    if (cacheNames.length === 0) {
      return {
        passed: false,
        message: 'No caches found - offline functionality may not work',
      };
    }

    // Test if essential resources are cached
    const essentialResources = ['/', '/manifest.json'];
    const cachedResources: string[] = [];

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        cachedResources.push(request.url);
      }
    }

    const missingResources = essentialResources.filter(
      resource => !cachedResources.some(cached => cached.endsWith(resource))
    );

    if (missingResources.length > 0) {
      return {
        passed: false,
        message: `Essential resources not cached: ${missingResources.join(', ')}`,
        details: { cachedResources, missingResources },
      };
    }

    return {
      passed: true,
      message: `Offline functionality ready - ${cacheNames.length} cache(s) with ${cachedResources.length} resources`,
      details: { cacheNames, cachedResources },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Offline test failed: ${error}`,
      details: { error },
    };
  }
}

/**
 * Test PWA performance metrics
 */
export async function testPWAPerformance(): Promise<PWATestResult> {
  if (!('performance' in window)) {
    return {
      passed: false,
      message: 'Performance API not supported',
    };
  }

  try {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    if (!navigation) {
      return {
        passed: false,
        message: 'Navigation timing not available',
      };
    }

    const metrics = {
      domContentLoaded:
        (navigation.domContentLoadedEventEnd || 0) -
        (navigation.domContentLoadedEventStart || 0),
      loadComplete:
        (navigation.loadEventEnd || 0) - (navigation.loadEventStart || 0),
      firstPaint: 0,
      firstContentfulPaint: 0,
    };

    // Get paint metrics if available
    const paintEntries = performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    }

    // Performance thresholds (in milliseconds)
    const thresholds = {
      domContentLoaded: 1500,
      loadComplete: 2500,
      firstContentfulPaint: 1800,
    };

    const issues: string[] = [];

    if (metrics.domContentLoaded > thresholds.domContentLoaded) {
      issues.push(`DOM Content Loaded too slow: ${metrics.domContentLoaded}ms`);
    }

    if (metrics.loadComplete > thresholds.loadComplete) {
      issues.push(`Load Complete too slow: ${metrics.loadComplete}ms`);
    }

    if (metrics.firstContentfulPaint > thresholds.firstContentfulPaint) {
      issues.push(
        `First Contentful Paint too slow: ${metrics.firstContentfulPaint}ms`
      );
    }

    return {
      passed: issues.length === 0,
      message:
        issues.length === 0
          ? 'Performance metrics within acceptable ranges'
          : `Performance issues found: ${issues.join(', ')}`,
      details: metrics,
    };
  } catch (error) {
    return {
      passed: false,
      message: `Performance test failed: ${error}`,
      details: { error },
    };
  }
}

/**
 * Run all PWA tests and return comprehensive results
 */
export async function runAllPWATests() {
  console.log('🔍 Running PWA tests...');

  const results = {
    manifest: await testManifestValidation(),
    serviceWorker: await testServiceWorker(),
    installability: await testInstallability(),
    offline: await testOfflineFunctionality(),
    performance: await testPWAPerformance(),
    timestamp: new Date().toISOString(),
  };

  // Log results to console for development
  console.log('📊 PWA Test Results:', results);

  return results;
}

/**
 * Simulate offline mode for testing (development only)
 */
export function simulateOfflineMode(enabled: boolean = true) {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('simulateOfflineMode should only be used in development');
    return;
  }

  if (enabled) {
    // Override fetch to simulate network failures
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      console.log('🚫 Simulating offline - blocking fetch request:', args[0]);
      throw new Error('Simulated offline mode');
    };

    // Store original fetch for restoration
    (window as any).__originalFetch = originalFetch;
    console.log('🔌 Offline mode simulation enabled');
  } else {
    // Restore original fetch
    if ((window as any).__originalFetch) {
      window.fetch = (window as any).__originalFetch;
      delete (window as any).__originalFetch;
      console.log('🌐 Offline mode simulation disabled');
    }
  }
}

/**
 * Test notification permissions and functionality
 */
export async function testNotifications(): Promise<PWATestResult> {
  if (!('Notification' in window)) {
    return {
      passed: false,
      message: 'Notifications not supported in this browser',
    };
  }

  const permission = Notification.permission;

  if (permission === 'denied') {
    return {
      passed: false,
      message: 'Notification permission denied by user',
    };
  }

  if (permission === 'default') {
    return {
      passed: false,
      message: 'Notification permission not requested yet',
      details: { permission },
    };
  }

  // Test if service worker can show notifications
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Test notification display
        await registration.showNotification('PWA Test', {
          body: 'Testing notification functionality',
          tag: 'pwa-test',
          silent: true,
        });

        return {
          passed: true,
          message: 'Notifications working correctly',
          details: { permission },
        };
      }
    } catch (error) {
      return {
        passed: false,
        message: `Notification test failed: ${error}`,
        details: { permission, error },
      };
    }
  }

  return {
    passed: true,
    message: 'Basic notification support available',
    details: { permission },
  };
}
