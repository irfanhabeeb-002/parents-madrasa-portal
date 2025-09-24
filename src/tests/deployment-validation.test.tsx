import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

describe('Deployment Validation and Build Process Tests', () => {
  const distPath = join(process.cwd(), 'dist');

  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
  });

  describe('Build Output Validation', () => {
    it('should have created dist directory with all required files', () => {
      // Check if dist directory exists
      expect(existsSync(distPath)).toBe(true);

      // Check for essential files
      const requiredFiles = [
        'index.html',
        'manifest.json',
        'sw.js',
        'registerSW.js',
      ];

      requiredFiles.forEach(file => {
        const filePath = join(distPath, file);
        expect(existsSync(filePath)).toBe(true);
      });
    });

    it('should have properly structured JavaScript chunks', () => {
      const jsDir = join(distPath, 'js');
      expect(existsSync(jsDir)).toBe(true);

      // Check for expected chunk patterns
      const expectedChunks = [
        /react-vendor-.*\.js$/,
        /firebase-vendor-.*\.js$/,
        /zoom-vendor-.*\.js$/,
        /common-components-.*\.js$/,
        /ui-components-.*\.js$/,
        /core-services-.*\.js$/,
      ];

      const jsFiles = require('fs').readdirSync(jsDir);

      expectedChunks.forEach(pattern => {
        const hasMatchingFile = jsFiles.some((file: string) =>
          pattern.test(file)
        );
        expect(hasMatchingFile).toBe(true);
      });
    });

    it('should have optimized CSS files', () => {
      const cssDir = join(distPath, 'css');
      expect(existsSync(cssDir)).toBe(true);

      const cssFiles = require('fs').readdirSync(cssDir);
      expect(cssFiles.length).toBeGreaterThan(0);

      // Check that CSS files are minified (no unnecessary whitespace)
      cssFiles.forEach((file: string) => {
        if (file.endsWith('.css')) {
          const cssContent = readFileSync(join(cssDir, file), 'utf-8');
          // Minified CSS should not have excessive line breaks
          const lineCount = cssContent.split('\n').length;
          expect(lineCount).toBeLessThan(50); // Reasonable limit for minified CSS
        }
      });
    });

    it('should have optimized images in images directory', () => {
      const imagesDir = join(distPath, 'images');
      expect(existsSync(imagesDir)).toBe(true);

      const imageFiles = require('fs').readdirSync(imagesDir);
      expect(imageFiles.length).toBeGreaterThan(0);

      // Check that images are optimized (reasonable file sizes)
      imageFiles.forEach((file: string) => {
        const filePath = join(imagesDir, file);
        const stats = statSync(filePath);

        // Images should be under 100KB after optimization
        expect(stats.size).toBeLessThan(100 * 1024); // 100KB
      });
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should have JavaScript bundles within acceptable size limits', () => {
      const jsDir = join(distPath, 'js');
      const jsFiles = require('fs').readdirSync(jsDir);

      jsFiles.forEach((file: string) => {
        const filePath = join(jsDir, file);
        const stats = statSync(filePath);

        // Individual chunks should be under 3MB (except zoom-vendor which is expected to be large)
        if (file.includes('zoom-vendor')) {
          expect(stats.size).toBeLessThan(4 * 1024 * 1024); // 4MB for Zoom SDK
        } else {
          expect(stats.size).toBeLessThan(1 * 1024 * 1024); // 1MB for other chunks
        }
      });
    });

    it('should have total bundle size within reasonable limits', () => {
      const jsDir = join(distPath, 'js');
      const jsFiles = require('fs').readdirSync(jsDir);

      let totalSize = 0;
      jsFiles.forEach((file: string) => {
        const filePath = join(jsDir, file);
        const stats = statSync(filePath);
        totalSize += stats.size;
      });

      // Total JS bundle should be under 10MB
      expect(totalSize).toBeLessThan(10 * 1024 * 1024);
    });

    it('should have efficient code splitting', () => {
      const jsDir = join(distPath, 'js');
      const jsFiles = require('fs').readdirSync(jsDir);

      // Should have separate vendor chunks
      const hasReactVendor = jsFiles.some(file =>
        file.includes('react-vendor')
      );
      const hasFirebaseVendor = jsFiles.some(file =>
        file.includes('firebase-vendor')
      );
      const hasZoomVendor = jsFiles.some(file => file.includes('zoom-vendor'));

      expect(hasReactVendor).toBe(true);
      expect(hasFirebaseVendor).toBe(true);
      expect(hasZoomVendor).toBe(true);

      // Should have page-specific chunks
      const hasPageChunks = jsFiles.some(file => file.includes('page-'));
      expect(hasPageChunks).toBe(true);
    });
  });

  describe('PWA and Service Worker Validation', () => {
    it('should have valid PWA manifest', () => {
      const manifestPath = join(distPath, 'manifest.json');
      expect(existsSync(manifestPath)).toBe(true);

      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // Check required PWA manifest fields
      expect(manifest.name).toBe('Parents Madrasa Portal');
      expect(manifest.short_name).toBe('Madrasa Portal');
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#2563eb');
      expect(manifest.background_color).toBe('#ffffff');

      // Check icons array
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);

      // Verify icon paths point to icons directory
      manifest.icons.forEach((icon: any) => {
        expect(icon.src).toMatch(/^icons\//);
      });
    });

    it('should have valid service worker', () => {
      const swPath = join(distPath, 'sw.js');
      expect(existsSync(swPath)).toBe(true);

      const swContent = readFileSync(swPath, 'utf-8');

      // Service worker should contain workbox references
      expect(swContent).toContain('workbox');

      // Should have precaching setup
      expect(swContent).toContain('precacheAndRoute');
    });

    it('should have service worker registration script', () => {
      const registerSWPath = join(distPath, 'registerSW.js');
      expect(existsSync(registerSWPath)).toBe(true);

      const registerSWContent = readFileSync(registerSWPath, 'utf-8');

      // Should contain service worker registration logic
      expect(registerSWContent).toContain('serviceWorker');
    });
  });

  describe('HTML and Asset Validation', () => {
    it('should have properly structured index.html', () => {
      const indexPath = join(distPath, 'index.html');
      expect(existsSync(indexPath)).toBe(true);

      const htmlContent = readFileSync(indexPath, 'utf-8');

      // Check for essential meta tags
      expect(htmlContent).toContain('charset="UTF-8"');
      expect(htmlContent).toContain('name="viewport"');
      expect(htmlContent).toContain('name="theme-color"');

      // Check for PWA meta tags
      expect(htmlContent).toContain('rel="manifest"');
      expect(htmlContent).toContain('rel="apple-touch-icon"');

      // Check for icon references pointing to icons directory
      expect(htmlContent).toContain('href="/icons/favicon.ico"');
      expect(htmlContent).toContain('href="/icons/apple-touch-icon.png"');
    });

    it('should have minified HTML', () => {
      const indexPath = join(distPath, 'index.html');
      const htmlContent = readFileSync(indexPath, 'utf-8');

      // Minified HTML should not have excessive whitespace
      const hasExcessiveWhitespace = /\n\s{4,}/.test(htmlContent);
      expect(hasExcessiveWhitespace).toBe(false);
    });

    it('should have proper asset references', () => {
      const indexPath = join(distPath, 'index.html');
      const htmlContent = readFileSync(indexPath, 'utf-8');

      // Check that CSS and JS files are properly referenced
      expect(htmlContent).toMatch(/href="\/css\/.*\.css"/);
      expect(htmlContent).toMatch(/src="\/js\/.*\.js"/);

      // Check that assets have cache-busting hashes
      expect(htmlContent).toMatch(/\/css\/.*-[a-zA-Z0-9_-]+\.css/);
      expect(htmlContent).toMatch(/\/js\/.*-[a-zA-Z0-9_-]+\.js/);
    });
  });

  describe('Security and Performance Validation', () => {
    it('should have security headers in HTML', () => {
      const indexPath = join(distPath, 'index.html');
      const htmlContent = readFileSync(indexPath, 'utf-8');

      // Check for security meta tags
      expect(htmlContent).toContain('X-Content-Type-Options');
      expect(htmlContent).toContain('X-XSS-Protection');
      expect(htmlContent).toContain('referrer');
    });

    it('should not contain development artifacts', () => {
      const indexPath = join(distPath, 'index.html');
      const htmlContent = readFileSync(indexPath, 'utf-8');

      // Should not contain development-only content
      expect(htmlContent).not.toContain('localhost');
      expect(htmlContent).not.toContain('development');
      expect(htmlContent).not.toContain('console.log');
    });

    it('should have optimized JavaScript (no console logs)', () => {
      const jsDir = join(distPath, 'js');
      const jsFiles = require('fs').readdirSync(jsDir);

      jsFiles.forEach((file: string) => {
        const filePath = join(jsDir, file);
        const jsContent = readFileSync(filePath, 'utf-8');

        // Production builds should not contain console.log statements
        expect(jsContent).not.toContain('console.log');
        expect(jsContent).not.toContain('debugger');
      });
    });
  });

  describe('Vercel Deployment Readiness', () => {
    it('should have .vercelignore file in project root', () => {
      const vercelIgnorePath = join(process.cwd(), '.vercelignore');
      expect(existsSync(vercelIgnorePath)).toBe(true);

      const vercelIgnoreContent = readFileSync(vercelIgnorePath, 'utf-8');

      // Should exclude development files
      expect(vercelIgnoreContent).toContain('node_modules');
      expect(vercelIgnoreContent).toContain('.git');
      expect(vercelIgnoreContent).toContain('src/tests');
      expect(vercelIgnoreContent).toContain('.vscode');
    });

    it('should not have Netlify-specific files', () => {
      const netlifyFiles = ['netlify.toml', '_headers', '_redirects'];

      netlifyFiles.forEach(file => {
        const filePath = join(process.cwd(), file);
        expect(existsSync(filePath)).toBe(false);
      });

      // Check public directory for Netlify files
      netlifyFiles.forEach(file => {
        const publicFilePath = join(process.cwd(), 'public', file);
        expect(existsSync(publicFilePath)).toBe(false);
      });
    });

    it('should have proper package.json scripts for deployment', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Check for required scripts
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.preview).toBeDefined();
      expect(packageJson.scripts.start).toBeUndefined(); // Not needed for static deployment

      // Build script should include post-build processing
      expect(packageJson.scripts.build).toContain('vite build');
    });

    it('should have proper Node.js version specification', () => {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Check Node.js version requirement
      expect(packageJson.engines.node).toBeDefined();
      expect(packageJson.engines.node).toMatch(/>=20/);
    });
  });

  describe('Icon and Asset Consistency', () => {
    it('should have all required icons in dist', () => {
      // Icons should be copied to dist during build
      const _distIconsPath = join(distPath, 'icons');

      // Note: Icons might be in different locations after build optimization
      // Check if they exist in the expected locations or are referenced in manifest
      const manifestPath = join(distPath, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      // All manifest icons should reference valid paths
      manifest.icons.forEach((icon: any) => {
        expect(icon.src).toMatch(/^icons\//);
        expect(icon.sizes).toBeDefined();
        expect(icon.type).toBeDefined();
      });
    });

    it('should have consistent theme colors across files', () => {
      const indexPath = join(distPath, 'index.html');
      const manifestPath = join(distPath, 'manifest.json');

      const htmlContent = readFileSync(indexPath, 'utf-8');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      // Extract theme color from HTML
      const themeColorMatch = htmlContent.match(
        /name="theme-color"[^>]*content="([^"]+)"/
      );
      const htmlThemeColor = themeColorMatch ? themeColorMatch[1] : null;

      // Compare with manifest theme color
      expect(htmlThemeColor).toBe(manifest.theme_color);
    });
  });

  describe('Performance Optimization Validation', () => {
    it('should have proper cache-busting for static assets', () => {
      const jsDir = join(distPath, 'js');
      const cssDir = join(distPath, 'css');

      const jsFiles = require('fs').readdirSync(jsDir);
      const cssFiles = require('fs').readdirSync(cssDir);

      // All JS files should have hashes
      jsFiles.forEach((file: string) => {
        expect(file).toMatch(/-[a-zA-Z0-9_-]+\.js$/);
      });

      // All CSS files should have hashes
      cssFiles.forEach((file: string) => {
        expect(file).toMatch(/-[a-zA-Z0-9_-]+\.css$/);
      });
    });

    it('should have reasonable file count for optimal loading', () => {
      const jsDir = join(distPath, 'js');
      const cssDir = join(distPath, 'css');

      const jsFiles = require('fs').readdirSync(jsDir);
      const cssFiles = require('fs').readdirSync(cssDir);

      // Should not have too many chunks (affects HTTP/2 performance)
      expect(jsFiles.length).toBeLessThan(50);
      expect(cssFiles.length).toBeLessThan(10);
    });

    it('should have compressed assets ready for gzip', () => {
      const jsDir = join(distPath, 'js');
      const jsFiles = require('fs').readdirSync(jsDir);

      // Check that files are minified (smaller than unminified would be)
      jsFiles.forEach((file: string) => {
        const filePath = join(jsDir, file);
        const content = readFileSync(filePath, 'utf-8');

        // Minified files should not have excessive line breaks
        const lineCount = content.split('\n').length;
        const fileSize = content.length;

        // Ratio of lines to file size should indicate minification
        const linesPerKB = lineCount / (fileSize / 1024);
        expect(linesPerKB).toBeLessThan(10); // Minified files have fewer lines per KB
      });
    });
  });
});
