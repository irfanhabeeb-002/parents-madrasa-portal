import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Placeholder components - will be implemented in later tasks
const Dashboard = () => <div className="p-4">Dashboard - Coming Soon</div>;
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
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-class" element={<LiveClass />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route path="/notes-exercises" element={<NotesExercises />} />
          <Route path="/exams-attendance" element={<ExamsAttendance />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
