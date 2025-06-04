// src/components/Dashboard/Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

// Icons
const ResumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const InterviewPrepIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path>
    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
    <circle cx="12" cy="10" r="2"></circle>
    <line x1="8" y1="2" x2="8" y2="4"></line>
    <line x1="16" y1="2" x2="16" y2="4"></line>
    <line x1="12" y1="18" x2="12" y2="16"></line>
  </svg>
);

const CoverLetterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.29 2.71L13.29 2.71A2 2 0 0 0 11.41 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.59a2 2 0 0 0-.71-1.71z"></path> {/* Envelope shape */}
    <polyline points="14 2 14 8 20 8"></polyline> {/* Page fold */}
    <path d="M18 14l-4-4-4 4"></path> {/* Arrow up - representing sending/composing */}
    <path d="M14 10v10"></path>
  </svg>
);


export default function Dashboard({ token }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (!token) {
    return <p className={styles.authMessage}>Please log in to access features.</p>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Welcome to Career Pro Suite!</h1>
        <p>Your personal AI-powered toolkit for career advancement. Choose a feature below to get started.</p>
      </header>

      <div className={styles.featuresGrid}>
        <div className={styles.featureCard} onClick={() => handleNavigate('/resume-analyzer')}>
          <ResumeIcon />
          <h2>Resume Analyzer</h2>
          <p>Upload your resume (PDF or DOCX) for instant AI-powered analysis, scoring, and improvement tips.</p>
          <button className={styles.featureButton}>Analyze Resume</button>
        </div>

        <div className={styles.featureCard} onClick={() => handleNavigate('/interview-assistant')}>
          <InterviewPrepIcon />
          <h2>Interview Assistant</h2>
          <p>Practice for interviews with AI-generated questions and get feedback on your answers for specific roles.</p>
          <button className={styles.featureButton}>Practice Interview</button>
        </div>

        <div className={styles.featureCard} onClick={() => handleNavigate('/cover-letter-generator')}>
          <CoverLetterIcon />
          <h2>Cover Letter Generator</h2>
          <p>Craft a professional and tailored cover letter in minutes with AI assistance for any job application.</p>
          <button className={styles.featureButton}>Create Cover Letter</button>
        </div>
      </div>

      {/* --- ADDED CONTENT SECTION --- */}
      <section className={styles.suiteImportanceSection}>
        <h2 className={styles.importanceTitle}>Why Career Pro Suite Matters</h2>
        <div className={styles.importanceContent}>
          <p>
            Navigating today's competitive job market requires more than just a good resume; it demands a strategic approach.
            Career Pro Suite provides you with cutting-edge AI tools designed to give you a significant advantage.
          </p>
          <ul>
            <li>
              <strong>Stand Out:</strong> Our Resume Analyzer ensures your CV is perfectly optimized to catch the eye of recruiters and pass through Applicant Tracking Systems (ATS).
            </li>
            <li>
              <strong>Ace Interviews:</strong> The Interview Assistant prepares you for common and challenging questions, boosting your confidence and performance.
            </li>
            <li>
              <strong>Impress with Every Application:</strong> Generate compelling, personalized cover letters that highlight your unique strengths for each specific role.
            </li>
          </ul>
          <p>
            By leveraging the power of AI, Career Pro Suite empowers you to present the best version of yourself at every stage of your job search.
            Invest in your future and let us help you unlock your full career potential.
          </p>
        </div>
      </section>
      {/* --- END OF ADDED CONTENT SECTION --- */}

    </div>
  );
}