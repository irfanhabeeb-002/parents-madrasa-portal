# PWA Components

This directory contains Progressive Web App (PWA) related components for the Madrasa Portal application.

## Components

### InstallButton

A reusable button component that provides PWA installation functionality with proper UX and accessibility features.

#### Features

- **Smart Visibility**: Only renders when the app is installable and not already installed
- **Multiple Variants**: Primary, secondary, and minimal styling options
- **Responsive Sizing**: Small, medium, and large size options
- **Theme Support**: Automatic light/dark theme and high contrast mode support
- **Accessibility**: Full WCAG compliance with proper ARIA labels and keyboard navigation
- **Motion Preferences**: Respects user's reduced motion preferences
- **Customizable**: Supports custom content, icons, and styling

#### Usage

```tsx
import { InstallButton } from '../components/pwa';

// Basic usage
<InstallButton />

// With custom content and callbacks
<InstallButton
  variant="secondary"
  size="lg"
  onInstallStart={() => console.log('Install started')}
  onInstallComplete={(success) => console.log('Install completed:', success)}
>
  Install Madrasa Portal
</InstallButton>

// Minimal variant for inline use
<InstallButton
  variant="minimal"
  size="sm"
  showIcon={false}
>
  Install now
</InstallButton>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'minimal'` | `'primary'` | Button styling variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `className` | `string` | `''` | Additional CSS classes |
| `showIcon` | `boolean` | `true` | Whether to show the mobile app icon |
| `children` | `React.ReactNode` | `'Install App'` | Custom button content |
| `onInstallStart` | `() => void` | - | Callback when install process starts |
| `onInstallComplete` | `(success: boolean) => void` | - | Callback when install process completes |

### InstallPrompt

A comprehensive install prompt component with banner and modal functionality.

#### Features

- **Smart Banner**: Appears after 30 seconds with dismissal functionality
- **Detailed Modal**: Provides comprehensive installation information
- **Multilingual**: Supports English and Malayalam content
- **Accessibility**: Full screen reader support and keyboard navigation
- **Theme Aware**: Adapts to light/dark themes and high contrast mode

#### Usage

```tsx
import { InstallPrompt } from '../components/pwa';

// Add to your app layout
<InstallPrompt />
```

### useInstallPrompt Hook

A custom hook that manages PWA installation state and functionality.

#### Usage

```tsx
import { useInstallPrompt } from '../components/pwa';

function MyComponent() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

  const handleInstall = async () => {
    const success = await promptInstall();
    console.log('Install result:', success);
  };

  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <button onClick={handleInstall}>
      Install App
    </button>
  );
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `isInstallable` | `boolean` | Whether the app can be installed |
| `isInstalled` | `boolean` | Whether the app is already installed |
| `promptInstall` | `() => Promise<boolean>` | Function to trigger install prompt |

## TypeScript Types

The PWA components include comprehensive TypeScript types for browser APIs:

- `BeforeInstallPromptEvent`: Install prompt event interface
- `WebAppManifest`: Web app manifest structure
- `ManifestIcon`: Icon configuration interface
- `PWADisplayMode`: Display mode options

## Browser Support

- **Chrome/Edge**: Full PWA support including install prompts
- **Firefox**: Service worker and manifest support
- **Safari**: Limited PWA support, graceful degradation
- **Mobile Browsers**: Touch-optimized install experience

## Accessibility Features

- **WCAG 2.1 AA Compliance**: All components meet accessibility standards
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast Mode**: Automatic high contrast styling
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Reduced Motion**: Respects user motion preferences

## Examples

See `InstallButtonExample.tsx` for comprehensive usage examples and different implementation patterns.