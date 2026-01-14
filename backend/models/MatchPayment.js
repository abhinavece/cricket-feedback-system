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
  owedAmount: {
    type: Number,
    default: 0 // Amount owed back to player (when overpaid)
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'due', 'overpaid'],
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
    default: 0 // Sum of all amountPaid
  },
  totalPending: {
    type: Number,
    default: 0 // Sum of all dueAmount (money yet to be collected)
  },
  totalOwed: {
    type: Number,
    default: 0 // Sum of all owedAmount (money to be refunded)
  },
  perPersonAmount: {
    type: Number,
    default: 0 // Equal share for non-adjusted members
  },
  membersCount: {
    type: Number,
    default: 0
  },
  paidCount: {
    type: Number,
    default: 0 // Members who have paid fully or overpaid
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
// 
// Field Definitions:
// - calculatedAmount: The amount this player should pay
//   - If adjustedAmount is set (including 0): calculatedAmount = adjustedAmount
//   - If adjustedAmount is null: calculatedAmount = (totalAmount - sum of adjustedAmounts) / non-adjusted count
// - adjustedAmount: Admin-fixed amount. null = not adjusted, 0 = free player, number = fixed amount
// - amountPaid: Total amount actually paid by player
// - dueAmount: Amount player still owes (calculatedAmount - amountPaid, if positive)
// - owedAmount: Amount to refund to player (amountPaid - calculatedAmount, if overpaid)
//
// Invariant: For each player, amountPaid + dueAmount - owedAmount = calculatedAmount
// Invariant: Sum of all calculatedAmounts = totalAmount
//
matchPaymentSchema.methods.recalculateAmounts = function() {
  if (this.squadMembers.length === 0) {
    this.membersCount = 0;
    this.paidCount = 0;
    this.totalCollected = 0;
    this.totalPending = 0;
    this.totalOwed = 0;
    return;
  }

  // Step 1: Calculate totals for adjusted members
  let totalAdjusted = 0;
  let nonAdjustedCount = 0;
  
  this.squadMembers.forEach(member => {
    if (member.adjustedAmount !== null) {
      totalAdjusted += member.adjustedAmount;
    } else {
      nonAdjustedCount++;
    }
  });

  // Step 2: Calculate equal share for non-adjusted members
  const remainingAmount = this.totalAmount - totalAdjusted;
  const equalShare = nonAdjustedCount > 0 ? Math.ceil(remainingAmount / nonAdjustedCount) : 0;
  
  // Store the per-person amount (what non-adjusted players pay)
  this.perPersonAmount = equalShare;
  
  // Step 3: Update each member's calculatedAmount and payment details
  this.squadMembers.forEach(member => {
    // calculatedAmount depends on whether player has adjustedAmount
    // - Adjusted player (including free player with 0): calculatedAmount = adjustedAmount
    // - Non-adjusted player: calculatedAmount = equal share of remaining
    if (member.adjustedAmount !== null) {
      member.calculatedAmount = member.adjustedAmount;
    } else {
      member.calculatedAmount = equalShare;
    }
    
    // Calculate total paid from valid payment history only
    const validPayments = member.paymentHistory.filter(p => p.isValidPayment !== false);
    const totalPaid = validPayments.reduce((sum, payment) => sum + payment.amount, 0);
    member.amountPaid = totalPaid;
    
    // Calculate dueAmount and owedAmount based on calculatedAmount
    const difference = member.calculatedAmount - totalPaid;
    
    if (difference > 0) {
      // Player still owes money
      member.dueAmount = difference;
      member.owedAmount = 0;
    } else if (difference < 0) {
      // Player has overpaid, we owe them money
      member.dueAmount = 0;
      member.owedAmount = Math.abs(difference);
    } else {
      // Exactly paid
      member.dueAmount = 0;
      member.owedAmount = 0;
    }
    
    // Update payment status
    if (member.calculatedAmount === 0) {
      // Free player - always considered paid
      member.paymentStatus = totalPaid > 0 ? 'overpaid' : 'paid';
    } else if (totalPaid === 0) {
      member.paymentStatus = 'pending';
    } else if (totalPaid > member.calculatedAmount) {
      member.paymentStatus = 'overpaid';
    } else if (totalPaid === member.calculatedAmount) {
      member.paymentStatus = 'paid';
    } else {
      member.paymentStatus = 'partial';
    }
    
    // Update paidAt to last payment date
    if (member.paymentHistory.length > 0) {
      const lastPayment = member.paymentHistory[member.paymentHistory.length - 1];
      member.paidAt = lastPayment.paidAt;
    }
  });

  // Step 4: Update payment statistics
  this.membersCount = this.squadMembers.length;
  this.paidCount = this.squadMembers.filter(m => 
    m.paymentStatus === 'paid' || m.paymentStatus === 'overpaid'
  ).length;
  
  // Sum of all amounts paid
  this.totalCollected = this.squadMembers.reduce((sum, m) => sum + (m.amountPaid || 0), 0);
  
  // Sum of all due amounts (money yet to collect)
  this.totalPending = this.squadMembers.reduce((sum, m) => sum + (m.dueAmount || 0), 0);
  
  // Sum of all owed amounts (money to refund)
  this.totalOwed = this.squadMembers.reduce((sum, m) => sum + (m.owedAmount || 0), 0);

  // Step 5: Update overall payment status
  const hasPartial = this.squadMembers.some(m => m.paymentStatus === 'partial');
  
  if (this.paidCount === this.membersCount) {
    this.status = 'completed';
  } else if (this.paidCount > 0 || hasPartial) {
    this.status = 'partial';
  } else if (this.squadMembers.some(m => m.messageSentAt)) {
    this.status = 'sent';
  } else {
    this.status = 'draft';
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
