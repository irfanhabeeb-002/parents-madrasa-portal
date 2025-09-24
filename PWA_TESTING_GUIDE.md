# PWA Testing and Validation Guide

This guide provides comprehensive instructions for testing and validating the Progressive Web App (PWA) functionality of the Parents Madrasa Portal.

## Overview

The PWA testing suite validates all aspects of PWA functionality including:
- **Manifest validation** (Requirement 6.1)
- **Service worker functionality** (Requirement 6.2) 
- **Install flow testing** (Requirement 6.3)
- **Offline functionality** (Requirement 6.4)
- **Performance validation** (Requirement 6.5)

## Quick Start

### Run All PWA Tests
```bash
# Run all PWA unit tests
npm run test:pwa

# Run comprehensive PWA validation
npm run validate:pwa

# Run validation with Lighthouse audit
npm run validate:pwa:full
```

### Individual Test Categories
```bash
# Run PWA validation tests only
npm run test:pwa:validation

# Run end-to-end PWA tests
npm run test:pwa:e2e

# Run specific test patterns
npm run test -- --grep "PWA"
npm run test -- --grep "manifest"
npm run test -- --grep "offline"
```

## Testing Categories

### 1. Manifest Validation (Requirement 6.1)

**Purpose**: Validate that the web app manifest meets all PWA requirements.

**What it tests**:
- Required manifest fields (name, short_name, start_url, display, icons)
- Icon requirements (192x192, 512x512, maskable icons)
- Display mode validation
- Theme and background colors
- Manifest accessibility

**Manual testing**:
```bash
# Check manifest in browser
# 1. Open DevTools → Application → Manifest
# 2. Verify all fields are present and valid
# 3. Check icon display and sizes
```

### 2. Service Worker Functionality (Requirement 6.2)

**Purpose**: Test service worker registration, caching strategies, and lifecycle management.

**What it tests**:
- Service worker registration and activation
- Precaching of essential assets
- Runtime caching strategies
- Cache management and cleanup
- Push notification handling
- Background sync capabilities

**Manual testing**:
```bash
# Check service worker in browser
# 1. Open DevTools → Application → Service Workers
# 2. Verify service worker is registered and active
# 3. Check cache storage in Application → Storage → Cache Storage
# 4. Test offline functionality by disabling network
```

### 3. Install Flow Testing (Requirement 6.3)

**Purpose**: Verify the app meets installability criteria and test installation flow.

**What it tests**:
- HTTPS requirement
- Service worker presence
- Valid manifest
- Install prompt handling
- Cross-browser compatibility
- Installation success/failure scenarios

**Manual testing**:
```bash
# Test installation flow
# 1. Open app in Chrome/Edge (desktop or mobile)
# 2. Look for install prompt in address bar
# 3. Click install and verify app appears on home screen/desktop
# 4. Test app launch in standalone mode
# 5. Verify app icon and name display correctly
```

### 4. Offline Functionality Testing (Requirement 6.4)

**Purpose**: Test offline capabilities across different pages and features.

**What it tests**:
- Page availability when offline
- API request fallbacks to cache
- Offline queue and background sync
- Network status detection
- Graceful degradation

**Manual testing**:
```bash
# Test offline functionality
# 1. Load the app and navigate to different pages
# 2. Open DevTools → Network → Check "Offline"
# 3. Navigate between pages and verify they load from cache
# 4. Try to perform actions and verify appropriate feedback
# 5. Re-enable network and verify sync works
```

### 5. Performance Validation (Requirement 6.5)

**Purpose**: Measure and validate PWA performance metrics.

**What it tests**:
- First Contentful Paint (< 1.5s)
- DOM Content Loaded (< 2s)
- Cache performance
- Resource loading optimization
- Lighthouse PWA score (> 90)

**Manual testing**:
```bash
# Test performance
# 1. Open DevTools → Lighthouse
# 2. Run PWA audit
# 3. Verify score is > 90
# 4. Check performance metrics in DevTools → Performance
```

## Test Commands Reference

### Unit Tests
```bash
# All PWA tests
npm run test:pwa

# Watch mode for development
npm run test:pwa:watch

# Specific test files
npm run test:pwa:validation
npm run test:pwa:e2e

# With coverage
npm run test:coverage -- --grep "PWA"
```

### Validation Scripts
```bash
# Quick validation
npm run validate:pwa

# Full validation with Lighthouse
npm run validate:pwa:full

# Build and validate
npm run build
npm run validate:pwa
```

### Lighthouse Audits
```bash
# PWA-focused audit
npm run lighthouse:pwa

# Full audit
npm run lighthouse

# Build and audit
npm run build:pwa:full
```

## Development Testing

### Using the PWA Test Suite Component

The app includes a comprehensive PWA test suite component for development testing:

1. **Access the test suite**:
   - Navigate to `/pwa-test` in development mode
   - Or import and use the `PWATestSuite` component

2. **Features**:
   - Run individual or all tests
   - Simulate offline mode
   - View detailed test results
   - Real-time test status updates

3. **Usage**:
   ```tsx
   import { PWATestSuite } from './components/pwa/PWATestSuite';
   
   // Use in development pages
   <PWATestSuite />
   ```

### Offline Simulation

```bash
# Enable offline simulation in development
# This will override fetch to simulate network failures
simulateOfflineMode(true);

# Disable offline simulation
simulateOfflineMode(false);
```

## Browser Testing

### Chrome/Chromium-based Browsers
- Full PWA support including install prompts
- Best testing experience
- Complete DevTools PWA debugging

### Firefox
- Service worker and manifest support
- Limited install prompt support
- Good for testing core PWA functionality

### Safari
- Basic PWA support
- Limited service worker features
- Test with web app meta tags

### Mobile Testing
- Test on actual mobile devices
- Verify touch interactions
- Test install flow on mobile browsers
- Check app icon and splash screen

## Continuous Integration

### GitHub Actions / CI Pipeline

```yaml
# Example CI configuration
- name: Run PWA Tests
  run: |
    npm run test:pwa
    npm run validate:pwa
    npm run build
    npm run lighthouse:pwa
```

### Pre-deployment Checklist

- [ ] All PWA unit tests pass
- [ ] PWA validation script passes
- [ ] Lighthouse PWA score > 90
- [ ] Manual installation test successful
- [ ] Offline functionality verified
- [ ] Cross-browser testing completed

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Check HTTPS requirement
   - Verify service worker file path
   - Check browser console for errors

2. **Install Prompt Not Appearing**
   - Verify all installability criteria are met
   - Check manifest validation
   - Test in supported browsers

3. **Offline Functionality Not Working**
   - Verify service worker is active
   - Check cache storage in DevTools
   - Ensure essential resources are cached

4. **Performance Issues**
   - Check resource sizes and optimization
   - Verify caching strategies
   - Use Lighthouse for detailed analysis

### Debug Commands

```bash
# Verbose test output
npm run test:pwa -- --reporter=verbose

# Debug specific test
npm run test -- --grep "specific test name" --reporter=verbose

# Check build output
npm run build
ls -la dist/

# Validate manifest manually
curl https://your-app.com/manifest.json | jq
```

## Performance Targets

| Metric | Target | Test Method |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| DOM Content Loaded | < 2s | Performance API |
| Lighthouse PWA Score | > 90 | Lighthouse audit |
| Cache Hit Ratio | > 80% | Service worker metrics |
| Install Prompt Time | < 30s | Manual testing |

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse PWA Audits](https://web.dev/lighthouse-pwa/)
- [Service Worker Testing](https://web.dev/service-worker-lifecycle/)
- [Web App Manifest](https://web.dev/add-manifest/)

## Support

For issues with PWA testing:
1. Check this guide first
2. Review test output and error messages
3. Use browser DevTools for debugging
4. Check the PWA test suite component for detailed results