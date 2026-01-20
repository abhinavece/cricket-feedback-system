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
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true
  },
  cricHeroesId: {
    type: String,
    trim: true
  },
  about: {
    type: String,
    maxLength: 500,
    trim: true
  },
  battingStyle: {
    type: String,
    enum: ['right-handed', 'left-handed', null],
    default: null
  },
  bowlingStyle: {
    type: String,
    enum: ['right-arm-fast', 'right-arm-medium', 'right-arm-spin', 'left-arm-fast', 'left-arm-medium', 'left-arm-spin', 'none', null],
    default: null
  },
  dateOfBirth: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Player', playerSchema);
