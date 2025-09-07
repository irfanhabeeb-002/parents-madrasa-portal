import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import './App.css';

// Placeholder components - will be implemented in later tasks
const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Parents Madrasa Portal</h1>
            <p className="text-gray-600">অভিভাবক মাদ্রাসা পোর্টাল</p>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-700 mb-2">
            Welcome, {user?.name}!
          </p>
          <p className="text-sm text-gray-500">
            Phone: {user?.phone}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Dashboard will be implemented in future tasks.
          </p>
        </div>
      </div>
    </div>
  );
};

const LiveClass = () => <div className="p-4">Live Class - Coming Soon</div>;
const Recordings = () => <div className="p-4">Recordings - Coming Soon</div>;
const NotesExercises = () => (
  <div className="p-4">Notes & Exercises - Coming Soon</div>
);
const ExamsAttendance = () => (
  <div className="p-4">Exams & Attendance - Coming Soon</div>
);
const Profile = () => <div className="p-4">Profile - Coming Soon</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            <Route
              path="/auth"
              element={
                <ProtectedRoute requireAuth={false}>
                  <AuthPage />
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
  );
}

export default App;
