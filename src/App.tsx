import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { AuthPage, Dashboard, LiveClass, Recordings, NotesExercises, ExamsAttendance } from './pages';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout';
import { NotificationPreferences } from './components/notifications';
import './App.css';

const Profile = () => {
  const { preferences, permission, updatePreferences, requestPermission } = useNotifications();
  
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
      </div>
    </Layout>
  );
};

function App() {
  return (
    <FontSizeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App min-h-screen bg-gray-50">
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
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </FontSizeProvider>
  );
}

export default App;
