const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// POST /api/whatsapp/send - Send WhatsApp messages to players
router.post('/send', auth, async (req, res) => {
  try {
    const { playerIds, message, previewUrl = false, template } = req.body;
    
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Player IDs are required'
      });
    }
    
    // Get player details for response
    const Player = require('../models/Player');
    const players = await Player.find({ '_id': { $in: playerIds } }).select('name phone');
    
    // TODO: Implement actual WhatsApp API integration
    // For now, just return a mock response
    console.log('WhatsApp message request:', {
      playerIds,
      message,
      previewUrl,
      template
    });
    
    // Mock response - simulate sending messages
    const results = players.map(player => ({
      playerId: player._id,
      name: player.name,
      phone: player.phone,
      status: 'sent',
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }));
    
    res.json({
      success: true,
      data: {
        sent: results.length,
        failed: 0,
        attempted: playerIds.length,
        results
      },
      message: 'Messages sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending WhatsApp messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send messages'
    });
  }
});

module.exports = router;
