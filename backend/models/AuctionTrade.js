/**
 * @fileoverview AuctionTrade Model
 * 
 * Bilateral post-auction player trades with smart player locking.
 * Initiator proposes → counterparty accepts/rejects → admin approves+executes.
 * Configurable purse settlement based on player purchase prices.
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
  role: {
    type: String,
    default: '',
  },
  soldAmount: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const auctionTradeSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
    index: true,
  },

  // Teams (initiator = proposer, counterparty = must accept/reject)
  initiatorTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionTeam',
    required: true,
  },
  counterpartyTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionTeam',
    required: true,
  },

  // Players with financial info
  initiatorPlayers: {
    type: [tradePlayerSchema],
    required: true,
    validate: [arr => arr.length > 0, 'At least one player required from initiator team'],
  },
  counterpartyPlayers: {
    type: [tradePlayerSchema],
    required: true,
    validate: [arr => arr.length > 0, 'At least one player required from counterparty team'],
  },

  // Financial summary (auto-calculated on creation)
  initiatorTotalValue: {
    type: Number,
    default: 0,
  },
  counterpartyTotalValue: {
    type: Number,
    default: 0,
  },
  settlementAmount: {
    type: Number,
    default: 0,
  },
  settlementDirection: {
    type: String,
    enum: ['initiator_pays', 'counterparty_pays', 'even'],
    default: 'even',
  },
  purseSettlementEnabled: {
    type: Boolean,
    default: true,
  },

  // Status — bilateral flow
  status: {
    type: String,
    enum: ['pending_counterparty', 'both_agreed', 'executed', 'rejected', 'withdrawn', 'cancelled', 'expired'],
    default: 'pending_counterparty',
    index: true,
  },

  // Messages
  initiatorMessage: {
    type: String,
    default: '',
  },
  counterpartyMessage: {
    type: String,
    default: '',
  },
  adminNote: {
    type: String,
    default: '',
  },

  // Rejection / cancellation tracking
  rejectedBy: {
    type: String,
    enum: ['counterparty', 'admin', null],
    default: null,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  cancellationReason: {
    type: String,
    default: '',
  },

  // Timestamps / admin tracking
  counterpartyAcceptedAt: {
    type: Date,
    default: null,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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
auctionTradeSchema.index({ auctionId: 1, initiatorTeamId: 1 });
auctionTradeSchema.index({ auctionId: 1, counterpartyTeamId: 1 });
// For player lock queries: find active trades involving specific players
auctionTradeSchema.index({ auctionId: 1, 'initiatorPlayers.playerId': 1, status: 1 });
auctionTradeSchema.index({ auctionId: 1, 'counterpartyPlayers.playerId': 1, status: 1 });

module.exports = mongoose.model('AuctionTrade', auctionTradeSchema);
