import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'; // Keep BrowserRouter here if not moving to index.js
import { FaTachometerAlt, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaRocket, FaFileAlt } from 'react-icons/fa'; // Added FaFileAlt for Cover Letter

// Corrected Component Imports
import Dashboard from './components/Dashboard'; // Assuming path like ./components/Dashboard/Dashboard.js
import Register from './components/Register';
import Login from './components/login';
import ResumeAnalyzer from './components/ResumeAnalyser';
import InterviewAssistant from './components/InterviewAssistant';
import CoverLetterGenerator from './components/CoverLetter'; // <--- ADD THIS IMPORT
import Home from './components/Home';

// Navbar styles (keep as is)
const navStyles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    marginBottom: '0px',
    fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
  },
  brandLink: {
    textDecoration: 'none',
    color: '#4F46E5',
    fontSize: '1.6em',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLinksContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
  },
  navLink: {
    textDecoration: 'none',
    color: '#4A5568',
    fontSize: '1em',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  navLinkHover: {
    backgroundColor: '#EDE9FE',
    color: '#4F46E5',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: '#EF4444',
    border: '2px solid #EF4444',
    padding: '8px 15px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.95em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
  },
  logoutButtonHover: {
    backgroundColor: '#EF4444',
    color: 'white',
  }
};

const applyLinkHover = (e, isHovering) => {
  if (isHovering) {
    e.currentTarget.style.backgroundColor = navStyles.navLinkHover.backgroundColor;
    e.currentTarget.style.color = navStyles.navLinkHover.color;
  } else {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = navStyles.navLink.color;
  }
};

const applyButtonHover = (e, isHovering) => {
    if (isHovering) {
      e.currentTarget.style.backgroundColor = navStyles.logoutButtonHover.backgroundColor;
      e.currentTarget.style.color = navStyles.logoutButtonHover.color;
    } else {
      e.currentTarget.style.backgroundColor = navStyles.logoutButton.backgroundColor;
      e.currentTarget.style.color = navStyles.logoutButton.color;
    }
  };


function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const websiteName = "AI Resume Insight";
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    navigate('/login');
  };

  const handleSetToken = (newToken) => {
    if (newToken) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    } else {
        localStorage.removeItem('token');
        setToken('');
    }
  };

  return (
    <>
      <nav style={navStyles.navbar}>
        <Link to="/" style={navStyles.brandLink}>
          <FaRocket />
          {websiteName}
        </Link>

        <div style={navStyles.navLinksContainer}>
          {token ? (
            <>
              <Link
                to="/dashboard"
                style={navStyles.navLink}
                onMouseEnter={(e) => applyLinkHover(e, true)}
                onMouseLeave={(e) => applyLinkHover(e, false)}
              >
                <FaTachometerAlt /> Dashboard
              </Link>
              {/* You might want individual links to features too, or just let dashboard handle it */}
              {/* Example:
              <Link to="/resume-analyzer" style={navStyles.navLink} onMouseEnter={(e) => applyLinkHover(e, true)} onMouseLeave={(e) => applyLinkHover(e, false)}>
                <FaFileAlt /> Resume
              </Link>
              */}
              <button
                onClick={handleLogout}
                style={navStyles.logoutButton}
                onMouseEnter={(e) => applyButtonHover(e, true)}
                onMouseLeave={(e) => applyButtonHover(e, false)}
              >
                <FaSignOutAlt /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={navStyles.navLink}
                onMouseEnter={(e) => applyLinkHover(e, true)}
                onMouseLeave={(e) => applyLinkHover(e, false)}
              >
                <FaSignInAlt /> Login
              </Link>
              <Link
                to="/register"
                style={navStyles.navLink}
                onMouseEnter={(e) => applyLinkHover(e, true)}
                onMouseLeave={(e) => applyLinkHover(e, false)}
              >
                <FaUserPlus /> Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="container-fluid mt-3"> {/* Optional Bootstrap-like main content container */}
        <Routes>
          <Route path="/" element={<Home token={token} />} />
          <Route
            path="/register"
            element={token ? <Navigate to="/dashboard" /> : <Register setToken={handleSetToken}/>}
          />
          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" /> : <Login setToken={handleSetToken} />}
          />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={token ? <Dashboard token={token} /> : <Navigate to="/login" />}
          />
          <Route
            path="/resume-analyzer"
            element={token ? <ResumeAnalyzer token={token} /> : <Navigate to="/login" />}
          />
          <Route 
              path="/interview-assistant" 
              element={token ? <InterviewAssistant token={token} /> : <Navigate to="/login" />}
          />
          {/* --- ADDED ROUTE FOR COVER LETTER GENERATOR --- */}
          <Route
            path="/cover-letter-generator"
            element={token ? <CoverLetterGenerator token={token} /> : <Navigate to="/login" />}
          />
          {/* --- END OF ADDED ROUTE --- */}

          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/"} />} />
        </Routes>
      </div>
    </>
  );
}

// IMPORTANT: Ensure App is wrapped by <Router> in your index.js
// Example for src/index.js:
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { BrowserRouter as Router } from 'react-router-dom';
// import App from './App';
// import './index.css'; // Your global styles
//
// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <Router>
//       <App />
//     </Router>
//   </React.StrictMode>
// );

export default App;