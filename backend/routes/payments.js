const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MatchPayment = require('../models/MatchPayment');
const Match = require('../models/Match');
const Player = require('../models/Player');
const Availability = require('../models/Availability');
const Message = require('../models/Message');
const axios = require('axios');

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
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance

    // Return only essential fields for list view
    const summaryPayments = payments.map(payment => ({
      _id: payment._id,
      matchId: payment.matchId,
      totalAmount: payment.totalAmount,
      status: payment.status,
      totalCollected: payment.totalCollected,
      totalPending: payment.totalPending,
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
router.post('/', auth, async (req, res) => {
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

    // Format squad members
    const formattedMembers = squadMembers.map(member => ({
      playerId: member.playerId || null,
      playerName: member.playerName,
      playerPhone: formatPhoneNumber(member.playerPhone),
      adjustedAmount: member.adjustedAmount !== undefined ? member.adjustedAmount : null,
      paymentStatus: 'pending',
      notes: member.notes || ''
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
router.put('/:id', auth, async (req, res) => {
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
      squadMembers.forEach(newMember => {
        const existingIndex = payment.squadMembers.findIndex(
          m => m.playerPhone === formatPhoneNumber(newMember.playerPhone)
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
          // Add new member
          payment.squadMembers.push({
            playerId: newMember.playerId || null,
            playerName: newMember.playerName,
            playerPhone: formatPhoneNumber(newMember.playerPhone),
            adjustedAmount: newMember.adjustedAmount !== undefined ? newMember.adjustedAmount : null,
            paymentStatus: newMember.paymentStatus || 'pending',
            notes: newMember.notes || ''
          });
        }
      });
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
router.put('/:id/member/:memberId', auth, async (req, res) => {
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
      playerName: member.playerName,
      playerPhone: member.playerPhone,
      calculatedAmount: member.calculatedAmount,
      adjustedAmount: member.adjustedAmount,
      amountPaid: member.amountPaid,
      dueAmount: member.dueAmount,
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
        paidCount: payment.paidCount,
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
router.post('/:id/member/:memberId/add-payment', auth, async (req, res) => {
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

    // Override total amount paid with the user input
    const parsedAmount = parseFloat(amount);
    
    // Mark all existing payments as invalid
    member.paymentHistory.forEach(payment => {
      payment.isValidPayment = false;
    });
    
    // Add new payment entry as valid
    member.paymentHistory.push({
      amount: parsedAmount,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      paymentMethod: paymentMethod || 'upi',
      notes: notes || '',
      isValidPayment: true // Mark new payment as valid
    });
    
    // Calculate amountPaid from valid payments only
    const validPayments = member.paymentHistory.filter(p => p.isValidPayment);
    member.amountPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate due amount based on effective amount
    const effectiveAmount = member.adjustedAmount !== null ? member.adjustedAmount : member.calculatedAmount;
    member.dueAmount = Math.max(0, effectiveAmount - member.amountPaid);
    
    // Update payment status
    if (member.amountPaid === 0) {
      member.paymentStatus = 'pending';
    } else if (member.amountPaid >= effectiveAmount) {
      member.paymentStatus = 'paid';
    } else {
      member.paymentStatus = 'partial';
    }
    
    // Set paid date
    member.paidAt = member.amountPaid > 0 ? (paidAt ? new Date(paidAt) : new Date()) : null;

    await payment.save();

    // Return only the updated member data, not the entire payment object
    const updatedMember = payment.squadMembers.id(req.params.memberId);
    
    // Get only the latest payment entry (without binary data)
    const latestPayment = updatedMember.paymentHistory
      .filter(p => p.isValidPayment !== false)
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0];
    
    const memberData = {
      _id: updatedMember._id,
      playerName: updatedMember.playerName,
      playerPhone: updatedMember.playerPhone,
      calculatedAmount: updatedMember.calculatedAmount,
      adjustedAmount: updatedMember.adjustedAmount,
      amountPaid: updatedMember.amountPaid,
      dueAmount: updatedMember.dueAmount,
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
        paidCount: payment.paidCount,
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
router.post('/:id/member/:memberId/mark-unpaid', auth, async (req, res) => {
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
        paidCount: payment.paidCount,
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
router.delete('/:id/member/:memberId', auth, async (req, res) => {
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
      playerName: member.playerName,
      playerPhone: member.playerPhone,
      calculatedAmount: member.calculatedAmount,
      adjustedAmount: member.adjustedAmount,
      amountPaid: member.amountPaid,
      dueAmount: member.dueAmount,
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
router.post('/:id/add-member', auth, async (req, res) => {
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

    const formattedPhone = formatPhoneNumber(playerPhone);

    // Check if member already exists in payment
    const exists = payment.squadMembers.some(m => m.playerPhone === formattedPhone);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Player already exists in this payment record'
      });
    }

    // Save player permanently to Player collection if not exists
    const Player = require('../models/Player');
    let savedPlayerId = playerId;
    
    if (!playerId) {
      // Check if player exists in database
      let existingPlayer = await Player.findOne({ phone: formattedPhone });
      
      if (!existingPlayer) {
        // Create new player in database
        existingPlayer = await Player.create({
          name: playerName,
          phone: formattedPhone,
          role: 'player',
          team: 'Mavericks XI',
          isActive: true
        });
      }
      
      savedPlayerId = existingPlayer._id;
    }

    payment.squadMembers.push({
      playerId: savedPlayerId,
      playerName,
      playerPhone: formattedPhone,
      adjustedAmount: adjustedAmount !== undefined ? adjustedAmount : null,
      paymentStatus: 'pending'
    });

    await payment.save();

    // Return all squad members (rebalancing affects all non-adjusted members)
    const squadMembersData = payment.squadMembers.map(member => ({
      _id: member._id,
      playerName: member.playerName,
      playerPhone: member.playerPhone,
      calculatedAmount: member.calculatedAmount,
      adjustedAmount: member.adjustedAmount,
      amountPaid: member.amountPaid,
      dueAmount: member.dueAmount,
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
router.post('/:id/send-requests', auth, async (req, res) => {
  try {
    const { memberIds } = req.body; // Optional: specific members to send to

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
        
        // Create payment request message
        const message = `🏏 *Payment Request - Mavericks XI*\n\n` +
          `Hi ${member.playerName},\n\n` +
          `Please pay your match fee for:\n` +
          `📅 *Date:* ${matchDate}\n` +
          `🆚 *Opponent:* ${match.opponent || 'TBD'}\n` +
          `📍 *Ground:* ${match.ground}\n` +
          `⏰ *Slot:* ${match.slot}\n\n` +
          `💰 *Amount to Pay:* ₹${amount}\n\n` +
          `Please upload a screenshot of your payment in reply to this message.\n\n` +
          `Thank you! 🙏`;

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
    if (!member || !member.screenshotImage) {
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
router.post('/load-squad/:matchId', auth, async (req, res) => {
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
router.delete('/:id', auth, async (req, res) => {
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

// Helper function to format phone number
function formatPhoneNumber(phone) {
  if (!phone) return '';
  let formatted = phone.replace(/\D/g, '');
  if (!formatted.startsWith('91') && formatted.length === 10) {
    formatted = '91' + formatted;
  }
  return formatted;
}

module.exports = router;
