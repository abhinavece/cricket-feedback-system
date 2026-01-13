const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'player'],
    default: 'player',
  },
  team: {
    type: String,
    required: false,
    trim: true,
    default: 'Unknown Team'
  },
  notes: {
    type: String,
    required: false,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', playerSchema);
