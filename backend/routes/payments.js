const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const MatchPayment = require('../models/MatchPayment');
const Match = require('../models/Match');
const Player = require('../models/Player');
const Availability = require('../models/Availability');
const Message = require('../models/Message');
const axios = require('axios');
const { getOrCreatePlayer, formatPhoneNumber } = require('../services/playerService');
const { getTotalOutstandingForPlayer } = require('../services/paymentDistributionService');
const {
  calculatePlayerSummary,
  calculatePlayerMatchHistory,
  calculateAmountPaidFromHistory
} = require('../services/paymentCalculationService');

// GET /api/payments - Get all payment records (optimized with pagination)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const payments = await MatchPayment.find()
      .populate('matchId', 'date opponent ground slot matchId')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    // Note: Forced recalculation removed - use migration script to fix stale data
    // Run: node backend/scripts/migratePaymentCalculations.js

    // Optimize payload by removing heavy data
    const optimizedPayments = payments.map(payment => {
      const paymentObj = payment.toJSON();
      
      // Remove payment history and binary data from squad members
      if (paymentObj.squadMembers) {
        paymentObj.squadMembers = paymentObj.squadMembers.map(member => {
          const { 
            paymentHistory, 
            screenshotImage, 
            screenshotContentType, 
            ...memberOptimized 
          } = member;
          return memberOptimized;
        });
      }
      
      return paymentObj;
    });

    const total = await MatchPayment.countDocuments();
    const hasMore = (pageNum * limitNum) < total;

    res.json({
      success: true,
      payments: optimizedPayments,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// GET /api/payments/match/:matchId - Get payment for a specific match (optimized)
router.get('/match/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { includeHistory = false } = req.query; // Optional query param to include payment history

    const payment = await MatchPayment.findOne({ matchId })
      .populate('matchId', 'date opponent ground slot matchId')
      .populate('squadMembers.playerId', 'name phone role');

    if (!payment) {
      return res.json({
        success: true,
        payment: null,
        message: 'No payment record exists for this match'
      });
    }

    // Note: Forced recalculation removed - use migration script to fix stale data
    // Run: node backend/scripts/migratePaymentCalculations.js

    // Convert to JSON and optimize payload
    const paymentObj = payment.toJSON();
    
    // Remove binary image data and optionally payment history from squad members
    if (paymentObj.squadMembers) {
      paymentObj.squadMembers = paymentObj.squadMembers.map(member => {
        const { 
          screenshotImage, 
          screenshotContentType,
          ...memberWithoutImage 
        } = member;
        
        // Only include payment history if explicitly requested
        if (!includeHistory) {
          const { paymentHistory, ...memberWithoutHistory } = memberWithoutImage;
          return memberWithoutHistory;
        }
        
        return memberWithoutImage;
      });
    }

    res.json({
      success: true,
      payment: paymentObj
    });
  } catch (error) {
    console.error('Error fetching match payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch match payment'
    });
  }
});

// GET /api/payments/summary - Get lightweight payment summary for list view
router.get('/summary', auth, async (req, res) => {
  try {
    const payments = await MatchPayment.find({})
      .sort({ createdAt: -1 });

    // Note: Forced recalculation removed - use migration script to fix stale data
    // Run: node backend/scripts/migratePaymentCalculations.js

    // Return only essential fields for list view
    const summaryPayments = payments.map(payment => ({
      _id: payment._id,
      matchId: payment.matchId,
      totalAmount: payment.totalAmount,
      status: payment.status,
      totalCollected: payment.totalCollected,
      totalPending: payment.totalPending,
      totalOwed: payment.totalOwed,
      membersCount: payment.membersCount,
      paidCount: payment.paidCount,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      // Include minimal squad member info (just counts and basic status)
      squadMembers: payment.squadMembers ? payment.squadMembers.map(member => ({
        _id: member._id,
        playerName: member.playerName,
        playerPhone: member.playerPhone,
        paymentStatus: member.paymentStatus,
        amountPaid: member.amountPaid,
        dueAmount: member.dueAmount,
        owedAmount: member.owedAmount,
        adjustedAmount: member.adjustedAmount,
        calculatedAmount: member.calculatedAmount
      })) : []
    }));

    res.json({
      success: true,
      payments: summaryPayments
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment summary'
    });
  }
});

// GET /api/payments/players-summary - Get all players with payment summary stats
// NOTE: This route MUST be defined BEFORE /:id to avoid route conflict
// Uses centralized PaymentCalculationService for consistent calculations
router.get('/players-summary', auth, async (req, res) => {
  try {
    const { search } = req.query;

    // Get all active players
    let playerQuery = { isActive: true };
    if (search) {
      playerQuery.name = { $regex: search, $options: 'i' };
    }

    const players = await Player.find(playerQuery)
      .select('_id name phone')
      .sort({ name: 1 })
      .lean();

    // Get payment summary for each player using aggregation
    const playerSummaries = await Promise.all(players.map(async (player) => {
      const matchData = await MatchPayment.aggregate([
        {
          $match: {
            $or: [
              { 'squadMembers.playerId': player._id },
              { 'squadMembers.playerPhone': player.phone }
            ]
          }
        },
        { $unwind: '$squadMembers' },
        {
          $match: {
            $or: [
              { 'squadMembers.playerId': player._id },
              { 'squadMembers.playerPhone': player.phone }
            ]
          }
        },
        {
          $project: {
            adjustedAmount: '$squadMembers.adjustedAmount',
            calculatedAmount: '$squadMembers.calculatedAmount',
            paymentHistory: '$squadMembers.paymentHistory',
            settledAmount: '$squadMembers.settledAmount'
          }
        }
      ]);

      // Use centralized calculation service for consistent results
      const summary = calculatePlayerSummary(matchData);

      return {
        playerId: player._id,
        playerName: player.name,
        playerPhone: player.phone,
        _id: null,
        ...summary
      };
    }));

    // Filter out players with no payment history
    const playersWithHistory = playerSummaries.filter(p => p.totalMatches > 0);

    res.json({
      success: true,
      players: playersWithHistory,
      total: playersWithHistory.length
    });
  } catch (error) {
    console.error('Error fetching players summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players summary'
    });
  }
});

// GET /api/payments/player-history/:playerId - Get detailed payment history for a player
// NOTE: This route MUST be defined BEFORE /:id to avoid route conflict
// Uses centralized PaymentCalculationService for consistent calculations
router.get('/player-history/:playerId', auth, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Get player details
    const player = await Player.findById(playerId).select('_id name phone').lean();
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Use aggregation pipeline for efficient data retrieval
    // Include raw paymentHistory to calculate from source
    const matchHistory = await MatchPayment.aggregate([
      {
        $match: {
          $or: [
            { 'squadMembers.playerId': player._id },
            { 'squadMembers.playerPhone': player.phone }
          ]
        }
      },
      { $unwind: '$squadMembers' },
      {
        $match: {
          $or: [
            { 'squadMembers.playerId': player._id },
            { 'squadMembers.playerPhone': player.phone }
          ]
        }
      },
      {
        $lookup: {
          from: 'matches',
          localField: 'matchId',
          foreignField: '_id',
          as: 'match',
          pipeline: [
            { $project: { date: 1, opponent: 1, ground: 1, slot: 1 } }
          ]
        }
      },
      { $unwind: '$match' },
      {
        $project: {
          paymentId: '$_id',
          matchId: '$match._id',
          matchDate: '$match.date',
          opponent: '$match.opponent',
          ground: '$match.ground',
          slot: '$match.slot',
          adjustedAmount: '$squadMembers.adjustedAmount',
          calculatedAmount: '$squadMembers.calculatedAmount',
          settledAmount: '$squadMembers.settledAmount',
          paymentHistory: '$squadMembers.paymentHistory' // Raw history for calculation
        }
      },
      { $sort: { matchDate: -1 } }
    ]);

    // Use centralized service to calculate stats from raw data
    const calculatedHistory = calculatePlayerMatchHistory(matchHistory);

    // Calculate summary using centralized service
    const summary = calculatePlayerSummary(matchHistory);

    // Extract due matches from calculated data
    const dueMatches = calculatedHistory
      .filter(m => m.dueAmount > 0)
      .map(m => ({
        matchId: m.matchId,
        paymentId: m.paymentId,
        matchDate: m.matchDate,
        opponent: m.opponent,
        dueAmount: m.dueAmount
      }));

    // Format transactions for each match - include settlements and mark them appropriately
    const formattedHistory = calculatedHistory.map(m => ({
      paymentId: m.paymentId,
      matchId: m.matchId,
      matchDate: m.matchDate,
      opponent: m.opponent,
      ground: m.ground,
      slot: m.slot,
      effectiveAmount: m.effectiveAmount,
      amountPaid: m.amountPaid,
      dueAmount: m.dueAmount,
      owedAmount: m.owedAmount,
      paymentStatus: m.paymentStatus,
      isFreePlayer: m.isFreePlayer,
      transactions: (m.paymentHistory || []).map(t => {
        // Determine transaction type based on notes and isValidPayment
        let type = 'payment';
        if (t.notes && t.notes.includes('SETTLEMENT')) {
          type = 'settlement';
        } else if (t.notes && t.notes.includes('Adjusted due to settlement')) {
          type = 'adjusted';
        } else if (t.isValidPayment === false) {
          type = 'invalid';
        }

        return {
          type,
          amount: t.amount,
          date: t.paidAt,
          method: t.paymentMethod || 'upi',
          notes: t.notes || '',
          isValid: t.isValidPayment !== false
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date))
    }));

    // Paginate match history
    const paginatedHistory = formattedHistory.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      playerId: player._id,
      playerName: player.name,
      playerPhone: player.phone,
      summary,
      dueMatches,
      matchHistory: paginatedHistory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: matchHistory.length,
        hasMore: pageNum * limitNum < matchHistory.length
      }
    });
  } catch (error) {
    console.error('Error fetching player payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

// GET /api/payments/:id - Get single payment by ID (optimized)
router.get('/:id', auth, async (req, res) => {
  try {
    const { includeHistory = false } = req.query; // Optional query param to include payment history

    const payment = await MatchPayment.findById(req.params.id)
      .populate('matchId', 'date opponent ground slot matchId')
      .populate('squadMembers.playerId', 'name phone role');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // Optimize payload by removing heavy data
    const paymentObj = payment.toJSON();
    
    // Remove binary image data and optionally payment history from squad members
    if (paymentObj.squadMembers) {
      paymentObj.squadMembers = paymentObj.squadMembers.map(member => {
        const { 
          screenshotImage, 
          screenshotContentType,
          ...memberWithoutImage 
        } = member;
        
        // Only include payment history if explicitly requested
        if (!includeHistory) {
          const { paymentHistory, ...memberWithoutHistory } = memberWithoutImage;
          return memberWithoutHistory;
        }
        
        return memberWithoutImage;
      });
    }

    res.json({
      success: true,
      payment: paymentObj
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment'
    });
  }
});

// POST /api/payments - Create payment record for a match
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { matchId, totalAmount, squadMembers, notes } = req.body;

    if (!matchId || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Match ID and total amount are required'
      });
    }

    // Check if payment already exists for this match
    const existingPayment = await MatchPayment.findOne({ matchId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment record already exists for this match. Use PUT to update.'
      });
    }

    // Validate match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Ensure all squad members exist in Player collection and get their playerIds
    const formattedMembers = await Promise.all(squadMembers.map(async (member) => {
      // Use centralized player service to get or create player
      const { player } = await getOrCreatePlayer({
        phone: member.playerPhone,
        name: member.playerName,
        updateIfExists: false // Don't overwrite existing player data
      });
      
      return {
        playerId: player._id,
        playerName: player.name, // Use name from Player collection
        playerPhone: player.phone, // Use formatted phone from Player collection
        adjustedAmount: member.adjustedAmount !== undefined ? member.adjustedAmount : null,
        paymentStatus: 'pending',
        notes: member.notes || ''
      };
    }));

    const payment = await MatchPayment.create({
      matchId,
      totalAmount,
      squadMembers: formattedMembers,
      createdBy: req.user._id,
      notes: notes || ''
    });

    const populatedPayment = await MatchPayment.findById(payment._id)
      .populate('matchId', 'date opponent ground slot matchId')
      .populate('squadMembers.playerId', 'name phone role');

    res.status(201).json({
      success: true,
      payment: populatedPayment,
      message: 'Payment record created successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment'
    });
  }
});

// PUT /api/payments/:id - Update payment record
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { totalAmount, squadMembers, notes, status } = req.body;

    const payment = await MatchPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // Update fields
    if (totalAmount !== undefined) payment.totalAmount = totalAmount;
    if (notes !== undefined) payment.notes = notes;
    if (status !== undefined) payment.status = status;

    if (squadMembers) {
      // Update or add squad members
      for (const newMember of squadMembers) {
        const formattedPhone = formatPhoneNumber(newMember.playerPhone);
        const existingIndex = payment.squadMembers.findIndex(
          m => m.playerPhone === formattedPhone
        );

        if (existingIndex >= 0) {
          // Update existing member
          const existing = payment.squadMembers[existingIndex];
          if (newMember.adjustedAmount !== undefined) {
            existing.adjustedAmount = newMember.adjustedAmount;
          }
          if (newMember.paymentStatus !== undefined) {
            existing.paymentStatus = newMember.paymentStatus;
            if (newMember.paymentStatus === 'paid') {
              existing.paidAt = new Date();
            }
          }
          if (newMember.notes !== undefined) {
            existing.notes = newMember.notes;
          }
        } else {
          // Add new member - ensure player exists in Player collection
          const { player } = await getOrCreatePlayer({
            phone: newMember.playerPhone,
            name: newMember.playerName,
            updateIfExists: false
          });
          
          payment.squadMembers.push({
            playerId: player._id,
            playerName: player.name,
            playerPhone: player.phone,
            adjustedAmount: newMember.adjustedAmount !== undefined ? newMember.adjustedAmount : null,
            paymentStatus: newMember.paymentStatus || 'pending',
            notes: newMember.notes || ''
          });
        }
      }
    }

    await payment.save();

    const populatedPayment = await MatchPayment.findById(payment._id)
      .populate('matchId', 'date opponent ground slot matchId')
      .populate('squadMembers.playerId', 'name phone role');

    res.json({
      success: true,
      payment: populatedPayment,
      message: 'Payment record updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment'
    });
  }
});

// PUT /api/payments/:id/member/:memberId - Update single member
router.put('/:id/member/:memberId', auth, requireAdmin, async (req, res) => {
  try {
    const { adjustedAmount, paymentStatus, notes, dueDate } = req.body;

    const payment = await MatchPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    const member = payment.squadMembers.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Squad member not found'
      });
    }

    if (adjustedAmount !== undefined) member.adjustedAmount = adjustedAmount;
    if (notes !== undefined) member.notes = notes;
    if (dueDate !== undefined) member.dueDate = dueDate;
    
    // Handle status changes - but status will be auto-calculated based on payments
    if (paymentStatus !== undefined && paymentStatus !== member.paymentStatus) {
      // If marking as paid without valid payment history, add a full payment entry
      const validPayments = member.paymentHistory.filter(p => p.isValidPayment !== false);
      if (paymentStatus === 'paid' && validPayments.length === 0) {
        const effectiveAmount = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
        
        // Mark all existing payments as invalid
        member.paymentHistory.forEach(payment => {
          payment.isValidPayment = false;
        });
        
        // Add new valid payment
        member.paymentHistory.push({
          amount: effectiveAmount,
          paidAt: new Date(),
          paymentMethod: 'other',
          notes: notes || 'Marked as paid',
          isValidPayment: true
        });
      }
    }

    await payment.save();

    // Return all squad members (rebalancing affects all non-adjusted members)
    const squadMembersData = payment.squadMembers.map(member => ({
      _id: member._id,
      playerId: member.playerId, // Added playerId to the response mapping
      playerName: member.playerName,
      playerPhone: member.playerPhone,
      calculatedAmount: member.calculatedAmount,
      adjustedAmount: member.adjustedAmount,
      amountPaid: member.amountPaid,
      dueAmount: member.dueAmount,
      owedAmount: member.owedAmount,
      paymentStatus: member.paymentStatus,
      notes: member.notes,
      dueDate: member.dueDate,
      paidAt: member.paidAt
    }));

    res.json({
      success: true,
      squadMembers: squadMembersData,
      paymentSummary: {
        totalAmount: payment.totalAmount,
        totalCollected: payment.totalCollected,
        totalPending: payment.totalPending,
        totalOwed: payment.totalOwed,
        paidCount: payment.paidCount,
        membersCount: payment.membersCount,
        status: payment.status
      },
      message: 'Member updated successfully'
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member'
    });
  }
});

// POST /api/payments/:id/member/:memberId/add-payment - Record a partial/full payment
router.post('/:id/member/:memberId/add-payment', auth, requireAdmin, async (req, res) => {
  try {
    const { amount, paymentMethod, notes, paidAt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid payment amount is required'
      });
    }

    const payment = await MatchPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    const member = payment.squadMembers.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Squad member not found'
      });
    }

    // ADD new payment to existing payments (cumulative)
    const parsedAmount = parseFloat(amount);
    
    // Add new payment entry - this ADDS to existing valid payments
    member.paymentHistory.push({
      amount: parsedAmount,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      paymentMethod: paymentMethod || 'upi',
      notes: notes || '',
      isValidPayment: true
    });
    
    // Calculate amountPaid from ALL valid payments (cumulative sum)
    const validPayments = member.paymentHistory.filter(p => p.isValidPayment !== false);
    member.amountPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate due amount and owed amount based on netPayment
    // netPayment = amountPaid - settledAmount (effective contribution after refunds)
    const effectiveAmount = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
    const settledAmount = member.settledAmount || 0;
    const netPayment = member.amountPaid - settledAmount;

    if (netPayment < effectiveAmount) {
      // Player still owes money
      member.dueAmount = effectiveAmount - netPayment;
      member.owedAmount = 0;
    } else if (netPayment > effectiveAmount) {
      // Player has overpaid (net contribution exceeds requirement)
      member.dueAmount = 0;
      member.owedAmount = netPayment - effectiveAmount;
    } else {
      // Exactly paid
      member.dueAmount = 0;
      member.owedAmount = 0;
    }

    // Update payment status
    if (member.amountPaid === 0) {
      member.paymentStatus = 'pending';
    } else if (member.owedAmount > 0) {
      // Player has overpaid and needs refund
      member.paymentStatus = 'overpaid';
    } else if (member.dueAmount === 0) {
      // Fully paid (netPayment >= effectiveAmount)
      member.paymentStatus = 'paid';
    } else if (netPayment > 0) {
      // Partial payment
      member.paymentStatus = 'partial';
    } else {
      // Edge case: netPayment <= 0
      member.paymentStatus = 'pending';
    }

    // Set paid date
    member.paidAt = member.amountPaid > 0 ? (paidAt ? new Date(paidAt) : new Date()) : null;

    await payment.save();

    // Return only the updated member data, not the entire payment object
    const updatedMember = payment.squadMembers.id(req.params.memberId);

    // Get only the latest payment entry (without binary data)
    // Sort by paidAt descending, then by createdAt/updatedAt descending for stable ordering
    const validPaymentsForLatest = updatedMember.paymentHistory.filter(p => p.isValidPayment !== false);
    const latestPayment = validPaymentsForLatest.length > 0
      ? validPaymentsForLatest[validPaymentsForLatest.length - 1] // Most recently added
      : null;

    const memberData = {
      _id: updatedMember._id,
      playerName: updatedMember.playerName,
      playerPhone: updatedMember.playerPhone,
      calculatedAmount: updatedMember.calculatedAmount,
      adjustedAmount: updatedMember.adjustedAmount,
      amountPaid: updatedMember.amountPaid,
      dueAmount: updatedMember.dueAmount,
      owedAmount: updatedMember.owedAmount || 0,
      settledAmount: updatedMember.settledAmount || 0, // Include settledAmount for visibility
      paymentStatus: updatedMember.paymentStatus,
      paidAt: updatedMember.paidAt,
      latestPayment: latestPayment ? {
        amount: latestPayment.amount,
        paidAt: latestPayment.paidAt,
        paymentMethod: latestPayment.paymentMethod,
        notes: latestPayment.notes
      } : null
    };

    res.json({
      success: true,
      member: memberData,
      paymentSummary: {
        totalAmount: payment.totalAmount,
        totalCollected: payment.totalCollected,
        totalPending: payment.totalPending,
        totalOwed: payment.totalOwed,
        paidCount: payment.paidCount,
        membersCount: payment.membersCount,
        status: payment.status
      },
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment'
    });
  }
});

// POST /api/payments/:id/member/:memberId/mark-unpaid - Mark payment as unpaid
router.post('/:id/member/:memberId/mark-unpaid', auth, requireAdmin, async (req, res) => {
  try {
    const payment = await MatchPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    const member = payment.squadMembers.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Squad member not found'
      });
    }

    // Mark as unpaid - mark all payments as invalid
    member.paymentHistory.forEach(payment => {
      payment.isValidPayment = false;
    });
    
    // Calculate amountPaid from valid payments only (should be 0 now)
    const validPayments = member.paymentHistory.filter(p => p.isValidPayment);
    member.amountPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);
    
    member.paymentStatus = 'pending';
    member.paidAt = null;
    
    // Recalculate due amount
    const effectiveAmount = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
    member.dueAmount = effectiveAmount;

    await payment.save();

    // Return only the updated member data
    const updatedMember = payment.squadMembers.id(req.params.memberId);
    const memberData = {
      _id: updatedMember._id,
      playerName: updatedMember.playerName,
      playerPhone: updatedMember.playerPhone,
      calculatedAmount: updatedMember.calculatedAmount,
      adjustedAmount: updatedMember.adjustedAmount,
      amountPaid: updatedMember.amountPaid,
      dueAmount: updatedMember.dueAmount,
      paymentStatus: updatedMember.paymentStatus,
      paidAt: updatedMember.paidAt
    };

    res.json({
      success: true,
      member: memberData,
      paymentSummary: {
        totalAmount: payment.totalAmount,
        totalCollected: payment.totalCollected,
        totalPending: payment.totalPending,
        totalOwed: payment.totalOwed,
        paidCount: payment.paidCount,
        membersCount: payment.membersCount,
        status: payment.status
      },
      message: 'Marked as unpaid successfully'
    });
  } catch (error) {
    console.error('Error marking as unpaid:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark as unpaid'
    });
  }
});

// POST /api/payments/:id/member/:memberId/settle-overpayment - Settle overpayment and send WhatsApp notification
router.post('/:id/member/:memberId/settle-overpayment', auth, requireAdmin, async (req, res) => {
  try {
    const payment = await MatchPayment.findById(req.params.id)
      .populate('matchId', 'date opponent ground slot matchId');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    const member = payment.squadMembers.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Squad member not found'
      });
    }

    // Check if member has owed amount
    if (!member.owedAmount || member.owedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No overpayment to settle for this player'
      });
    }

    const settlementAmount = member.owedAmount;
    const effectiveAmount = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
    const match = payment.matchId;
    const matchDate = new Date(match.date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // SETTLEMENT LOGIC:
    // 1. Keep all existing payment entries as valid (they are real payments - show in history)
    // 2. Set settledAmount to track the refund (used in calculations)
    // 3. Add a settlement record entry for history display
    
    // Step 1: Set the settled amount (this will be used in recalculate to reduce owedAmount)
    member.settledAmount = (member.settledAmount || 0) + settlementAmount;
    
    // Step 2: Add settlement record entry for history display (isValidPayment: false so it doesn't add to amountPaid)
    member.paymentHistory.push({
      amount: settlementAmount,
      paidAt: new Date(),
      paymentMethod: 'other',
      notes: `✅ SETTLEMENT: ₹${settlementAmount} returned to player by Mavericks XI`,
      isValidPayment: false // Won't affect amountPaid calculations, but will show in history
    });

    // Save - the pre-save hook will recalculate amounts correctly (using settledAmount)
    await payment.save();

    // Format phone number for WhatsApp
    let formattedPhone = member.playerPhone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    // ISSUE 3: Check for pending amounts in other matches
    const otherPendingAmount = await getTotalOutstandingForPlayer(formattedPhone);
    // Exclude current match from pending calculation
    const remainingPending = otherPendingAmount.totalDue - (member.dueAmount || 0);

    // ISSUE 2: Send WhatsApp notification
    let whatsappSent = false;
    let messageId = null;
    
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = 'v19.0';

    if (accessToken && phoneNumberId) {
      try {
        // Build settlement message
        let message = `💰 *Payment Settlement - Mavericks XI*\n\n` +
          `Hi ${member.playerName},\n\n` +
          `Great news! Your overpayment has been settled. 🎉\n\n` +
          `📅 *Match:* ${match.opponent || 'TBD'} on ${matchDate}\n` +
          `💵 *Settlement Amount:* ₹${settlementAmount}\n\n` +
          `The balance of ₹${settlementAmount} has been returned/adjusted by Mavericks XI.\n\n` +
          `Your payment for this match is now complete. ✅`;

        // ISSUE 3: Add pending amount info if there's remaining pending from other matches
        if (remainingPending > 0 && otherPendingAmount.matchCount > 1) {
          message += `\n\n⚠️ *Note:* You still have a pending amount of *₹${remainingPending}* for ${otherPendingAmount.matchCount - 1} other match(es).`;
        }

        message += `\n\nThank you for being part of the team! 🏏`;

        const whatsappApiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
        const response = await axios.post(whatsappApiUrl, {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message, preview_url: false }
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        messageId = response.data?.messages?.[0]?.id;
        whatsappSent = true;

        // Save message to database
        await Message.create({
          from: phoneNumberId,
          to: formattedPhone,
          text: message,
          direction: 'outgoing',
          messageId: messageId,
          timestamp: new Date(),
          messageType: 'payment_settlement',
          matchId: payment.matchId._id,
          matchTitle: `${match.opponent || 'TBD'} - ${matchDate}`,
          paymentId: payment._id,
          paymentMemberId: member._id,
          playerId: member.playerId,
          playerName: member.playerName
        });

        console.log(`✅ Settlement notification sent to ${member.playerName} for ₹${settlementAmount}`);
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp settlement notification:', whatsappError.response?.data || whatsappError.message);
      }
    }

    // Reload payment to get recalculated values
    const updatedPayment = await MatchPayment.findById(req.params.id);
    const updatedMember = updatedPayment.squadMembers.id(req.params.memberId);
    
    // Get payment history for display (include settlement records)
    const paymentHistoryForDisplay = updatedMember.paymentHistory.map(p => ({
      amount: p.amount,
      paidAt: p.paidAt,
      paymentMethod: p.paymentMethod,
      notes: p.notes,
      isValidPayment: p.isValidPayment
    }));
    
    const memberData = {
      _id: updatedMember._id,
      playerName: updatedMember.playerName,
      playerPhone: updatedMember.playerPhone,
      calculatedAmount: updatedMember.calculatedAmount,
      adjustedAmount: updatedMember.adjustedAmount,
      amountPaid: updatedMember.amountPaid,
      dueAmount: updatedMember.dueAmount,
      owedAmount: updatedMember.owedAmount,
      settledAmount: updatedMember.settledAmount || 0,
      paymentStatus: updatedMember.paymentStatus,
      paidAt: updatedMember.paidAt,
      paymentHistory: paymentHistoryForDisplay
    };

    res.json({
      success: true,
      member: memberData,
      paymentSummary: {
        totalAmount: updatedPayment.totalAmount,
        totalCollected: updatedPayment.totalCollected,
        totalPending: updatedPayment.totalPending,
        totalOwed: updatedPayment.totalOwed,
        paidCount: updatedPayment.paidCount,
        membersCount: updatedPayment.membersCount,
        status: updatedPayment.status
      },
      settlement: {
        amount: settlementAmount,
        whatsappSent,
        messageId,
        remainingPending: remainingPending > 0 ? remainingPending : 0
      },
      message: `Settlement of ₹${settlementAmount} completed${whatsappSent ? ' and notification sent' : ''}`
    });
  } catch (error) {
    console.error('Error settling overpayment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to settle overpayment'
    });
  }
});

// GET /api/payments/player/:phone/history - Get payment history for a specific player
router.get('/player/:phone/history', auth, async (req, res) => {
  try {
    const phone = formatPhoneNumber(req.params.phone);
    
    // Find all payments where this player is involved
    const payments = await MatchPayment.find({
      'squadMembers.playerPhone': phone
    })
    .populate('matchId', 'date opponent ground slot matchId')
    .sort({ 'matchId.date': -1 });

    // Extract player-specific data from each payment
    const playerHistory = [];
    let totalPaid = 0;
    let totalDue = 0;
    let totalExpected = 0;

    for (const payment of payments) {
      const memberData = payment.squadMembers.find(m => m.playerPhone === phone);
      if (memberData) {
        const effectiveAmount = memberData.adjustedAmount !== null ? memberData.adjustedAmount : memberData.calculatedAmount;
        totalExpected += effectiveAmount;
        totalPaid += memberData.amountPaid;
        totalDue += memberData.dueAmount;

        // Filter to only include valid payments in history
        const validPaymentHistory = memberData.paymentHistory.filter(p => p.isValidPayment !== false);
        
        playerHistory.push({
          paymentId: payment._id,
          match: payment.matchId,
          expectedAmount: effectiveAmount,
          amountPaid: memberData.amountPaid,
          dueAmount: memberData.dueAmount,
          paymentStatus: memberData.paymentStatus,
          dueDate: memberData.dueDate,
          paymentHistory: validPaymentHistory,
          notes: memberData.notes,
          lastPaymentDate: memberData.paidAt
        });
      }
    }

    res.json({
      success: true,
      playerPhone: phone,
      summary: {
        totalMatches: playerHistory.length,
        totalExpected,
        totalPaid,
        totalDue,
        totalPayments: playerHistory.reduce((sum, p) => sum + p.paymentHistory.length, 0)
      },
      history: playerHistory
    });
  } catch (error) {
    console.error('Error fetching player payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

// DELETE /api/payments/:id/member/:memberId - Remove member from payment
router.delete('/:id/member/:memberId', auth, requireAdmin, async (req, res) => {
  try {
    const payment = await MatchPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    payment.squadMembers.pull(req.params.memberId);
    await payment.save();

    // Return all squad members (rebalancing affects all non-adjusted members)
    const squadMembersData = payment.squadMembers.map(member => ({
      _id: member._id,
      playerId: member.playerId,
      playerName: member.playerName,
      playerPhone: member.playerPhone,
      calculatedAmount: member.calculatedAmount,
      adjustedAmount: member.adjustedAmount,
      amountPaid: member.amountPaid,
      dueAmount: member.dueAmount,
      owedAmount: member.owedAmount,
      paymentStatus: member.paymentStatus,
      notes: member.notes,
      dueDate: member.dueDate,
      paidAt: member.paidAt
    }));

    res.json({
      success: true,
      squadMembers: squadMembersData,
      paymentSummary: {
        totalAmount: payment.totalAmount,
        totalCollected: payment.totalCollected,
        totalPending: payment.totalPending,
        totalOwed: payment.totalOwed,
        paidCount: payment.paidCount,
        membersCount: payment.membersCount,
        status: payment.status
      },
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove member'
    });
  }
});

// POST /api/payments/:id/add-member - Add new member (ad-hoc player)
router.post('/:id/add-member', auth, requireAdmin, async (req, res) => {
  try {
    const { playerName, playerPhone, playerId, adjustedAmount } = req.body;

    if (!playerName || !playerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Player name and phone are required'
      });
    }

    const payment = await MatchPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    // Use centralized player service to get or create player
    const { player } = await getOrCreatePlayer({
      phone: playerPhone,
      name: playerName,
      updateIfExists: false
    });

    payment.squadMembers.push({
      playerId: player._id,
      playerName: player.name,
      playerPhone: player.phone,
      adjustedAmount: adjustedAmount !== undefined ? adjustedAmount : null,
      paymentStatus: 'pending'
    });

    await payment.save();

    // Return all squad members (rebalancing affects all non-adjusted members)
    const squadMembersData = payment.squadMembers.map(member => ({
      _id: member._id,
      playerId: member.playerId,
      playerName: member.playerName,
      playerPhone: member.playerPhone,
      calculatedAmount: member.calculatedAmount,
      adjustedAmount: member.adjustedAmount,
      amountPaid: member.amountPaid,
      dueAmount: member.dueAmount,
      owedAmount: member.owedAmount,
      paymentStatus: member.paymentStatus,
      notes: member.notes,
      dueDate: member.dueDate,
      paidAt: member.paidAt
    }));

    res.json({
      success: true,
      squadMembers: squadMembersData,
      paymentSummary: {
        totalAmount: payment.totalAmount,
        totalCollected: payment.totalCollected,
        totalPending: payment.totalPending,
        totalOwed: payment.totalOwed,
        paidCount: payment.paidCount,
        membersCount: payment.membersCount,
        status: payment.status
      },
      message: 'Member added successfully and saved to squad'
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add member'
    });
  }
});

// POST /api/payments/:id/send-requests - Send payment request messages
router.post('/:id/send-requests', auth, requireAdmin, async (req, res) => {
  try {
    const { memberIds, customMessage } = req.body; // Optional: specific members to send to, custom message template

    const payment = await MatchPayment.findById(req.params.id)
      .populate('matchId', 'date opponent ground slot matchId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    const match = payment.matchId;
    const matchDate = new Date(match.date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // WhatsApp API configuration
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = 'v19.0';

    if (!accessToken || !phoneNumberId) {
      return res.status(500).json({
        success: false,
        error: 'WhatsApp API not configured'
      });
    }

    const results = [];
    const membersToSend = memberIds 
      ? payment.squadMembers.filter(m => memberIds.includes(m._id.toString()))
      : payment.squadMembers.filter(m => m.paymentStatus !== 'paid');

    for (const member of membersToSend) {
      try {
        const amount = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;

        // Format phone number consistently (remove + and ensure 91 prefix)
        let formattedPhone = member.playerPhone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone;
        }

        // Get total outstanding across all matches for this player
        const outstanding = await getTotalOutstandingForPlayer(formattedPhone);

        // Create payment request message - use custom message if provided, else default
        let message;
        if (customMessage) {
          // Replace placeholders in custom message
          message = customMessage
            .replace(/{playerName}/g, member.playerName)
            .replace(/{dueAmount}/g, member.dueAmount.toString())
            .replace(/{amount}/g, amount.toString());
          
          // Add total outstanding if player has dues on multiple matches
          if (outstanding.matchCount > 1) {
            message += `\n\n📊 *Total Outstanding: ₹${outstanding.totalDue} (${outstanding.matchCount} matches)*`;
          }
        } else {
          // Default message
          message = `🏏 *Payment Request - Mavericks XI*\n\n` +
            `Hi ${member.playerName},\n\n` +
            `Please pay your match fee for:\n` +
            `📅 *Date:* ${matchDate}\n` +
            `🆚 *Opponent:* ${match.opponent || 'TBD'}\n` +
            `📍 *Ground:* ${match.ground}\n` +
            `⏰ *Slot:* ${match.slot}\n\n` +
            `💰 *Amount for this match:* ₹${amount}`;

          // Add total outstanding if player has dues on multiple matches
          if (outstanding.matchCount > 1) {
            message += `\n\n📊 *Total Outstanding: ₹${outstanding.totalDue} (${outstanding.matchCount} matches)*`;
            message += `\n_Pay full amount in one transaction - it will auto-distribute._`;
          }

          message += `\n\nPlease upload a screenshot of your payment in reply to this message.\n\nThank you! 🙏`;
        }

        const whatsappApiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

        const payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message,
            preview_url: false
          }
        };

        const response = await axios.post(whatsappApiUrl, payload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        const messageId = response.data?.messages?.[0]?.id;

        // Update member record
        member.messageSentAt = new Date();
        member.outgoingMessageId = messageId;

        // Save message to database
        await Message.create({
          from: phoneNumberId,
          to: formattedPhone,
          text: message,
          direction: 'outgoing',
          messageId: messageId,
          timestamp: new Date(),
          messageType: 'payment_request',
          matchId: payment.matchId._id,
          matchTitle: `${match.opponent || 'TBD'} - ${matchDate}`,
          paymentId: payment._id,
          paymentMemberId: member._id,
          playerId: member.playerId,
          playerName: member.playerName
        });

        results.push({
          memberId: member._id,
          playerName: member.playerName,
          phone: member.playerPhone,
          amount,
          status: 'sent',
          messageId
        });

      } catch (error) {
        console.error(`Failed to send to ${member.playerName}:`, error.response?.data || error.message);
        results.push({
          memberId: member._id,
          playerName: member.playerName,
          phone: member.playerPhone,
          status: 'failed',
          error: error.response?.data?.error?.message || error.message
        });
      }
    }

    await payment.save();

    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    res.json({
      success: true,
      data: {
        sent: sentCount,
        failed: failedCount,
        total: results.length,
        results
      },
      message: `Payment requests sent: ${sentCount} success, ${failedCount} failed`
    });
  } catch (error) {
    console.error('Error sending payment requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send payment requests'
    });
  }
});

// GET /api/payments/:id/screenshot/:memberId - Get screenshot image (public for img src)
// Handles both direct screenshots and references to screenshots stored elsewhere
router.get('/:id/screenshot/:memberId', async (req, res) => {
  try {
    const payment = await MatchPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    const member = payment.squadMembers.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Check if this member has a screenshot reference (from distributed payment)
    if (member.screenshotRef?.sourcePaymentId && member.screenshotRef?.sourceMemberId) {
      const sourcePayment = await MatchPayment.findById(member.screenshotRef.sourcePaymentId);
      if (sourcePayment) {
        const sourceMember = sourcePayment.squadMembers.id(member.screenshotRef.sourceMemberId);
        if (sourceMember?.screenshotImage) {
          res.set('Content-Type', sourceMember.screenshotContentType || 'image/jpeg');
          return res.send(sourceMember.screenshotImage);
        }
      }
    }

    // Direct screenshot on this member
    if (!member.screenshotImage) {
      return res.status(404).json({
        success: false,
        error: 'Screenshot not found'
      });
    }

    res.set('Content-Type', member.screenshotContentType || 'image/jpeg');
    res.send(member.screenshotImage);
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screenshot'
    });
  }
});

// POST /api/payments/load-squad/:matchId - Load squad from availability
router.post('/load-squad/:matchId', auth, requireAdmin, async (req, res) => {
  try {
    const { matchId } = req.params;

    // Get all players who said "yes" for this match
    const availabilities = await Availability.find({
      matchId,
      response: 'yes'
    }).populate('playerId', 'name phone role');

    if (availabilities.length === 0) {
      return res.json({
        success: true,
        squad: [],
        message: 'No confirmed players found for this match'
      });
    }

    const squad = availabilities.map(a => ({
      playerId: a.playerId?._id || null,
      playerName: a.playerName || a.playerId?.name,
      playerPhone: formatPhoneNumber(a.playerPhone || a.playerId?.phone),
      role: a.playerId?.role || 'player'
    }));

    res.json({
      success: true,
      squad,
      count: squad.length
    });
  } catch (error) {
    console.error('Error loading squad:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load squad from availability'
    });
  }
});

// DELETE /api/payments/:id - Delete payment record
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const payment = await MatchPayment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment'
    });
  }
});

// GET /api/payments/review-required - Get all payments requiring admin review
router.get('/review-required', auth, async (req, res) => {
  try {
    const payments = await MatchPayment.find({
      'squadMembers.requiresReview': true
    }).populate('matchId', 'date opponent ground');

    // Extract members that need review
    const reviewItems = [];
    for (const payment of payments) {
      for (const member of payment.squadMembers) {
        if (member.requiresReview) {
          reviewItems.push({
            paymentId: payment._id,
            memberId: member._id,
            matchId: payment.matchId?._id,
            matchInfo: {
              date: payment.matchId?.date,
              opponent: payment.matchId?.opponent,
              ground: payment.matchId?.ground
            },
            playerName: member.playerName,
            playerPhone: member.playerPhone,
            expectedAmount: member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount,
            ocrExtractedAmount: member.ocrExtractedAmount,
            ocrConfidence: member.ocrConfidence,
            reviewReason: member.reviewReason,
            amountPaid: member.amountPaid,
            dueAmount: member.dueAmount,
            hasScreenshot: !!(member.screenshotImage || member.screenshotRef?.sourcePaymentId),
            screenshotReceivedAt: member.screenshotReceivedAt
          });
        }
      }
    }

    res.json({
      success: true,
      data: reviewItems,
      count: reviewItems.length
    });
  } catch (error) {
    console.error('Error fetching review required payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments requiring review'
    });
  }
});

// PUT /api/payments/:id/member/:memberId/resolve-review - Resolve admin review
router.put('/:id/member/:memberId/resolve-review', auth, requireAdmin, async (req, res) => {
  try {
    const { action, correctedAmount, notes } = req.body;
    // action: 'accept' (accept OCR amount), 'override' (use correctedAmount), 'reject' (mark unpaid)

    const payment = await MatchPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    const member = payment.squadMembers.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    switch (action) {
      case 'accept':
        // Accept the OCR extracted amount as-is
        member.requiresReview = false;
        member.reviewReason = null;
        if (notes) member.notes = notes;
        break;

      case 'override':
        // Override with admin-provided amount
        if (typeof correctedAmount !== 'number' || correctedAmount < 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid correctedAmount is required for override action'
          });
        }

        // Clear existing payment history and add corrected amount
        member.paymentHistory = member.paymentHistory.map(p => ({
          ...p.toObject(),
          isValidPayment: false
        }));

        member.paymentHistory.push({
          amount: correctedAmount,
          paidAt: new Date(),
          paymentMethod: 'upi',
          notes: notes || 'Admin corrected amount',
          isValidPayment: true
        });

        member.requiresReview = false;
        member.reviewReason = null;
        break;

      case 'reject':
        // Mark as unpaid, remove screenshot
        member.paymentHistory = member.paymentHistory.map(p => ({
          ...p.toObject(),
          isValidPayment: false
        }));
        member.screenshotImage = null;
        member.screenshotContentType = null;
        member.screenshotMediaId = null;
        member.screenshotReceivedAt = null;
        member.screenshotRef = null;
        member.requiresReview = false;
        member.reviewReason = null;
        if (notes) member.notes = notes;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use: accept, override, or reject'
        });
    }

    await payment.save();

    res.json({
      success: true,
      message: `Review resolved with action: ${action}`,
      data: {
        memberId: member._id,
        playerName: member.playerName,
        amountPaid: member.amountPaid,
        dueAmount: member.dueAmount,
        paymentStatus: member.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error resolving review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve review'
    });
  }
});

// GET /api/payments/player/:phone/outstanding - Get total outstanding for a player
router.get('/player/:phone/outstanding', auth, async (req, res) => {
  try {
    const outstanding = await getTotalOutstandingForPlayer(req.params.phone);
    res.json({
      success: true,
      data: outstanding
    });
  } catch (error) {
    console.error('Error fetching outstanding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch outstanding amount'
    });
  }
});

module.exports = router;
