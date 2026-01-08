const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
    index: true
  },
  playerName: {
    type: String,
    required: true
  },
  playerPhone: {
    type: String,
    required: true
  },
  response: {
    type: String,
    enum: ['yes', 'no', 'tentative', 'pending'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  },
  messageContent: {
    type: String
  },
  outgoingMessageId: {
    type: String
  },
  incomingMessageId: {
    type: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'responded', 'no_response'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one availability record per player per match
availabilitySchema.index({ matchId: 1, playerId: 1 }, { unique: true });

// Index for quick lookups by match
availabilitySchema.index({ matchId: 1, status: 1 });

// Index for quick lookups by player
availabilitySchema.index({ playerId: 1, response: 1 });

// Update the updatedAt timestamp before saving
availabilitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for match details
availabilitySchema.virtual('match', {
  ref: 'Match',
  localField: 'matchId',
  foreignField: '_id',
  justOne: true
});

// Virtual for player details
availabilitySchema.virtual('player', {
  ref: 'Player',
  localField: 'playerId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON
availabilitySchema.set('toJSON', { virtuals: true });
availabilitySchema.set('toObject', { virtuals: true });

const Availability = mongoose.model('Availability', availabilitySchema);

module.exports = Availability;
