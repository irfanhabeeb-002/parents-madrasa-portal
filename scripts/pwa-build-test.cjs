#!/usr/bin/env node

/**
 * PWA Build and Test Script
 * Integrates PWA testing into the build process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  log(`${colors.red}✗${colors.reset} ${message}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function runCommand(command, description) {
  try {
    log(`${colors.blue}Running:${colors.reset} ${command}`);
    execSync(command, { stdio: 'inherit' });
    logSuccess(description);
    return true;
  } catch (error) {
    logError(`${description} failed`);
    return false;
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    logSuccess(`${description} exists`);
    return true;
  } else {
    logError(`${description} not found at ${filePath}`);
    return false;
  }
}

function validateManifest() {
  const manifestPath = path.join(process.cwd(), 'dist', 'manifest.json');
  
  if (!checkFileExists(manifestPath, 'Manifest file')) {
    return false;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    let isValid = true;
    
    for (const field of requiredFields) {
      if (!manifest[field]) {
        logError(`Manifest missing required field: ${field}`);
        isValid = false;
      }
    }
    
    if (manifest.icons && Array.isArray(manifest.icons)) {
      const hasRequiredSizes = manifest.icons.some(icon => 
        icon.sizes && (icon.sizes.includes('192x192') || icon.sizes.includes('512x512'))
      );
      
      if (!hasRequiredSizes) {
        logError('Manifest must include icons with sizes 192x192 or 512x512');
        isValid = false;
      }
      
      const hasMaskableIcon = manifest.icons.some(icon => 
        icon.purpose && icon.purpose.includes('maskable')
      );
      
      if (!hasMaskableIcon) {
        logWarning('Consider adding maskable icons for better Android integration');
      }
    }
    
    if (isValid) {
      logSuccess('Manifest validation passed');
    }
    
    return isValid;
  } catch (error) {
    logError(`Failed to parse manifest: ${error.message}`);
    return false;
  }
}

function checkServiceWorker() {
  const swPath = path.join(process.cwd(), 'dist', 'sw.js');
  return checkFileExists(swPath, 'Service worker');
}

function checkIcons() {
  const iconsDir = path.join(process.cwd(), 'dist', 'icons');
  
  if (!fs.existsSync(iconsDir)) {
    logError('Icons directory not found');
    return false;
  }
  
  const requiredIcons = [
    'pwa-192x192.png',
    'pwa-512x512.jpg',
    'apple-touch-icon.png'
  ];
  
  let allIconsExist = true;
  
  for (const icon of requiredIcons) {
    const iconPath = path.join(iconsDir, icon);
    if (!fs.existsSync(iconPath)) {
      logError(`Required icon not found: ${icon}`);
      allIconsExist = false;
    }
  }
  
  if (allIconsExist) {
    logSuccess('All required icons found');
  }
  
  return allIconsExist;
}

function generatePWAReport() {
  const reportPath = path.join(process.cwd(), 'pwa-build-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    buildSuccess: true,
    checks: {
      manifest: false,
      serviceWorker: false,
      icons: false
    },
    warnings: [],
    errors: []
  };
  
  // Run checks and update report
  report.checks.manifest = validateManifest();
  report.checks.serviceWorker = checkServiceWorker();
  report.checks.icons = checkIcons();
  
  report.buildSuccess = Object.values(report.checks).every(Boolean);
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`\n${colors.cyan}PWA Build Report generated: ${reportPath}${colors.reset}`);
  
  return report;
}

async function main() {
  log(`${colors.bright}${colors.magenta}PWA Build and Test Script${colors.reset}`);
  log(`${colors.cyan}Building and testing PWA functionality...${colors.reset}\n`);
  
  let success = true;
  
  // Step 1: Build the application
  logStep('1', 'Building application');
  if (!runCommand('npm run build', 'Application build')) {
    process.exit(1);
  }
  
  // Step 2: Validate PWA assets
  logStep('2', 'Validating PWA assets');
  const report = generatePWAReport();
  
  if (!report.buildSuccess) {
    logError('PWA validation failed');
    success = false;
  }
  
  // Step 3: Run PWA-specific tests
  logStep('3', 'Running PWA tests');
  if (!runCommand('npm run test:pwa', 'PWA unit tests')) {
    logWarning('PWA tests failed - this may not block deployment');
  }
  
  // Step 4: Run Lighthouse PWA audit (optional)
  if (process.argv.includes('--lighthouse')) {
    logStep('4', 'Running Lighthouse PWA audit');
    if (!runCommand('npm run lighthouse:pwa', 'Lighthouse PWA audit')) {
      logWarning('Lighthouse audit failed - check configuration');
    }
  }
  
  // Final summary
  log(`\n${colors.bright}Build Summary:${colors.reset}`);
  
  if (success) {
    logSuccess('PWA build completed successfully');
    log(`${colors.green}✓ Manifest: Valid${colors.reset}`);
    log(`${colors.green}✓ Service Worker: Present${colors.reset}`);
    log(`${colors.green}✓ Icons: Complete${colors.reset}`);
    
    log(`\n${colors.bright}Next steps:${colors.reset}`);
    log(`• Deploy to your hosting platform`);
    log(`• Test installation on mobile devices`);
    log(`• Verify offline functionality`);
    log(`• Run full Lighthouse audit with: npm run lighthouse:pwa`);
    
    process.exit(0);
  } else {
    logError('PWA build completed with errors');
    log(`\n${colors.yellow}Please fix the above issues before deploying.${colors.reset}`);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`${colors.bright}PWA Build and Test Script${colors.reset}`);
  log(`\nUsage: node scripts/pwa-build-test.cjs [options]`);
  log(`\nOptions:`);
  log(`  --lighthouse    Run Lighthouse PWA audit after build`);
  log(`  --help, -h      Show this help message`);
  log(`\nThis script:`);
  log(`• Builds the application`);
  log(`• Validates PWA assets (manifest, service worker, icons)`);
  log(`• Runs PWA-specific tests`);
  log(`• Optionally runs Lighthouse PWA audit`);
  log(`• Generates a PWA build report`);
  process.exit(0);
}

// Run the main function
main().catch(error => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
});