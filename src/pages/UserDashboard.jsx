import { useNavigate } from 'react-router-dom';
import styles from './styles/UserDashboard.module.css'; // Import layout styles

export default function UserDashboard({ user }) {
  const navigate = useNavigate();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.dashboardCard}>
        <h1 className={styles.title}>Hello, {user.name}! 👋</h1>
        <p className={styles.subtitle}>
          Welcome to your Employee Self-Service Workspace portal.
        </p>
        
        <hr className={styles.divider} />

        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          
          {/* Active Feature Block */}
          <div 
            onClick={() => navigate('/reports')}
            className={styles.actionCardActive}
          >
            <h4 className={styles.cardTitleActive}>⏱️ Daily Work Reports</h4>
            <p className={styles.cardDescription}>Submit or adjust your task items and logs for today.</p>
          </div>

          {/* Locked/Future Feature Block */}
          {/*
          <div className={styles.actionCardDisabled}>
            <h4 className={styles.cardTitleDisabled}>🌴 Leave & Time-Off</h4>
            <p className={styles.cardDescription}>Check balances and request leaves (Coming Soon).</p>
          </div>
          */}

        </div>
      </div>
    </div>
  );
}