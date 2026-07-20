import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './styles/Navbar.module.css';

export default function Navbar({ user, onUserUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
      <div className={styles.sidebarContainer || styles.sidebar}>
        <div className={styles.logoRow || styles.logo}>
          <span className={styles.appTitle || styles.logoText}>DrewHub</span>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className={styles.hamburgerButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`${styles.navMenu || styles.nav} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
          <div className={styles.sectionHeader || styles.sectionTitle}>OPERATIONS</div>
          <NavLink to="/reports" className={getLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
             Daily Reports
          </NavLink>
          
          {isAdmin && (
            <>
              <div className={styles.sectionHeader || styles.sectionTitle}>HUMAN RESOURCES</div>
              <NavLink to="/employees" className={getLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                👥 Employees
              </NavLink>
              <NavLink to="/settings" className={getLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                ⚙️ Org Settings
              </NavLink>
            </>
          )}
        </nav>

        {/* 2. User Row with Inline Edit Button */}
        <div className={styles.profileRow || styles.userProfile} style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', padding: '1rem 0', display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>👤</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{user?.name}</span>
          </div>
          <button 
            onClick={handleOpenModal} 
            style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#eff6ff'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Edit
          </button>
        </div>
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
                <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>Save Changes</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}