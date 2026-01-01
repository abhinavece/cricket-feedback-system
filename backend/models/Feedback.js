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

module.exports = mongoose.model('Feedback', feedbackSchema);
