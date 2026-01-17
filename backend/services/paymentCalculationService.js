/**
 * Payment Calculation Service
 *
 * Single source of truth for all payment calculations.
 * This service centralizes payment logic that was previously scattered across:
 * - MatchPayment.recalculateAmounts() model method
 * - /players-summary endpoint inline calculations
 * - /player-history endpoint aggregation pipeline
 * - paymentDistributionService calculations
 *
 * Invariants maintained:
 * - For each member: amountPaid + dueAmount - owedAmount = calculatedAmount
 * - Sum of all calculatedAmounts = totalAmount
 */

/**
 * Calculate total paid from payment history
 * Only counts payments where isValidPayment !== false
 *
 * @param {Array} paymentHistory - Array of payment history entries
 * @returns {number} - Total amount paid
 */
const calculateAmountPaidFromHistory = (paymentHistory = []) => {
  const validPayments = paymentHistory.filter(p => p.isValidPayment !== false);
  return validPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
};

/**
 * Calculate per-person shares for squad members
 * Handles adjusted amounts (including free players with adjustedAmount = 0)
 *
 * @param {number} totalAmount - Total amount to be split
 * @param {Array} squadMembers - Array of squad member objects with adjustedAmount field
 * @returns {Object} - { equalShare, totalAdjusted, nonAdjustedCount }
 */
const calculatePerPersonShares = (totalAmount, squadMembers = []) => {
  let totalAdjusted = 0;
  let nonAdjustedCount = 0;

  squadMembers.forEach(member => {
    if (member.adjustedAmount !== null && member.adjustedAmount !== undefined) {
      totalAdjusted += member.adjustedAmount;
    } else {
      nonAdjustedCount++;
    }
  });

  const remainingAmount = totalAmount - totalAdjusted;
  const equalShare = nonAdjustedCount > 0 ? Math.ceil(remainingAmount / nonAdjustedCount) : 0;

  return { equalShare, totalAdjusted, nonAdjustedCount, remainingAmount };
};

/**
 * Calculate a single member's payment statistics
 * This is the core calculation that determines:
 * - calculatedAmount (what they should pay)
 * - amountPaid (what they've actually paid - sum of paymentHistory)
 * - settledAmount (money already returned to player from overpayment)
 * - dueAmount (what they still owe)
 * - owedAmount (what should be refunded if overpaid)
 * - paymentStatus (pending/partial/paid/overpaid)
 *
 * Key concept: netPayment = amountPaid - settledAmount
 * This represents the player's actual net contribution after accounting for refunds.
 *
 * @param {Object} member - Member object with paymentHistory, adjustedAmount, settledAmount
 * @param {number} equalShare - The equal share for non-adjusted members
 * @returns {Object} - Calculated member statistics
 */
const calculateMemberStats = (member, equalShare) => {
  // Determine calculatedAmount based on whether member has adjustedAmount
  const calculatedAmount = (member.adjustedAmount !== null && member.adjustedAmount !== undefined)
    ? member.adjustedAmount
    : equalShare;

  // Calculate total paid from valid payment history
  const amountPaid = calculateAmountPaidFromHistory(member.paymentHistory || []);

  // Get settled amount (money already returned to player)
  const settledAmount = member.settledAmount || 0;

  // Calculate net payment: what the player has effectively contributed
  // If they paid 820 and got 70 returned, their net payment is 750
  const netPayment = amountPaid - settledAmount;

  // Calculate dueAmount and owedAmount based on netPayment vs calculatedAmount
  let dueAmount = 0;
  let owedAmount = 0;

  if (netPayment < calculatedAmount) {
    // Player still owes money
    // If netPayment=750 and calculatedAmount=900, dueAmount=150
    dueAmount = calculatedAmount - netPayment;
    owedAmount = 0;
  } else if (netPayment > calculatedAmount) {
    // Player has overpaid (net contribution exceeds what's required)
    // If netPayment=820 and calculatedAmount=750, owedAmount=70
    dueAmount = 0;
    owedAmount = netPayment - calculatedAmount;
  } else {
    // Exactly paid (netPayment === calculatedAmount)
    dueAmount = 0;
    owedAmount = 0;
  }

  // Determine payment status
  let paymentStatus;
  if (calculatedAmount === 0) {
    // Free player - always considered paid unless they have net contribution
    paymentStatus = netPayment > 0 ? 'overpaid' : 'paid';
  } else if (amountPaid === 0) {
    // No payments recorded at all
    paymentStatus = 'pending';
  } else if (owedAmount > 0) {
    // Player has overpaid and needs refund
    paymentStatus = 'overpaid';
  } else if (dueAmount === 0) {
    // Player has fully paid (netPayment >= calculatedAmount)
    paymentStatus = 'paid';
  } else if (netPayment > 0) {
    // Player has made some payment but still owes
    paymentStatus = 'partial';
  } else {
    // netPayment <= 0 (settled more than paid - edge case)
    paymentStatus = 'pending';
  }

  // Get last payment date from payment history
  const paymentHistory = member.paymentHistory || [];
  const lastPayment = paymentHistory.length > 0 ? paymentHistory[paymentHistory.length - 1] : null;
  const paidAt = lastPayment?.paidAt || null;

  return {
    calculatedAmount,
    amountPaid,
    settledAmount,
    dueAmount,
    owedAmount,
    paymentStatus,
    paidAt
  };
};

/**
 * Calculate full payment statistics for a match payment record
 * Updates all squad member calculations and overall statistics
 *
 * @param {Object} matchPayment - MatchPayment document (or plain object with same structure)
 * @returns {Object} - Complete calculated statistics
 */
const calculateMatchPaymentStats = (matchPayment) => {
  const { totalAmount, squadMembers = [] } = matchPayment;

  if (squadMembers.length === 0) {
    return {
      membersCount: 0,
      paidCount: 0,
      totalCollected: 0,
      totalPending: 0,
      totalOwed: 0,
      perPersonAmount: 0,
      memberStats: [],
      status: 'draft'
    };
  }

  // Calculate per-person shares
  const { equalShare } = calculatePerPersonShares(totalAmount, squadMembers);

  // Calculate stats for each member
  const memberStats = squadMembers.map(member => ({
    memberId: member._id,
    ...calculateMemberStats(member, equalShare)
  }));

  // Calculate aggregate statistics
  const membersCount = squadMembers.length;
  const paidCount = memberStats.filter(m =>
    m.paymentStatus === 'paid' || m.paymentStatus === 'overpaid'
  ).length;
  const totalCollected = memberStats.reduce((sum, m) => sum + m.amountPaid, 0);
  const totalPending = memberStats.reduce((sum, m) => sum + m.dueAmount, 0);
  const totalOwed = memberStats.reduce((sum, m) => sum + m.owedAmount, 0);

  // Determine overall status
  let status;
  const hasPartial = memberStats.some(m => m.paymentStatus === 'partial');
  const hasMessageSent = squadMembers.some(m => m.messageSentAt);

  if (paidCount === membersCount) {
    status = 'completed';
  } else if (paidCount > 0 || hasPartial) {
    status = 'partial';
  } else if (hasMessageSent) {
    status = 'sent';
  } else {
    status = 'draft';
  }

  return {
    membersCount,
    paidCount,
    totalCollected,
    totalPending,
    totalOwed,
    perPersonAmount: equalShare,
    memberStats,
    status
  };
};

/**
 * Calculate player summary statistics from raw match data
 * Used by both /players-summary and /player-history endpoints
 *
 * Uses netPayment (amountPaid - settledAmount) for accurate due calculation.
 *
 * @param {Array} matchData - Array of match payment data for a player
 * @returns {Object} - Summary statistics
 */
const calculatePlayerSummary = (matchData = []) => {
  let totalMatches = matchData.length;
  let totalPaid = 0;
  let totalSettled = 0;
  let totalDue = 0;
  let freeMatches = 0;
  let pendingMatches = 0;

  matchData.forEach(m => {
    const isFree = m.adjustedAmount === 0;
    if (isFree) freeMatches++;

    // Calculate amountPaid from valid payment history
    const amountPaid = calculateAmountPaidFromHistory(m.paymentHistory || []);
    totalPaid += amountPaid;

    // Get settled amount
    const settledAmount = m.settledAmount || 0;
    totalSettled += settledAmount;

    // Calculate net payment (what player effectively contributed)
    const netPayment = amountPaid - settledAmount;

    // Calculate effective amount (adjusted or calculated)
    const effectiveAmount = (m.adjustedAmount !== null && m.adjustedAmount !== undefined)
      ? m.adjustedAmount
      : (m.calculatedAmount || 0);

    // Calculate due amount based on net payment
    const dueAmount = Math.max(0, effectiveAmount - netPayment);

    if (dueAmount > 0) {
      totalDue += dueAmount;
      pendingMatches++;
    }
  });

  return {
    totalMatches,
    totalPaid,
    totalSettled,
    totalDue,
    freeMatches,
    pendingMatches,
    netContribution: totalPaid - totalSettled
  };
};

/**
 * Calculate detailed match history for a player
 * Returns per-match statistics calculated from raw data
 *
 * Uses netPayment (amountPaid - settledAmount) for accurate calculations.
 *
 * @param {Array} matchData - Array of match payment aggregation results
 * @returns {Array} - Array of match history entries with calculated stats
 */
const calculatePlayerMatchHistory = (matchData = []) => {
  return matchData.map(m => {
    const effectiveAmount = (m.adjustedAmount !== null && m.adjustedAmount !== undefined)
      ? m.adjustedAmount
      : (m.calculatedAmount || 0);

    // Calculate amountPaid from valid payment history
    const amountPaid = calculateAmountPaidFromHistory(m.paymentHistory || []);

    // Get settled amount and calculate net payment
    const settledAmount = m.settledAmount || 0;
    const netPayment = amountPaid - settledAmount;

    // Calculate due and owed amounts based on net payment
    let dueAmount = 0;
    let owedAmount = 0;

    if (netPayment < effectiveAmount) {
      // Player still owes money
      dueAmount = effectiveAmount - netPayment;
    } else if (netPayment > effectiveAmount) {
      // Player has overpaid (net contribution exceeds requirement)
      owedAmount = netPayment - effectiveAmount;
    }

    // Determine status
    let paymentStatus;
    if (effectiveAmount === 0) {
      // Free player
      paymentStatus = netPayment > 0 ? 'overpaid' : 'paid';
    } else if (amountPaid === 0) {
      // No payments recorded
      paymentStatus = 'pending';
    } else if (owedAmount > 0) {
      // Player has overpaid and needs refund
      paymentStatus = 'overpaid';
    } else if (dueAmount === 0) {
      // Fully paid
      paymentStatus = 'paid';
    } else if (netPayment > 0) {
      // Partial payment
      paymentStatus = 'partial';
    } else {
      // Edge case: settled more than paid
      paymentStatus = 'pending';
    }

    return {
      ...m,
      effectiveAmount,
      amountPaid,
      settledAmount,
      dueAmount,
      owedAmount,
      paymentStatus,
      isFreePlayer: m.adjustedAmount === 0
    };
  });
};

module.exports = {
  calculateAmountPaidFromHistory,
  calculatePerPersonShares,
  calculateMemberStats,
  calculateMatchPaymentStats,
  calculatePlayerSummary,
  calculatePlayerMatchHistory
};
