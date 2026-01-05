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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
