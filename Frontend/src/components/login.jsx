import React, { useState } from 'react';
import styles from './login.module.css'; // Import the CSS module

// Example GIF URL - replace with your preferred one
const LOGIN_GIF_URL = "https://cdn.dribbble.com/userupload/34022841/file/original-07b777e02c236203e56930a3a58faf9f.gif";
// Alternative related to careers/jobs: https://cdn.dribbble.com/users/1068771/screenshots/8800943/media/6851d781739752095c77205cc5d344a6.gif

export default function Login({ setToken, onNavigateToSignup }) { // Added onNavigateToSignup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', { // Assuming /api/auth/login
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        // Optionally, redirect or show success message before App re-renders
      } else {
        setMsg(data.error || data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error("Login error:", error);
      setMsg('Server error. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <div className={styles.gifContainer}>
            <img src={LOGIN_GIF_URL} alt="Resume Analysis Animation" />
          </div>
          <h2 className={styles.tagline}>Unlock Your Career Potential</h2>
          <p className={styles.subTagline}>
            Get instant AI-powered feedback on your resume and land your dream job faster.
            Log in to access your personalized dashboard and analysis history.
          </p>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <h2 className={styles.formTitle}>Welcome Back!</h2>
          <p className={styles.formSubtitle}>Please enter your details to sign in.</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.inputLabel}>Email Address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.inputField}
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.inputLabel}>Password</label>
              <input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputField}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          {msg && <p className={styles.errorMessage}>{msg}</p>}
          {onNavigateToSignup && ( // Conditionally render signup link
            <p className={styles.signupLink}>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToSignup(); }}>
                Sign Up
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}