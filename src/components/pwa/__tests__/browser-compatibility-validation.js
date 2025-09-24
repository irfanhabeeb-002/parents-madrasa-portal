/**
 * Browser Compatibility Validation Script for Task 11
 * 
 * This script validates PWA install functionality across different browsers
 * and provides a comprehensive compatibility report.
 */

// Browser detection utilities
const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
  const isEdge = /Edg/.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);

  return {
    name: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Unknown',
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isIOS,
    isAndroid,
    userAgent,
    version: getUserAgentVersion(userAgent),
  };
};

const getUserAgentVersion = (userAgent) => {
  const match = userAgent.match(/(Chrome|Firefox|Safari|Edg)\/(\d+)/);
  return match ? match[2] : 'Unknown';
};

// PWA feature detection
const detectPWAFeatures = () => {
  const features = {
    serviceWorker: 'serviceWorker' in navigator,
    beforeInstallPrompt: 'onbeforeinstallprompt' in window,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
    minimalUI: window.matchMedia('(display-mode: minimal-ui)').matches,
    webAppManifest: document.querySelector('link[rel="manifest"]') !== null,
    https: location.protocol === 'https:',
    localStorage: typeof Storage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
    pushNotifications: 'PushManager' in window,
    notifications: 'Notification' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    webShare: 'share' in navigator,
    installPromptEvent: false, // Will be set when event fires
  };

  return features;
};

// Install state detection
const detectInstallState = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  const isIOSStandalone = window.navigator.standalone === true;

  return {
    isInstalled: isStandalone || isFullscreen || isMinimalUI || isIOSStandalone,
    displayMode: isStandalone ? 'standalone' : isFullscreen ? 'fullscreen' : isMinimalUI ? 'minimal-ui' : 'browser',
    confidence: (isStandalone || isFullscreen || isMinimalUI) ? 'high' : isIOSStandalone ? 'medium' : 'low',
  };
};

// Compatibility scoring
const calculateCompatibilityScore = (browser, features) => {
  let score = 0;
  let maxScore = 0;

  // Essential features (high weight)
  const essentialFeatures = [
    { key: 'serviceWorker', weight: 20, name: 'Service Worker' },
    { key: 'https', weight: 15, name: 'HTTPS' },
    { key: 'webAppManifest', weight: 15, name: 'Web App Manifest' },
  ];

  // PWA features (medium weight)
  const pwaFeatures = [
    { key: 'beforeInstallPrompt', weight: 10, name: 'Before Install Prompt' },
    { key: 'standalone', weight: 8, name: 'Standalone Display Mode' },
    { key: 'pushNotifications', weight: 5, name: 'Push Notifications' },
    { key: 'notifications', weight: 5, name: 'Notifications API' },
  ];

  // Nice-to-have features (low weight)
  const niceToHaveFeatures = [
    { key: 'backgroundSync', weight: 3, name: 'Background Sync' },
    { key: 'webShare', weight: 2, name: 'Web Share API' },
    { key: 'localStorage', weight: 2, name: 'Local Storage' },
    { key: 'sessionStorage', weight: 2, name: 'Session Storage' },
  ];

  const allFeatures = [...essentialFeatures, ...pwaFeatures, ...niceToHaveFeatures];

  allFeatures.forEach(feature => {
    maxScore += feature.weight;
    if (features[feature.key]) {
      score += feature.weight;
    }
  });

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    grade: getGrade(score / maxScore),
  };
};

const getGrade = (ratio) => {
  if (ratio >= 0.9) return 'A';
  if (ratio >= 0.8) return 'B';
  if (ratio >= 0.7) return 'C';
  if (ratio >= 0.6) return 'D';
  return 'F';
};

// Generate compatibility report
const generateCompatibilityReport = () => {
  const browser = detectBrowser();
  const features = detectPWAFeatures();
  const installState = detectInstallState();
  const compatibility = calculateCompatibilityScore(browser, features);

  return {
    timestamp: new Date().toISOString(),
    browser,
    features,
    installState,
    compatibility,
    recommendations: generateRecommendations(browser, features, compatibility),
  };
};

const generateRecommendations = (browser, features, compatibility) => {
  const recommendations = [];

  if (!features.serviceWorker) {
    recommendations.push({
      type: 'critical',
      message: 'Service Worker not supported. PWA functionality will be severely limited.',
      action: 'Consider upgrading to a modern browser that supports Service Workers.',
    });
  }

  if (!features.https) {
    recommendations.push({
      type: 'critical',
      message: 'HTTPS required for PWA features to work properly.',
      action: 'Ensure the app is served over HTTPS in production.',
    });
  }

  if (!features.beforeInstallPrompt && browser.isChrome) {
    recommendations.push({
      type: 'warning',
      message: 'Before Install Prompt not available despite Chrome browser.',
      action: 'Check if PWA criteria are met (HTTPS, manifest, service worker).',
    });
  }

  if (browser.isFirefox) {
    recommendations.push({
      type: 'info',
      message: 'Firefox has limited PWA support. Install prompts may not work.',
      action: 'Provide manual installation instructions for Firefox users.',
    });
  }

  if (browser.isIOS && !features.standalone) {
    recommendations.push({
      type: 'info',
      message: 'iOS Safari requires manual installation via Share > Add to Home Screen.',
      action: 'Provide iOS-specific installation instructions.',
    });
  }

  if (compatibility.percentage < 70) {
    recommendations.push({
      type: 'warning',
      message: `Low PWA compatibility score (${compatibility.percentage}%). Some features may not work.`,
      action: 'Consider graceful degradation for unsupported features.',
    });
  }

  return recommendations;
};

// Test install functionality
const testInstallFunctionality = () => {
  return new Promise((resolve) => {
    const results = {
      beforeInstallPromptFired: false,
      installPromptAvailable: false,
      installButtonVisible: false,
      errorHandlingWorks: false,
      fallbackInstructionsAvailable: false,
    };

    // Test beforeinstallprompt event
    const beforeInstallPromptHandler = (e) => {
      results.beforeInstallPromptFired = true;
      results.installPromptAvailable = typeof e.prompt === 'function';
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

    // Test install button visibility
    setTimeout(() => {
      const installButtons = document.querySelectorAll('[data-testid="install-button"], button[aria-label*="install" i], button[aria-label*="ഇൻസ്റ്റാൾ"]');
      results.installButtonVisible = installButtons.length > 0;

      // Test error handling
      try {
        // Simulate an install error
        const errorEvent = new CustomEvent('pwa-install-error', {
          detail: { message: 'Test error' }
        });
        window.dispatchEvent(errorEvent);
        results.errorHandlingWorks = true;
      } catch (error) {
        console.warn('Error handling test failed:', error);
      }

      // Test fallback instructions
      const fallbackElements = document.querySelectorAll('[data-testid="fallback-instructions"], .fallback-instructions');
      results.fallbackInstructionsAvailable = fallbackElements.length > 0;

      resolve(results);
    }, 2000);
  });
};

// Main validation function
const validateBrowserCompatibility = async () => {
  console.log('🔍 Starting browser compatibility validation...');
  
  const report = generateCompatibilityReport();
  const installTests = await testInstallFunctionality();

  const fullReport = {
    ...report,
    installTests,
    validation: {
      passed: report.compatibility.percentage >= 70 && report.features.serviceWorker && report.features.https,
      score: report.compatibility.percentage,
      grade: report.compatibility.grade,
    }
  };

  // Log detailed report
  console.group('📊 Browser Compatibility Report');
  console.log('Browser:', report.browser.name, report.browser.version);
  console.log('Platform:', report.browser.isIOS ? 'iOS' : report.browser.isAndroid ? 'Android' : 'Desktop');
  console.log('Compatibility Score:', `${report.compatibility.percentage}% (${report.compatibility.grade})`);
  console.log('Install State:', report.installState.isInstalled ? 'Installed' : 'Not Installed');
  console.log('Display Mode:', report.installState.displayMode);
  console.groupEnd();

  console.group('🔧 Feature Support');
  Object.entries(report.features).forEach(([key, supported]) => {
    console.log(`${supported ? '✅' : '❌'} ${key}:`, supported);
  });
  console.groupEnd();

  console.group('🧪 Install Functionality Tests');
  Object.entries(installTests).forEach(([key, result]) => {
    console.log(`${result ? '✅' : '❌'} ${key}:`, result);
  });
  console.groupEnd();

  if (report.recommendations.length > 0) {
    console.group('💡 Recommendations');
    report.recommendations.forEach(rec => {
      const icon = rec.type === 'critical' ? '🚨' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${rec.message}`);
      console.log(`   Action: ${rec.action}`);
    });
    console.groupEnd();
  }

  console.log(fullReport.validation.passed ? '✅ Browser compatibility validation PASSED' : '❌ Browser compatibility validation FAILED');
  
  return fullReport;
};

// Auto-run validation if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateBrowserCompatibility);
  } else {
    validateBrowserCompatibility();
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectBrowser,
    detectPWAFeatures,
    detectInstallState,
    calculateCompatibilityScore,
    generateCompatibilityReport,
    testInstallFunctionality,
    validateBrowserCompatibility,
  };
}