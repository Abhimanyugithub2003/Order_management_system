'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { loginAction } from './actions';
import styles from './login.module.css';

const initialState = {
  error: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={styles.btn} id="login-submit-btn">
      {pending ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M4 12a8 8 0 018-8V4a10 10 0 00-10 10h2z" />
          </svg>
          Logging in...
        </>
      ) : (
        'Sign In'
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <main className={styles.container}>
      <div className={`${styles.authCard} glass-panel`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5" />
              <path d="M12 2v14" />
              <path d="M9 12h6" />
              <path d="M12 2a3 3 0 0 1 3 3v2H9V5a3 3 0 0 1 3-3z" />
            </svg>
            <span className="gradient-text">AasaMedChem</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Sign in to your account</h1>
          <p className={styles.subtitle}>Inventory & Order Management System</p>
        </div>

        <form action={formAction}>
          {state?.error && (
            <div className={styles.error} role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.input}
              placeholder="name@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.input}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <SubmitButton />
        </form>

        <p className={styles.footerText}>
          Don't have an account? 
          <Link href="/register" className={styles.link} id="go-to-register-link">
            Create account
          </Link>
        </p>

        <div className={styles.helperBox}>
          <h5>Quick Access (Test Credentials)</h5>
          <ul>
            <li>🧑‍💼 <strong>Admin:</strong> <code>admin@aasamedchem.com</code> / <code>admin123</code></li>
            <li>🧑‍🔬 <strong>Seller/User:</strong> <code>seller@aasamedchem.com</code> / <code>seller123</code></li>
          </ul>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
