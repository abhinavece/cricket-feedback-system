const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const Message = require('../models/Message');
const Availability = require('../models/Availability');
const Match = require('../models/Match');

// Webhook verification endpoint (GET)
// Facebook sends a GET request to verify the webhook
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mavericks-xi-verify-token-2024';
    
    // Verify the webhook
    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.sendStatus(500);
  }
});

// Webhook endpoint to receive messages (POST)
router.post('/webhook', (req, res) => {
  try {
    const data = req.body;
    
    console.log('Received WhatsApp webhook:', JSON.stringify(data, null, 2));
    
    // Check if this is a WhatsApp message
    if (data.object === 'whatsapp_business_account') {
      console.log('Valid WhatsApp webhook object found');
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value;
            const messages = value.messages || [];
            const contacts = value.contacts || [];
            
            console.log(`Processing ${messages.length} messages and ${contacts.length} contacts`);
            
            for (const message of messages) {
              const from = message.from; // WhatsApp ID of sender
              let text = '';
              const contextId = message.context?.id; // Original message ID being replied to
              
              if (message.type === 'text') {
                text = message.text.body;
              } else if (message.type === 'button') {
                text = message.button.text;
                console.log(`Received button response: ${text}`);
              } else if (message.type === 'interactive') {
                const interactive = message.interactive;
                if (interactive.type === 'button_reply') {
                  text = interactive.button_reply.title;
                } else if (interactive.type === 'list_reply') {
                  text = interactive.list_reply.title;
                }
              }
              
              if (text) {
                console.log(`Message text: ${text}`);
                console.log(`Message ID: ${message.id}`);
                if (contextId) {
                  console.log(`Context ID (replying to): ${contextId}`);
                }
                
                // Process the message asynchronously with context
                processIncomingMessage(from, text, message.id, contextId).catch(err => {
                  console.error('Error in processIncomingMessage:', err);
                });
              }
            }
          }
        }
      }
    }
    
    // Send 200 OK response immediately
    res.status(200).send('EVENT_RECEIVED');
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.sendStatus(500);
  }
});

// Process incoming messages
async function processIncomingMessage(from, text, messageId, contextId = null) {
  try {
    console.log('\n=== PROCESSING INCOMING MESSAGE ===');
    console.log(`From: ${from}`);
    console.log(`Text: "${text}"`);
    console.log(`Message ID: ${messageId}`);
    console.log(`Context ID: ${contextId || 'Not provided'}`);
    
    // Check if this is a response to an availability request
    const Player = require('../models/Player');
    
    // Format phone number to match database format (needed for both methods)
    let formattedPhone = from.replace(/\D/g, '');
    console.log(`Original phone: ${from}`);
    console.log(`Cleaned phone: ${formattedPhone}`);
    
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    console.log(`Formatted phone: ${formattedPhone}`);
    
    // Try multiple phone formats to find the message
    const phoneVariants = [
      formattedPhone,
      formattedPhone.slice(-10), // Last 10 digits
      '91' + formattedPhone.slice(-10), // With country code
      from // Original format
    ];
    
    let recentAvailabilityMessage = null;
    
    // METHOD 1: Try to find message by context ID (most accurate)
    if (contextId) {
      console.log(`\n🔍 METHOD 1: Looking up by context ID...`);
      recentAvailabilityMessage = await Message.findOne({
        messageId: contextId,
        direction: 'outgoing'
      });
      
      if (recentAvailabilityMessage) {
        console.log(`✅ Found message by context ID!`);
        console.log(`  Match ID: ${recentAvailabilityMessage.matchId}`);
        console.log(`  Availability ID: ${recentAvailabilityMessage.availabilityId}`);
        console.log(`  Sent to: ${recentAvailabilityMessage.to}`);
      } else {
        console.log(`❌ No message found with context ID: ${contextId}`);
      }
    }
    
    // METHOD 2: Fallback to phone number matching if context ID didn't work
    if (!recentAvailabilityMessage) {
      console.log(`\n🔍 METHOD 2: Falling back to phone number matching...`);
      console.log(`Searching for messages with phone variants:`, phoneVariants);
      
      // Find the most recent availability request sent to this number
      recentAvailabilityMessage = await Message.findOne({
        to: { $in: phoneVariants },
        $or: [
          { messageType: 'availability_request' },
          { messageType: 'general', matchId: { $exists: true } } // Fallback for messages marked as general but have matchId
        ],
        direction: 'outgoing'
      }).sort({ timestamp: -1 });
    }
    
    console.log(`Found availability message:`, recentAvailabilityMessage ? 'YES' : 'NO');
    if (recentAvailabilityMessage) {
      console.log(`  Match ID: ${recentAvailabilityMessage.matchId}`);
      console.log(`  Availability ID: ${recentAvailabilityMessage.availabilityId}`);
      console.log(`  Sent to: ${recentAvailabilityMessage.to}`);
      console.log(`  Sent at: ${recentAvailabilityMessage.timestamp}`);
    }
    
    // Only process as availability response if:
    // 1. This is a reply to a specific message (has context ID) OR
    // 2. This is a button response (which are always availability-related)
    const isAvailabilityReply = contextId || recentAvailabilityMessage.messageType === 'availability_request';
    
    if (recentAvailabilityMessage && recentAvailabilityMessage.matchId && isAvailabilityReply) {
      console.log(`\n✅ Found availability request for match: ${recentAvailabilityMessage.matchId}`);
      console.log(`Processing as availability response: ${isAvailabilityReply ? 'YES' : 'NO'}`);
      
      // Determine response type from button text
      let response = 'pending';
      const lowerText = text.toLowerCase().trim();
      
      console.log(`Analyzing response text: "${lowerText}"`);
      
      // More comprehensive response detection
      if (lowerText === 'yes' || lowerText === 'available' || lowerText.includes('confirm') || 
          lowerText.includes('i am available') || lowerText.includes('i can play') ||
          lowerText.includes('count me in') || lowerText === 'y') {
        response = 'yes';
      } else if (lowerText === 'no' || lowerText === 'not available' || lowerText.includes('decline') ||
                 lowerText.includes('cannot') || lowerText.includes('can\'t') || 
                 lowerText.includes('unavailable') || lowerText === 'n') {
        response = 'no';
      } else if (lowerText === 'tentative' || lowerText === 'maybe' || lowerText.includes('not sure') ||
                 lowerText.includes('might') || lowerText.includes('possibly')) {
        response = 'tentative';
      }
      
      console.log(`Detected response type: ${response}`);
      
      // Find player by phone - try multiple formats
      let player = await Player.findOne({ phone: { $regex: formattedPhone.slice(-10) } });
      
      if (!player) {
        console.log(`Player not found with regex, trying exact matches...`);
        for (const phoneVariant of phoneVariants) {
          player = await Player.findOne({ phone: phoneVariant });
          if (player) {
            console.log(`Found player with phone variant: ${phoneVariant}`);
            break;
          }
        }
      }
      
      if (!player) {
        console.log(`❌ Player not found for phone: ${formattedPhone}`);
        return;
      }
      
      console.log(`✅ Found player: ${player.name} (${player._id})`);
      
      if (recentAvailabilityMessage.availabilityId) {
        console.log(`Updating availability record: ${recentAvailabilityMessage.availabilityId}`);
        // Update availability record
        const availability = await Availability.findById(recentAvailabilityMessage.availabilityId);
        
        if (availability) {
          console.log(`Current availability status: ${availability.response}`);
          availability.response = response;
          availability.status = 'responded';
          availability.respondedAt = new Date();
          availability.messageContent = text;
          availability.incomingMessageId = messageId;
          await availability.save();
          
          console.log(`✅ Updated availability for player ${player.name}: ${response}`);
          console.log(`   Responded at: ${availability.respondedAt}`);
          
          // Update match statistics and squad
          console.log(`Updating match statistics for match: ${recentAvailabilityMessage.matchId}`);
          const match = await Match.findById(recentAvailabilityMessage.matchId);
          if (match) {
            // Recalculate statistics
            const allAvailabilities = await Availability.find({ matchId: match._id });
            console.log(`Total availability records for match: ${allAvailabilities.length}`);
            
            const confirmedCount = allAvailabilities.filter(a => a.response === 'yes').length;
            const declinedCount = allAvailabilities.filter(a => a.response === 'no').length;
            const tentativeCount = allAvailabilities.filter(a => a.response === 'tentative').length;
            const pendingCount = allAvailabilities.filter(a => a.response === 'pending').length;
            
            console.log(`Statistics: Confirmed=${confirmedCount}, Declined=${declinedCount}, Tentative=${tentativeCount}, Pending=${pendingCount}`);
            
            match.confirmedPlayers = confirmedCount;
            match.declinedPlayers = declinedCount;
            match.tentativePlayers = tentativeCount;
            match.noResponsePlayers = pendingCount;
            match.lastAvailabilityUpdate = new Date();
            
            // Update squad status
            if (match.confirmedPlayers >= 11) {
              match.squadStatus = 'full';
            } else if (match.confirmedPlayers > 0) {
              match.squadStatus = 'partial';
            }
            
            // Add to squad if confirmed
            if (response === 'yes') {
              const playerInSquad = match.squad.find(
                s => s.player.toString() === player._id.toString()
              );
              
              if (!playerInSquad) {
                match.squad.push({
                  player: player._id,
                  response: 'yes',
                  respondedAt: new Date()
                });
                console.log(`Added ${player.name} to match squad`);
              }
            } else {
              // Remove from squad if declined or tentative
              match.squad = match.squad.filter(
                s => s.player.toString() !== player._id.toString()
              );
              console.log(`Removed ${player.name} from match squad`);
            }
            
            await match.save();
            console.log(`✅ Match updated successfully`);
            console.log(`   Match: ${match.matchId}`);
            console.log(`   Squad Status: ${match.squadStatus}`);
            console.log(`   Last Update: ${match.lastAvailabilityUpdate}`);
          } else {
            console.log(`❌ Match not found: ${recentAvailabilityMessage.matchId}`);
          }
        } else {
          console.log(`❌ Availability record not found: ${recentAvailabilityMessage.availabilityId}`);
        }
      } else {
        console.log(`❌ No availabilityId in message record`);
        
        // Try to find availability by matchId and player phone
        const availability = await Availability.findOne({
          matchId: recentAvailabilityMessage.matchId,
          playerPhone: { $in: phoneVariants }
        });
        
        if (availability) {
          console.log(`✅ Found availability by matchId and phone, updating...`);
          availability.response = response;
          availability.status = 'responded';
          availability.respondedAt = new Date();
          availability.messageContent = text;
          availability.incomingMessageId = messageId;
          await availability.save();
          
          // Update match statistics
          const match = await Match.findById(recentAvailabilityMessage.matchId);
          if (match) {
            const allAvailabilities = await Availability.find({ matchId: match._id });
            match.confirmedPlayers = allAvailabilities.filter(a => a.response === 'yes').length;
            match.declinedPlayers = allAvailabilities.filter(a => a.response === 'no').length;
            match.tentativePlayers = allAvailabilities.filter(a => a.response === 'tentative').length;
            match.noResponsePlayers = allAvailabilities.filter(a => a.response === 'pending').length;
            match.lastAvailabilityUpdate = new Date();
            
            if (match.confirmedPlayers >= 11) {
              match.squadStatus = 'full';
            } else if (match.confirmedPlayers > 0) {
              match.squadStatus = 'partial';
            }
            
            await match.save();
            console.log(`✅ Match updated via fallback method`);
          }
        } else {
          console.log(`❌ Could not find availability record by any method`);
        }
      }
    } else {
      console.log(`❌ Not processing as availability response`);
      
      // Handle general chat messages - save to database for chat interface
      try {
        const player = await Player.findOne({ 
          phone: { $regex: formattedPhone.slice(-10) } 
        });
        
        if (player) {
          console.log(`✅ Found player for general message: ${player.name}`);
          
          // Save incoming message to database
          await Message.create({
            from: formattedPhone,
            to: process.env.WHATSAPP_PHONE_NUMBER_ID,
            text: text,
            direction: 'incoming',
            messageId: messageId,
            timestamp: new Date(),
            messageType: 'general',
            playerId: player._id,
            playerName: player.name
          });
          
          console.log(`✅ General message saved to database`);
        } else {
          console.log(`❌ Player not found for general message from: ${formattedPhone}`);
        }
      } catch (saveErr) {
        console.error(`❌ Error saving general message:`, saveErr.message);
      }
    }
    
    console.log('=== END PROCESSING ===\n');
  } catch (error) {
    console.error('❌ Error processing incoming message:', error);
    console.error('Stack trace:', error.stack);
  }
}

// GET /api/whatsapp/messages/:phone - Get message history for a phone number
router.get('/messages/:phone', auth, async (req, res) => {
  try {
    const { phone } = req.params;
    
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    console.log(`Fetching message history for phone: ${phone}`);
    
    // Format phone number to match how it's stored
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    console.log(`Querying messages for formatted phone: ${formattedPhone}`);

    const messages = await Message.find({
      $or: [
        { from: formattedPhone },
        { to: formattedPhone }
      ]
    }).sort({ timestamp: 1 });

    console.log(`Found ${messages.length} messages for ${formattedPhone}`);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message history'
    });
  }
});

// Test endpoint for WhatsApp API
router.post('/test', async (req, res) => {
  try {
    const { message = "Test message from Mavericks XI Cricket Feedback", phone = "918087102325" } = req.body;
    
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = 'v19.0';
    
    const whatsappApiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        body: message,
        preview_url: false
      }
    };
    
    console.log(`Testing WhatsApp API to ${phone}:`, message);
    console.log('API URL:', whatsappApiUrl);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(whatsappApiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('WhatsApp API Response:', response.data);
    
    // Save outgoing test message to database
    await Message.create({
      from: phoneNumberId,
      to: phone,
      text: message,
      direction: 'outgoing',
      messageId: response.data?.messages?.[0]?.id,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Test message sent successfully',
      apiResponse: response.data
    });
    
  } catch (error) {
    console.error('WhatsApp test failed:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send test message',
      details: error.response?.data || error.message
    });
  }
});

// POST /api/whatsapp/send - Send WhatsApp messages to players
router.post('/send', auth, async (req, res) => {
  try {
    const { playerIds, message, previewUrl = false, template, matchId, matchTitle } = req.body;
    
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Player IDs are required'
      });
    }
    
    // Get player details for response
    const Player = require('../models/Player');
    console.log('Searching for players with IDs:', playerIds);
    const players = await Player.find({ '_id': { $in: playerIds } }).select('name phone');
    console.log(`Found ${players.length} players in database`);
    
    // WhatsApp API configuration
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = 'v19.0';
    
    console.log('WhatsApp Config:', {
      apiVersion,
      phoneNumberId,
      tokenPrefix: accessToken.substring(0, 10) + '...'
    });
    
    if (!accessToken || !phoneNumberId) {
      console.error('WhatsApp credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'WhatsApp API not properly configured'
      });
    }
    
    const results = [];
    
    // Send messages to each player
    for (const player of players) {
      try {
        console.log(`Processing player: ${player.name} (${player._id}) with phone: ${player.phone}`);
        
        // Format phone number (remove any non-digit characters and add country code if needed)
        let formattedPhone = player.phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone;
        }
        // Remove any leading 91 if it was added twice
        if (formattedPhone.startsWith('9191') && formattedPhone.length === 12) {
          formattedPhone = '91' + formattedPhone.substring(2);
        }
        
        const whatsappApiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
        
        let payload;
        if (template) {
          console.log('Template detected, processing components...');
          // Process template components to replace {{PLAYER_NAME}} placeholder
          const processedComponents = template.components ? template.components.map(component => {
            if (component.type === 'body' && component.parameters) {
              return {
                ...component,
                parameters: component.parameters.map(param => {
                  if (param.type === 'text' && param.text === '{{PLAYER_NAME}}') {
                    console.log(`Replacing {{PLAYER_NAME}} with ${player.name}`);
                    return { ...param, text: player.name };
                  }
                  return param;
                })
              };
            }
            return component;
          }) : [];

          payload = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
              name: template.name,
              language: {
                code: template.languageCode || 'en'
              },
              components: processedComponents
            }
          };
        } else {
          payload = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: {
              body: message,
              preview_url: previewUrl
            }
          };
        }
        
        console.log(`Final Payload for ${player.name}:`, JSON.stringify(payload, null, 2));
        
        const response = await axios.post(whatsappApiUrl, payload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`WhatsApp API Success for ${player.name}:`, JSON.stringify(response.data, null, 2));
        
        // Create availability record if matchId is provided (for availability tracking)
        let availabilityId = null;
        if (matchId) {
          try {
            const availability = await Availability.create({
              matchId,
              playerId: player._id,
              playerName: player.name,
              playerPhone: formattedPhone,
              response: 'pending',
              status: 'sent',
              outgoingMessageId: response.data?.messages?.[0]?.id
            });
            availabilityId = availability._id;
            console.log(`Created availability record for ${player.name} - Match: ${matchId}`);
          } catch (availErr) {
            console.error(`Failed to create availability record for ${player.name}:`, availErr.message);
          }
        }
        
        // Save outgoing message to database
        await Message.create({
          from: phoneNumberId,
          to: formattedPhone,
          text: template ? `Template: ${template.name}` : message,
          direction: 'outgoing',
          messageId: response.data?.messages?.[0]?.id,
          timestamp: new Date(),
          matchId: matchId || null,
          matchTitle: matchTitle || null,
          messageType: matchId ? 'availability_request' : 'general',
          templateUsed: template?.name || null,
          availabilityId: availabilityId
        });
        
        results.push({
          playerId: player._id,
          name: player.name,
          phone: player.phone,
          status: 'sent',
          messageId: response.data?.messages?.[0]?.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          apiResponse: response.data
        });
        
        console.log(`WhatsApp message sent successfully to ${player.name}:`, response.data);
        
      } catch (error) {
        console.error(`Failed to send WhatsApp message to ${player.name}:`, error.response?.data || error.message);
        
        results.push({
          playerId: player._id,
          name: player.name,
          phone: player.phone,
          status: 'failed',
          error: error.response?.data?.error?.message || error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    // Update match statistics if matchId provided
    if (matchId && sentCount > 0) {
      try {
        await Match.findByIdAndUpdate(matchId, {
          availabilitySent: true,
          availabilitySentAt: new Date(),
          totalPlayersRequested: sentCount,
          noResponsePlayers: sentCount
        });
        console.log(`Updated match ${matchId} with availability statistics`);
      } catch (matchErr) {
        console.error('Failed to update match statistics:', matchErr.message);
      }
    }
    
    res.json({
      success: true,
      data: {
        sent: sentCount,
        failed: failedCount,
        attempted: playerIds.length,
        results
      },
      message: `Messages processed: ${sentCount} sent, ${failedCount} failed`
    });
    
  } catch (error) {
    console.error('Error sending WhatsApp messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send messages'
    });
  }
});

// POST /api/whatsapp/send-reminder - Send reminder to non-responders
router.post('/send-reminder', auth, async (req, res) => {
  try {
    const { matchId } = req.body;
    
    console.log('\n=== SENDING REMINDER ===');
    console.log(`Match ID: ${matchId}`);
    
    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: 'Match ID is required'
      });
    }
    
    // Get match details
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Find all availability records with no response
    const pendingAvailabilities = await Availability.find({
      matchId: matchId,
      response: 'pending'
    });
    
    console.log(`Found ${pendingAvailabilities.length} players who haven't responded`);
    
    if (pendingAvailabilities.length === 0) {
      return res.json({
        success: true,
        message: 'All players have already responded',
        data: {
          sent: 0,
          pending: 0
        }
      });
    }
    
    // Get player details
    const playerIds = pendingAvailabilities.map(a => a.playerId);
    const Player = require('../models/Player');
    const players = await Player.find({ '_id': { $in: playerIds } });
    
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
    let sentCount = 0;
    
    // Send reminder to each player
    for (const player of players) {
      try {
        console.log(`Sending reminder to: ${player.name}`);
        
        // Format phone number
        let formattedPhone = player.phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone;
        }
        
        const whatsappApiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
        
        // Create reminder message
        const reminderText = `🔔 *Reminder: Match Availability*\n\nHi ${player.name},\n\nThis is a friendly reminder about the upcoming match:\n\n📅 *${match.opponent || 'Practice Match'}*\n🏟️ ${match.ground}\n📆 ${new Date(match.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n\nWe haven't received your response yet. Please let us know if you're available!\n\nReply with:\n✅ *Yes* - I'm available\n❌ *No* - Not available\n⏳ *Tentative* - Maybe`;
        
        const payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: reminderText,
            preview_url: false
          }
        };
        
        const response = await axios.post(whatsappApiUrl, payload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Update availability record with reminder timestamp
        const availability = pendingAvailabilities.find(
          a => a.playerId.toString() === player._id.toString()
        );
        
        if (availability) {
          availability.reminderSentAt = new Date();
          availability.reminderCount = (availability.reminderCount || 0) + 1;
          await availability.save();
        }
        
        // Save reminder message
        await Message.create({
          from: phoneNumberId,
          to: formattedPhone,
          text: reminderText,
          direction: 'outgoing',
          messageId: response.data?.messages?.[0]?.id,
          matchId: matchId,
          matchTitle: match.opponent || 'Practice Match',
          messageType: 'availability_reminder',
          availabilityId: availability?._id,
          timestamp: new Date()
        });
        
        sentCount++;
        results.push({
          player: player.name,
          phone: formattedPhone,
          status: 'sent'
        });
        
        console.log(`✅ Reminder sent to ${player.name}`);
        
      } catch (error) {
        console.error(`Failed to send reminder to ${player.name}:`, error.message);
        results.push({
          player: player.name,
          phone: player.phone,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    console.log(`Reminders sent: ${sentCount}/${pendingAvailabilities.length}`);
    
    res.json({
      success: true,
      message: `Sent ${sentCount} reminder(s) to players who haven't responded`,
      data: {
        sent: sentCount,
        pending: pendingAvailabilities.length,
        results
      }
    });
    
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reminders'
    });
  }
});

module.exports = router;
