import { useState } from 'react';
import styles from './styles/Landing.module.css';

export default function Landing({ onLoginSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();

      if (json.status === 'success') {
        // Pass the loaded user record database structure back to App.jsx
        onLoginSuccess(json.user);
      } else {
        alert(json.error || 'Authentication failed.');
      }
    } catch (err) {
      alert('Could not reach authentication server.');
    }
  };

  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroCard}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#111827', margin: '0 auto 1.5rem auto' }}></div>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>Welcome to DrewHub</h1>
        <p style={{ color: '#4b5563', margin: '0.5rem 0 2rem 0' }}>The comprehensive unified Core HR Portal platform.</p>
        <button className={styles.loginBtn} onClick={() => setShowModal(true)}>Log In to Workspace</button>
      </div>

      {/* LOGIN POPUP MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Account Sign In</h3>
            
            <form onSubmit={handleLoginSubmit}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#4b5563' }}>Corporate Email</label>
              <input 
                type="email" 
                required 
                className={styles.inputField} 
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#4b5563' }}>Password</label>
              <input 
                type="password" 
                required 
                className={styles.inputField} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit" className={styles.loginBtn} style={{ width: '100%', marginTop: '0.5rem' }}>
                Verify Identity
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}