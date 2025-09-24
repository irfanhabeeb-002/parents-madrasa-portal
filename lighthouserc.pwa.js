module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 1, // Single run for PWA-focused testing
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        // Focus only on PWA category for detailed analysis
        onlyCategories: ['pwa'],
        // Mobile emulation for PWA testing
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        // Additional PWA-specific settings
        locale: 'en-US',
        disableStorageReset: false,
        // Include additional PWA audits
        onlyAudits: [
          // Core PWA audits
          'installable-manifest',
          'splash-screen',
          'themed-omnibox',
          'content-width',
          'viewport',
          'without-javascript',
          'service-worker',
          'offline-start-url',
          'apple-touch-icon',
          'maskable-icon',

          // Performance audits relevant to PWA
          'first-contentful-paint',
          'largest-contentful-paint',
          'speed-index',
          'interactive',
          'total-blocking-time',
          'cumulative-layout-shift',

          // Best practices for PWA
          'uses-https',
          'redirects-http',
          'is-on-https',

          // Accessibility for PWA
          'color-contrast',
          'meta-viewport',
          'document-title',
          'html-has-lang',
        ],
      },
    },
    assert: {
      assertions: {
        // Strict PWA requirements
        'categories:pwa': ['error', { minScore: 1.0 }], // Perfect PWA score required

        // Core PWA audits must pass
        'installable-manifest': 'error',
        'service-worker': 'error',
        'offline-start-url': 'error',
        'splash-screen': 'error',
        'themed-omnibox': 'error',
        'content-width': 'error',
        viewport: 'error',
        'without-javascript': 'error',
        'apple-touch-icon': 'error',

        // Performance thresholds for PWA
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        interactive: ['error', { maxNumericValue: 3800 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Security requirements
        'uses-https': 'error',
        'is-on-https': 'error',

        // Accessibility requirements
        'color-contrast': 'error',
        'meta-viewport': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',

        // Optional but recommended
        'maskable-icon': 'warn',
        'redirects-http': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9002, // Different port to avoid conflicts
      storage: './lighthouse-pwa-reports',
    },
  },
};
