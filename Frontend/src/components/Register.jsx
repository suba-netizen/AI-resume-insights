import React, { useState } from 'react';
import styles from './Register.module.css'; // Import the CSS module

// Example GIF URL - replace with your preferred one
const REGISTER_GIF_URL = "https://i.gifer.com/QDyD.gif";

export default function Register({ onNavigateToLogin }) {
  const [email, setEmail] = useState(''); // Changed from username back to email
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsSuccess(false);

    if (!email.trim()) { // Check if email is provided
      setMsg("Email is required.");
      setIsSuccess(false);
      return;
    }
    // A very basic email format check (consider a more robust library for production)
    if (!/\S+@\S+\.\S+/.test(email)) {
      setMsg("Please enter a valid email address.");
      setIsSuccess(false);
      return;
    }

    if (password.length < 6) { // Basic password length validation
      setMsg("Password must be at least 6 characters long.");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    try {
      // Ensure your backend expects 'email' and 'password' for registration
      const res = await fetch('https://ai-resume-insights.onrender.com/api/auth/register', { // Adjust endpoint as needed
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), // Sending email and password
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Registration successful! You can now log in.');
        setIsSuccess(true);
        setEmail(''); // Clear email
        setPassword('');
        // Optionally, automatically navigate to login after a delay
        // if (onNavigateToLogin) {
        //   setTimeout(() => onNavigateToLogin(), 2000);
        // }
      } else {
        setMsg(data.error || data.message || 'Registration failed. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMsg('Server error. Please try again later.');
      setIsSuccess(false);
    }
    setLoading(false);
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <div className={styles.gifContainer}>
            <img src={REGISTER_GIF_URL} alt="Account Creation Animation" />
          </div>
          <h2 className={styles.tagline}>Join Our Community!</h2>
          <p className={styles.subTagline}>
            Create your account to start analyzing resumes, tracking your progress,
            and accessing powerful tools to supercharge your job search.
          </p>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <h2 className={styles.formTitle}>Create Your Account</h2>
          <p className={styles.formSubtitle}>Get started by filling in your details below.</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="emailReg" className={styles.inputLabel}>Email Address</label>
              <input
                id="emailReg"
                type="email" // Changed type back to email
                required
                placeholder="you@example.com" // Updated placeholder
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.inputField}
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="passwordReg" className={styles.inputLabel}>Password</label>
              <input
                id="passwordReg"
                type="password"
                required
                placeholder="Create a strong password (min. 6 chars)"
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          {msg && (
            <p className={`${styles.message} ${isSuccess ? styles.successMessage : styles.errorMessage}`}>
              {msg}
            </p>
          )}
           {onNavigateToLogin && (
            <p className={styles.loginLink}>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>
                Log In
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}