# BottomNavigation Component Documentation

## Overview

The `BottomNavigation` component provides a fixed bottom navigation menu for the Parents Madrasa Portal application. It offers easy access to the four main sections: Home, Live Class, Profile, and Settings. The component is designed with accessibility, responsiveness, and user experience in mind, particularly for users aged 40+.

## Features

- ✅ Fixed positioning at bottom of viewport
- ✅ Responsive design with mobile-first approach
- ✅ Full accessibility compliance (WCAG 2.1 AA)
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Dark mode and high contrast support
- ✅ Smooth animations with reduced motion support
- ✅ React Router integration
- ✅ Touch-friendly interface (44px+ touch targets)

## Props Interface

```typescript
interface BottomNavigationProps {
  // No props required - component is self-contained
  // Navigation state is managed internally via React Router
}
```

## Navigation Items Configuration

The component uses a predefined configuration for navigation items:

```javascript
const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    ariaLabel: 'Navigate to Home page',
    icon: <HomeIcon />
  },
  {
    id: 'live-class',
    label: 'Live Class',
    path: '/live-class',
    ariaLabel: 'Navigate to Live Class page',
    icon: <VideoIcon />
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    ariaLabel: 'Navigate to Profile page',
    icon: <UserIcon />
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    ariaLabel: 'Navigate to Settings page',
    icon: <SettingsIcon />
  }
];
```

## Usage Examples

### Basic Usage

```jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import BottomNavigation from './components/BottomNavigation';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* Your main content */}
        <main>
          {/* Page content goes here */}
        </main>
        
        {/* Bottom navigation - automatically handles routing */}
        <BottomNavigation />
      </div>
    </BrowserRouter>
  );
}
```

### Integration with Layout

```jsx
import React from 'react';
import BottomNavigation from './components/BottomNavigation';

function Layout({ children }) {
  return (
    <div className="layout">
      {/* Main content with bottom padding to avoid overlap */}
      <main style={{ paddingBottom: '80px' }}>
        {children}
      </main>
      
      {/* Fixed bottom navigation */}
      <BottomNavigation />
    </div>
  );
}
```

### With Custom Styling

```jsx
import React from 'react';
import styled from 'styled-components';
import BottomNavigation from './components/BottomNavigation';

const AppContainer = styled.div`
  min-height: 100vh;
  padding-bottom: 80px; /* Space for navigation */
  
  @media (max-width: 768px) {
    padding-bottom: 88px; /* More space on mobile */
  }
`;

function App() {
  return (
    <AppContainer>
      {/* Your content */}
      <BottomNavigation />
    </AppContainer>
  );
}
```

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

The component meets all WCAG 2.1 AA requirements:

#### Color and Contrast
- **Minimum contrast ratio**: 4.5:1 for normal text
- **Active state contrast**: High contrast between active and inactive states
- **High contrast mode**: Automatic adaptation for users with high contrast preferences

#### Touch Targets
- **Minimum size**: 44px × 56px (mobile: 48px × 60px)
- **Spacing**: Adequate spacing between touch targets
- **Visual feedback**: Clear hover and active states

#### Keyboard Navigation
- **Tab navigation**: All navigation items are keyboard accessible
- **Arrow keys**: Left/Right arrows navigate between items
- **Home/End keys**: Jump to first/last navigation item
- **Enter/Space**: Activate navigation items

#### Screen Reader Support
- **ARIA labels**: Descriptive labels for each navigation item
- **ARIA roles**: Proper navigation landmark
- **Live regions**: Announces navigation changes
- **Current page**: `aria-current="page"` for active item

### Accessibility Features

```jsx
// Example of accessibility features in action
<nav role="navigation" aria-label="Main navigation">
  <button
    aria-label="Navigate to Home page"
    aria-current="page" // Only on active item
    onKeyDown={handleKeyDown} // Keyboard support
  >
    <svg aria-hidden="true">{/* Icon */}</svg>
    <span>Home</span>
  </button>
</nav>
```

### Screen Reader Testing

Test with popular screen readers:
- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS/iOS)
- **TalkBack** (Android)

Expected announcements:
- "Main navigation landmark"
- "Navigate to Home page, button, current page"
- "Navigated to Profile" (on navigation)

## Responsive Behavior

### Breakpoints

The component adapts to different screen sizes:

#### Mobile (< 768px)
- **Touch targets**: 48px × 60px minimum
- **Font size**: 12px
- **Icon size**: 22px × 22px
- **Container padding**: 12px 16px
- **Enhanced touch feedback**: Scale animation on tap

#### Tablet (768px - 1024px)
- **Touch targets**: 44px × 56px
- **Font size**: 11px
- **Icon size**: 20px × 20px
- **Container padding**: 8px
- **Hover effects**: Enabled

#### Desktop (> 1024px)
- **Max width**: 500px (centered)
- **Hover effects**: Full hover support
- **Focus indicators**: Enhanced keyboard focus
- **Cursor**: Pointer on interactive elements

### Responsive CSS Examples

```css
/* Mobile-first approach */
.tab_button {
  min-height: 56px;
  min-width: 44px;
  font-size: 11px;
}

@media (max-width: 768px) {
  .tab_button {
    min-height: 60px;
    min-width: 48px;
    font-size: 12px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .tab_button:active {
    transform: scale(0.98);
    background-color: rgba(148, 163, 184, 0.2);
  }
}
```

## Theme Customization

### Dark Mode Support

The component automatically adapts to system dark mode preferences:

```css
@media (prefers-color-scheme: dark) {
  /* Dark theme styles */
  background: #1f2937;
  color: #9ca3af;
}
```

### High Contrast Mode

Automatic adaptation for high contrast preferences:

```css
@media (prefers-contrast: high) {
  .indicator {
    background: #000000;
  }
  
  .tab_button:focus {
    outline: 3px solid #000000;
  }
}
```

### Custom Theme Integration

To integrate with a custom theme system:

```jsx
import { ThemeProvider } from 'styled-components';

const theme = {
  navigation: {
    background: '#ffffff',
    activeColor: '#3b82f6',
    inactiveColor: '#64748b',
    hoverColor: '#475569'
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BottomNavigation />
    </ThemeProvider>
  );
}
```

### Reduced Motion Support

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .indicator,
  .tab_button,
  .tab_icon svg {
    transition: none;
  }
}
```

## Performance Considerations

### Optimization Features

- **Minimal re-renders**: Efficient state management
- **CSS transitions**: Hardware-accelerated animations
- **Event delegation**: Optimized event handling
- **Lazy loading**: Icons are inline SVG (no additional requests)

### Bundle Size Impact

- **Component size**: ~8KB (minified + gzipped)
- **Dependencies**: Uses existing React Router and styled-components
- **Icons**: Inline SVG (no icon library dependency)

### Performance Best Practices

```jsx
// Memoize navigation items to prevent re-creation
const navigationItems = useMemo(() => [
  // ... navigation items
], []);

// Use callback for navigation handler
const handleNavigation = useCallback((path, label, index) => {
  // ... navigation logic
}, [navigate]);
```

## Troubleshooting Guide

### Common Integration Issues

#### Issue: Navigation not working
**Symptoms**: Clicking navigation items doesn't change routes
**Solution**: Ensure React Router is properly configured

```jsx
// ❌ Missing Router wrapper
function App() {
  return <BottomNavigation />;
}

// ✅ Correct Router setup
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <BottomNavigation />
    </BrowserRouter>
  );
}
```

#### Issue: Active state not updating
**Symptoms**: Active indicator doesn't move when navigating
**Solution**: Check route configuration matches navigation paths

```jsx
// ❌ Route mismatch
<Route path="/dashboard" element={<Home />} />

// ✅ Correct route matching
<Route path="/" element={<Home />} />
<Route path="/live-class" element={<LiveClass />} />
```

#### Issue: Styling conflicts
**Symptoms**: Navigation appears broken or unstyled
**Solution**: Check for CSS conflicts and z-index issues

```css
/* Ensure navigation stays on top */
.bottom-navigation {
  z-index: 1000;
}

/* Avoid conflicts with other fixed elements */
.other-fixed-element {
  z-index: 999; /* Lower than navigation */
}
```

#### Issue: Accessibility warnings
**Symptoms**: Screen reader or accessibility testing tools report issues
**Solution**: Verify ARIA attributes and semantic HTML

```jsx
// ❌ Missing accessibility attributes
<div onClick={handleClick}>
  <span>Home</span>
</div>

// ✅ Proper accessibility
<button
  aria-label="Navigate to Home page"
  aria-current={isActive ? 'page' : undefined}
  onClick={handleClick}
>
  <span>Home</span>
</button>
```

### Performance Issues

#### Issue: Slow animations
**Symptoms**: Navigation transitions are choppy
**Solution**: Check for CSS conflicts and use hardware acceleration

```css
/* Enable hardware acceleration */
.indicator {
  transform: translateX(0);
  will-change: transform;
}

/* Avoid expensive properties in transitions */
.tab_button {
  /* ❌ Avoid transitioning layout properties */
  /* transition: width 0.3s; */
  
  /* ✅ Use transform and opacity */
  transition: transform 0.3s, opacity 0.3s;
}
```

#### Issue: Memory leaks
**Symptoms**: Performance degrades over time
**Solution**: Ensure proper cleanup of event listeners

```jsx
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };
  
  window.addEventListener('resize', handleResize);
  
  // ✅ Cleanup event listener
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### Mobile-Specific Issues

#### Issue: Touch targets too small
**Symptoms**: Difficult to tap on mobile devices
**Solution**: Verify minimum touch target sizes

```css
.tab_button {
  min-height: 44px;
  min-width: 44px;
  
  @media (max-width: 768px) {
    min-height: 48px;
    min-width: 48px;
  }
}
```

#### Issue: Navigation hidden by mobile browsers
**Symptoms**: Navigation covered by browser UI
**Solution**: Use proper viewport units and safe areas

```css
.bottom-navigation {
  bottom: 0;
  bottom: env(safe-area-inset-bottom, 0);
  padding-bottom: env(safe-area-inset-bottom, 8px);
}
```

### Testing Recommendations

#### Unit Testing
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

test('renders all navigation items', () => {
  render(
    <BrowserRouter>
      <BottomNavigation />
    </BrowserRouter>
  );
  
  expect(screen.getByLabelText('Navigate to Home page')).toBeInTheDocument();
  expect(screen.getByLabelText('Navigate to Live Class page')).toBeInTheDocument();
  expect(screen.getByLabelText('Navigate to Profile page')).toBeInTheDocument();
  expect(screen.getByLabelText('Navigate to Settings page')).toBeInTheDocument();
});
```

#### Accessibility Testing
```jsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(
    <BrowserRouter>
      <BottomNavigation />
    </BrowserRouter>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Visual Regression Testing
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
```

## Browser Support

### Supported Browsers

- **Chrome**: 88+ (full support)
- **Firefox**: 85+ (full support)
- **Safari**: 14+ (full support)
- **Edge**: 88+ (full support)
- **Mobile Safari**: iOS 14+ (full support)
- **Chrome Mobile**: Android 8+ (full support)

### Feature Compatibility

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| CSS Grid | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS Custom Properties | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS Media Queries Level 5 | ✅ | ✅ | ✅ | ✅ | ✅ |
| ARIA Support | ✅ | ✅ | ✅ | ✅ | ✅ |
| Touch Events | ✅ | ✅ | ✅ | ✅ | ✅ |

### Polyfills

No polyfills required for supported browsers. For older browser support, consider:

```jsx
// Optional: Add polyfills for older browsers
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

## Migration Guide

### From Previous Version

If migrating from an older navigation component:

1. **Update imports**:
   ```jsx
   // ❌ Old import
   import Navigation from './Navigation';
   
   // ✅ New import
   import BottomNavigation from './BottomNavigation';
   ```

2. **Remove custom props** (component is now self-contained):
   ```jsx
   // ❌ Old usage with props
   <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
   
   // ✅ New usage (no props needed)
   <BottomNavigation />
   ```

3. **Update CSS** (remove custom navigation styles):
   ```css
   /* ❌ Remove old navigation styles */
   .old-navigation { /* ... */ }
   
   /* ✅ Component is fully styled */
   ```

### Breaking Changes

- **Props removed**: Component no longer accepts props
- **Styling**: Now uses styled-components instead of CSS classes
- **Navigation**: Requires React Router for navigation functionality

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Run tests: `npm test`

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting (Prettier)
- Add JSDoc comments for public APIs
- Write tests for new features

### Testing Requirements

- Unit tests for all functionality
- Accessibility tests with jest-axe
- Visual regression tests
- Cross-browser testing

## License

This component is part of the Parents Madrasa Portal project and follows the same license terms.

## Support

For issues, questions, or contributions:

1. Check the troubleshooting guide above
2. Search existing issues in the project repository
3. Create a new issue with detailed reproduction steps
4. Include browser version and device information

---

*Last updated: December 2024*