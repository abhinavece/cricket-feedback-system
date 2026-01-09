const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
  messageId: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    default: 'delivered'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  // NEW: Match context fields
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    index: true
  },
  matchTitle: {
    type: String
  },
  messageType: {
    type: String,
    enum: ['general', 'availability_request', 'availability_response', 'availability_reminder', 'match_update'],
    default: 'general',
    index: true
  },
  templateUsed: {
    type: String
  },
  availabilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability'
  },
  // Player context for incoming messages
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    index: true
  },
  playerName: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
