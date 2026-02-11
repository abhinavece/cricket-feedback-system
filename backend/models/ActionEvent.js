/**
 * @fileoverview ActionEvent Model (Undo Stack)
 * 
 * Tracks all auditable actions in an auction for undo support.
 * Each player-level action (sold, unsold, disqualified) is an atomic undoable unit.
 * LIFO undo stack with configurable max depth (default 3).
 * 
 * @module models/ActionEvent
 */

const mongoose = require('mongoose');

const actionEventSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
    index: true,
  },

  sequenceNumber: {
    type: Number,
    required: true,
  },

  type: {
    type: String,
    enum: [
      'BID_PLACED',
      'PLAYER_SOLD',
      'PLAYER_UNSOLD',
      'PLAYER_DISQUALIFIED',
      'PLAYER_REINSTATED',
      'TRADE_EXECUTED',
      'MANUAL_OVERRIDE',
      'PURSE_ADJUSTED',
      'PLAYER_DATA_UPDATED',
      'RETENTION_ADDED',
      'AUCTION_PAUSED',
      'AUCTION_RESUMED',
      'AUCTION_STARTED',
      'AUCTION_COMPLETED',
      'PLAYER_SKIPPED',
    ],
    required: true,
    index: true,
  },

  // Forward state (what happened)
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Reverse state (how to undo)
  reversalPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Undo tracking
  isUndone: {
    type: Boolean,
    default: false,
    index: true,
  },
  undoneAt: {
    type: Date,
    default: null,
  },
  undoneBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Public visibility
  isPublic: {
    type: Boolean,
    default: true,
  },
  publicMessage: {
    type: String,
    default: '',
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// --- Indexes ---

actionEventSchema.index({ auctionId: 1, sequenceNumber: -1 });
actionEventSchema.index({ auctionId: 1, isUndone: 1, type: 1 });

// --- Statics ---

/**
 * Get next sequence number for an auction
 */
actionEventSchema.statics.getNextSequence = async function(auctionId) {
  const last = await this.findOne({ auctionId })
    .sort({ sequenceNumber: -1 })
    .select('sequenceNumber')
    .lean();
  return last ? last.sequenceNumber + 1 : 1;
};

/**
 * Get the last N undoable (non-undone, player-level) actions
 * @param {ObjectId} auctionId
 * @param {number} limit
 */
actionEventSchema.statics.getUndoableActions = async function(auctionId, limit = 3) {
  const UNDOABLE_TYPES = [
    'PLAYER_SOLD',
    'PLAYER_UNSOLD',
    'PLAYER_DISQUALIFIED',
    'PLAYER_REINSTATED',
    'MANUAL_OVERRIDE',
  ];

  return this.find({
    auctionId,
    isUndone: false,
    type: { $in: UNDOABLE_TYPES },
  })
    .sort({ sequenceNumber: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get count of consecutive undos performed (for max undo limit)
 */
actionEventSchema.statics.getConsecutiveUndoCount = async function(auctionId) {
  const actions = await this.find({
    auctionId,
    isUndone: true,
  })
    .sort({ undoneAt: -1 })
    .limit(10)
    .lean();

  // Count consecutive undos from the most recent
  let count = 0;
  for (const action of actions) {
    if (action.isUndone) count++;
    else break;
  }
  return count;
};

module.exports = mongoose.model('ActionEvent', actionEventSchema);
