const mongoose = require('mongoose');

const squadResponseSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  response: {
    type: String,
    enum: ['yes', 'no', 'tentative', 'pending'],
    default: 'pending'
  },
  respondedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: false,
    unique: true,
    trim: true
  },
  cricHeroesMatchId: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    trim: true,
    default: ''
  },
  slot: {
    type: String,
    enum: ['morning', 'evening', 'night', 'custom'],
    required: true
  },
  opponent: {
    type: String,
    trim: true,
    default: ''
  },
  ground: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'cancelled', 'completed'],
    default: 'draft'
  },
  squad: [squadResponseSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better performance
matchSchema.index({ date: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ 'squad.player': 1 });

module.exports = mongoose.model('Match', matchSchema);
