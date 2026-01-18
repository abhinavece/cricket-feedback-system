const mongoose = require('mongoose');
const crypto = require('crypto');

const feedbackLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  accessCount: {
    type: Number,
    default: 0
  },
  submissionCount: {
    type: Number,
    default: 0
  },
  submittedPlayers: [{
    type: String // Store lowercase player names to prevent duplicates
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Static: Generate URL-safe token
feedbackLinkSchema.statics.generateToken = function() {
  return crypto.randomBytes(8).toString('base64url');
};

// Method: Check if link is valid (active and not expired)
feedbackLinkSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

// Method: Check if player can submit (not already submitted)
feedbackLinkSchema.methods.canPlayerSubmit = function(playerName) {
  const normalizedName = playerName.toLowerCase().trim();
  return !this.submittedPlayers.includes(normalizedName);
};

// Method: Record a submission from a player
feedbackLinkSchema.methods.recordSubmission = function(playerName) {
  const normalizedName = playerName.toLowerCase().trim();
  if (!this.submittedPlayers.includes(normalizedName)) {
    this.submittedPlayers.push(normalizedName);
    this.submissionCount += 1;
  }
};

// Compound index for finding active links by match
feedbackLinkSchema.index({ matchId: 1, isActive: 1 });

module.exports = mongoose.model('FeedbackLink', feedbackLinkSchema);
