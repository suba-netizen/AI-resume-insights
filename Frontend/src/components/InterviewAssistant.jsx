// src/components/InterviewAssistant/InterviewAssistant.js
import React, { useState, useEffect } from 'react'; // Added useEffect
import { API_URL, getAuthHeaders } from '../utils';
import styles from './InterviewAssistant.module.css';

const RoleIcon = () => <span role="img" aria-label="role">💼</span>;
const QuestionIcon = () => <span role="img" aria-label="question">❓</span>;
const SendIcon = () => <span role="img" aria-label="send">➡️</span>;
const SummaryIcon = () => <span role="img" aria-label="summary">📊</span>;
const LoadingSpinner = () => <div className={styles.spinnerSmall}></div>;

export default function InterviewAssistant({ token }) {
  const [role, setRole] = useState('');
  const [numQuestions, setNumQuestions] = useState(3); // Default to fewer for testing
  const [difficulty, setDifficulty] = useState('moderate');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  // Store all feedback sessions
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null); // Feedback for the current question

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [error, setError] = useState('');
  const [showOverallSummary, setShowOverallSummary] = useState(false);
  const [overallInterviewScore, setOverallInterviewScore] = useState(0);
  const [overallSummaryText, setOverallSummaryText] = useState('');


  const handleGetQuestions = async () => {
    if (!role) {
      setError('Please enter a job role.');
      return;
    }
    setIsLoadingQuestions(true);
    setError('');
    setQuestions([]);
    setCurrentFeedback(null);
    setAllFeedbacks([]); // Reset all feedbacks for new session
    setShowOverallSummary(false); // Hide summary for new session
    setOverallInterviewScore(0);
    setOverallSummaryText('');

    try {
      const response = await fetch(`${API_URL}/interview/questions`, {
        method: 'POST',
        headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, numQuestions: parseInt(numQuestions), difficulty }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch questions.');
      setQuestions(data.questions || []);
      setCurrentQuestionIndex(0);
    } catch (err) {
      setError(err.message);
      console.error("Failed to get interview questions:", err);
    }
    setIsLoadingQuestions(false);
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer || questions.length === 0) return;
    setIsLoadingFeedback(true);
    setError('');
    setCurrentFeedback(null);
    const currentQuestionText = questions[currentQuestionIndex];

    try {
      const response = await fetch(`${API_URL}/interview/analyze-answer`, {
        method: 'POST',
        headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestionText, userAnswerText: userAnswer }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze answer.');
      
      console.log("Received feedback from backend:", data.feedback);
      setCurrentFeedback(data.feedback);
      // Store this feedback along with question and answer
      setAllFeedbacks(prev => [...prev, {
          question: currentQuestionText,
          answer: userAnswer,
          feedback: data.feedback
      }]);

    } catch (err) {
      setError(err.message);
      console.error("Failed to submit answer for analysis:", err);
    }
    setIsLoadingFeedback(false);
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setCurrentFeedback(null);
    setError('');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, time to show summary
      calculateOverallPerformance();
      setShowOverallSummary(true);
    }
  };

  const calculateOverallPerformance = () => {
    if (allFeedbacks.length === 0) return;

    let totalScore = 0;
    let validScoresCount = 0;
    let summaryPoints = [];

    allFeedbacks.forEach(fbItem => {
        if (fbItem.feedback && fbItem.feedback.contentAnalysis && fbItem.feedback.contentAnalysis.answerRating) {
            const ratingStr = fbItem.feedback.contentAnalysis.answerRating;
            // Extract number from "7/10" or "7"
            const scoreMatch = ratingStr.match(/(\d+)(?:\s*\/\s*\d+)?/);
            if (scoreMatch && scoreMatch[1]) {
                totalScore += parseInt(scoreMatch[1], 10);
                validScoresCount++;
            }
        }
        if (fbItem.feedback && fbItem.feedback.contentAnalysis && Array.isArray(fbItem.feedback.contentAnalysis.feedbackPoints)) {
            summaryPoints.push(...fbItem.feedback.contentAnalysis.feedbackPoints.slice(0,1)); // Take first feedback point from each
        }
    });

    const averageScore = validScoresCount > 0 ? (totalScore / validScoresCount) * 10 : 0; // Scale to 100 if original is /10
    setOverallInterviewScore(Math.round(averageScore));

    // Generate a simple summary text
    let generatedSummary = `Based on your answers for the ${role} (${difficulty}) role: `;
    if (validScoresCount > 0) {
        generatedSummary += `You showed good understanding in several areas. `;
    } else {
        generatedSummary += `There were challenges in providing detailed responses. `;
    }
    if (summaryPoints.length > 0) {
        generatedSummary += "Key areas to focus on include: " + summaryPoints.slice(0, 2).join('; ') + ". ";
    }
    generatedSummary += "Keep practicing to refine your answers and build confidence!";
    setOverallSummaryText(generatedSummary);
  };
  
  const handleStartNewSession = () => {
    setRole('');
    setNumQuestions(3);
    setDifficulty('moderate');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setCurrentFeedback(null);
    setAllFeedbacks([]);
    setError('');
    setShowOverallSummary(false);
    setOverallInterviewScore(0);
    setOverallSummaryText('');
  };

  if (!token) {
      return <div className={styles.container}><p className={styles.authError}>Please log in.</p></div>;
  }

  // RENDER LOGIC
  if (showOverallSummary) {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1><SummaryIcon /> Interview Performance Summary</h1>
                <p>Role: {role} ({difficulty})</p>
            </header>
            <section className={styles.summarySection}>
                <h2>Overall Score: <span className={styles.overallScore}>{overallInterviewScore}/100</span></h2>
                <div className={styles.summaryText}>
                    <p>{overallSummaryText}</p>
                </div>
                <h3>Detailed Feedback Recap:</h3>
                {allFeedbacks.map((item, index) => (
                    <div key={index} className={styles.recapItem}>
                        <h4>Question {index + 1}: {item.question}</h4>
                        {item.feedback && item.feedback.contentAnalysis && (
                            <p><em>Rating: {item.feedback.contentAnalysis.answerRating || "N/A"} - {item.feedback.contentAnalysis.overallSummary || "No summary."}</em></p>
                        )}
                    </div>
                ))}
                <button onClick={handleStartNewSession} className={styles.actionButton}>
                    Start New Practice Session
                </button>
            </section>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1><span role="img" aria-label="microphone">🎤</span> AI Interview Assistant</h1>
        <p>Practice for your upcoming interviews with AI-generated questions and feedback.</p>
      </header>

      {!questions.length ? (
        <section className={styles.setupSection}>
          <h2>Set Up Your Practice Session</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="role"><RoleIcon /> Job Role</label>
            <input type="text" id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., Software Engineer" disabled={isLoadingQuestions}/>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="numQuestions"><QuestionIcon /> Number of Questions</label>
            <input type="number" id="numQuestions" value={numQuestions} onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value)))} min="1" max="10" disabled={isLoadingQuestions}/>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="difficulty">Difficulty Level</label>
            <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={isLoadingQuestions} className={styles.selectInput}>
                <option value="entry-level">Entry-Level</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
                <option value="expert">Expert</option>
            </select>
          </div>
          <button onClick={handleGetQuestions} disabled={isLoadingQuestions || !role} className={styles.actionButton}>
            {isLoadingQuestions ? <LoadingSpinner /> : <SendIcon />}
            {isLoadingQuestions ? 'Generating...' : 'Get Questions'}
          </button>
        </section>
      ) : (
        <section className={styles.practiceSection}>
          <h2>Practice Mode: {role} ({difficulty})</h2>
          <div className={styles.questionCard}>
            <h3>Question {currentQuestionIndex + 1} of {questions.length}:</h3>
            <p className={styles.questionText}>{questions[currentQuestionIndex]}</p>
          </div>

          <div className={styles.answerSection}>
            <label htmlFor="userAnswer">Your Answer:</label>
            <textarea id="userAnswer" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Type your answer here..." rows="6" disabled={isLoadingFeedback}/>
            <button onClick={handleSubmitAnswer} disabled={isLoadingFeedback || !userAnswer} className={styles.submitButton}>
              {isLoadingFeedback ? <LoadingSpinner /> : <SendIcon />}
              {isLoadingFeedback ? 'Analyzing...' : 'Get Feedback'}
            </button>
          </div>

          {currentFeedback && (
            <div className={styles.feedbackCard}>
              <h3>AI Feedback for Current Answer:</h3>
              {currentFeedback.contentAnalysis && typeof currentFeedback.contentAnalysis === 'object' ? (
                <div className={styles.feedbackSubCard}>
                  <h4>Content & Clarity (Rating: {currentFeedback.contentAnalysis.answerRating || "N/A"}):</h4>
                  {currentFeedback.contentAnalysis.overallSummary && <p><strong>Overall:</strong> {currentFeedback.contentAnalysis.overallSummary}</p>}
                  {currentFeedback.contentAnalysis.relevance && <p><strong>Relevance:</strong> {currentFeedback.contentAnalysis.relevance}</p>}
                  {Array.isArray(currentFeedback.contentAnalysis.feedbackPoints) && currentFeedback.contentAnalysis.feedbackPoints.length > 0 && (
                    <><strong>Key Points:</strong><ul>{currentFeedback.contentAnalysis.feedbackPoints.map((p, i) => typeof p === 'string' ? <li key={`cfb-${i}`}>{p}</li> : null)}</ul></>
                  )}
                </div>
              ) : currentFeedback.contentAnalysis && <div className={styles.feedbackSubCard}><p>{currentFeedback.contentAnalysis}</p></div>}

              {currentFeedback.englishImprovement && typeof currentFeedback.englishImprovement === 'object' ? (
                <div className={styles.feedbackSubCard}>
                  <h4>Language & Fluency:</h4>
                  {currentFeedback.englishImprovement.fluencyNotes && <p><strong>Fluency:</strong> {currentFeedback.englishImprovement.fluencyNotes}</p>}
                  {Array.isArray(currentFeedback.englishImprovement.grammarObservations) && currentFeedback.englishImprovement.grammarObservations.length > 0 && (
                    <><strong>Grammar:</strong><ul>{currentFeedback.englishImprovement.grammarObservations.map((o, i) => typeof o === 'string' ? <li key={`gfb-${i}`}>{o}</li> : null)}</ul></>
                  )}
                  {Array.isArray(currentFeedback.englishImprovement.vocabularySuggestions) && currentFeedback.englishImprovement.vocabularySuggestions.length > 0 && (
                    <><strong>Vocabulary:</strong><ul>{currentFeedback.englishImprovement.vocabularySuggestions.map((s, i) => typeof s === 'string' ? <li key={`vfb-${i}`}>{s}</li> : null)}</ul></>
                  )}
                </div>
               ) : currentFeedback.englishImprovement && <div className={styles.feedbackSubCard}><p>{currentFeedback.englishImprovement}</p></div>}
            </div>
          )}
            <button onClick={handleNextQuestion} className={styles.nextButton} disabled={isLoadingFeedback || !currentFeedback}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Overall Summary'} <SendIcon />
            </button>
        </section>
      )}
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}