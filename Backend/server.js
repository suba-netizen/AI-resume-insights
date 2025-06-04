require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const coverletterRoutes = require('./routes/coverLetterRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB and start server only on successful connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('MongoDB connected successfully');

  // Mount routes AFTER DB connection established
  app.use('/api/auth', authRoutes);
  app.use('/api', resumeRoutes);
  app.use('/api/interview', interviewRoutes);
  app.use('/api/cover-letter', coverletterRoutes);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Optional: enable mongoose debug to see queries in console
mongoose.set('debug', true);
