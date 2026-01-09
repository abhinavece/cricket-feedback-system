const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MatchPayment = require('../models/MatchPayment');
const Match = require('../models/Match');
const Player = require('../models/Player');
const Availability = require('../models/Availability');
const Message = require('../models/Message');
const axios = require('axios');

// GET /api/payments - Get all payment records
router.get('/', auth, async (req, res) => {
  try {
    const payments = await MatchPayment.find()
      .populate('matchId', 'date opponent ground slot matchId')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// GET /api/payments/match/:matchId - Get payment for a specific match
router.get('/match/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;

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

    // Convert to JSON and exclude binary image data
    const paymentObj = payment.toJSON();
    
    // Remove binary image data from squadMembers but keep metadata
    if (paymentObj.squadMembers) {
      paymentObj.squadMembers = paymentObj.squadMembers.map(member => {
        const { screenshotImage, ...memberWithoutImage } = member;
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

// GET /api/payments/:id - Get single payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await MatchPayment.findById(req.params.id)
      .populate('matchId', 'date opponent ground slot matchId')
      .populate('squadMembers.playerId', 'name phone role');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }

    res.json({
      success: true,
      payment
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
    const { adjustedAmount, paymentStatus, notes } = req.body;

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
    if (paymentStatus !== undefined) {
      member.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        member.paidAt = new Date();
      }
    }
    if (notes !== undefined) member.notes = notes;

    await payment.save();

    res.json({
      success: true,
      payment,
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

    res.json({
      success: true,
      payment,
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

    // Check if member already exists
    const exists = payment.squadMembers.some(m => m.playerPhone === formattedPhone);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Player already exists in this payment record'
      });
    }

    payment.squadMembers.push({
      playerId: playerId || null,
      playerName,
      playerPhone: formattedPhone,
      adjustedAmount: adjustedAmount !== undefined ? adjustedAmount : null,
      paymentStatus: 'pending'
    });

    await payment.save();

    const populatedPayment = await MatchPayment.findById(payment._id)
      .populate('matchId', 'date opponent ground slot matchId')
      .populate('squadMembers.playerId', 'name phone role');

    res.json({
      success: true,
      payment: populatedPayment,
      message: 'Member added successfully'
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
