import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout';
import { NotificationPreferences } from './components/notifications';
import { KeyboardNavigationIndicator, AccessibilitySettings } from './components/accessibility';
import { useLiveRegion } from './components/accessibility/LiveRegion';
import { SkeletonLoader } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator, InstallPrompt } from './components/pwa';
import { offlineQueue } from './services/offlineQueue';
import { AppIcons } from './assets/icons';
import './App.css';

// Lazy load page components for code splitting
const AuthPage = lazy(() => import('./pages/AuthPage').then(module => ({ default: module.AuthPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const LiveClass = lazy(() => import('./pages/LiveClass').then(module => ({ default: module.LiveClass })));
const Recordings = lazy(() => import('./pages/Recordings').then(module => ({ default: module.Recordings })));
const NotesExercises = lazy(() => import('./pages/NotesExercises').then(module => ({ default: module.NotesExercises })));
const ExamsAttendance = lazy(() => import('./pages/ExamsAttendance').then(module => ({ default: module.ExamsAttendance })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('./pages/Settings'));

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <SkeletonLoader className="w-64 h-8 mx-auto" />
      <SkeletonLoader className="w-48 h-6 mx-auto" />
      <SkeletonLoader className="w-32 h-4 mx-auto" />
      <div className="text-sm text-gray-500 mt-4" role="status" aria-live="polite">
        Loading page...
        <span className="block text-xs mt-1" lang="ml">പേജ് ലോഡ് ചെയ്യുന്നു...</span>
      </div>
    </div>
  </div>
);



function App() {
  // Initialize offline queue on app start
  React.useEffect(() => {
    offlineQueue.initialize();
  }, []);

  // Ensure consistent app icon usage across the application
  React.useEffect(() => {
    // Update favicon to use centralized icon system
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      // Ensure favicon uses the centralized icon path
      favicon.href = AppIcons.favicon;
    }

    // Update apple-touch-icon to use centralized icon system
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = AppIcons.appleTouchIcon;
    }
  }, []);

  return (
    <ErrorBoundary>
      <FontSizeProvider>
        <AccessibilityProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
              <Router>
                <div className="App min-h-screen bg-gray-50">
                  {/* PWA Components */}
                  <OfflineIndicator />
                  <InstallPrompt />
                  
                  {/* Keyboard Navigation Indicator */}
                  <KeyboardNavigationIndicator />
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                  <Route
                    path="/auth"
                    element={
                      <ProtectedRoute requireAuth={false}>
                        <Layout showBottomNav={false} showLogout={false}>
                          <AuthPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/live-class"
                    element={
                      <ProtectedRoute>
                        <LiveClass />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recordings"
                    element={
                      <ProtectedRoute>
                        <Recordings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notes-exercises"
                    element={
                      <ProtectedRoute>
                        <NotesExercises />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exams-attendance"
                    element={
                      <ProtectedRoute>
                        <ExamsAttendance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Layout 
                          showBackButton={true}
                          title="Profile"
                        >
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  </Routes>
                </Suspense>
                </div>
              </Router>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </AccessibilityProvider>
      </FontSizeProvider>
    </ErrorBoundary>
  );
}

export default App;
