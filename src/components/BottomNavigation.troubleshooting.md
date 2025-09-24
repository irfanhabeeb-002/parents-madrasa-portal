# BottomNavigation Troubleshooting Guide

## Overview

This guide provides solutions to common integration issues, performance problems, and debugging techniques for the BottomNavigation component. Use this guide to quickly identify and resolve issues during development and production.

## Common Integration Issues

### 1. Navigation Not Working

#### Symptoms

- Clicking navigation items doesn't change routes
- URL doesn't update when navigation items are clicked
- Page content doesn't change

#### Diagnosis

```jsx
// Check if React Router is properly configured
console.log('Current location:', window.location.pathname);
console.log('React Router location:', useLocation().pathname);
```

#### Solutions

**Missing Router Wrapper**

```jsx
// ❌ Incorrect - Missing Router
function App() {
  return (
    <div>
      <BottomNavigation />
    </div>
  );
}

// ✅ Correct - Wrapped in Router
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div>
        <BottomNavigation />
      </div>
    </BrowserRouter>
  );
}
```

**Route Configuration Mismatch**

```jsx
// ❌ Incorrect - Routes don't match navigation paths
<Routes>
  <Route path="/dashboard" element={<Home />} />
  <Route path="/classes" element={<LiveClass />} />
</Routes>

// ✅ Correct - Routes match navigation paths
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/live-class" element={<LiveClass />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

**Missing Route Components**

```jsx
// ❌ Missing route components
<Route path="/profile" element={null} />

// ✅ Proper route components
<Route path="/profile" element={<Profile />} />
```

### 2. Active State Not Updating

#### Symptoms

- Active indicator doesn't move when navigating
- Wrong navigation item appears active
- Active state is stuck on one item

#### Diagnosis

```jsx
// Add debugging to component
const BottomNavigation = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  console.log('Current pathname:', location.pathname);
  console.log('Active tab index:', activeTab);

  // ... rest of component
};
```

#### Solutions

**Incorrect Path Matching Logic**

```jsx
// ❌ Incorrect - Simple string comparison
const getActiveTabIndex = () => {
  const currentPath = location.pathname;
  return navigationItems.findIndex(item => item.path === currentPath);
};

// ✅ Correct - Handles root path and nested paths
const getActiveTabIndex = useCallback(() => {
  const currentPath = location.pathname;
  const index = navigationItems.findIndex(item => {
    if (item.path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(item.path);
  });
  return index >= 0 ? index : 0;
}, [location.pathname]);
```

**State Not Updating on Route Change**

```jsx
// ❌ Missing useEffect dependency
useEffect(() => {
  setActiveTab(getActiveTabIndex());
}, []); // Missing dependency

// ✅ Correct dependency array
useEffect(() => {
  setActiveTab(getActiveTabIndex());
}, [getActiveTabIndex]);
```

### 3. Styling Issues

#### Symptoms

- Navigation appears broken or unstyled
- Styles conflict with other components
- Layout is incorrect

#### Diagnosis

```jsx
// Check for CSS conflicts
console.log(
  'Navigation element:',
  document.querySelector('.bottom-navigation')
);
console.log(
  'Computed styles:',
  getComputedStyle(document.querySelector('.bottom-navigation'))
);
```

#### Solutions

**CSS Conflicts**

```css
/* ❌ Global styles affecting navigation */
button {
  background: red !important;
  border: 5px solid black !important;
}

/* ✅ Scope global styles to avoid conflicts */
.main-content button {
  background: red;
  border: 5px solid black;
}

/* Or use more specific selectors */
.bottom-navigation button {
  /* Navigation-specific styles take precedence */
}
```

**Z-Index Issues**

```css
/* ❌ Navigation hidden behind other elements */
.some-modal {
  z-index: 9999;
}

.bottom-navigation {
  z-index: 1000; /* Lower than modal */
}

/* ✅ Proper z-index hierarchy */
.bottom-navigation {
  z-index: 1000;
}

.modal {
  z-index: 1001; /* Higher than navigation when needed */
}

.tooltip {
  z-index: 1002; /* Highest for temporary elements */
}
```

**Styled Components Not Loading**

```jsx
// ❌ Missing styled-components import
import BottomNavigation from './BottomNavigation';

// ✅ Ensure styled-components is installed and imported
import styled from 'styled-components';
import BottomNavigation from './BottomNavigation';

// Check if styled-components is installed
console.log(
  'Styled components version:',
  require('styled-components/package.json').version
);
```

### 4. Accessibility Issues

#### Symptoms

- Screen readers not announcing navigation
- Keyboard navigation not working
- Focus indicators not visible

#### Diagnosis

```jsx
// Test keyboard navigation
document.addEventListener('keydown', e => {
  console.log('Key pressed:', e.key, 'Target:', e.target);
});

// Test screen reader announcements
const ariaLiveRegions = document.querySelectorAll('[aria-live]');
console.log('ARIA live regions:', ariaLiveRegions);
```

#### Solutions

**Missing ARIA Attributes**

```jsx
// ❌ Missing accessibility attributes
<div onClick={handleClick}>
  <span>Home</span>
</div>

// ✅ Proper accessibility attributes
<button
  aria-label="Navigate to Home page"
  aria-current={isActive ? 'page' : undefined}
  onClick={handleClick}
  type="button"
>
  <div aria-hidden="true">{/* Icon */}</div>
  <span>Home</span>
</button>
```

**Keyboard Navigation Not Working**

```jsx
// ❌ Missing keyboard event handlers
<button onClick={handleClick}>Home</button>

// ✅ Proper keyboard support
<button
  onClick={handleClick}
  onKeyDown={(e) => handleKeyDown(e, path, label, index)}
>
  Home
</button>
```

**Focus Indicators Not Visible**

```css
/* ❌ Focus outline removed without replacement */
.tab_button:focus {
  outline: none;
}

/* ✅ Custom focus indicators */
.tab_button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.tab_button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

## Performance Issues

### 1. Slow Animations

#### Symptoms

- Navigation transitions are choppy
- Indicator movement is laggy
- Poor performance on mobile devices

#### Diagnosis

```jsx
// Monitor performance
const observer = new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    console.log('Performance entry:', entry);
  });
});
observer.observe({ entryTypes: ['measure', 'navigation'] });

// Check for layout thrashing
const checkLayoutThrashing = () => {
  const start = performance.now();
  document.querySelector('.indicator').style.left = '50%';
  const end = performance.now();
  console.log('Layout time:', end - start);
};
```

#### Solutions

**Use Hardware Acceleration**

```css
/* ❌ CPU-based animations */
.indicator {
  left: 0;
  transition: left 0.3s ease;
}

/* ✅ GPU-accelerated animations */
.indicator {
  transform: translateX(0);
  transition: transform 0.3s ease;
  will-change: transform;
}
```

**Avoid Expensive CSS Properties**

```css
/* ❌ Expensive properties that cause reflow */
.tab_button {
  transition:
    width 0.3s,
    height 0.3s,
    padding 0.3s;
}

/* ✅ Cheap properties that only affect compositing */
.tab_button {
  transition:
    transform 0.3s,
    opacity 0.3s;
}
```

**Optimize Event Handlers**

```jsx
// ❌ Creating new functions on every render
<button onClick={() => handleNavigation(path, label, index)}>

// ✅ Memoized event handlers
const handleClick = useCallback(() => {
  handleNavigation(path, label, index);
}, [path, label, index, handleNavigation]);

<button onClick={handleClick}>
```

### 2. Memory Leaks

#### Symptoms

- Performance degrades over time
- Memory usage increases continuously
- Browser becomes unresponsive

#### Diagnosis

```jsx
// Monitor memory usage
const checkMemory = () => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
    });
  }
};

setInterval(checkMemory, 5000);
```

#### Solutions

**Clean Up Event Listeners**

```jsx
// ❌ Event listeners not cleaned up
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };

  window.addEventListener('resize', handleResize);
  // Missing cleanup
}, []);

// ✅ Proper cleanup
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

**Clean Up ARIA Live Regions**

```jsx
// ❌ ARIA live regions accumulating
const announcement = `Navigated to ${label}`;
const ariaLiveRegion = document.createElement('div');
ariaLiveRegion.setAttribute('aria-live', 'polite');
ariaLiveRegion.textContent = announcement;
document.body.appendChild(ariaLiveRegion);
// Missing cleanup

// ✅ Proper cleanup with timeout
const announcement = `Navigated to ${label}`;
const ariaLiveRegion = document.createElement('div');
ariaLiveRegion.setAttribute('aria-live', 'polite');
ariaLiveRegion.textContent = announcement;
document.body.appendChild(ariaLiveRegion);

setTimeout(() => {
  if (document.body.contains(ariaLiveRegion)) {
    document.body.removeChild(ariaLiveRegion);
  }
}, 1000);
```

## Mobile-Specific Issues

### 1. Touch Targets Too Small

#### Symptoms

- Difficult to tap navigation items on mobile
- Users miss taps frequently
- Poor user experience on touch devices

#### Diagnosis

```jsx
// Check touch target sizes
const checkTouchTargets = () => {
  const buttons = document.querySelectorAll('.tab_button');
  buttons.forEach((button, index) => {
    const rect = button.getBoundingClientRect();
    console.log(`Button ${index} size:`, {
      width: rect.width,
      height: rect.height,
      meetsWCAG: rect.width >= 44 && rect.height >= 44,
    });
  });
};
```

#### Solutions

**Increase Touch Target Sizes**

```css
/* ❌ Touch targets too small */
.tab_button {
  min-height: 40px;
  min-width: 40px;
}

/* ✅ WCAG compliant touch targets */
.tab_button {
  min-height: 44px;
  min-width: 44px;

  @media (max-width: 768px) {
    min-height: 48px;
    min-width: 48px;
  }
}
```

### 2. Navigation Hidden by Mobile Browsers

#### Symptoms

- Navigation covered by browser UI
- Navigation not visible in landscape mode
- Issues with iPhone home indicator

#### Solutions

**Use Safe Area Insets**

```css
/* ✅ Account for safe areas */
.bottom-navigation {
  bottom: 0;
  bottom: env(safe-area-inset-bottom, 0);
  padding-bottom: env(safe-area-inset-bottom, 8px);
}
```

**Handle Viewport Changes**

```jsx
// Handle viewport height changes on mobile
useEffect(() => {
  const handleViewportChange = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  window.addEventListener('resize', handleViewportChange);
  handleViewportChange();

  return () => {
    window.removeEventListener('resize', handleViewportChange);
  };
}, []);
```

```css
/* Use custom viewport height */
.main-content {
  min-height: calc(var(--vh, 1vh) * 100);
  padding-bottom: 80px;
}
```

## Browser-Specific Issues

### 1. Safari Issues

#### Symptoms

- Animations not working in Safari
- Touch events not firing correctly
- Styling differences in Safari

#### Solutions

**Safari Animation Support**

```css
/* ✅ Safari-compatible animations */
.indicator {
  -webkit-transform: translateX(0);
  transform: translateX(0);
  -webkit-transition: -webkit-transform 0.3s ease;
  transition: transform 0.3s ease;
}
```

**Safari Touch Event Handling**

```jsx
// ✅ Safari-compatible touch handling
const handleTouchStart = e => {
  // Prevent default to ensure touch events work
  e.preventDefault();
};

<button onTouchStart={handleTouchStart} onClick={handleClick}>
  Home
</button>;
```

### 2. Internet Explorer Issues

#### Symptoms

- Component not rendering in IE
- CSS Grid not working
- Modern JavaScript features failing

#### Solutions

**CSS Grid Fallback**

```css
/* ✅ Flexbox fallback for IE */
.tab-container {
  display: flex; /* Fallback */
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

/* IE-specific styles */
@media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
  .tab-container {
    display: flex;
  }

  .tab_button {
    flex: 1;
  }
}
```

**JavaScript Polyfills**

```jsx
// Add polyfills for IE support
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

## Debugging Tools and Techniques

### 1. React Developer Tools

```jsx
// Add debugging props to component
const BottomNavigation = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  // Debug information for React DevTools
  const debugInfo = {
    currentPath: location.pathname,
    activeTab,
    navigationItems: navigationItems.map(item => ({
      id: item.id,
      path: item.path,
      isActive: navigationItems.indexOf(item) === activeTab
    }))
  };

  // Make debug info available in DevTools
  useDebugValue(debugInfo);

  return (
    // Component JSX
  );
};
```

### 2. Console Debugging

```jsx
// Add comprehensive logging
const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Log navigation events
  const handleNavigation = (path, label, index) => {
    console.group('Navigation Event');
    console.log('From:', location.pathname);
    console.log('To:', path);
    console.log('Label:', label);
    console.log('Index:', index);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();

    setActiveTab(index);
    navigate(path);
  };

  // Log route changes
  useEffect(() => {
    console.log('Route changed:', location.pathname);
  }, [location.pathname]);

  return (
    // Component JSX
  );
};
```

### 3. Performance Monitoring

```jsx
// Monitor component performance
const BottomNavigation = () => {
  const renderStart = performance.now();

  useEffect(() => {
    const renderEnd = performance.now();
    console.log(`BottomNavigation render time: ${renderEnd - renderStart}ms`);
  });

  // Monitor navigation performance
  const handleNavigation = (path, label, index) => {
    const navStart = performance.now();

    setActiveTab(index);
    navigate(path);

    requestAnimationFrame(() => {
      const navEnd = performance.now();
      console.log(`Navigation time: ${navEnd - navStart}ms`);
    });
  };

  return (
    // Component JSX
  );
};
```

### 4. Accessibility Testing

```jsx
// Test accessibility programmatically
const testAccessibility = () => {
  const navigation = document.querySelector('[role="navigation"]');
  const buttons = navigation.querySelectorAll('button');

  console.group('Accessibility Test Results');

  // Check ARIA labels
  buttons.forEach((button, index) => {
    const ariaLabel = button.getAttribute('aria-label');
    const ariaCurrent = button.getAttribute('aria-current');

    console.log(`Button ${index}:`, {
      hasAriaLabel: !!ariaLabel,
      ariaLabel,
      ariaCurrent,
      isActive: ariaCurrent === 'page',
    });
  });

  // Check keyboard navigation
  const firstButton = buttons[0];
  const lastButton = buttons[buttons.length - 1];

  console.log('Keyboard navigation:', {
    firstButtonFocusable: firstButton.tabIndex >= 0,
    lastButtonFocusable: lastButton.tabIndex >= 0,
    totalFocusableElements: buttons.length,
  });

  console.groupEnd();
};

// Run accessibility test
useEffect(() => {
  testAccessibility();
}, []);
```

## Testing Strategies

### 1. Unit Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

describe('BottomNavigation', () => {
  const renderWithRouter = component => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  test('renders all navigation items', () => {
    renderWithRouter(<BottomNavigation />);

    expect(screen.getByLabelText('Navigate to Home page')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Navigate to Live Class page')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Navigate to Profile page')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Navigate to Settings page')
    ).toBeInTheDocument();
  });

  test('handles navigation correctly', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    renderWithRouter(<BottomNavigation />);

    fireEvent.click(screen.getByLabelText('Navigate to Profile page'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});
```

### 2. Integration Testing

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('navigation integrates correctly with routing', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  // Test that home is active initially
  const homeButton = screen.getByLabelText('Navigate to Home page');
  expect(homeButton).toHaveAttribute('aria-current', 'page');

  // Navigate to profile
  fireEvent.click(screen.getByLabelText('Navigate to Profile page'));

  // Test that profile is now active
  const profileButton = screen.getByLabelText('Navigate to Profile page');
  expect(profileButton).toHaveAttribute('aria-current', 'page');
});
```

### 3. Visual Regression Testing

```jsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

test('matches visual snapshot', () => {
  const { container } = render(
    <BrowserRouter>
      <BottomNavigation />
    </BrowserRouter>
  );

  expect(container.firstChild).toMatchSnapshot();
});

test('matches visual snapshot in dark mode', () => {
  // Mock dark mode preference
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });

  const { container } = render(
    <BrowserRouter>
      <BottomNavigation />
    </BrowserRouter>
  );

  expect(container.firstChild).toMatchSnapshot();
});
```

## Quick Reference

### Common Error Messages

| Error                                                                   | Cause                              | Solution                          |
| ----------------------------------------------------------------------- | ---------------------------------- | --------------------------------- |
| "useNavigate() may be used only in the context of a <Router> component" | Missing Router wrapper             | Wrap app in BrowserRouter         |
| "Cannot read property 'pathname' of undefined"                          | Missing location context           | Ensure component is inside Router |
| "Element is not focusable"                                              | Missing tabindex or button element | Use proper button elements        |
| "ARIA attribute is not allowed"                                         | Invalid ARIA usage                 | Check ARIA specification          |

### Performance Checklist

- [ ] Use hardware acceleration for animations
- [ ] Avoid expensive CSS properties in transitions
- [ ] Clean up event listeners and timers
- [ ] Use memoization for expensive calculations
- [ ] Test on low-end devices
- [ ] Monitor memory usage over time

### Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are clearly visible
- [ ] ARIA labels are descriptive and accurate
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 44px
- [ ] Screen reader announcements are appropriate

---

_This troubleshooting guide should help you quickly identify and resolve common issues with the BottomNavigation component. For additional support, refer to the main documentation and accessibility guidelines._
