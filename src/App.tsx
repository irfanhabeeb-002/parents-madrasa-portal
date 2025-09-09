import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
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
import './App.css';

// Lazy load page components for code splitting
const AuthPage = lazy(() => import('./pages/AuthPage').then(module => ({ default: module.AuthPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const LiveClass = lazy(() => import('./pages/LiveClass').then(module => ({ default: module.LiveClass })));
const Recordings = lazy(() => import('./pages/Recordings').then(module => ({ default: module.Recordings })));
const NotesExercises = lazy(() => import('./pages/NotesExercises').then(module => ({ default: module.NotesExercises })));
const ExamsAttendance = lazy(() => import('./pages/ExamsAttendance').then(module => ({ default: module.ExamsAttendance })));

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

const Profile = () => {
  const { preferences, permission, updatePreferences, requestPermission } = useNotifications();
  const { announce, LiveRegionComponent } = useLiveRegion();
  
  return (
    <Layout 
      showBackButton={true}
      title="Profile"
      malayalamTitle="പ്രൊഫൈൽ"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Profile</h2>
          <p className="text-gray-700">Profile settings - Coming Soon</p>
          <p className="text-gray-500 text-sm mt-2" lang="ml">പ്രൊഫൈൽ ക്രമീകരണങ്ങൾ - ഉടൻ വരുന്നു</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
          <p className="text-gray-500 text-sm mb-4" lang="ml">അറിയിപ്പ് ക്രമീകരണങ്ങൾ</p>
          <NotificationPreferences
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
            permissionGranted={permission.granted}
            onRequestPermission={requestPermission}
          />
        </div>
        
        <AccessibilitySettings />
      </div>
      
      {LiveRegionComponent}
    </Layout>
  );
};

function App() {
  // Initialize offline queue on app start
  React.useEffect(() => {
    offlineQueue.initialize();
  }, []);

  return (
    <ErrorBoundary>
      <FontSizeProvider>
        <AccessibilityProvider>
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
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  </Routes>
                </Suspense>
                </div>
              </Router>
            </NotificationProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </FontSizeProvider>
    </ErrorBoundary>
  );
}

export default App;
