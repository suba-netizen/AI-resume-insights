// models/CoverLetter.js
const mongoose = require('mongoose');

const CoverLetterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming your user model is named 'User'
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  generatedText: {
    type: String,
    required: true,
  },
  // You can add more fields from the input form if you want to store them
  // e.g., keySkills, jobDescriptionSnapshot, etc.
  tone: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CoverLetter', CoverLetterSchema);