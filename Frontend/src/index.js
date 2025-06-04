// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18+
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router here
import App from './App';
import './index.css'; // Or your global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router> {/* Router wraps the App component */}
      <App />
    </Router>
  </React.StrictMode>
);