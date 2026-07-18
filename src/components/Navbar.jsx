import { NavLink } from 'react-router-dom';
import styles from './styles/Navbar.module.css';

export default function Navbar({ user }) {
  const getLinkClass = ({ isActive }) => 
    `${styles.link} ${isActive ? styles.activeLink : ''}`;

  // Evaluate authorization status permissions
  const isAdmin = user?.role === 'hr' || user?.role === 'manager';

  return (
    <aside className={styles.sidebar}>
      <div>
        {/* Brand Header */}
        <div className={styles.logoArea}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#111827' }}></div>
          <h2 className={styles.logoText}>DrewHub</h2>
        </div>

        {/* Dynamic Navigation Items Mapping */}
        <div className={styles.navGroup}>
          <NavLink to="/" className={getLinkClass}>
            📊 Dashboard
          </NavLink>
          
          <div className={styles.sectionHeader}>Operations</div>
          <NavLink to="/reports" className={getLinkClass}>
            ⏱️ Daily Reports
          </NavLink>

          {/* HR Administration links only compile if an administrative role signs in */}
          {isAdmin && (
            <>
              <div className={styles.sectionHeader}>Human Resources</div>
              <NavLink to="/employees" className={getLinkClass}>
                👥 Employees
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Profile Info Footer displaying the logged-in user's name */}
      <div className={styles.footerUser}>
        👤 {user?.name || 'User Session'}
      </div>
    </aside>
  );
}