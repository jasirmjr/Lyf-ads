import { useState } from 'react';
import styles from './styles/Landing.module.css';

export default function Landing({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();

      if (json.status === 'success') {
        onLoginSuccess(json.user);
      } else {
        alert(json.error || 'Authentication failed.');
      }
    } catch (err) {
      alert('Could not reach authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.singlePageContainer}>
      <div className={styles.loginCentralCard}>
        
        {/* Top Header Row with Logo */}
        <div className={styles.logoRow}>
          <img 
            src="/logo.png" 
            alt="DrewHub Logo" 
            className={styles.brandLogo}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'inline-block';
            }}
          />
          <span className={styles.fallbackLogoIcon} style={{ display: 'none' }}>🎬</span>
          <span className={styles.brandName}>DrewHub</span>
        </div>

        {/* Greetings and Sub-heading */}
        <h1 className={styles.mainGreeting}>Holla,<br />Welcome Back</h1>
        <p className={styles.subGreeting}>Hey, welcome back to your production workspace</p>

        {/* Input Forms */}
        <form onSubmit={handleLoginSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <input 
              type="email" 
              required 
              className={styles.styledInput} 
              placeholder="stanley@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <input 
              type="password" 
              required 
              className={styles.styledInput} 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Form Options Checkbox / Links */}
          <div className={styles.formOptionsRow}>
            <label className={styles.rememberMeLabel}>
              <input type="checkbox" className={styles.checkboxControl} />
              Remember me
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your system HR Admin to reset passwords.'); }} className={styles.forgotPasswordLink}>
              Forgot Password?
            </a>
          </div>

          {/* Core Sign In Action Button */}
          <button type="submit" disabled={isLoading} className={styles.submitActionButton}>
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        {/* Bottom Footer Hint */}
        <div className={styles.formFooterHint}>
          Don't have an account? <span className={styles.contactHRText} onClick={() => alert('New accounts can only be onboarded by an HR Manager.')}>Contact HR</span>
        </div>

      </div>
    </div>
  );
}