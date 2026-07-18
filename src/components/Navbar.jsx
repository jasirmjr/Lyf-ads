import { Link } from 'react-router-dom';
import styles from './styles/Navbar.module.css'; // Import the CSS module

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <h2 className={styles.title}>CoreHR</h2>
      <Link to="/" className={styles.link}>Dashboard</Link>
      <Link to="/reports" className={styles.link}>Daily Reports</Link>
      <Link to="/employees" className={styles.link}>Employees</Link>
    </nav>
  );
}