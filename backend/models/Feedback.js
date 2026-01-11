const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true,
    trim: true,
  },
  matchDate: {
    type: Date,
    required: true,
  },
  batting: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  bowling: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  fielding: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  teamSpirit: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedbackText: {
    type: String,
    required: true,
    trim: true,
  },
  issues: {
    venue: { type: Boolean, default: false },
    equipment: { type: Boolean, default: false },
    timing: { type: Boolean, default: false },
    umpiring: { type: Boolean, default: false },
    other: { type: Boolean, default: false },
  },
  additionalComments: {
    type: String,
    trim: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: String, // Admin identifier
  },
}, {
  timestamps: true,
});

// Indexes for optimized queries
// Compound index for listing active feedback sorted by date
feedbackSchema.index({ isDeleted: 1, createdAt: -1 });

// Index for trash view
feedbackSchema.index({ isDeleted: 1, deletedAt: -1 });

// Index for stats aggregation
feedbackSchema.index({ isDeleted: 1, batting: 1, bowling: 1, fielding: 1, teamSpirit: 1 });

// Index for player name search
feedbackSchema.index({ playerName: 'text' });

module.exports = mongoose.model('Feedback', feedbackSchema);
