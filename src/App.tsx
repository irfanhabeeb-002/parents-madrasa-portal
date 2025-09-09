import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AuthPage, Dashboard, LiveClass, Recordings, NotesExercises, ExamsAttendance } from './pages';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout';
import './App.css';

const Profile = () => (
  <Layout 
    showBackButton={true}
    title="Profile"
    malayalamTitle="പ്രൊഫൈൽ"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Profile - Coming Soon</p>
      <p className="text-gray-500 text-sm mt-2" lang="ml">പ്രൊഫൈൽ - ഉടൻ വരുന്നു</p>
    </div>
  </Layout>
);

function App() {
  return (
    <FontSizeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </FontSizeProvider>
  );
}

export default App;
