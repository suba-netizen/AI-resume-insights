// src/utils.js (Frontend)

// Fallback to localhost:5000/api if REACT_APP_API_URL is not set
export const API_URL = process.env.REACT_APP_API_URL || 'https://ai-resume-insights.onrender.com/api';

export const getAuthHeaders = (token) => {
  if (!token) {
    // Return an empty object if no token, so spreading it doesn't cause an error
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`,
    // DO NOT set 'Content-Type' here by default.
    // Let the specific fetch call determine its Content-Type.
  };
};