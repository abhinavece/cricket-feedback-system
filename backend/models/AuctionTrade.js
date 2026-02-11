/**
 * @fileoverview AuctionTrade Model
 * 
 * Post-auction player-for-player swap trades.
 * Team-initiated, admin-approved. Max 2 per team, 48-hour window.
 * Player-for-player swap only (no money).
 * 
 * @module models/AuctionTrade
 */

const mongoose = require('mongoose');

const tradePlayerSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionPlayer',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
}, { _id: false });

const auctionTradeSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
    index: true,
  },

  fromTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionTeam',
    required: true,
  },
  toTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionTeam',
    required: true,
  },

  // Player-for-player swap only (no money)
  fromPlayers: {
    type: [tradePlayerSchema],
    required: true,
    validate: [arr => arr.length > 0, 'At least one player required from proposing team'],
  },
  toPlayers: {
    type: [tradePlayerSchema],
    required: true,
    validate: [arr => arr.length > 0, 'At least one player required from receiving team'],
  },

  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  status: {
    type: String,
    enum: ['proposed', 'approved', 'rejected', 'executed'],
    default: 'proposed',
    index: true,
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  rejectionReason: {
    type: String,
    default: '',
  },

  executedAt: {
    type: Date,
    default: null,
  },

  publicAnnouncement: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// --- Indexes ---

auctionTradeSchema.index({ auctionId: 1, status: 1 });
auctionTradeSchema.index({ auctionId: 1, fromTeamId: 1 });
auctionTradeSchema.index({ auctionId: 1, toTeamId: 1 });

module.exports = mongoose.model('AuctionTrade', auctionTradeSchema);
