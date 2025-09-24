#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root directory
const projectRoot = path.resolve(__dirname, '..');

// Read package.json
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const dependencies = Object.keys(packageJson.dependencies || {});
const devDependencies = Object.keys(packageJson.devDependencies || {});
const allDependencies = [...dependencies, ...devDependencies];

// Directories to scan for imports
const scanDirectories = ['src', 'public', '.'];
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css'];

// Track found imports
const foundImports = new Set();
const importPatterns = new Set();

// Function to scan file for imports
function scanFileForImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Patterns to match imports
    const importRegexes = [
      // ES6 imports: import ... from 'package'
      /import\s+(?:[\w\s{},*]+\s+from\s+)?['"`]([^'"`]+)['"`]/g,
      // CommonJS require: require('package')
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      // Dynamic imports: import('package')
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      // CSS imports: @import 'package'
      /@import\s+['"`]([^'"`]+)['"`]/g,
    ];

    importRegexes.forEach(regex => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const importPath = match[1];
        importPatterns.add(importPath);

        // Extract package name (handle scoped packages)
        let packageName = importPath;
        if (importPath.startsWith('@')) {
          // Scoped package: @scope/package or @scope/package/subpath
          const parts = importPath.split('/');
          if (parts.length >= 2) {
            packageName = `${parts[0]}/${parts[1]}`;
          }
        } else {
          // Regular package: package or package/subpath
          packageName = importPath.split('/')[0];
        }

        if (allDependencies.includes(packageName)) {
          foundImports.add(packageName);
        }
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

// Function to recursively scan directory
function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (
          !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item)
        ) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (fileExtensions.includes(ext)) {
          scanFileForImports(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
}

// Scan all specified directories
console.log('🔍 Scanning codebase for dependency usage...\n');

scanDirectories.forEach(dir => {
  const fullPath = path.join(projectRoot, dir);
  if (fs.existsSync(fullPath)) {
    scanDirectory(fullPath);
  }
});

// Analyze results
const usedDependencies = Array.from(foundImports).filter(dep =>
  dependencies.includes(dep)
);
const usedDevDependencies = Array.from(foundImports).filter(dep =>
  devDependencies.includes(dep)
);
const unusedDependencies = dependencies.filter(dep => !foundImports.has(dep));
const unusedDevDependencies = devDependencies.filter(
  dep => !foundImports.has(dep)
);

// Special cases - dependencies that might be used indirectly
const specialCases = {
  // Build tools and configs that might not show up in imports
  vite: 'Build tool - used in package.json scripts',
  typescript: 'TypeScript compiler - used in build process',
  eslint: 'Linting tool - used in package.json scripts',
  prettier: 'Code formatter - used in package.json scripts',
  husky: 'Git hooks - used in package.json prepare script',
  'lint-staged': 'Pre-commit tool - used with husky',
  vitest: 'Testing framework - used in package.json scripts',
  jsdom: 'DOM implementation for testing - used by vitest',
  tailwindcss: 'CSS framework - used in build process',
  '@vitejs/plugin-react': 'Vite React plugin - used in vite.config.ts',
  'vite-plugin-pwa': 'PWA plugin - used in vite.config.ts',
  'vite-tsconfig-paths': 'TypeScript paths plugin - used in vite.config.ts',
  '@tailwindcss/vite': 'Tailwind Vite plugin - used in vite.config.ts',
  globals: 'Global variables for ESLint - used in eslint.config.js',
  '@lhci/cli': 'Lighthouse CI - used in package.json scripts',
  'audit-ci': 'Security audit tool - used in package.json scripts',
  'workbox-webpack-plugin':
    'Service worker plugin - might be used by vite-plugin-pwa',
};

// Report results
console.log('📊 DEPENDENCY ANALYSIS REPORT');
console.log('================================\n');

console.log('✅ USED DEPENDENCIES:');
usedDependencies.forEach(dep => {
  console.log(`  ✓ ${dep}`);
});

console.log('\n✅ USED DEV DEPENDENCIES:');
usedDevDependencies.forEach(dep => {
  console.log(`  ✓ ${dep}`);
});

console.log('\n❌ POTENTIALLY UNUSED DEPENDENCIES:');
if (unusedDependencies.length === 0) {
  console.log('  None found!');
} else {
  unusedDependencies.forEach(dep => {
    if (specialCases[dep]) {
      console.log(`  ⚠️  ${dep} - ${specialCases[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - Consider removing`);
    }
  });
}

console.log('\n❌ POTENTIALLY UNUSED DEV DEPENDENCIES:');
if (unusedDevDependencies.length === 0) {
  console.log('  None found!');
} else {
  unusedDevDependencies.forEach(dep => {
    if (specialCases[dep]) {
      console.log(`  ⚠️  ${dep} - ${specialCases[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - Consider removing`);
    }
  });
}

console.log('\n🔧 RECOMMENDATIONS:');
const trulyUnused = [
  ...unusedDependencies.filter(dep => !specialCases[dep]),
  ...unusedDevDependencies.filter(dep => !specialCases[dep]),
];

if (trulyUnused.length === 0) {
  console.log('  All dependencies appear to be in use!');
} else {
  console.log('  Consider removing these packages:');
  trulyUnused.forEach(dep => {
    console.log(`    npm uninstall ${dep}`);
  });
}

console.log('\n📋 SUMMARY:');
console.log(`  Total dependencies: ${dependencies.length}`);
console.log(`  Used dependencies: ${usedDependencies.length}`);
console.log(`  Total dev dependencies: ${devDependencies.length}`);
console.log(`  Used dev dependencies: ${usedDevDependencies.length}`);
console.log(`  Potentially unused: ${trulyUnused.length}`);

// Export results for programmatic use
export const analysisResults = {
  usedDependencies,
  usedDevDependencies,
  unusedDependencies,
  unusedDevDependencies,
  trulyUnused,
  specialCases,
};
