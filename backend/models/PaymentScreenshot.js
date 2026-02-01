const mongoose = require('mongoose');

const distributionSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchPayment',
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  amountApplied: {
    type: Number,
    required: true,
    min: 0
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const aiAnalysisSchema = new mongoose.Schema({
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
  processing_time_ms: {
    type: Number,
    default: null
  },
  payerName: {
    type: String,
    default: null
  },
  payeeName: {
    type: String,
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentDate: {
    type: Date,
    default: null
  },
  paymentTime: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    default: null
  },
  upiId: {
    type: String,
    default: null
  },
  currency: {
    type: String,
    default: 'INR'
  },
  transactionStatus: {
    type: String,
    default: null
  },
  isPaymentScreenshot: {
    type: Boolean,
    default: null
  },
  requiresReview: {
    type: Boolean,
    default: false
  },
  reviewReason: {
    type: String,
    enum: [
      null,
      'low_confidence',
      'amount_mismatch',
      'date_mismatch',
      'service_error',
      'parse_failed',
      'not_payment_screenshot',
      'duplicate_image',
      'amount_exceeds_threshold'
    ],
    default: null
  },
  rawResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { _id: false });

const paymentScreenshotSchema = new mongoose.Schema({
  // Multi-tenant isolation - required for all tenant-scoped data
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  // Player identification
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null, // Can be null for ad-hoc players not in the system
    index: true
  },
  playerPhone: {
    type: String,
    required: true,
    index: true
  },
  playerName: {
    type: String,
    default: null
  },

  // Screenshot binary data
  screenshotImage: {
    type: Buffer,
    required: true
  },
  screenshotContentType: {
    type: String,
    default: 'image/jpeg'
  },

  // WhatsApp message tracking
  screenshotMediaId: {
    type: String,
    index: true
  },
  messageId: {
    type: String,
    index: true
  },

  // Duplicate detection
  imageHash: {
    type: String,
    required: true,
    index: true
  },

  // Timestamps
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // AI extracted data
  extractedAmount: {
    type: Number,
    default: null
  },

  // Full AI analysis
  aiAnalysis: {
    type: aiAnalysisSchema,
    default: () => ({})
  },

  // FIFO distribution tracking
  distributions: {
    type: [distributionSchema],
    default: []
  },

  // Total amount distributed from this screenshot
  totalDistributed: {
    type: Number,
    default: 0
  },

  // Remaining amount not yet distributed
  remainingAmount: {
    type: Number,
    default: null
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending_ai', 'ai_complete', 'ai_failed', 'pending_review', 'approved', 'rejected', 'auto_applied', 'duplicate'],
    default: 'pending_ai',
    index: true
  },

  // If this is a duplicate, reference the original
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentScreenshot',
    default: null
  },

  // Review tracking
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for multi-tenant queries and duplicate detection
paymentScreenshotSchema.index({ organizationId: 1, playerPhone: 1, imageHash: 1 });
paymentScreenshotSchema.index({ organizationId: 1, playerPhone: 1, receivedAt: -1 });
paymentScreenshotSchema.index({ organizationId: 1, status: 1 });
paymentScreenshotSchema.index({ organizationId: 1, 'distributions.matchId': 1 });
paymentScreenshotSchema.index({ organizationId: 1, 'distributions.paymentId': 1 });

// Virtual for checking if fully distributed
paymentScreenshotSchema.virtual('isFullyDistributed').get(function() {
  if (this.extractedAmount === null) return false;
  return this.totalDistributed >= this.extractedAmount;
});

// Static method to find duplicate by image hash for a player within organization
// organizationId is required for multi-tenant isolation
paymentScreenshotSchema.statics.findDuplicate = async function(playerPhone, imageHash, organizationId) {
  if (!organizationId) {
    throw new Error('organizationId is required for duplicate detection');
  }
  
  return this.findOne({
    organizationId,
    playerPhone,
    imageHash,
    status: { $ne: 'duplicate' } // Don't match against other duplicates
  }).sort({ receivedAt: 1 }); // Get the original (earliest)
};

// Static method to get all screenshots for a player within organization
// organizationId is required for multi-tenant isolation
paymentScreenshotSchema.statics.getPlayerScreenshots = async function(playerPhone, organizationId, options = {}) {
  if (!organizationId) {
    throw new Error('organizationId is required for listing player screenshots');
  }
  
  const query = { organizationId, playerPhone };
  
  if (options.excludeDuplicates) {
    query.status = { $ne: 'duplicate' };
  }
  
  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .select(options.includeImage ? {} : { screenshotImage: 0 })
    .sort({ receivedAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get screenshots for a specific match payment within organization
// organizationId is required for multi-tenant isolation
paymentScreenshotSchema.statics.getPaymentScreenshots = async function(paymentId, organizationId, memberId, options = {}) {
  if (!organizationId) {
    throw new Error('organizationId is required for listing payment screenshots');
  }
  
  const query = {
    organizationId,
    'distributions.paymentId': paymentId
  };

  if (memberId) {
    query['distributions.memberId'] = memberId;
  }

  return this.find(query)
    .select(options.includeImage ? {} : { screenshotImage: 0 })
    .sort({ receivedAt: -1 });
};

// Instance method to add distribution
paymentScreenshotSchema.methods.addDistribution = function(matchId, paymentId, memberId, amount) {
  this.distributions.push({
    matchId,
    paymentId,
    memberId,
    amountApplied: amount,
    appliedAt: new Date()
  });
  
  this.totalDistributed = this.distributions.reduce((sum, d) => sum + d.amountApplied, 0);
  
  if (this.extractedAmount !== null) {
    this.remainingAmount = Math.max(0, this.extractedAmount - this.totalDistributed);
  }
  
  return this;
};

// Instance method to mark as duplicate
paymentScreenshotSchema.methods.markAsDuplicate = function(originalScreenshotId) {
  this.status = 'duplicate';
  this.duplicateOf = originalScreenshotId;
  this.aiAnalysis.requiresReview = true;
  this.aiAnalysis.reviewReason = 'duplicate_image';
  return this;
};

const PaymentScreenshot = mongoose.model('PaymentScreenshot', paymentScreenshotSchema);

module.exports = PaymentScreenshot;
