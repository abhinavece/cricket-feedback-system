const mongoose = require('mongoose');

const paymentMemberSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null // null for ad-hoc players not in the system
  },
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  playerPhone: {
    type: String,
    required: true,
    trim: true
  },
  calculatedAmount: {
    type: Number,
    default: 0 // Auto-calculated equal share
  },
  adjustedAmount: {
    type: Number,
    default: null // Manual override, null means use calculated
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'due'],
    default: 'pending'
  },
  messageSentAt: {
    type: Date,
    default: null
  },
  outgoingMessageId: {
    type: String,
    default: null
  },
  screenshotImage: {
    type: Buffer,
    default: null
  },
  screenshotContentType: {
    type: String,
    default: null
  },
  screenshotMediaId: {
    type: String,
    default: null // WhatsApp media ID for reference
  },
  screenshotReceivedAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: true });

// Virtual to get the effective amount (adjusted or calculated)
paymentMemberSchema.virtual('effectiveAmount').get(function() {
  return this.adjustedAmount !== null ? this.adjustedAmount : this.calculatedAmount;
});

const matchPaymentSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  squadMembers: [paymentMemberSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'partial', 'completed'],
    default: 'draft'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Statistics
  totalCollected: {
    type: Number,
    default: 0
  },
  totalPending: {
    type: Number,
    default: 0
  },
  membersCount: {
    type: Number,
    default: 0
  },
  paidCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for quick lookups
matchPaymentSchema.index({ matchId: 1 }, { unique: true });
matchPaymentSchema.index({ status: 1 });
matchPaymentSchema.index({ createdAt: -1 });
matchPaymentSchema.index({ 'squadMembers.playerPhone': 1 });
matchPaymentSchema.index({ 'squadMembers.outgoingMessageId': 1 });

// Method to recalculate amounts when members change
matchPaymentSchema.methods.recalculateAmounts = function() {
  if (this.squadMembers.length === 0) {
    return;
  }

  // Calculate total of adjusted amounts
  let totalAdjusted = 0;
  let adjustedCount = 0;
  
  this.squadMembers.forEach(member => {
    if (member.adjustedAmount !== null) {
      totalAdjusted += member.adjustedAmount;
      adjustedCount++;
    }
  });

  // Remaining amount to distribute among non-adjusted members
  const remainingAmount = this.totalAmount - totalAdjusted;
  const nonAdjustedCount = this.squadMembers.length - adjustedCount;
  
  // Calculate equal share for non-adjusted members
  const equalShare = nonAdjustedCount > 0 ? Math.ceil(remainingAmount / nonAdjustedCount) : 0;

  // Update calculated amounts
  this.squadMembers.forEach(member => {
    if (member.adjustedAmount === null) {
      member.calculatedAmount = equalShare;
    }
  });

  // Update statistics
  this.membersCount = this.squadMembers.length;
  this.paidCount = this.squadMembers.filter(m => m.paymentStatus === 'paid').length;
  this.totalCollected = this.squadMembers
    .filter(m => m.paymentStatus === 'paid')
    .reduce((sum, m) => sum + (m.adjustedAmount !== null ? m.adjustedAmount : m.calculatedAmount), 0);
  this.totalPending = this.totalAmount - this.totalCollected;

  // Update overall status
  if (this.paidCount === 0) {
    this.status = this.squadMembers.some(m => m.messageSentAt) ? 'sent' : 'draft';
  } else if (this.paidCount === this.membersCount) {
    this.status = 'completed';
  } else {
    this.status = 'partial';
  }
};

// Pre-save hook to recalculate
matchPaymentSchema.pre('save', function() {
  this.recalculateAmounts();
});

// Ensure virtuals are included
matchPaymentSchema.set('toJSON', { virtuals: true });
matchPaymentSchema.set('toObject', { virtuals: true });
paymentMemberSchema.set('toJSON', { virtuals: true });
paymentMemberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MatchPayment', matchPaymentSchema);
