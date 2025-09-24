/**
 * Browser Compatibility Check Script
 *
 * This script can be run in the browser console to validate
 * cross-platform compatibility features for the PWA install popup.
 *
 * Usage:
 * 1. Open browser developer tools
 * 2. Navigate to Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 * 5. Review the compatibility report
 */

(function () {
  'use strict';

  console.warn('🔍 PWA Install Popup - Browser Compatibility Check');
  console.warn('================================================');

  const results = {
    browser: {},
    features: {},
    css: {},
    pwa: {},
    issues: [],
  };

  // Browser Detection
  function detectBrowser() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    results.browser = {
      userAgent,
      platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };

    // Detect specific browsers
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      results.browser.name = 'Chrome';
      results.browser.mobile = userAgent.includes('Mobile');
    } else if (userAgent.includes('Firefox')) {
      results.browser.name = 'Firefox';
      results.browser.mobile = userAgent.includes('Mobile');
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      results.browser.name = 'Safari';
      results.browser.mobile = userAgent.includes('Mobile');
    } else if (userAgent.includes('Edg')) {
      results.browser.name = 'Edge';
      results.browser.mobile = userAgent.includes('Mobile');
    } else {
      results.browser.name = 'Unknown';
      results.browser.mobile = userAgent.includes('Mobile');
    }

    console.warn(
      `📱 Browser: ${results.browser.name} (${results.browser.mobile ? 'Mobile' : 'Desktop'})`
    );
  }

  // Feature Detection
  function checkFeatures() {
    results.features = {
      serviceWorker: 'serviceWorker' in navigator,
      beforeInstallPrompt: 'onbeforeinstallprompt' in window,
      matchMedia: typeof window.matchMedia === 'function',
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window,
      customElements: 'customElements' in window,
      webComponents:
        'customElements' in window && 'attachShadow' in Element.prototype,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
    };

    console.warn('🔧 Feature Support:');
    Object.entries(results.features).forEach(([feature, supported]) => {
      console.warn(`  ${supported ? '✅' : '❌'} ${feature}: ${supported}`);
      if (
        !supported &&
        ['serviceWorker', 'matchMedia', 'localStorage'].includes(feature)
      ) {
        results.issues.push(`Critical feature missing: ${feature}`);
      }
    });
  }

  // CSS Support Detection
  function checkCSSSupport() {
    const testElement = document.createElement('div');
    document.body.appendChild(testElement);

    results.css = {
      flexbox: CSS.supports('display', 'flex'),
      grid: CSS.supports('display', 'grid'),
      customProperties: CSS.supports('--test', '0'),
      calc: CSS.supports('width', 'calc(100% - 10px)'),
      transforms: CSS.supports('transform', 'translateX(0)'),
      transitions: CSS.supports('transition', 'all 0.3s'),
      backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
      safeAreaInsets: CSS.supports('padding', 'env(safe-area-inset-bottom)'),
      displayModeStandalone: window.matchMedia('(display-mode: standalone)')
        .matches,
      prefersReducedMotion: window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches,
      prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)')
        .matches,
    };

    // Test specific Tailwind classes
    const tailwindClasses = [
      'z-60',
      'bottom-22',
      'fixed',
      'bg-primary-700',
      'text-white',
      'shadow-2xl',
      'rounded-lg',
      'p-4',
      'md:p-5',
      'max-w-md',
      'mx-auto',
    ];

    results.css.tailwindSupport = {};
    tailwindClasses.forEach(className => {
      testElement.className = className;
      const computedStyle = window.getComputedStyle(testElement);
      results.css.tailwindSupport[className] =
        computedStyle.getPropertyValue('display') !== '';
    });

    document.body.removeChild(testElement);

    console.warn('🎨 CSS Support:');
    Object.entries(results.css).forEach(([feature, supported]) => {
      if (typeof supported === 'boolean') {
        console.warn(`  ${supported ? '✅' : '❌'} ${feature}: ${supported}`);
        if (
          !supported &&
          ['flexbox', 'customProperties', 'transforms'].includes(feature)
        ) {
          results.issues.push(`Important CSS feature missing: ${feature}`);
        }
      }
    });
  }

  // PWA Capabilities
  function checkPWASupport() {
    results.pwa = {
      manifest: document.querySelector('link[rel="manifest"]') !== null,
      serviceWorkerRegistered: false,
      installable: false,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
      minimalUI: window.matchMedia('(display-mode: minimal-ui)').matches,
      browser: window.matchMedia('(display-mode: browser)').matches,
    };

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        results.pwa.serviceWorkerRegistered = registrations.length > 0;
        console.warn(
          `🔧 Service Worker: ${results.pwa.serviceWorkerRegistered ? 'Registered' : 'Not Registered'}`
        );
      });
    }

    // Check for install prompt capability
    let installPromptAvailable = false;
    const beforeInstallPromptHandler = e => {
      installPromptAvailable = true;
      results.pwa.installable = true;
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

    // iOS specific checks
    if (results.browser.name === 'Safari' && results.browser.mobile) {
      results.pwa.iosStandalone = window.navigator.standalone === true;
      results.pwa.iosInstallable = !results.pwa.iosStandalone;
    }

    console.warn('📱 PWA Support:');
    Object.entries(results.pwa).forEach(([feature, value]) => {
      console.warn(`  ${value ? '✅' : '❌'} ${feature}: ${value}`);
    });

    // Clean up event listener
    setTimeout(() => {
      window.removeEventListener(
        'beforeinstallprompt',
        beforeInstallPromptHandler
      );
    }, 1000);
  }

  // Z-Index and Positioning Tests
  function checkPositioning() {
    console.warn('📐 Testing Banner Positioning...');

    // Create test banner
    const testBanner = document.createElement('div');
    testBanner.style.cssText = `
      position: fixed;
      bottom: 88px;
      left: 16px;
      right: 16px;
      z-index: 60;
      background: rgb(29, 78, 216);
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 448px;
      margin: 0 auto;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    testBanner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Install Madrasa Portal</div>
          <div style="opacity: 0.9;">Get quick access and work offline</div>
        </div>
        <button style="background: white; color: rgb(29, 78, 216); border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer;">Install</button>
      </div>
    `;

    document.body.appendChild(testBanner);

    // Test positioning
    setTimeout(() => {
      testBanner.style.opacity = '1';

      const rect = testBanner.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const bottomNavHeight = 64; // Assumed bottom nav height

      const positioning = {
        visible: rect.top >= 0 && rect.bottom <= viewportHeight,
        aboveBottomNav: rect.bottom <= viewportHeight - bottomNavHeight,
        centered:
          Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2) < 10,
        properZIndex: window.getComputedStyle(testBanner).zIndex === '60',
      };

      console.warn('📐 Positioning Results:');
      Object.entries(positioning).forEach(([test, passed]) => {
        console.warn(`  ${passed ? '✅' : '❌'} ${test}: ${passed}`);
        if (!passed) {
          results.issues.push(`Positioning issue: ${test} failed`);
        }
      });

      // Clean up
      setTimeout(() => {
        testBanner.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(testBanner);
        }, 300);
      }, 2000);
    }, 100);
  }

  // Performance Tests
  function checkPerformance() {
    console.warn('⚡ Performance Tests...');

    const performanceTests = {
      renderTime: 0,
      memoryUsage: 0,
      animationSupport: false,
    };

    // Test render performance
    const startTime = performance.now();
    const testDiv = document.createElement('div');
    testDiv.className =
      'fixed bottom-22 left-4 right-4 z-60 bg-primary-700 text-white p-4 rounded-lg shadow-2xl max-w-md mx-auto';
    testDiv.textContent = 'Performance test element';
    document.body.appendChild(testDiv);

    requestAnimationFrame(() => {
      performanceTests.renderTime = performance.now() - startTime;
      document.body.removeChild(testDiv);

      console.warn(
        `⚡ Render time: ${performanceTests.renderTime.toFixed(2)}ms`
      );

      if (performanceTests.renderTime > 100) {
        results.issues.push(
          `Slow render time: ${performanceTests.renderTime.toFixed(2)}ms`
        );
      }
    });

    // Test memory usage (if available)
    if (performance.memory) {
      performanceTests.memoryUsage = performance.memory.usedJSHeapSize;
      console.warn(
        `💾 Memory usage: ${(performanceTests.memoryUsage / 1024 / 1024).toFixed(2)}MB`
      );
    }

    // Test animation support
    performanceTests.animationSupport = CSS.supports(
      'animation',
      'slideUpFadeIn 0.3s ease-out'
    );
    console.warn(
      `🎬 Animation support: ${performanceTests.animationSupport ? 'Yes' : 'No'}`
    );

    results.performance = performanceTests;
  }

  // Generate Report
  function generateReport() {
    console.warn('\n📊 COMPATIBILITY REPORT');
    console.warn('========================');

    console.warn(
      `\n🌐 Platform: ${results.browser.name} on ${results.browser.platform}`
    );
    console.warn(
      `📱 Device Type: ${results.browser.mobile ? 'Mobile' : 'Desktop'}`
    );

    const criticalFeatures = ['serviceWorker', 'matchMedia', 'localStorage'];
    const supportedCritical = criticalFeatures.filter(
      feature => results.features[feature]
    );

    console.warn(
      `\n✅ Critical Features: ${supportedCritical.length}/${criticalFeatures.length} supported`
    );

    const cssFeatures = [
      'flexbox',
      'customProperties',
      'transforms',
      'transitions',
    ];
    const supportedCSS = cssFeatures.filter(feature => results.css[feature]);

    console.warn(
      `🎨 CSS Features: ${supportedCSS.length}/${cssFeatures.length} supported`
    );

    if (results.issues.length > 0) {
      console.warn('\n⚠️  ISSUES FOUND:');
      results.issues.forEach((issue, index) => {
        console.warn(`  ${index + 1}. ${issue}`);
      });
    } else {
      console.warn('\n✅ No critical issues found!');
    }

    console.warn('\n📋 RECOMMENDATIONS:');

    if (results.browser.name === 'Safari' && results.browser.mobile) {
      console.warn(
        '  • iOS Safari detected - Test "Add to Home Screen" functionality'
      );
      console.warn('  • Verify safe area inset handling');
    }

    if (results.browser.name === 'Firefox') {
      console.warn('  • Firefox detected - PWA install may not be available');
      console.warn('  • Focus on banner visibility and styling');
    }

    if (!results.features.beforeInstallPrompt) {
      console.warn(
        '  • beforeinstallprompt not supported - Banner may not appear'
      );
    }

    if (!results.css.safeAreaInsets) {
      console.warn(
        '  • Safe area insets not supported - May have positioning issues on notched devices'
      );
    }

    console.warn('\n🔗 Next Steps:');
    console.warn('  1. Test actual PWA install functionality');
    console.warn('  2. Verify banner positioning with bottom navigation');
    console.warn('  3. Test in different orientations (mobile)');
    console.warn('  4. Validate accessibility with screen readers');
    console.warn('  5. Test performance under load');

    // Return results for programmatic access
    return results;
  }

  // Run all checks
  detectBrowser();
  checkFeatures();
  checkCSSSupport();
  checkPWASupport();
  checkPositioning();
  checkPerformance();

  // Generate final report after a delay to allow async operations
  setTimeout(() => {
    window.pwaCompatibilityResults = generateReport();
    console.warn('\n💾 Results saved to window.pwaCompatibilityResults');
  }, 2000);
})();
