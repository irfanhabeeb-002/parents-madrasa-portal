import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout';
import './App.css';

// Placeholder components - will be implemented in later tasks
const Dashboard = () => (
  <Layout>
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome to Your Dashboard
        </h2>
        <p className="text-gray-600" lang="bn">
          আপনার ড্যাশবোর্ডে স্বাগতম
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-700 mb-4">
          Dashboard content will be implemented in future tasks.
        </p>
        <p className="text-sm text-gray-500">
          Use the navigation below to explore different sections.
        </p>
      </div>
    </div>
  </Layout>
);

const LiveClass = () => (
  <Layout 
    showBackButton={true}
    title="Live Class"
    malayalamTitle="লাইভ ক্লাস"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Live Class - Coming Soon</p>
    </div>
  </Layout>
);

const Recordings = () => (
  <Layout 
    showBackButton={true}
    title="Recordings"
    malayalamTitle="রেকর্ডিং"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Recordings - Coming Soon</p>
    </div>
  </Layout>
);

const NotesExercises = () => (
  <Layout 
    showBackButton={true}
    title="Notes & Exercises"
    malayalamTitle="নোট এবং অনুশীলন"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Notes & Exercises - Coming Soon</p>
    </div>
  </Layout>
);

const ExamsAttendance = () => (
  <Layout 
    showBackButton={true}
    title="Exams & Attendance"
    malayalamTitle="পরীক্ষা এবং উপস্থিতি"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Exams & Attendance - Coming Soon</p>
    </div>
  </Layout>
);

const Profile = () => (
  <Layout 
    showBackButton={true}
    title="Profile"
    malayalamTitle="প্রোফাইল"
  >
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-700">Profile - Coming Soon</p>
    </div>
  </Layout>
);

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
  );
}

export default App;
