import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  base: '/',
  root: '.',
  publicDir: 'public',
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    // Image optimization plugin
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 85 },
      pngquant: { quality: [0.65, 0.8] },
      webp: { quality: 85 },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon.ico',
        'icons/apple-touch-icon.png',
        'icons/masked-icon.svg',
        'icons/pwa-192x192.png',
        'icons/pwa-192x192.jpg',
        'icons/pwa-512x512.jpg',
      ],
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'Parents Madrasa Portal',
        short_name: 'Madrasa Portal',
        description: 'Islamic education portal for parents and students',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-192x192.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: 'icons/pwa-512x512.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
          {
            src: 'icons/pwa-512x512.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
        // Increase maximum file size for caching
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
        // Runtime caching strategies
        runtimeCaching: [
          // Google Fonts - Cache First (long-term cache)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Google Fonts CSS - Stale While Revalidate
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Firebase Storage - Stale While Revalidate for better performance
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Firebase API calls - Network First with fallback
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              networkTimeoutSeconds: 10,
            },
          },
          // Images - Cache First with fallback
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // API routes - Network First
          {
            urlPattern: /^.*\/api\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 5,
            },
          },
          // Static assets - Stale While Revalidate
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Enable code splitting and chunk optimization
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks: id => {
          // Node modules vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router')
            ) {
              return 'react-vendor';
            }

            // Firebase - separate chunk due to size
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }

            // Zoom SDK - separate chunk due to size
            if (id.includes('@zoom/meetingsdk')) {
              return 'zoom-vendor';
            }

            // UI libraries
            if (id.includes('@heroicons') || id.includes('tailwindcss')) {
              return 'ui-vendor';
            }

            // Other vendor libraries
            return 'vendor';
          }

          // Application code chunks
          // Services - group by functionality
          if (id.includes('/src/services/')) {
            if (
              id.includes('zoomService') ||
              id.includes('zoomRecordingService')
            ) {
              return 'zoom-services';
            }
            if (
              id.includes('firebaseService') ||
              id.includes('storageService') ||
              id.includes('dataSync')
            ) {
              return 'firebase-services';
            }
            if (
              id.includes('notificationService') ||
              id.includes('backgroundSync')
            ) {
              return 'notification-services';
            }
            return 'core-services';
          }

          // Contexts
          if (id.includes('/src/contexts/')) {
            return 'contexts';
          }

          // Components - group by feature
          if (id.includes('/src/components/')) {
            if (id.includes('/auth/')) {
              return 'auth-components';
            }
            if (id.includes('/zoom/')) {
              return 'zoom-components';
            }
            if (id.includes('/notifications/')) {
              return 'notification-components';
            }
            if (id.includes('/accessibility/')) {
              return 'accessibility-components';
            }
            if (id.includes('/ui/')) {
              return 'ui-components';
            }
            return 'common-components';
          }

          // Pages - each page as separate chunk for route-based splitting
          if (id.includes('/src/pages/')) {
            const pageName = id
              .split('/')
              .pop()
              ?.replace('.tsx', '')
              .replace('.ts', '')
              .toLowerCase();
            return `page-${pageName}`;
          }

          // Utils and hooks
          if (id.includes('/src/utils/') || id.includes('/src/hooks/')) {
            return 'utils';
          }

          // Types and config
          if (id.includes('/src/types/') || id.includes('/src/config/')) {
            return 'config';
          }
        },
        // Optimize chunk names for caching
        chunkFileNames: () => {
          return `js/[name]-[hash:8].js`;
        },
        entryFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: assetInfo => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext || '')) {
            return `images/[name]-[hash:8][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash:8][extname]`;
          }
          if (/woff2?|ttf|eot/i.test(ext || '')) {
            return `fonts/[name]-[hash:8][extname]`;
          }
          return `assets/[name]-[hash:8][extname]`;
        },
      },
    },
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Set chunk size warning limit (increased for complex app)
    chunkSizeWarningLimit: 1500,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
    ],
    exclude: [
      // Exclude heavy libraries that should be lazy loaded
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/messaging',
      '@zoom/meetingsdk',
    ],
  },
  // Improve build performance
  esbuild: {
    // Drop console and debugger in production
    drop: ['console', 'debugger'],
    // Enable legal comments for licenses
    legalComments: 'none',
  },
});
