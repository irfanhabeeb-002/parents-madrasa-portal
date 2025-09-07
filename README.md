# Parents Madrasa Portal

A mobile-first Progressive Web Application (PWA) for Islamic education, built with React, TypeScript, and TailwindCSS.

## Features

- 📱 Mobile-first responsive design
- ♿ Accessibility-compliant (WCAG AA)
- 🔄 Progressive Web App (PWA) capabilities
- 🎨 TailwindCSS with custom accessibility utilities
- 🔧 TypeScript for type safety
- 📋 ESLint + Prettier for code quality
- 🪝 Husky pre-commit hooks
- 🚀 Vite for fast development and builds

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

### Building

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Code Quality

Run linting:

```bash
npm run lint
npm run lint:fix
```

Format code:

```bash
npm run format
npm run format:check
```

Type checking:

```bash
npm run typecheck
```

## Project Structure

```
src/
├── App.tsx          # Main application component
├── App.css          # Global styles with accessibility utilities
└── main.tsx         # Application entry point

public/
├── pwa-*.png        # PWA icons (placeholder)
├── apple-touch-icon.png
├── masked-icon.svg
└── favicon.ico
```

## Accessibility Features

- Minimum 44px touch targets
- High contrast mode support
- Reduced motion support
- Screen reader compatibility
- Keyboard navigation
- ARIA labels and roles

## PWA Features

- Service worker for offline support
- Web app manifest
- Installable on mobile devices
- Background sync capabilities

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: TailwindCSS v4
- **Build Tool**: Vite
- **Router**: React Router DOM v6
- **PWA**: Vite PWA Plugin + Workbox
- **Code Quality**: ESLint + Prettier + Husky

## Requirements Addressed

This setup addresses the following requirements from the specification:

- **1.1**: Mobile-optimized dashboard with clear navigation
- **1.2**: 44px minimum touch targets for accessibility
- **7.1**: AA contrast compliance and accessibility features
- **7.4**: PWA capabilities for mobile-first experience

## Next Steps

The project is now ready for implementing the core features:

1. Firebase Authentication
2. Dashboard components
3. Live class integration
4. Recording management
5. Notes and exercises
6. Exam system
