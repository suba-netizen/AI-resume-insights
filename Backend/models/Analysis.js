// src/models/Analysis.js
// Example Mongoose model

const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true,
  },
  analysis: {
    type: String,
    required: true,
  },
  // Mongoose timestamps will add createdAt and updatedAt fields automatically
}, { timestamps: true });

module.exports = mongoose.model('Analysis', AnalysisSchema);