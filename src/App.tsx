import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { AuthPage, Dashboard } from './pages';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout';
import './App.css';

const LiveClass = () => (
  <Layout 
    showBackButton={true}
    title="Live Class"
    malayalamTitle="ലൈവ് ക്ലാസ്"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Live Class - Coming Soon</p>
      <p className="text-gray-500 text-sm mt-2" lang="ml">ലൈവ് ക്ലാസ് - ഉടൻ വരുന്നു</p>
    </div>
  </Layout>
);

const Recordings = () => (
  <Layout 
    showBackButton={true}
    title="Recordings"
    malayalamTitle="റെക്കോർഡിംഗുകൾ"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Recordings - Coming Soon</p>
      <p className="text-gray-500 text-sm mt-2" lang="ml">റെക്കോർഡിംഗുകൾ - ഉടൻ വരുന്നു</p>
    </div>
  </Layout>
);

const NotesExercises = () => (
  <Layout 
    showBackButton={true}
    title="Notes & Exercises"
    malayalamTitle="കുറിപ്പുകളും അഭ്യാസങ്ങളും"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Notes & Exercises - Coming Soon</p>
      <p className="text-gray-500 text-sm mt-2" lang="ml">കുറിപ്പുകളും അഭ്യാസങ്ങളും - ഉടൻ വരുന്നു</p>
    </div>
  </Layout>
);

const ExamsAttendance = () => (
  <Layout 
    showBackButton={true}
    title="Exams & Attendance"
    malayalamTitle="പരീക്ഷകളും ഹാജരും"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Exams & Attendance - Coming Soon</p>
      <p className="text-gray-500 text-sm mt-2" lang="ml">പരീക്ഷകളും ഹാജരും - ഉടൻ വരുന്നു</p>
    </div>
  </Layout>
);

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
