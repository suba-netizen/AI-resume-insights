require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const interviewRoutes = require('./routes/interviewRoutes'); // <--- New routes
const coverletterRoutes = require('./routes/coverLetterRoutes'); // <--- New routes

const app = express();

app.use(cors());
app.use(express.json());

require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('MongoDB connected successfully');
  mongoose.connection.close(); // Close connection after test
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.set('debug', true);

app.use('/api/auth', authRoutes); // Mount authRoutes under /api/auth
app.use('/api', resumeRoutes);
app.use('/api/interview', interviewRoutes); // <--- Use new interview routes
app.use('/api/cover-letter', coverletterRoutes); // <--- Use new interview routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
