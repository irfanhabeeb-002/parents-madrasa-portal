const fs = require('fs');
const path = require('path');

// Fix test files with unused variables
const testFixes = [
  {
    file: 'src/test/integration/pwa.test.ts',
    fixes: [
      { from: 'const error =', to: 'const _error =' },
      { from: 'const notification =', to: 'const _notification =' },
      { from: 'const clickEvent =', to: 'const _clickEvent =' },
      { from: 'const syncEvent =', to: 'const _syncEvent =' }
    ]
  },
  {
    file: 'src/test/integration/userWorkflows.test.tsx',
    fixes: [
      { from: 'const user =', to: 'const _user =' },
      { from: 'const rect =', to: 'const _rect =' }
    ]
  },
  {
    file: 'src/tests/accessibility-audit.test.tsx',
    fixes: [
      { from: 'fireEvent,', to: '_fireEvent,' },
      { from: 'App', to: '_App' },
      { from: 'const styles =', to: 'const _styles =' },
      { from: 'const minSize =', to: 'const _minSize =' },
      { from: 'const focusableElements =', to: 'const _focusableElements =' }
    ]
  },
  {
    file: 'src/tests/announcement-responsive.test.tsx',
    fixes: [
      { from: 'waitFor,', to: '_waitFor,' },
      { from: 'act,', to: '_act,' },
      { from: 'const rerender =', to: 'const _rerender =' }
    ]
  },
  {
    file: 'src/tests/auth-context-logout-unit.test.tsx',
    fixes: [
      { from: 'const error =', to: 'const _error =' }
    ]
  },
  {
    file: 'src/tests/auth-context-logout.test.tsx',
    fixes: [
      { from: 'const error =', to: 'const _error =' }
    ]
  },
  {
    file: 'src/tests/deployment-validation.test.tsx',
    fixes: [
      { from: 'const distIconsPath =', to: 'const _distIconsPath =' }
    ]
  },
  {
    file: 'src/tests/icon-consistency.test.tsx',
    fixes: [
      { from: 'React', to: '_React' },
      { from: 'render', to: '_render' },
      { from: 'const expectedBackgroundColor =', to: 'const _expectedBackgroundColor =' }
    ]
  },
  {
    file: 'src/tests/keyboard-navigation.test.tsx',
    fixes: [
      { from: 'fireEvent,', to: '_fireEvent,' }
    ]
  },
  {
    file: 'src/tests/logout-accessibility.test.tsx',
    fixes: [
      { from: 'const dialog =', to: 'const _dialog =' }
    ]
  },
  {
    file: 'src/tests/logout-comprehensive-fixed.test.tsx',
    fixes: [
      { from: 'waitFor,', to: '_waitFor,' },
      { from: 'userEvent', to: '_userEvent' },
      { from: 'axe', to: '_axe' },
      { from: 'allowedUsers', to: '_allowedUsers' },
      { from: 'const error =', to: 'const _error =' }
    ]
  },
  {
    file: 'src/tests/logout-comprehensive.test.tsx',
    fixes: [
      { from: 'allowedUsers', to: '_allowedUsers' },
      { from: 'const FullWrapper =', to: 'const _FullWrapper =' },
      { from: 'const error =', to: 'const _error =' },
      { from: 'const cancelButton =', to: 'const _cancelButton =' },
      { from: 'const styles =', to: 'const _styles =' }
    ]
  },
  {
    file: 'src/tests/logout-debug-simple.test.ts',
    fixes: [
      { from: 'render,', to: '_render,' },
      { from: 'screen,', to: '_screen,' },
      { from: 'fireEvent,', to: '_fireEvent,' },
      { from: 'waitFor', to: '_waitFor' },
      { from: 'BrowserRouter', to: '_BrowserRouter' },
      { from: 'React', to: '_React' }
    ]
  },
  {
    file: 'src/tests/logout-final.test.tsx',
    fixes: [
      { from: 'const error =', to: 'const _error =' }
    ]
  },
  {
    file: 'src/tests/logout-integration.test.tsx',
    fixes: [
      { from: 'fireEvent,', to: '_fireEvent,' }
    ]
  },
  {
    file: 'src/tests/logout-mobile.test.tsx',
    fixes: [
      { from: 'const styles =', to: 'const _styles =' }
    ]
  },
  {
    file: 'src/tests/session-cleanup-core.test.tsx',
    fixes: [
      { from: 'const error =', to: 'const _error =' }
    ]
  },
  {
    file: 'src/tests/session-cleanup-security.test.tsx',
    fixes: [
      { from: 'initialPath:', to: '_initialPath:' },
      { from: 'const error =', to: 'const _error =' },
      { from: 'const contextUser =', to: 'const _contextUser =' }
    ]
  },
  {
    file: 'src/tests/task6-verification.test.tsx',
    fixes: [
      { from: 'const error =', to: 'const _error =' }
    ]
  },
  {
    file: 'src/tests/task8-comprehensive-verification.test.tsx',
    fixes: [
      { from: 'const buttonRect =', to: 'const _buttonRect =' },
      { from: 'const computedStyle =', to: 'const _computedStyle =' }
    ]
  },
  {
    file: 'src/utils/mobileNotificationManager.ts',
    fixes: [
      { from: 'const error =', to: 'const _error =' }
    ]
  },
  {
    file: 'src/utils/performance.ts',
    fixes: [
      { from: 'process.env', to: 'typeof process !== "undefined" ? process.env' }
    ]
  }
];

function applyTestFixes() {
  for (const fileConfig of testFixes) {
    const filePath = path.join(__dirname, fileConfig.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const fix of fileConfig.fixes) {
      if (content.includes(fix.from)) {
        content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${fileConfig.file}`);
    }
  }
}

applyTestFixes();
console.log('Done!');