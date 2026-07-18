import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import WorkReports from './pages/WorkReports';
import EmployeeMgmt from './pages/EmployeeMgmt';

function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#fff' }}>
        {/* The navigation bar stays persistent across all sub-pages */}
        <Navbar />

        {/* Dynamic viewport layout switches based on current URL path */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<WorkReports />} />
          <Route path="/employees" element={<EmployeeMgmt />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;