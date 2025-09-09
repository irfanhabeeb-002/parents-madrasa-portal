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

## Authentication System

### Current Status: Manual Phone-Number Login

The application currently uses a **manual phone-number login system** (no OTP, no Firebase) for easier development and testing. Firebase integration is fully prepared but disabled.

#### Demo Users

Use any of these phone numbers to login (no OTP required):

- `9876543210` - Abdul Rahman
- `9123456789` - Fatima Khatun  
- `9012345678` - Muhammad Ali
- `9234567890` - Aisha Begum
- `9345678901` - Omar Farooq
- `7025021695` - Irfan Habeeb

#### Switching to Firebase Authentication

When ready to enable Firebase Auth, follow these steps:

1. **Update AuthContext.tsx**:
   - Uncomment Firebase imports at the top
   - Comment out manual login methods
   - Uncomment Firebase auth methods
   - Update the useEffect to use Firebase auth state

2. **Update SimpleLoginForm.tsx**:
   - Restore OTP verification flow
   - Add back email/register options
   - Update form handling for Firebase methods

3. **Configure Firebase**:
   - Set up Firebase project
   - Add environment variables
   - Configure authentication providers

4. **Test Firebase Integration**:
   - Verify phone authentication works
   - Test OTP verification
   - Ensure user data syncs with Firestore

### Firebase Setup (Ready but Disabled)

All Firebase configuration is complete and ready:

- ✅ Firebase SDK installed and configured
- ✅ Authentication context prepared
- ✅ Firestore services implemented
- ✅ Security rules defined
- ✅ Environment variables configured

**To enable Firebase**: Simply uncomment the Firebase code sections marked with `TODO: Uncomment when ready to enable Firebase Auth`

## Next Steps

The project is now ready for implementing the core features:

1. ✅ Authentication System (Manual login active, Firebase ready)
2. ✅ Dashboard components
3. ✅ Live class integration
4. ✅ Recording management
5. ✅ Notes and exercises
6. ✅ Exam system
7. 🔄 Zoom integration
8. 🔄 Notification system
