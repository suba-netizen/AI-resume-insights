import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- Import useNavigate
import { API_URL, getAuthHeaders } from '../utils';
import styles from './Upload.module.css';

// --- ICONS ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);
const AnalyzeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    <circle cx="6.5" cy="6.5" r="1.5"/>
  </svg>
);
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8.5 5.5a.5.5 0 0 0-1 0v3.354l-1.146 1.147a.5.5 0 0 0 .708.708l1.5-1.5A.5.5 0 0 0 8.5 8.854V5.5z"/>
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
  </svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);
const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);
const InterviewIcon = () => ( // New Icon for Interview Assistant
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path>
        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
        <circle cx="12" cy="10" r="2"></circle>
        <line x1="8" y1="2" x2="8" y2="4"></line>
        <line x1="16" y1="2" x2="16" y2="4"></line>
    </svg>
);


// --- PieChart, formatListItems, parseAnalysisData, AnalysisDisplay components (그대로 유지) ---
// (These components remain unchanged from your previous version)
const PieChart = ({ percentage, size = 120, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const offset = circumference - (clampedPercentage / 100) * circumference;
  return (
    <div className={styles.pieChartContainer}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.pieChart}>
        <circle className={styles.pieBackground} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle className={styles.pieForeground} cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" dy=".3em" textAnchor="middle" className={styles.pieText}>{`${clampedPercentage}%`}</text>
      </svg>
    </div>
  );
};
const formatListItems = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text.split(/[\n•\-\*]/).map(item => item.trim()).filter(item => item.length > 0);
};
const parseAnalysisData = (textToFormat) => {
  if (!textToFormat || typeof textToFormat !== 'string') {
    return { scoreText: 'N/A', numericScore: 0, fieldsList: [], strengthsList: [], weaknessesList: [], suggestionsList: [], coursesList: [], rawText: textToFormat };
  }
  const scoreMatch = textToFormat.match(/Resume Score:\s*(.*?)(?:\n|$)/i);
  const scoreText = scoreMatch ? scoreMatch[1].trim() : 'N/A';
  let numericScore = 0;
  if (scoreText !== 'N/A') { const scoreNumMatch = scoreText.match(/(\d+)(?:\s*\/\s*\d+)?/); if (scoreNumMatch) numericScore = parseInt(scoreNumMatch[1], 10); }
  const fieldsMatch = textToFormat.match(/Suggested Career Fields:\s*([\s\S]*?)(?=Strengths:|$)/i);
  const fieldsText = fieldsMatch ? fieldsMatch[1].trim() : '';
  const fieldsList = fieldsText.split(',').map(f => f.trim()).filter(f => f && f.toLowerCase() !== 'not specified.' && f.length > 0);
  const strengthsMatch = textToFormat.match(/Strengths:\s*([\s\S]*?)(?=Weaknesses:|$)/i);
  const strengthsText = strengthsMatch ? strengthsMatch[1].trim() : '';
  const weaknessesMatch = textToFormat.match(/Weaknesses:\s*([\s\S]*?)(?=Improvement Suggestions:|$)/i);
  const weaknessesText = weaknessesMatch ? weaknessesMatch[1].trim() : '';
  const suggestionsMatch = textToFormat.match(/Improvement Suggestions:\s*([\s\S]*?)(?=Recommended Courses:|$)/i);
  const suggestionsText = suggestionsMatch ? suggestionsMatch[1].trim() : '';
  const coursesMatch = textToFormat.match(/Recommended Courses:\s*([\s\S]*?)(?=$)/i);
  const coursesText = coursesMatch ? coursesMatch[1].trim() : '';
  return { scoreText, numericScore, fieldsList, strengthsList: formatListItems(strengthsText), weaknessesList: formatListItems(weaknessesText), suggestionsList: formatListItems(suggestionsText), coursesList: formatListItems(coursesText), rawText: textToFormat };
};
const AnalysisDisplay = ({ analysisText, isHistoryItem = false }) => {
  const [activeView, setActiveView] = useState('score');
  const data = useMemo(() => parseAnalysisData(analysisText), [analysisText]);
  const analysisSections = [
    { key: 'score', label: '📊 Score' }, { key: 'fields', label: '🎯 Career Fields', list: data.fieldsList, itemClass: styles.careerFieldTag, isTagCloud: true },
    { key: 'strengths', label: '👍 Strengths', list: data.strengthsList, itemClass: styles.strengthItem }, { key: 'weaknesses', label: '📉 Weaknesses', list: data.weaknessesList, itemClass: styles.weaknessItem },
    { key: 'suggestions', label: '💡 Suggestions', list: data.suggestionsList, itemClass: styles.suggestionItem }, { key: 'courses', label: '📚 Courses', list: data.coursesList, itemClass: styles.courseItem },
  ];
  if (!data.scoreText && !data.fieldsList.length && !data.strengthsList.length) {
    if (data.rawText && typeof data.rawText === 'string' && data.rawText.trim().length > 0) {
      return (<div className={`${styles.analysisCard} ${isHistoryItem ? styles.historyAnalysisCard : ''}`}><p className={styles.analysisCategory}><strong>Analysis Details:</strong></p><pre className={styles.rawTextDisplay}>{data.rawText}</pre></div>);
    } return (<div className={`${styles.analysisCard} ${isHistoryItem ? styles.historyAnalysisCard : ''}`}><p className={styles.noDataText}>Could not parse analysis data.</p></div>);
  }
  return (
    <div className={`${styles.analysisCard} ${isHistoryItem ? styles.historyAnalysisCard : ''}`}>
      <div className={styles.analysisTabs}>
        {analysisSections.map(section => {
          const isDisabled = section.key !== 'score' && (!section.list || section.list.length === 0);
          return (<button key={section.key} onClick={() => setActiveView(section.key)} className={`${styles.tabButton} ${activeView === section.key ? styles.activeTab : ''} ${isDisabled ? styles.disabledTab : ''}`} disabled={isDisabled} title={isDisabled ? "No data available for this section" : `Show ${section.label.substring(2).trim()}`}>{section.label}</button>);
        })}
      </div>
      <div className={styles.analysisContent}>
        {activeView === 'score' && (<div className={styles.scoreDisplaySection}><PieChart percentage={data.numericScore} /><p className={styles.scoreTextDisplay}><strong>Overall Resume Score:</strong> {data.scoreText}</p></div>)}
        {analysisSections.map(section => {
          if (activeView === section.key && section.key !== 'score') {
            if (!section.list || section.list.length === 0) { return <p key={section.key} className={styles.noDataText}>No data available for {section.label.substring(2).toLowerCase()}.</p>; }
            if (section.isTagCloud) { return (<div key={section.key} className={styles.careerFieldsContainer}>{section.list.map((item, idx) => (<span key={`${section.key}-${idx}`} className={styles.careerFieldTag}>{item}</span>))}</div>); }
            return (<ul key={section.key} className={styles.analysisList}>{section.list.map((item, idx) => (<li key={`${section.key}-${idx}`} className={section.itemClass}>{item}</li>))}</ul>);
          } return null;
        })}
      </div>
    </div>
  );
};


// --- Main Upload Component ---
export default function Upload({ token }) {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate(); // <--- Initialize useNavigate

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError('');
      fetch(`${API_URL}/analyses`, { headers: getAuthHeaders(token) })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) throw new Error('Unauthorized: Please check your login.');
            throw new Error('Failed to fetch history. Server responded with ' + res.status);
          }
          return res.json();
        })
        .then(data => {
          const formattedHistory = data.map((item, index) => ({
            ...item,
            id: item.id || `history-${Date.now()}-${index}`,
            createdAt: item.createdAt || new Date().toISOString(),
            analysis: typeof item.analysis === 'string' ? item.analysis : JSON.stringify(item.analysis || {}),
            filename: item.filename || 'Unknown file'
          })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
          setHistory(formattedHistory);
        })
        .catch(err => {
          console.error("History fetch error:", err);
          setError(`Could not load analysis history: ${err.message}`);
        })
        .finally(() => setLoading(false));
    } else {
      setHistory([]);
      setError('');
    }
  }, [token]);

  const handleUpload = async () => {
    if (!file) { alert('Please select a file first.'); return; }
    setError('');
    setLoading(true);
    setAnalysis('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { ...getAuthHeaders(token) },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const newAnalysisText = typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis || {});
        setAnalysis(newAnalysisText);
        const newHistoryItem = {
          analysis: newAnalysisText, filename: file.name, 
          createdAt: new Date().toISOString(), id: data.id || `upload-${Date.now()}`
        };
        setHistory((prev) => [newHistoryItem, ...prev]);
      } else {
        const errorMsg = data.error || data.message || `Failed to analyze the resume (status: ${res.status}). Please try again.`;
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = 'A server error occurred during upload. Please check your connection or try again later.';
      setError(errorMsg);
    }
    setLoading(false);
  };

  const handleNavigateToInterviewAssistant = () => {
    navigate('/interview-assistant'); // <--- Navigate to the new route
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🚀 Resume Analyzer Pro</h1>
        <p>Elevate your career prospects. Upload your resume (PDF or DOCX) for instant, AI-powered analysis and actionable improvement tips.</p>
      </header>

      {/* --- NEW Section for Interview Assistant Navigation ---
      <section className={styles.featureSection}>
        <h2 className={styles.sectionTitleAlt}>🎤 Ace Your Interview</h2>
        <p>Practice common interview questions tailored to your desired role and get AI-powered feedback on your answers.</p>
        <button 
          onClick={handleNavigateToInterviewAssistant} 
          className={`${styles.actionButton} ${styles.interviewButton}`}
        >
          <InterviewIcon /> Launch Interview Assistant
        </button>
      </section> */}

      <section className={styles.uploadBox}>
        <label htmlFor="resume-upload" className={styles.fileInputLabel}>
          Select Your Resume (PDF, DOCX, DOC)
        </label>
        <div className={styles.fileInputWrapper}>
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={(e) => {
                const selectedFile = e.target.files[0];
                if (selectedFile) {
                    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
                    if (!allowedTypes.includes(selectedFile.type)) {
                        setError("Invalid file type. Please upload a PDF, DOC, or DOCX file.");
                        setFile(null); e.target.value = null; return;
                    }
                    if (selectedFile.size > 5 * 1024 * 1024) {
                        setError("File is too large. Maximum size is 5MB.");
                        setFile(null); e.target.value = null; return;
                    }
                }
                setFile(selectedFile); setError(''); setAnalysis('');
            }}
            disabled={loading}
            className={styles.fileInput}
          />
          <div className={styles.fileInputCustom}>
            <UploadIcon />
            {file ? (
              <span className={styles.fileName}>Selected: {file.name}</span>
            ) : (
              <span className={styles.fileInputText}>
                Drag & drop or <span>click to browse</span>
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className={styles.actionButton}
        >
          {loading && !analysis ? (
            <><span className={styles.spinner}></span> Analyzing...</>
          ) : (
            <><AnalyzeIcon /> Analyze My Resume</>
          )}
        </button>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </section>

      {analysis && (
        <section className={styles.latestAnalysisSection}>
          <h2 className={styles.sectionTitle}>✨ Latest Analysis Results</h2>
          <AnalysisDisplay analysisText={analysis} />
        </section>
      )}

      {/* <section className={styles.historySection}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={styles.secondaryButton}
          aria-expanded={showHistory}
          aria-controls="history-content"
        >
          <HistoryIcon /> 
          {showHistory ? 'Hide Analysis History' : `Show Analysis History (${history.length})`}
          {showHistory ? <ChevronUpIcon/> : <ChevronDownIcon />}
        </button>
        <div 
            id="history-content"
            className={`${styles.historyContent} ${showHistory ? styles.show : ''}`}
        >
          <h2 className={styles.sectionTitle}>📜 Previous Analyses</h2>
          {loading && history.length === 0 && <p className={styles.infoMessage}>Loading history...</p>}
          {!loading && history.length === 0 && !error && (
            <div className={styles.noHistoryMessage}><p>No previous analyses found. Your first analysis will appear here!</p></div>
          )}
          {!loading && history.length === 0 && error && error.includes("history") && <p className={styles.errorMessage}>{error}</p>}
          {history.map((item, idx) => (
            <article key={item.id || idx} className={styles.historyItemCard} style={{animationDelay: `${idx * 0.05}s`}}>
              <header className={styles.historyItemHeader}>
                <time dateTime={item.createdAt} className={styles.historyDate}>{new Date(item.createdAt).toLocaleString()}</time>
                {item.filename && <span className={styles.historyFilename}>{item.filename}</span>}
              </header>
              <AnalysisDisplay analysisText={item.analysis} isHistoryItem={true} />
            </article>
          ))}
        </div>
      </section> */}
    </div>
  );
}