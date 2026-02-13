/**
 * @fileoverview AuctionPlayer Model
 * 
 * Represents a player in the auction pool.
 * Imported from XLSX/CSV with dynamic custom fields.
 * Tracks auction status, sale info, round history, and self-validation.
 * 
 * @module models/AuctionPlayer
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const roundHistorySchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true,
  },
  result: {
    type: String,
    enum: ['sold', 'unsold', 'skipped', 'voided'],
    required: true,
  },
  highestBid: {
    type: Number,
    default: 0,
  },
  highestBidTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionTeam',
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const flaggedIssueSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  flaggedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const auctionPlayerSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
    index: true,
  },

  playerNumber: {
    type: Number,
    required: true,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  imageThumbnailUrl: {
    type: String,
    default: '',
  },
  imageCropPosition: {
    type: String,
    default: 'center top',
  },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'],
    required: true,
  },

  // Dynamic fields from XLSX/CSV import
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map(),
  },

  // All players share auction-level base price (no per-player override)
  status: {
    type: String,
    enum: ['pool', 'in_auction', 'sold', 'unsold', 'disqualified', 'ineligible'],
    default: 'pool',
    index: true,
  },

  // Sale info
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionTeam',
    default: null,
  },
  soldAmount: {
    type: Number,
    default: null,
  },
  soldInRound: {
    type: Number,
    default: null,
  },

  // Round tracking (base price stays same across rounds — no reduction)
  roundHistory: {
    type: [roundHistorySchema],
    default: [],
  },

  // Player self-validation
  validationToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  validationStatus: {
    type: String,
    enum: ['pending', 'verified', 'flagged'],
    default: 'pending',
  },
  flaggedIssues: {
    type: [flaggedIssueSchema],
    default: [],
  },

  // Import metadata
  importSource: {
    type: String,
    enum: ['excel', 'manual'],
    default: 'manual',
  },
  importRow: {
    type: Number,
    default: null,
  },

  // Disqualification
  isDisqualified: {
    type: Boolean,
    default: false,
  },
  disqualifiedAt: {
    type: Date,
    default: null,
  },
  disqualifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  disqualificationReason: {
    type: String,
    default: '',
  },

  // Ineligibility (soft block — injury, pending verification, etc.)
  isIneligible: {
    type: Boolean,
    default: false,
  },
  ineligibleAt: {
    type: Date,
    default: null,
  },
  ineligibleBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  ineligibilityReason: {
    type: String,
    default: '',
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// --- Indexes ---

auctionPlayerSchema.index({ auctionId: 1, status: 1 });
auctionPlayerSchema.index({ auctionId: 1, playerNumber: 1 }, { unique: true });
auctionPlayerSchema.index({ auctionId: 1, role: 1, status: 1 });
auctionPlayerSchema.index({ auctionId: 1, soldTo: 1 });
// validationToken index already created by unique+sparse on field definition

// --- Statics ---

/**
 * Generate a unique validation token for player self-verification
 */
auctionPlayerSchema.statics.generateValidationToken = function() {
  return crypto.randomBytes(16).toString('base64url');
};

/**
 * Get next player number for an auction
 */
auctionPlayerSchema.statics.getNextPlayerNumber = async function(auctionId) {
  const lastPlayer = await this.findOne({ auctionId })
    .sort({ playerNumber: -1 })
    .select('playerNumber')
    .lean();
  return lastPlayer ? lastPlayer.playerNumber + 1 : 1;
};

module.exports = mongoose.model('AuctionPlayer', auctionPlayerSchema);
