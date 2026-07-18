import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import WorkReports from './pages/WorkReports';
import EmployeeMgmt from './pages/EmployeeMgmt';

function App() {
  const [user, setUser] = useState(null); // Holds { id, name, email, role }

  // Fixed structural dimensions matching the HR dashboard setup perfectly
  const layoutContainer = {
    display: 'grid',
    gridTemplateColumns: '260px 1fr', 
    minHeight: '100vh',
  };

  const contentArea = {
    padding: '2.5rem',
    overflowY: 'auto',
  };

  if (!user) {
    return <Landing onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  const isAdmin = user.role === 'hr' || user.role === 'manager';

  return (
    <Router>
      <div style={layoutContainer}>
        {/* Pass the logged-in user to the Navbar so it can control link visibility */}
        <Navbar user={user} />

        <main style={contentArea}>
          <Routes>
            {/* Directs to the correct homepage layout card dynamically */}
            <Route path="/" element={isAdmin ? <Dashboard /> : <UserDashboard user={user} />} />
            
            <Route path="/reports" element={<WorkReports user={user} />} />
            
            {/* Hard wall blocks regular employees from routing to management tools */}
            <Route path="/employees" element={isAdmin ? <EmployeeMgmt /> : <Navigate to="/" replace />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;