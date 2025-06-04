// routes/coverLetterRoutes.js
const express = require('express');
const router = express.Router();
const coverLetterController = require('../controllers/coverLetterController');
const authMiddleware = require('../middleware/authMiddleware');

console.log('[COVER LETTER ROUTES] File loaded.'); // Confirm this file is even being loaded

router.post('/generate', authMiddleware, (req, res, next) => {
    console.log('[COVER LETTER ROUTES] Reached /generate POST route after authMiddleware.');
    coverLetterController.generateCoverLetter(req, res, next); // Explicitly call next if controller doesn't send response
});

router.get('/', authMiddleware, (req, res, next) => {
    console.log('[COVER LETTER ROUTES] Reached / GET route after authMiddleware.');
    coverLetterController.getUserCoverLetters(req, res, next);
});

module.exports = router;