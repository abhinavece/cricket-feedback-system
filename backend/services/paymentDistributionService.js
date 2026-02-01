/**
 * Payment Distribution Service
 *
 * Handles FIFO distribution of payments across multiple matches.
 * When a player pays an amount that covers multiple matches,
 * this service distributes the payment to oldest matches first.
 *
 * Uses centralized PaymentCalculationService for consistent calculations.
 */

const MatchPayment = require('../models/MatchPayment');
const Match = require('../models/Match');
const { formatPhoneNumber } = require('./playerService');
const { calculateAmountPaidFromHistory } = require('./paymentCalculationService');

/**
 * Get all pending payments for a player, sorted by match date (oldest first - FIFO)
 * Uses centralized calculation to compute dueAmount from payment history
 * @param {string} playerPhone - Player's phone number
 * @returns {Promise<Array>} - Array of pending payment info sorted by match date
 */
const getPendingPaymentsForPlayer = async (playerPhone) => {
  const formattedPhone = formatPhoneNumber(playerPhone);

  if (!formattedPhone) {
    return [];
  }

  // Create phone variants for matching
  const phoneVariants = [
    formattedPhone,
    formattedPhone.slice(-10),
    '91' + formattedPhone.slice(-10)
  ];

  // Find all MatchPayments where this player is a member
  // Don't filter by dueAmount > 0 here - we'll calculate it fresh
  const payments = await MatchPayment.find({
    'squadMembers.playerPhone': { $in: phoneVariants }
  }).populate('matchId', 'date opponent ground slot');

  // Extract matching members and calculate dueAmount fresh from payment history
  const pendingPayments = [];

  for (const payment of payments) {
    const member = payment.squadMembers.find(m =>
      phoneVariants.includes(m.playerPhone) ||
      m.playerPhone.includes(formattedPhone.slice(-10))
    );

    if (member) {
      // Calculate effective amount (what they should pay)
      const effectiveAmount = member.adjustedAmount !== null
        ? member.adjustedAmount
        : member.calculatedAmount;

      // Calculate amount paid from payment history using centralized function
      const amountPaid = calculateAmountPaidFromHistory(member.paymentHistory || []);

      // Calculate due amount
      const dueAmount = Math.max(0, effectiveAmount - amountPaid);

      if (dueAmount > 0) {
        pendingPayments.push({
          paymentId: payment._id,
          memberId: member._id,
          playerId: member.playerId, // Include playerId for PaymentScreenshot
          organizationId: payment.organizationId, // Include organizationId for multi-tenant isolation
          matchId: (payment.matchId && payment.matchId._id) ? payment.matchId._id : payment.matchId,
          matchDate: payment.matchId?.date,
          matchInfo: {
            opponent: payment.matchId?.opponent || 'TBD',
            ground: payment.matchId?.ground || '',
            slot: payment.matchId?.slot || '',
            date: payment.matchId?.date
          },
          dueAmount,
          playerName: member.playerName,
          playerPhone: member.playerPhone,
          calculatedAmount: effectiveAmount
        });
      }
    }
  }

  // Sort by match date (oldest first for FIFO)
  pendingPayments.sort((a, b) => {
    const dateA = a.matchDate ? new Date(a.matchDate) : new Date(0);
    const dateB = b.matchDate ? new Date(b.matchDate) : new Date(0);
    return dateA - dateB;
  });

  return pendingPayments;
};

/**
 * Calculate total outstanding amount for a player across all matches
 * @param {string} playerPhone - Player's phone number
 * @returns {Promise<{totalDue: number, matchCount: number, matches: Array}>}
 */
const getTotalOutstandingForPlayer = async (playerPhone) => {
  const pendingPayments = await getPendingPaymentsForPlayer(playerPhone);

  const totalDue = pendingPayments.reduce((sum, p) => sum + p.dueAmount, 0);
  const matchCount = pendingPayments.length;

  return {
    totalDue,
    matchCount,
    matches: pendingPayments.map(p => ({
      matchId: p.matchId,
      opponent: p.matchInfo.opponent,
      date: p.matchDate,
      dueAmount: p.dueAmount
    }))
  };
};

/**
 * Distribute payment amount across matches using FIFO (oldest first)
 * @param {string} playerPhone - Player's phone number
 * @param {number} totalAmount - Total payment amount (from AI or manual)
 * @param {Object} screenshotData - Screenshot data
 * @param {Buffer} screenshotData.buffer - Image buffer
 * @param {string} screenshotData.contentType - MIME type
 * @param {string} screenshotData.mediaId - WhatsApp media ID
 * @param {Object} aiData - AI extraction data
 * @param {number} aiData.confidence - AI confidence score
 * @param {string} aiData.provider - AI provider used
 * @param {string} aiData.model - AI model used
 * @param {string} aiData.payerName - Extracted payer name
 * @param {string} aiData.transactionId - Extracted transaction ID
 * @param {string} aiData.paymentDate - Extracted payment date
 * @returns {Promise<Object>} - Distribution result
 */
const distributePaymentFIFO = async (playerPhone, totalAmount, screenshotData, aiData = {}) => {
  console.log(`\n📊 Starting FIFO payment distribution`);
  console.log(`   Player: ${playerPhone}`);
  console.log(`   Amount: ₹${totalAmount}`);

  const pendingPayments = await getPendingPaymentsForPlayer(playerPhone);

  if (pendingPayments.length === 0) {
    console.log('   ⚠️ No pending payments found');
    return {
      success: false,
      message: 'No pending payments found for this player',
      distributions: []
    };
  }

  console.log(`   Found ${pendingPayments.length} pending payment(s)`);

  const distributions = [];
  let remainingAmount = totalAmount;
  let primaryPaymentId = null;
  let primaryMemberId = null;

  // Store screenshot in the first (oldest) match
  const primaryPayment = await MatchPayment.findById(pendingPayments[0].paymentId);
  const primaryMember = primaryPayment?.squadMembers.id(pendingPayments[0].memberId);

  if (primaryMember && screenshotData?.buffer) {
    primaryMember.screenshotImage = screenshotData.buffer;
    primaryMember.screenshotContentType = screenshotData.contentType || 'image/jpeg';
    primaryMember.screenshotMediaId = screenshotData.mediaId || null;
    primaryMember.screenshotReceivedAt = new Date();
    primaryPaymentId = primaryPayment._id;
    primaryMemberId = primaryMember._id;
    console.log(`   📸 Screenshot stored in oldest match: ${pendingPayments[0].matchInfo.opponent}`);
  }

  // Calculate total due across all pending payments
  const totalDueAcrossMatches = pendingPayments.reduce((sum, p) => sum + p.dueAmount, 0);
  const isOverpayment = totalAmount > totalDueAcrossMatches;
  const overpaymentAmount = isOverpayment ? totalAmount - totalDueAcrossMatches : 0;

  if (isOverpayment) {
    console.log(`   ⚠️ Overpayment detected: ₹${totalAmount} paid for ₹${totalDueAcrossMatches} due (₹${overpaymentAmount} excess)`);
  }

  // Distribute amount across matches (FIFO)
  for (let i = 0; i < pendingPayments.length; i++) {
    if (remainingAmount <= 0) break;

    const pending = pendingPayments[i];
    const allocate = Math.min(pending.dueAmount, remainingAmount);
    remainingAmount -= allocate;

    console.log(`   → ${pending.matchInfo.opponent}: ₹${allocate} (due: ₹${pending.dueAmount})`);

    // Load the payment record
    const payment = i === 0 ? primaryPayment : await MatchPayment.findById(pending.paymentId);
    const member = payment?.squadMembers.id(pending.memberId);

    if (member) {
      // For primary match with overpayment: record FULL payment amount so owedAmount calculates correctly
      // For other matches: record only the allocated amount
      const recordedAmount = (i === 0 && isOverpayment) ? (allocate + overpaymentAmount) : allocate;
      
      // Add payment history entry
      member.paymentHistory.push({
        amount: recordedAmount,
        paidAt: new Date(),
        paymentMethod: 'upi',
        notes: isOverpayment && i === 0 
          ? `Auto-distributed from ₹${totalAmount} payment (₹${overpaymentAmount} overpayment)`
          : `Auto-distributed from ₹${totalAmount} payment`,
        isValidPayment: true,
        ocrExtractedAmount: totalAmount,
        distributedAmount: allocate,
        overpaymentAmount: i === 0 ? overpaymentAmount : 0,
        sourcePaymentInfo: i > 0 ? {
          paymentId: primaryPaymentId,
          memberId: primaryMemberId,
          totalAmount: totalAmount
        } : null
      });

      // Update AI tracking on member
      member.ocrExtractedAmount = totalAmount;
      member.ocrConfidence = aiData.confidence || null;
      member.paidAt = new Date();

      // Set screenshot reference for non-primary matches
      if (i > 0 && primaryPaymentId && primaryMemberId) {
        member.screenshotRef = {
          sourcePaymentId: primaryPaymentId,
          sourceMemberId: primaryMemberId,
          originalAmount: totalAmount
        };
        member.distributedFromPaymentId = primaryPaymentId;
      }

      // Check if amount needs review
      const expectedAmount = pending.calculatedAmount;
      if (i === 0 && totalAmount > 0 && expectedAmount > 0) {
        const diff = Math.abs(totalAmount - pending.dueAmount);
        // Flag for review if the OCR amount differs significantly from single match due
        // But don't flag if they're paying for multiple matches
        const totalDue = pendingPayments.reduce((sum, p) => sum + p.dueAmount, 0);
        if (Math.abs(totalAmount - totalDue) > 50 && Math.abs(totalAmount - pending.dueAmount) > 50) {
          member.requiresReview = true;
          member.reviewReason = totalAmount < pending.dueAmount ? 'partial_payment' : 'overpayment';
        }
      }

      await payment.save();

      distributions.push({
        matchId: pending.matchId,
        paymentId: payment._id,
        memberId: member._id,
        opponent: pending.matchInfo.opponent,
        matchDate: pending.matchDate,
        allocatedAmount: allocate,
        previousDue: pending.dueAmount,
        newDue: Math.max(0, pending.dueAmount - allocate),
        isPrimary: i === 0,
        status: allocate >= pending.dueAmount ? 'paid' : 'partial'
      });
    }
  }

  const totalDistributed = distributions.reduce((sum, d) => sum + d.allocatedAmount, 0);
  const overpayment = remainingAmount > 0 ? remainingAmount : 0;

  console.log(`   ✅ Distribution complete`);
  console.log(`   Total distributed: ₹${totalDistributed}`);
  if (overpayment > 0) {
    console.log(`   ⚠️ Overpayment: ₹${overpayment}`);
  }

  return {
    success: true,
    totalAmount,
    totalDistributed,
    overpayment,
    matchesAffected: distributions.length,
    distributions,
    playerName: pendingPayments[0]?.playerName,
    playerPhone
  };
};

/**
 * Build confirmation message for distributed payment
 * Shows ALL pending matches with their status, not just the ones that received payment
 *
 * @param {Object} distributionResult - Result from distributePaymentFIFO
 * @param {Array} allPendingPayments - All pending payments for the player (from getPendingPaymentsForPlayer)
 * @returns {string} - WhatsApp message text
 */
const buildDistributionConfirmation = (distributionResult, allPendingPayments = null) => {
  const { totalAmount, distributions, overpayment, playerName } = distributionResult;

  // If allPendingPayments not provided, fall back to distributions only
  const pendingPayments = allPendingPayments || distributions.map(d => ({
    paymentId: d.paymentId,
    matchInfo: { opponent: d.opponent },
    matchDate: d.matchDate,
    dueAmount: d.previousDue
  }));

  let message = `✅ Thank you ${playerName}!\n\n`;
  message += `💰 *Payment Received:* ₹${totalAmount}\n\n`;

  // Show breakdown of ALL pending matches with their status
  message += `📊 *Match Breakdown:*\n`;

  // Calculate total remaining across ALL matches
  let totalRemainingAcrossAllMatches = 0;

  pendingPayments.forEach(p => {
    const distribution = distributions.find(d =>
      d.paymentId.toString() === p.paymentId.toString()
    );

    const dateStr = p.matchDate ? new Date(p.matchDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    }) : '';

    const opponent = p.matchInfo?.opponent || 'TBD';

    if (distribution) {
      // This match received payment
      const statusIcon = distribution.status === 'paid' ? '✅' : '⏳';
      message += `• ${opponent} (${dateStr}): ₹${distribution.allocatedAmount} paid ${statusIcon}`;
      if (distribution.newDue > 0) {
        message += ` (₹${distribution.newDue} pending)`;
        totalRemainingAcrossAllMatches += distribution.newDue;
      }
    } else {
      // This match didn't receive payment (payment exhausted before reaching it)
      message += `• ${opponent} (${dateStr}): ₹${p.dueAmount} pending ⏳`;
      totalRemainingAcrossAllMatches += p.dueAmount;
    }
    message += '\n';
  });

  // Show total outstanding
  message += `\n📍 *Total Outstanding:* ₹${totalRemainingAcrossAllMatches}`;

  if (overpayment > 0) {
    message += `\n\n💰 *Overpayment:* ₹${overpayment} (will be adjusted in future matches)`;
  }

  if (totalRemainingAcrossAllMatches > 0) {
    message += `\n\n_Admin will validate and confirm your payment._`;
  } else {
    message += `\n\nYour payments are complete! 🙏`;
  }

  return message;
};

module.exports = {
  getPendingPaymentsForPlayer,
  getTotalOutstandingForPlayer,
  distributePaymentFIFO,
  buildDistributionConfirmation
};
