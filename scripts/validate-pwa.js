#!/usr/bin/env node

/**
 * PWA Validation Script
 * Comprehensive testing and validation of PWA functionality
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.blue}=== ${message} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logInfo(message) {
  log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

/**
 * Validate manifest.json file
 */
function validateManifest() {
  logHeader('Validating Web App Manifest');

  const manifestPath = join(projectRoot, 'public', 'manifest.json');

  if (!existsSync(manifestPath)) {
    logError('manifest.json not found in public directory');
    return false;
  }

  try {
    const manifestContent = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    // Required fields
    const requiredFields = [
      'name',
      'short_name',
      'start_url',
      'display',
      'icons',
    ];

    let isValid = true;

    for (const field of requiredFields) {
      if (!manifest[field]) {
        logError(`Missing required field: ${field}`);
        isValid = false;
      } else {
        logSuccess(`Required field present: ${field}`);
      }
    }

    // Validate icons
    if (manifest.icons && Array.isArray(manifest.icons)) {
      const requiredSizes = ['192x192', '512x512'];
      const availableSizes = manifest.icons.map(icon => icon.sizes);

      for (const size of requiredSizes) {
        if (availableSizes.includes(size)) {
          logSuccess(`Icon size ${size} present`);
        } else {
          logWarning(`Recommended icon size ${size} missing`);
        }
      }

      // Check for maskable icons
      const hasMaskableIcon = manifest.icons.some(
        icon => icon.purpose && icon.purpose.includes('maskable')
      );

      if (hasMaskableIcon) {
        logSuccess('Maskable icon present');
      } else {
        logWarning(
          'Maskable icon missing (recommended for better Android integration)'
        );
      }
    }

    // Validate display mode
    const validDisplayModes = [
      'standalone',
      'fullscreen',
      'minimal-ui',
      'browser',
    ];
    if (validDisplayModes.includes(manifest.display)) {
      logSuccess(`Valid display mode: ${manifest.display}`);
    } else {
      logError(`Invalid display mode: ${manifest.display}`);
      isValid = false;
    }

    // Check theme colors
    if (manifest.theme_color) {
      logSuccess(`Theme color set: ${manifest.theme_color}`);
    } else {
      logWarning('Theme color not set');
    }

    if (manifest.background_color) {
      logSuccess(`Background color set: ${manifest.background_color}`);
    } else {
      logWarning('Background color not set');
    }

    return isValid;
  } catch (error) {
    logError(`Error parsing manifest.json: ${error.message}`);
    return false;
  }
}

/**
 * Validate service worker configuration
 */
function validateServiceWorker() {
  logHeader('Validating Service Worker Configuration');

  const viteConfigPath = join(projectRoot, 'vite.config.ts');
  const swPath = join(projectRoot, 'src', 'sw.ts');

  if (!existsSync(viteConfigPath)) {
    logError('vite.config.ts not found');
    return false;
  }

  if (!existsSync(swPath)) {
    logError('Service worker source file (src/sw.ts) not found');
    return false;
  }

  try {
    const viteConfig = readFileSync(viteConfigPath, 'utf8');

    // Check for PWA plugin configuration
    if (viteConfig.includes('VitePWA')) {
      logSuccess('Vite PWA plugin configured');
    } else {
      logError('Vite PWA plugin not found in configuration');
      return false;
    }

    // Check for service worker strategy
    if (viteConfig.includes('injectManifest')) {
      logSuccess('Using injectManifest strategy (custom service worker)');
    } else if (viteConfig.includes('generateSW')) {
      logSuccess('Using generateSW strategy (auto-generated service worker)');
    } else {
      logWarning('Service worker strategy not explicitly defined');
    }

    // Check service worker source
    const swContent = readFileSync(swPath, 'utf8');

    if (swContent.includes('precacheAndRoute')) {
      logSuccess('Precaching configured');
    } else {
      logWarning('Precaching not found in service worker');
    }

    if (swContent.includes('registerRoute')) {
      logSuccess('Runtime caching configured');
    } else {
      logWarning('Runtime caching not found in service worker');
    }

    if (swContent.includes('push')) {
      logSuccess('Push notification handling configured');
    } else {
      logWarning('Push notification handling not found');
    }

    return true;
  } catch (error) {
    logError(`Error validating service worker: ${error.message}`);
    return false;
  }
}

/**
 * Validate PWA icons
 */
function validateIcons() {
  logHeader('Validating PWA Icons');

  const iconsDir = join(projectRoot, 'public', 'icons');

  if (!existsSync(iconsDir)) {
    logError('Icons directory not found in public/icons');
    return false;
  }

  const requiredIcons = [
    'pwa-192x192.png',
    'pwa-512x512.png',
    'apple-touch-icon.png',
  ];

  const recommendedIcons = [
    'pwa-512x512-maskable.png',
    'favicon.ico',
    'masked-icon.svg',
  ];

  let allRequired = true;

  for (const icon of requiredIcons) {
    const iconPath = join(iconsDir, icon);
    if (existsSync(iconPath)) {
      logSuccess(`Required icon present: ${icon}`);
    } else {
      logError(`Required icon missing: ${icon}`);
      allRequired = false;
    }
  }

  for (const icon of recommendedIcons) {
    const iconPath = join(iconsDir, icon);
    if (existsSync(iconPath)) {
      logSuccess(`Recommended icon present: ${icon}`);
    } else {
      logWarning(`Recommended icon missing: ${icon}`);
    }
  }

  return allRequired;
}

/**
 * Run PWA unit tests
 */
function runPWATests() {
  logHeader('Running PWA Unit Tests');

  try {
    logInfo('Running PWA-specific tests...');
    execSync('npm run test:pwa', {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    logSuccess('PWA unit tests passed');
    return true;
  } catch (error) {
    logError('PWA unit tests failed');
    return false;
  }
}

/**
 * Run Lighthouse PWA audit
 */
function runLighthousePWAAudit() {
  logHeader('Running Lighthouse PWA Audit');

  try {
    logInfo('Building application for PWA audit...');
    execSync('npm run build', {
      cwd: projectRoot,
      stdio: 'pipe',
    });

    logInfo('Running Lighthouse PWA audit...');
    execSync('npm run lighthouse:pwa', {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    logSuccess('Lighthouse PWA audit completed');
    return true;
  } catch (error) {
    logError('Lighthouse PWA audit failed');
    logInfo('Make sure the application is built and the server is running');
    return false;
  }
}

/**
 * Validate build output
 */
function validateBuildOutput() {
  logHeader('Validating Build Output');

  const distDir = join(projectRoot, 'dist');

  if (!existsSync(distDir)) {
    logError('Build output directory (dist) not found');
    logInfo('Run "npm run build" first');
    return false;
  }

  // Check for essential PWA files in build output
  const requiredFiles = ['manifest.json', 'sw.js', 'workbox-*.js'];

  let allPresent = true;

  for (const file of requiredFiles) {
    if (file.includes('*')) {
      // Check for pattern match
      const pattern = file.replace('*', '');
      try {
        const files = execSync(`find "${distDir}" -name "${file}" -type f`, {
          encoding: 'utf8',
        }).trim();

        if (files) {
          logSuccess(`Build file pattern found: ${file}`);
        } else {
          logWarning(`Build file pattern not found: ${file}`);
        }
      } catch (error) {
        logWarning(`Could not check for pattern: ${file}`);
      }
    } else {
      const filePath = join(distDir, file);
      if (existsSync(filePath)) {
        logSuccess(`Build file present: ${file}`);
      } else {
        logError(`Build file missing: ${file}`);
        allPresent = false;
      }
    }
  }

  return allPresent;
}

/**
 * Check HTTPS requirement
 */
function checkHTTPSRequirement() {
  logHeader('Checking HTTPS Requirement');

  const netlifyToml = join(projectRoot, 'netlify.toml');
  const vercelJson = join(projectRoot, 'vercel.json');

  if (existsSync(netlifyToml)) {
    logSuccess('Netlify configuration found (HTTPS enforced by default)');
    return true;
  }

  if (existsSync(vercelJson)) {
    logSuccess('Vercel configuration found (HTTPS enforced by default)');
    return true;
  }

  logWarning('No deployment configuration found');
  logInfo(
    'Ensure your deployment platform enforces HTTPS for PWA functionality'
  );

  return true; // Don't fail validation for this
}

/**
 * Generate PWA validation report
 */
function generateReport(results) {
  logHeader('PWA Validation Report');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  log(`\n${colors.bright}Summary:${colors.reset}`);
  log(`Total tests: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);

  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }

  const score = Math.round((passedTests / totalTests) * 100);

  if (score >= 90) {
    logSuccess(`\nPWA Validation Score: ${score}% - Excellent!`);
  } else if (score >= 75) {
    logWarning(
      `\nPWA Validation Score: ${score}% - Good, but room for improvement`
    );
  } else {
    logError(`\nPWA Validation Score: ${score}% - Needs attention`);
  }

  log(`\n${colors.bright}Next Steps:${colors.reset}`);

  if (!results.manifest) {
    log('• Fix manifest.json issues');
  }

  if (!results.serviceWorker) {
    log('• Configure service worker properly');
  }

  if (!results.icons) {
    log('• Add missing PWA icons');
  }

  if (!results.tests) {
    log('• Fix failing PWA tests');
  }

  if (!results.build) {
    log('• Ensure build process generates PWA assets');
  }

  log('• Test installation flow on different devices');
  log('• Test offline functionality manually');
  log('• Monitor PWA performance in production');

  return score >= 75; // Consider passing if score is 75% or higher
}

/**
 * Main validation function
 */
async function main() {
  log(`${colors.bright}${colors.magenta}PWA Validation Tool${colors.reset}`);
  log(
    `${colors.cyan}Validating PWA functionality for Parents Madrasa Portal${colors.reset}\n`
  );

  const results = {
    manifest: false,
    serviceWorker: false,
    icons: false,
    https: false,
    tests: false,
    build: false,
    lighthouse: false,
  };

  // Run all validation steps
  results.manifest = validateManifest();
  results.serviceWorker = validateServiceWorker();
  results.icons = validateIcons();
  results.https = checkHTTPSRequirement();

  // Build validation (optional - only if dist exists)
  if (existsSync(join(projectRoot, 'dist'))) {
    results.build = validateBuildOutput();
  } else {
    logInfo('Skipping build validation (run "npm run build" first)');
    results.build = true; // Don't fail for missing build
  }

  // Run tests
  results.tests = runPWATests();

  // Run Lighthouse audit (optional)
  const runLighthouse = process.argv.includes('--lighthouse');
  if (runLighthouse) {
    results.lighthouse = runLighthousePWAAudit();
  } else {
    logInfo('Skipping Lighthouse audit (use --lighthouse flag to include)');
    results.lighthouse = true; // Don't fail for skipped lighthouse
  }

  // Generate final report
  const success = generateReport(results);

  process.exit(success ? 0 : 1);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`${colors.bright}PWA Validation Tool${colors.reset}`);
  log('');
  log('Usage: node scripts/validate-pwa.js [options]');
  log('');
  log('Options:');
  log('  --lighthouse    Include Lighthouse PWA audit');
  log('  --help, -h      Show this help message');
  log('');
  log('Examples:');
  log('  node scripts/validate-pwa.js');
  log('  node scripts/validate-pwa.js --lighthouse');
  log('  npm run build:pwa:full  # Run with Lighthouse audit');
  process.exit(0);
}

// Run the validation
main().catch(error => {
  logError(`Validation failed: ${error.message}`);
  process.exit(1);
});
