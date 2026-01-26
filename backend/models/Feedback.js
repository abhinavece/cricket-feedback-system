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
  // New fields for match-specific feedback
  feedbackType: {
    type: String,
    enum: ['match', 'general'],
    default: 'general',
    index: true
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null,
    index: true
  },
  feedbackLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackLink',
    default: null
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  // Performance ratings - nullable to support "Didn't get a chance" (N/A) scenarios
  // When null, the rating is skipped in average calculations
  // Note: We use custom validators instead of min/max because those don't allow null
  batting: {
    type: Number,
    default: null,
    validate: {
      validator: function(v) { return v === null || (v >= 1 && v <= 5); },
      message: 'Batting rating must be between 1 and 5, or null for N/A'
    }
  },
  bowling: {
    type: Number,
    default: null,
    validate: {
      validator: function(v) { return v === null || (v >= 1 && v <= 5); },
      message: 'Bowling rating must be between 1 and 5, or null for N/A'
    }
  },
  fielding: {
    type: Number,
    default: null,
    validate: {
      validator: function(v) { return v === null || (v >= 1 && v <= 5); },
      message: 'Fielding rating must be between 1 and 5, or null for N/A'
    }
  },
  teamSpirit: {
    type: Number,
    default: null,
    validate: {
      validator: function(v) { return v === null || (v >= 1 && v <= 5); },
      message: 'Team spirit rating must be between 1 and 5, or null for N/A'
    }
  },
  feedbackText: {
    type: String,
    required: true,
    trim: true,
  },
  issues: {
    venue: { type: Boolean, default: false },
    timing: { type: Boolean, default: false },
    umpiring: { type: Boolean, default: false },
    other: { type: Boolean, default: false },
  },
  // Custom text when "other" issue is selected
  otherIssueText: {
    type: String,
    trim: true,
    default: '',
  },
  additionalComments: {
    type: String,
    trim: true,
  },
  groundRating: {
    type: String,
    enum: ['skip_it', 'decent', 'solid_pick', 'prime_ground', 'overpriced', null],
    default: null,
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

// Index for match feedback queries
feedbackSchema.index({ matchId: 1, isDeleted: 1 });

// Index for player feedback history
feedbackSchema.index({ playerId: 1, isDeleted: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
