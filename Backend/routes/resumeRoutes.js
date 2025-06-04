const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Make sure fs is imported
const auth = require('../middleware/auth'); // Assuming auth middleware exists
const resumeController = require('../controllers/resumeController'); // Assuming controller exists

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF and DOCX files
  if (file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true);
  } else {
    // Pass an error to reject the file
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Routes

// POST /api/upload - Upload and analyze resume
// 'resume' is the name of the file field in the form data
router.post('/upload', auth, upload.single('resume'), resumeController.uploadAndAnalyze);

// GET /api/analyses - Get all analyses for the authenticated user
router.get('/analyses', auth, resumeController.getUserAnalyses);

// Error handling middleware for multer (needs to be defined AFTER routes using multer)
// This catches errors thrown by multer middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    // Handle other multer errors
    return res.status(400).json({ error: 'File upload error: ' + error.message });
  }

  // Handle custom fileFilter error
  if (error.message === 'Only PDF and DOCX files are allowed') {
    return res.status(400).json({ error: error.message });
  }

  // Pass other errors to the next error handling middleware
  next(error);
});

module.exports = router;