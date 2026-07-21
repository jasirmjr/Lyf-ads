import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import WorkReports from './pages/WorkReports';
import EmployeeMgmt from './pages/EmployeeMgmt';
import OrgSettings from './pages/OrgSettings';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // Holds { id, name, email, role }

  if (!user) {
    return <Landing onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  const isAdmin = user.role === 'hr' || user.role === 'manager';
  const handleUserUpdate = (updatedUserFields) => {
    setUser(prev => ({
      ...prev,
      ...updatedUserFields // Merges the updated names cleanly into active context
    }));
  };

  return (
    <Router>
      <div className="app-layout-wrapper">
        {/* Pass the logged-in user to the Navbar so it can control link visibility */}
        <Navbar user={user} onUserUpdate={handleUserUpdate} />

        <main className="main-content-wrapper">
          <Routes>
            <Route path="/" element={isAdmin ? <Dashboard /> : <UserDashboard user={user} />} />
          
            <Route path="/reports" element={<WorkReports user={user} />} />
            
            {/* Protected Admin Modules */}
            <Route path="/employees" element={isAdmin ? <EmployeeMgmt /> : <Navigate to="/" replace />} />
            <Route path="/settings" element={isAdmin ? <OrgSettings /> : <Navigate to="/" replace />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;