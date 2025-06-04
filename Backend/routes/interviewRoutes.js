// routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have this

// @route   POST api/interview/questions
// @desc    Generate interview questions for a given role
// @access  Private
router.post(
  '/questions',
  authMiddleware, // Protect this route
  interviewController.generateInterviewQuestions
);

// @route   POST api/interview/analyze-answer
// @desc    Analyze user's answer and potentially spoken English (stubbed)
// @access  Private
router.post(
  '/analyze-answer',
  authMiddleware, // Protect this route
  // Add multer middleware here if you expect direct audio file uploads
  // e.g., upload.single('audioAnswer'),
  interviewController.analyzeAnswerAndConversation
);

module.exports = router;