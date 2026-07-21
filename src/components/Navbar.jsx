import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './styles/Navbar.module.css';

export default function Navbar({ user, onUserUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const currentNameParts = user?.name ? user.name.split(' ') : ['', ''];
  const [profileForm, setProfileForm] = useState({
    first_name: currentNameParts[0] || '',
    last_name: currentNameParts.slice(1).join(' ') || '',
    password: '' // Reset to empty string on open
  });

  const handleOpenModal = () => {
    const parts = user?.name ? user.name.split(' ') : ['', ''];
    setProfileForm({
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: user.id,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          password: profileForm.password // Added here
        })
      });

      const json = await res.json();
      if (json.status === 'success') {
        alert('Profile details updated successfully!');
        setIsModalOpen(false);
        if (onUserUpdate) onUserUpdate(json.user);
      } else {
        alert(json.error || 'Failed to update credentials.');
      }
    } catch (err) {
      alert('Error updating configuration data.');
    }
  };

  const isAdmin = user?.role === 'hr' || user?.role === 'manager';
  const getLinkClass = ({ isActive }) => (isActive ? styles.activeLink : styles.link);

  return (
    <>
      {/* 1. Left Sidebar Navigation Container */}
      <div style={{
        background: '#ffffff',
        borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
        borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
        padding: isMobile ? '1rem' : '2rem 1.5rem',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        justifyContent: 'space-between',
        width: isMobile ? '100%' : '260px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
        alignItems: isMobile ? 'center' : 'flex-start'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: isMobile ? '0' : '2rem', marginRight: isMobile ? '1rem' : '0' }}>
          <span style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>LYF ADS</span>
        </div>

        {/* Mobile Hamburger Button */}
        {isMobile && (
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', fontSize: '1.5rem', color: '#374151', marginLeft: 'auto' }}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        )}

        <nav style={{
          display: isMobile && !isMobileMenuOpen ? 'none' : 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          position: isMobile && isMobileMenuOpen ? 'absolute' : 'static',
          top: isMobile ? '100%' : 'auto',
          left: isMobile ? '0' : 'auto',
          right: isMobile ? '0' : 'auto',
          background: isMobile ? '#ffffff' : 'transparent',
          padding: isMobile ? '1rem' : '0',
          borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
          boxShadow: isMobile ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
          zIndex: isMobile ? 999 : 1,
          width: isMobile ? '100%' : 'auto'
        }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#760506', margin: isMobile ? '0.5rem 0 0.5rem 0' : '1.5rem 0 0.5rem 0.5rem', fontWeight: 600 }}>OPERATIONS</div>
          <NavLink to="/reports" className={getLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
             Daily Reports
          </NavLink>
          
          {isAdmin && (
            <>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#760506', margin: '1.5rem 0 0.5rem 0.5rem', fontWeight: 600 }}>HUMAN RESOURCES</div>
              <NavLink to="/employees" className={getLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                👥 Employees
              </NavLink>
              <NavLink to="/settings" className={getLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                ⚙️ Departments
              </NavLink>
            </>
          )}
        </nav>

        {/* 2. User Row with Inline Edit Button - Desktop Only */}
        {!isMobile && (
          <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', padding: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>👤</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{user?.name}</span>
            </div>
            <button 
              onClick={handleOpenModal} 
              style={{ background: 'transparent', border: 'none', color: '#760506', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
            >
              Edit
            </button>
          </div>
        )}

        {/* Mobile Profile Button (visible only on mobile) */}
        {isMobile && (
          <button 
            onClick={handleOpenModal}
            aria-label="Edit profile"
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem', marginLeft: '0.5rem' }}
          >
            👤
          </button>
        )}
      </div>

      {/* 3. FLOATING EDIT PROFILE DIALOG OVERLAY MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: '#111827', fontSize: '1.1rem', fontWeight: '700' }}>Update Profile Settings</h3>
            <form onSubmit={handleSaveProfile}>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>First Name</label>
                <input type="text" value={profileForm.first_name} onChange={e => setProfileForm({...profileForm, first_name: e.target.value})} required style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>Last Name</label>
                <input type="text" value={profileForm.last_name} onChange={e => setProfileForm({...profileForm, last_name: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>New Password (Leave blank to keep current)</label>
                <input type="password" placeholder="••••••••" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#760506', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>Save Changes</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}