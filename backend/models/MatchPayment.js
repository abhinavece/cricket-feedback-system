/**
 * @fileoverview MatchPayment Model
 * 
 * Tracks payment collection for matches within an organization.
 * 
 * @module models/MatchPayment
 */

const mongoose = require('mongoose');
const {
  calculatePerPersonShares,
  calculateMemberStats
} = require('../services/paymentCalculationService');

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
  },
  // OCR tracking for distributed payments
  ocrExtractedAmount: {
    type: Number,
    default: null
  },
  distributedAmount: {
    type: Number,
    default: null  // Amount allocated to THIS match from a larger payment
  },
  sourcePaymentInfo: {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MatchPayment'
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId
    },
    totalAmount: Number  // Total OCR amount from the original payment
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
  settledAmount: {
    type: Number,
    default: 0 // Amount that has been settled/refunded to player
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
  },
  // Screenshot reference (for multi-match payments where image stored elsewhere)
  screenshotRef: {
    sourcePaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MatchPayment'
    },
    sourceMemberId: {
      type: mongoose.Schema.Types.ObjectId
    },
    originalAmount: Number  // Full payment amount from screenshot
  },
  // OCR tracking
  ocrExtractedAmount: {
    type: Number,
    default: null  // Amount detected by OCR from screenshot
  },
  ocrConfidence: {
    type: Number,
    default: null  // 0-100 confidence score from OCR
  },
  requiresReview: {
    type: Boolean,
    default: false  // Flag for admin attention
  },
  reviewReason: {
    type: String,
    enum: ['ocr_mismatch', 'partial_payment', 'overpayment', 'ocr_failed', 'date_mismatch', 'amount_mismatch', 'confidence_low', 'ai_uncertain', 'validation_failed', 'service_error', null],
    default: null
  },
  // Track if payment was auto-distributed from another match payment
  distributedFromPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchPayment',
    default: null
  },
  // NEW: References to PaymentScreenshot documents (supports multiple screenshots)
  screenshots: [{
    screenshotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentScreenshot'
    },
    amountApplied: {
      type: Number,
      default: 0
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Summary fields for quick queries (updated when screenshots added)
  hasScreenshots: {
    type: Boolean,
    default: false
  },
  screenshotCount: {
    type: Number,
    default: 0
  },
  latestScreenshotAt: {
    type: Date,
    default: null
  },
  // DEPRECATED: Legacy AI fields (kept for backward compatibility)
  // New screenshots store AI data in PaymentScreenshot collection
  confidence: {
    type: Number,
    default: null,
    min: 0,
    max: 1
  },
  provider: {
    type: String,
    default: null
  },
  model: {
    type: String,
    default: null
  },
  model_cost_tier: {
    type: String,
    enum: ['free', 'paid', null],
    default: null
  },
  image_hash: {
    type: String,
    default: null
  },
  processing_time_ms: {
    type: Number,
    default: null
  },
  ai_service_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { _id: true });

// Virtual to get the effective amount (adjusted or calculated)
paymentMemberSchema.virtual('effectiveAmount').get(function() {
  return this.adjustedAmount !== null ? this.adjustedAmount : this.calculatedAmount;
});

const matchPaymentSchema = new mongoose.Schema({
  // Multi-tenant: Organization this payment belongs to
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  
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
  },
  // AI Service Integration Fields
  screenshotImage: {
    type: Buffer,
    default: null
  },
  screenshotContentType: {
    type: String,
    default: null
  },
  confidence: {
    type: Number,
    default: null, // 0-1 confidence score from AI service
    min: 0,
    max: 1
  },
  provider: {
    type: String,
    default: null // AI provider (e.g., 'google_ai_studio')
  },
  model: {
    type: String,
    default: null // AI model used (e.g., 'gemma-3-27b-it')
  },
  model_cost_tier: {
    type: String,
    enum: ['free', 'paid'],
    default: null
  },
  image_hash: {
    type: String,
    default: null // SHA-256 hash for deduplication
  },
  processing_time_ms: {
    type: Number,
    default: null // Processing time in milliseconds
  },
  ai_service_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null // Full AI service response
  }
}, {
  timestamps: true
});

// Indexes for multi-tenant queries
// matchId is unique within an organization
matchPaymentSchema.index({ organizationId: 1, matchId: 1 }, { unique: true });
matchPaymentSchema.index({ organizationId: 1, status: 1 });
matchPaymentSchema.index({ organizationId: 1, createdAt: -1 });
matchPaymentSchema.index({ organizationId: 1, 'squadMembers.playerPhone': 1 });
matchPaymentSchema.index({ 'squadMembers.outgoingMessageId': 1 });

// Method to recalculate amounts when members change
// Uses centralized PaymentCalculationService for consistent calculations
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
    this.perPersonAmount = 0;
    return;
  }

  // Step 1: Calculate equal share using centralized service
  const { equalShare } = calculatePerPersonShares(this.totalAmount, this.squadMembers);

  // Store the per-person amount (what non-adjusted players pay)
  this.perPersonAmount = equalShare;

  // Step 2: Update each member using centralized calculation
  this.squadMembers.forEach(member => {
    const stats = calculateMemberStats(member, equalShare);

    member.calculatedAmount = stats.calculatedAmount;
    member.amountPaid = stats.amountPaid;
    member.dueAmount = stats.dueAmount;
    member.owedAmount = stats.owedAmount;
    member.paymentStatus = stats.paymentStatus;

    // Update paidAt from stats if available
    if (stats.paidAt) {
      member.paidAt = stats.paidAt;
    }
  });

  // Step 3: Update payment statistics
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

  // Step 4: Update overall payment status
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
