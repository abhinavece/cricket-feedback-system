const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'bank_transfer', 'other'],
    default: 'upi'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isValidPayment: {
    type: Boolean,
    default: true // Mark if this payment entry is valid/counted
  },
  screenshotImage: {
    type: Buffer,
    default: null
  },
  screenshotContentType: {
    type: String,
    default: null
  }
}, { _id: true, timestamps: true });

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
  amountPaid: {
    type: Number,
    default: 0 // Total amount actually paid (sum of all payments in history)
  },
  dueAmount: {
    type: Number,
    default: 0 // Remaining amount to be paid
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'due'],
    default: 'pending'
  },
  paymentHistory: [paymentHistorySchema], // Array of all payment transactions
  dueDate: {
    type: Date,
    default: null // When the payment is due
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
    default: null // Latest screenshot (kept for backward compatibility)
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
    default: null // Date of last payment
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

  // Update calculated amounts and payment details
  this.squadMembers.forEach(member => {
    if (member.adjustedAmount === null) {
      member.calculatedAmount = equalShare;
    }
    
    // Calculate total paid from valid payment history only
    const validPayments = member.paymentHistory.filter(p => p.isValidPayment !== false);
    const totalPaid = validPayments.reduce((sum, payment) => sum + payment.amount, 0);
    member.amountPaid = totalPaid;
    
    // Calculate due amount
    const effectiveAmount = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
    member.dueAmount = Math.max(0, effectiveAmount - totalPaid);
    
    // Update payment status based on amounts
    if (totalPaid === 0) {
      member.paymentStatus = 'pending';
    } else if (totalPaid >= effectiveAmount) {
      member.paymentStatus = 'paid';
    } else {
      member.paymentStatus = 'partial';
    }
    
    // Update paidAt to last payment date
    if (member.paymentHistory.length > 0) {
      member.paidAt = member.paymentHistory[member.paymentHistory.length - 1].paidAt;
    }
  });

  // Update statistics
  this.membersCount = this.squadMembers.length;
  this.paidCount = this.squadMembers.filter(m => m.paymentStatus === 'paid').length;
  
  // Total collected is sum of all amounts paid
  this.totalCollected = this.squadMembers.reduce((sum, m) => sum + m.amountPaid, 0);
  this.totalPending = this.totalAmount - this.totalCollected;

  // Update overall status
  const hasPartial = this.squadMembers.some(m => m.paymentStatus === 'partial');
  if (this.paidCount === 0 && !hasPartial) {
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
