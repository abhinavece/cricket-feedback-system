const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const axios = require('axios');
const Message = require('../models/Message');
const Availability = require('../models/Availability');
const Match = require('../models/Match');
const MatchPayment = require('../models/MatchPayment');
const sseManager = require('../utils/sseManager');

/**
 * Send WhatsApp message and log to database
 * @param {string} toPhone - Recipient phone number
 * @param {string} messageText - Message body text
 * @param {Object} metadata - Optional metadata for logging
 * @returns {Promise<string|null>} - Message ID or null if failed
 */
async function sendAndLogMessage(toPhone, messageText, metadata = {}) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';

  let messageId = null;

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { body: messageText, preview_url: false }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    messageId = response.data?.messages?.[0]?.id;
    console.log(`✅ Message sent to ${toPhone}`);
  } catch (err) {
    console.error(`⚠️ Failed to send message to ${toPhone}:`, err.message);
    throw err;
  }

  // Log to Message collection
  try {
    const savedMsg = await Message.create({
      from: phoneNumberId,
      to: toPhone,
      text: messageText,
      direction: 'outgoing',
      messageId: messageId,
      timestamp: new Date(),
      messageType: metadata.messageType || 'general',
      matchId: metadata.matchId || null,
      matchTitle: metadata.matchTitle || null,
      paymentId: metadata.paymentId || null,
      playerId: metadata.playerId || null,
      playerName: metadata.playerName || null
    });

    // Broadcast SSE event for outgoing message
    sseManager.broadcast('messages', {
      type: 'message:sent',
      messageId: savedMsg._id.toString(),
      to: toPhone,
      text: messageText,
      playerName: metadata.playerName || null,
      direction: 'outgoing',
      messageType: metadata.messageType || 'general',
      timestamp: savedMsg.timestamp
    });
  } catch (logErr) {
    console.error('⚠️ Failed to log outgoing message:', logErr.message);
  }

  return messageId;
}

/**
 * Send auto-response message based on availability response
 * @param {string} toPhone - Recipient phone number
 * @param {string} response - Availability response (yes, no, tentative)
 * @param {Object} match - Match document with details
 * @param {string} playerName - Player's name for personalization
 */
async function sendAvailabilityAutoResponse(toPhone, response, match, playerName) {
  console.log(`\n📤 Sending auto-response for ${response} response to ${toPhone}`);
  
  // Format match date and time
  const matchDate = new Date(match.date);
  const dateStr = matchDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = match.time || matchDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Build location info with Google Maps link if available
  let locationInfo = match.ground || 'the venue';
  if (match.locationLink) {
    locationInfo = `${match.ground}\n📍 ${match.locationLink}`;
  }
  
  let autoMessage = '';
  
  if (response === 'yes') {
    // Confirmed - Thank them and provide match details
    autoMessage = `🎉 *Thanks for confirming, ${playerName}!*\n\n` +
      `We're excited to have you on the team! 🏏\n\n` +
      `📅 *${dateStr}*\n` +
      `⏰ *${timeStr}*\n` +
      `📍 *${locationInfo}*\n\n` +
      `See you on the ground! Let's make it a great match! 💪`;
  } else if (response === 'no') {
    // Declined - Acknowledge and ask about future availability
    autoMessage = `👍 *Thanks for letting us know, ${playerName}!*\n\n` +
      `We understand you can't make it this time. No worries!\n\n` +
      `🤔 If your plans change, just reply back and let us know.\n\n` +
      `Hope to see you in the next match! 🏏`;
  } else if (response === 'tentative') {
    // Tentative - Request confirmation closer to match date
    const hoursUntilMatch = Math.floor((matchDate.getTime() - Date.now()) / (1000 * 60 * 60));
    const confirmByDate = new Date(matchDate.getTime() - (48 * 60 * 60 * 1000)); // 48 hours before
    const confirmByStr = confirmByDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    autoMessage = `⏳ *Got it, ${playerName}!*\n\n` +
      `We've marked you as tentative for this match.\n\n` +
      `📅 *Match:* ${dateStr} at ${timeStr}\n` +
      `📍 *Venue:* ${match.ground || 'TBA'}\n\n` +
      `🙏 Please confirm your availability by *${confirmByStr}* so we can finalize the squad.\n\n` +
      `Just reply *"Available"* or *"Not Available"* when you know for sure!`;
  }
  
  if (autoMessage) {
    await sendAndLogMessage(toPhone, autoMessage, {
      messageType: 'availability_auto_response',
      matchId: match._id,
      matchTitle: match.opponent || 'Practice Match',
      playerName: playerName
    });
    console.log(`✅ Auto-response sent for ${response} response`);
  }
}

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
              } else if (message.type === 'image') {
                // Handle image messages (payment screenshots)
                console.log(`Received image from ${from}`);
                const imageId = message.image?.id;
                const caption = message.image?.caption || '';
                
                // Save image message to history first
                saveImageMessage(from, imageId, message.id, caption).catch(err => {
                  console.error('Error saving image message:', err);
                });
                
                processPaymentScreenshot(from, imageId, message.id, contextId, caption).catch(err => {
                  console.error('Error in processPaymentScreenshot:', err);
                });
                continue; // Skip text processing for images
              }
              
              if (text) {
                console.log(`Message text: ${text}`);
                console.log(`Message ID: ${message.id}`);
                if (contextId) {
                  console.log(`Context ID (replying to): ${contextId}`);
                }
                
                // Process the message asynchronously with context
                // Pass message.type to distinguish button/interactive from text messages
                processIncomingMessage(from, text, message.id, contextId, message.type).catch(err => {
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
async function processIncomingMessage(from, text, messageId, contextId = null, messageType = 'text') {
  try {
    console.log('\n=== PROCESSING INCOMING MESSAGE ===');
    console.log(`From: ${from}`);
    console.log(`Text: "${text}"`);
    console.log(`Message ID: ${messageId}`);
    console.log(`Context ID: ${contextId || 'Not provided'}`);
    console.log(`Message Type: ${messageType}`);

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

    // CRITICAL: Save ALL incoming messages immediately, regardless of context
    // This ensures no messages are ever lost
    let savedMessage = null;
    try {
      // Check if message already exists
      const Message = require('../models/Message');
      const existingMessage = await Message.findOne({ messageId });
      if (existingMessage) {
        console.log(`⚠️ Message ${messageId} already exists, skipping save`);
        savedMessage = existingMessage;
      } else {
        // Try to find associated player for enrichment (but don't require it)
        const player = await Player.findOne({
          phone: { $regex: formattedPhone.slice(-10) }
        });

        savedMessage = await Message.create({
          from: formattedPhone,
          to: process.env.WHATSAPP_PHONE_NUMBER_ID,
          text: text,
          direction: 'incoming',
          messageId: messageId,
          timestamp: new Date(),
          messageType: 'general', // Will be updated to 'availability_response' if context validates
          playerId: player?._id || null,
          playerName: player?.name || null
        });

        console.log(`✅ Message persisted immediately (ID: ${savedMessage._id})`);
        if (player) {
          console.log(`   Associated with player: ${player.name}`);
        } else {
          console.log(`   No player association (unknown sender)`);
        }
      }

      // Broadcast SSE event for new message
      sseManager.broadcast('messages', {
        type: 'message:received',
        messageId: savedMessage._id.toString(),
        from: formattedPhone,
        text: text,
        playerName: player?.name || null,
        playerId: player?._id?.toString() || null,
        direction: 'incoming',
        timestamp: savedMessage.timestamp
      });
    } catch (saveErr) {
      // Log error but continue processing - don't fail the whole flow
      console.error(`⚠️ Failed to persist message immediately:`, saveErr.message);
    }
    
    // Try multiple phone formats to find the message
    const phoneVariants = [
      formattedPhone,
      formattedPhone.slice(-10), // Last 10 digits
      '91' + formattedPhone.slice(-10), // With country code
      from // Original format
    ];
    
    let recentAvailabilityMessage = null;
    let contextValidated = false; // Track if context was properly validated
    let contextIdProvided = !!contextId; // Track if contextId was in the original message

    // METHOD 1: Try to find message by context ID (most accurate)
    if (contextId) {
      console.log(`\n🔍 METHOD 1: Looking up by context ID...`);
      const contextMessage = await Message.findOne({
        messageId: contextId,
        direction: 'outgoing'
      });

      if (contextMessage) {
        console.log(`✅ Found message by context ID!`);
        console.log(`  Message Type: ${contextMessage.messageType}`);
        console.log(`  Match ID: ${contextMessage.matchId}`);
        console.log(`  Availability ID: ${contextMessage.availabilityId}`);
        console.log(`  Sent to: ${contextMessage.to}`);

        // CRITICAL: Only treat as availability reply if the context message is an availability_request
        // or availability_reminder (has matchId and is related to availability)
        const isAvailabilityTemplate = contextMessage.messageType === 'availability_request' ||
                                       contextMessage.messageType === 'availability_reminder' ||
                                       (contextMessage.matchId && contextMessage.availabilityId);

        if (isAvailabilityTemplate) {
          recentAvailabilityMessage = contextMessage;
          contextValidated = true;
          console.log(`✅ Context validated: This is a reply to an availability request`);
        } else {
          console.log(`❌ Context message is NOT an availability request (type: ${contextMessage.messageType})`);
          console.log(`   This message will NOT update availability statistics`);
        }
      } else {
        console.log(`❌ No message found with context ID: ${contextId}`);
        console.log(`   This message will NOT update availability statistics (invalid context)`);
      }
    }

    // NO FALLBACK: Only context.id based matching is allowed
    // If no valid context.id, the message will NOT update availability
    if (!recentAvailabilityMessage) {
      if (contextIdProvided) {
        console.log(`\n⚠️ Context ID was provided but invalid - message will NOT update availability`);
      } else {
        console.log(`\n⚠️ No context ID provided - message will NOT update availability`);
      }
      console.log(`   Only replies to availability requests (with valid context.id) can update availability`);
    }

    console.log(`\n📊 Context Validation Summary:`);
    console.log(`   Context ID Provided: ${contextIdProvided ? 'YES' : 'NO'}`);
    console.log(`   Context Validated: ${contextValidated ? 'YES' : 'NO'}`);
    console.log(`   Found Availability Message: ${recentAvailabilityMessage ? 'YES' : 'NO'}`);
    if (recentAvailabilityMessage) {
      console.log(`   Match ID: ${recentAvailabilityMessage.matchId}`);
      console.log(`   Availability ID: ${recentAvailabilityMessage.availabilityId}`);
      console.log(`   Sent at: ${recentAvailabilityMessage.timestamp}`);
    }

    // Only process as availability response if context was properly validated
    // This ensures we never update availability for invalid/unrelated messages
    if (recentAvailabilityMessage && recentAvailabilityMessage.matchId && contextValidated) {
      console.log(`\n✅ Processing availability response for match: ${recentAvailabilityMessage.matchId}`);

      // Determine if this is a button/interactive response vs free text
      const isButtonResponse = messageType === 'button' || messageType === 'interactive';
      const lowerText = text.toLowerCase().trim();

      // Determine response type based on message type
      let response = null; // null means "don't update availability"

      if (isButtonResponse) {
        // Button responses - trust the exact text from button
        console.log(`📱 Button response received: "${text}"`);
        if (lowerText === 'yes' || lowerText === 'available') {
          response = 'yes';
        } else if (lowerText === 'no' || lowerText === 'not available') {
          response = 'no';
        } else if (lowerText === 'tentative' || lowerText === 'maybe') {
          response = 'tentative';
        }
      } else {
        // Text message - ONLY accept exact matches to prevent false positives
        console.log(`💬 Text response received: "${text}"`);
        const exactMatches = {
          'yes': 'yes',
          'y': 'yes',
          'available': 'yes',
          'no': 'no',
          'n': 'no',
          'not available': 'no',
          'tentative': 'tentative',
          'maybe': 'tentative'
        };
        response = exactMatches[lowerText] || null;

        if (!response) {
          console.log(`   ℹ️ Text "${lowerText}" is not an exact match - ignoring for availability`);
        }
      }

      console.log(`Detected response type: ${response || 'none (not a valid response)'}`);

      // Only update availability if we got a valid response
      if (!response) {
        console.log(`⚠️ Message not recognized as availability response - skipping update`);
        console.log(`   Message is still saved as general incoming message`);
        console.log('=== END MESSAGE PROCESSING (NOT AN AVAILABILITY RESPONSE) ===\n');
        return; // Don't proceed with availability update
      }

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

            // Broadcast SSE event for real-time updates
            sseManager.broadcastToMatch(match._id.toString(), {
              type: 'availability:update',
              matchId: match._id.toString(),
              playerId: player._id.toString(),
              playerName: player.name,
              response: response,
              respondedAt: availability.respondedAt,
              stats: {
                confirmed: match.confirmedPlayers,
                declined: match.declinedPlayers,
                tentative: match.tentativePlayers,
                pending: match.noResponsePlayers
              }
            });

            // Send auto-response based on availability response
            try {
              await sendAvailabilityAutoResponse(formattedPhone, response, match, player.name);
            } catch (autoRespErr) {
              console.error(`⚠️ Failed to send auto-response:`, autoRespErr.message);
            }

            // Update the saved incoming message to link it to the match context
            if (savedMessage) {
              try {
                await Message.findByIdAndUpdate(savedMessage._id, {
                  messageType: 'availability_response',
                  matchId: recentAvailabilityMessage.matchId,
                  matchTitle: recentAvailabilityMessage.matchTitle,
                  availabilityId: availability._id
                });
                console.log(`✅ Incoming message linked to match context`);
              } catch (linkErr) {
                console.error(`⚠️ Failed to link message to match:`, linkErr.message);
              }
            }
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

            // Broadcast SSE event for real-time updates (fallback method)
            sseManager.broadcastToMatch(match._id.toString(), {
              type: 'availability:update',
              matchId: match._id.toString(),
              playerId: availability.playerId?.toString() || null,
              playerName: availability.playerName,
              response: response,
              respondedAt: availability.respondedAt,
              stats: {
                confirmed: match.confirmedPlayers,
                declined: match.declinedPlayers,
                tentative: match.tentativePlayers,
                pending: match.noResponsePlayers
              }
            });

            // Send auto-response based on availability response (fallback method)
            try {
              await sendAvailabilityAutoResponse(formattedPhone, response, match, availability.playerName);
            } catch (autoRespErr) {
              console.error(`⚠️ Failed to send auto-response:`, autoRespErr.message);
            }

            // Update the saved incoming message to link it to the match context
            if (savedMessage) {
              try {
                await Message.findByIdAndUpdate(savedMessage._id, {
                  messageType: 'availability_response',
                  matchId: recentAvailabilityMessage.matchId,
                  matchTitle: recentAvailabilityMessage.matchTitle,
                  availabilityId: availability._id
                });
                console.log(`✅ Incoming message linked to match context (fallback)`);
              } catch (linkErr) {
                console.error(`⚠️ Failed to link message to match:`, linkErr.message);
              }
            }
          }
        } else {
          console.log(`❌ Could not find availability record by any method`);
        }
      }
    } else {
      // Message was already saved at the start of processing
      // Log why it wasn't processed as an availability response
      if (!recentAvailabilityMessage) {
        console.log(`ℹ️ No matching availability request found - saved as general message`);
      } else if (!recentAvailabilityMessage.matchId) {
        console.log(`ℹ️ No matchId in availability message - saved as general message`);
      } else if (!contextValidated) {
        console.log(`ℹ️ Context validation failed - saved as general message (availability NOT updated)`);
      }
    }
    
    console.log('=== END PROCESSING ===\n');
  } catch (error) {
    console.error('❌ Error processing incoming message:', error);
    console.error('Stack trace:', error.stack);
  }
}

async function saveImageMessage(from, imageId, messageId, caption) {
  try {
    console.log('\n=== SAVING IMAGE MESSAGE TO HISTORY ===');
    
    // Format phone number
    let formattedPhone = from.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    // Find associated player
    const Player = require('../models/Player');
    const player = await Player.findOne({
      phone: { $regex: formattedPhone.slice(-10) }
    });
    
    // Get image URL and download image data from WhatsApp Media API
    let imageUrl = null;
    let imageData = null;
    let mimeType = 'image/jpeg';
    
    try {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const apiVersion = 'v19.0';
      const mediaUrl = `https://graph.facebook.com/${apiVersion}/${imageId}`;
      
      // Step 1: Get media info (URL and mime type)
      const mediaResponse = await axios.get(mediaUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      imageUrl = mediaResponse.data.url;
      mimeType = mediaResponse.data.mime_type || 'image/jpeg';
      console.log(`Image URL obtained: ${imageUrl ? 'Yes' : 'No'}, MIME: ${mimeType}`);
      
      // Step 2: Download and cache the actual image data
      if (imageUrl) {
        const imageResponse = await axios.get(imageUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          responseType: 'arraybuffer'
        });
        imageData = Buffer.from(imageResponse.data);
        console.log(`Image data cached: ${imageData.length} bytes`);
      }
    } catch (err) {
      console.error('Failed to get/cache image:', err.message);
    }
    
    // Check if message already exists with the same image ID
    const Message = require('../models/Message');
    const existingMessage = await Message.findOne({ messageId });
    
    if (existingMessage) {
      if (existingMessage.imageId === imageId) {
        console.log(`⚠️ Message ${messageId} with same imageId ${imageId} already exists, skipping save`);
        return existingMessage;
      } else {
        console.log(`🔄 Message ${messageId} exists but has different imageId (${existingMessage.imageId} -> ${imageId}), creating new record`);
        // WhatsApp sometimes reuses message IDs for different images
        // We'll create a new message record with a unique ID
        const newMessageId = messageId + '_' + Date.now();
        
        // Save new message record with unique ID
        const savedMessage = await Message.create({
          from: formattedPhone,
          to: process.env.WHATSAPP_PHONE_NUMBER_ID,
          text: caption || '[Image]',
          direction: 'incoming',
          messageId: newMessageId, // Use unique ID
          originalMessageId: messageId, // Store original WhatsApp ID
          timestamp: new Date(),
          messageType: 'payment_screenshot',
          playerId: player?._id || null,
          playerName: player?.name || null,
          imageId: imageId,
          imageUrl: imageUrl,
          imageMimeType: mimeType,
          imageData: imageData,
          caption: caption || null
        });
        
        console.log(`✅ New image message saved to history (ID: ${savedMessage._id}) with unique ID: ${newMessageId}`);
        return savedMessage;
      }
    }
    
    // Save image message to database (with cached image data)
    const savedMessage = await Message.create({
      from: formattedPhone,
      to: process.env.WHATSAPP_PHONE_NUMBER_ID,
      text: caption || '[Image]',
      direction: 'incoming',
      messageId: messageId,
      timestamp: new Date(),
      messageType: 'payment_screenshot',
      playerId: player?._id || null,
      playerName: player?.name || null,
      imageId: imageId,
      imageUrl: imageUrl,
      imageMimeType: mimeType,
      imageData: imageData,
      caption: caption || null
    });
    
    console.log(`✅ Image message saved to history (ID: ${savedMessage._id})`);
    
    // Broadcast SSE event for incoming image message
    sseManager.broadcast('messages', {
      type: 'message:received',
      messageId: savedMessage._id.toString(),
      from: formattedPhone,
      text: caption || '[Image]',
      playerName: player?.name || null,
      playerId: player?._id?.toString() || null,
      direction: 'incoming',
      timestamp: savedMessage.timestamp,
      imageId: imageId,
      messageType: 'image',
      imageMimeType: mimeType,
      caption: caption || null
    });
    
    return savedMessage;
  } catch (error) {
    console.error('❌ Error saving image message:', error.message);
    throw error;
  }
}

// Import AI Service and distribution services
const { parsePaymentScreenshot: parseWithAI, requiresReview, getReviewReason } = require('../services/aiService');
const { getPendingPaymentsForPlayer, distributePaymentFIFO, buildDistributionConfirmation } = require('../services/paymentDistributionService');

// Process payment screenshot uploads with OCR and multi-match distribution
async function processPaymentScreenshot(from, imageId, messageId, contextId, caption) {
  try {
    console.log('\n=== PROCESSING PAYMENT SCREENSHOT ===');
    console.log(`From: ${from}`);
    console.log(`Image ID: ${imageId}`);
    console.log(`Message ID: ${messageId}`);
    console.log(`Context ID: ${contextId || 'Not provided'}`);
    console.log(`Caption: ${caption || 'None'}`);

    // Format phone number
    let formattedPhone = from.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    const phoneVariants = [
      formattedPhone,
      formattedPhone.slice(-10),
      '91' + formattedPhone.slice(-10),
      from
    ];

    // Check if player has any pending payments
    const pendingPayments = await getPendingPaymentsForPlayer(formattedPhone);

    if (pendingPayments.length === 0) {
      console.log('❌ No pending payments found for this player');

      // Save as general incoming message
      const existingMessage = await Message.findOne({ messageId });
      if (!existingMessage) {
        await Message.create({
          from: formattedPhone,
          to: process.env.WHATSAPP_PHONE_NUMBER_ID,
          text: caption || '[Image received - no pending payments]',
          direction: 'incoming',
          messageId: messageId,
          timestamp: new Date(),
          messageType: 'general'
        });
      } else {
        console.log(`⚠️ No pending payment message ${messageId} already exists, skipping save`);
      }
      return;
    }

    console.log(`📋 Found ${pendingPayments.length} pending payment(s) for player`);

    // Download the image from WhatsApp
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = 'v19.0';

    // Step 1: Get image URL
    const mediaUrl = `https://graph.facebook.com/${apiVersion}/${imageId}`;
    console.log(`Fetching media info from: ${mediaUrl}`);

    const mediaResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const imageDownloadUrl = mediaResponse.data.url;
    const mimeType = mediaResponse.data.mime_type || 'image/jpeg';
    console.log(`Image URL obtained, MIME type: ${mimeType}`);

    // Step 2: Download the actual image
    const imageResponse = await axios.get(imageDownloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      responseType: 'arraybuffer'
    });

    const imageBuffer = Buffer.from(imageResponse.data);
    console.log(`Image downloaded, size: ${imageBuffer.length} bytes`);

    // Step 3: Parse payment using AI Service
    // Get match date from oldest pending payment for date validation
    const matchDate = pendingPayments[0].matchInfo?.date || null;
    console.log('\n🤖 Calling AI Service to parse payment screenshot...');
    const aiResult = await parseWithAI(imageBuffer, matchDate);

    // Debug AI result structure
    console.log('🔍 AI Result received:');
    console.log('  aiResult.success:', aiResult.success);
    console.log('  aiResult.data:', aiResult.data ? 'present' : 'missing');
    console.log('  aiResult.metadata:', aiResult.metadata ? 'present' : 'missing');
    console.log('  requiresReview result:', requiresReview(aiResult));

    // If AI fails or requires review, flag for admin (fallback to manual entry)
    if (requiresReview(aiResult)) {
      const reviewReason = getReviewReason(aiResult);
      console.log(`⚠️ AI parsing requires review: ${reviewReason}`);

      // Store screenshot in oldest pending match and flag for review
      console.log('🔍 Payment lookup debug:');
      console.log('  pendingPayments[0].paymentId:', pendingPayments[0].paymentId);
      console.log('  pendingPayments[0].memberId:', pendingPayments[0].memberId);
      
      const primaryPayment = await MatchPayment.findById(pendingPayments[0].paymentId);
      console.log('  primaryPayment found:', primaryPayment ? 'yes' : 'no');
      
      const primaryMember = primaryPayment?.squadMembers.id(pendingPayments[0].memberId);
      console.log('  primaryMember found:', primaryMember ? 'yes' : 'no');

      if (primaryMember) {
        primaryMember.screenshotImage = imageBuffer;
        primaryMember.screenshotContentType = mimeType || 'image/jpeg';
        primaryMember.screenshotMediaId = imageId;
        primaryMember.screenshotReceivedAt = new Date();
        primaryMember.requiresReview = true;
        primaryMember.reviewReason = reviewReason;
        // Store AI result metadata if available
        console.log('🔍 AI Result structure check:');
        console.log('  aiResult.success:', aiResult.success);
        console.log('  aiResult.data:', aiResult.data ? 'present' : 'missing');
        console.log('  aiResult.metadata:', aiResult.metadata ? 'present' : 'missing');
        if (aiResult.metadata) {
          console.log('  metadata.confidence:', aiResult.metadata.confidence);
          console.log('  metadata.provider:', aiResult.metadata.provider);
          console.log('  metadata.model:', aiResult.metadata.model);
          primaryMember.confidence = aiResult.metadata.confidence || 0;
          primaryMember.provider = aiResult.metadata.provider || '';
          primaryMember.model = aiResult.metadata.model || '';
          primaryMember.model_cost_tier = aiResult.metadata.model_cost_tier || '';
          primaryMember.image_hash = aiResult.metadata.image_hash || '';
          primaryMember.processing_time_ms = aiResult.metadata.processing_time_ms || 0;
          primaryMember.ai_service_response = aiResult;
          console.log('✅ AI metadata stored successfully');
        } else {
          // Store basic AI data even if metadata is missing
          console.log('⚠️ AI result metadata is missing, storing basic data');
          console.log('  Full aiResult:', JSON.stringify(aiResult, null, 2));
          primaryMember.ai_service_response = aiResult;
          // Try to extract basic info from the response
          if (aiResult.success && aiResult.data) {
            primaryMember.confidence = 0.95; // Default confidence from logs
            primaryMember.provider = 'google_ai_studio';
            primaryMember.model = 'gemma-3-27b-it';
            console.log('✅ Basic AI data stored as fallback');
          }
        }
        await primaryPayment.save();
        console.log('📸 Screenshot stored and flagged for admin review');
      }

      // Save incoming message record
      const existingMessage = await Message.findOne({ messageId });
      if (!existingMessage) {
        await Message.create({
          from: formattedPhone,
          to: process.env.WHATSAPP_PHONE_NUMBER_ID,
          text: caption || `[Payment screenshot - pending admin review: ${reviewReason}]`,
          direction: 'incoming',
          messageId: messageId,
          timestamp: new Date(),
          messageType: 'payment_screenshot',
          matchId: pendingPayments[0].matchId,
          paymentId: primaryPayment?._id
        });
      } else {
        console.log(`⚠️ Payment screenshot message ${messageId} already exists, skipping save`);
      }

      // Calculate total outstanding for acknowledgment message
      const totalDue = pendingPayments.reduce((sum, p) => sum + p.dueAmount, 0);

      // Build acknowledgment message based on review reason
      let ackMessage = `📸 *Screenshot Received*\n\n` +
        `Hi ${pendingPayments[0].playerName},\n\n` +
        `We've received your payment screenshot.\n\n`;
      
      // Add context based on review reason
      if (reviewReason === 'not_payment_screenshot') {
        ackMessage += `⚠️ This doesn't appear to be a payment screenshot.\n\n`;
      } else if (reviewReason === 'date_mismatch') {
        ackMessage += `⚠️ The payment date seems older than expected.\n\n`;
      }
      
      ackMessage += `📍 *Your Total Outstanding:* ₹${totalDue}\n\n` +
        `_Admin will verify and update your balance._`;

      try {
        await sendAndLogMessage(formattedPhone, ackMessage, {
          messageType: 'payment_acknowledgment',
          matchId: pendingPayments[0].matchId,
          paymentId: primaryPayment?._id,
          playerName: pendingPayments[0].playerName
        });
      } catch (ackErr) {
        console.error('⚠️ Failed to send acknowledgment:', ackErr.message);
      }

      // Broadcast SSE event for payment requiring review
      sseManager.broadcast('payments', {
        type: 'payment:review_required',
        paymentId: primaryPayment?._id?.toString(),
        matchId: pendingPayments[0].matchId?.toString(),
        playerName: pendingPayments[0].playerName,
        reason: reviewReason
      });

      console.log('=== END PAYMENT SCREENSHOT PROCESSING (REQUIRES REVIEW) ===\n');
      return; // Don't proceed with auto-distribution
    }

    // AI parsing succeeded - continue with distribution
    const extractedAmount = aiResult.data.amount;
    console.log(`💰 AI extracted amount: ₹${extractedAmount}`);

    // Step 4: Distribute payment across matches (FIFO)
    const screenshotData = {
      buffer: imageBuffer,
      contentType: mimeType,
      mediaId: imageId
    };

    const aiData = {
      confidence: aiResult.metadata?.confidence || 0,
      provider: aiResult.metadata?.provider || '',
      model: aiResult.metadata?.model || '',
      payerName: aiResult.data?.payer_name || '',
      transactionId: aiResult.data?.transaction_id || '',
      paymentDate: aiResult.data?.date || ''
    };

    const distributionResult = await distributePaymentFIFO(
      formattedPhone,
      extractedAmount,
      screenshotData,
      aiData
    );

    if (!distributionResult.success) {
      console.log('❌ Payment distribution failed');
      return;
    }

    // Save incoming message record
    const primaryDistribution = distributionResult.distributions[0];
    const existingMessage = await Message.findOne({ messageId });
    if (!existingMessage) {
      await Message.create({
        from: formattedPhone,
        to: process.env.WHATSAPP_PHONE_NUMBER_ID,
        text: caption || `[Payment screenshot - ₹${extractedAmount} distributed to ${distributionResult.matchesAffected} match(es)]`,
        direction: 'incoming',
        messageId: messageId,
        timestamp: new Date(),
        messageType: 'payment_screenshot',
        matchId: primaryDistribution?.matchId,
        paymentId: primaryDistribution?.paymentId,
        paymentMemberId: primaryDistribution?.memberId
      });
    } else {
      console.log(`⚠️ Distributed payment message ${messageId} already exists, skipping save`);
    }

    // Build and send confirmation message
    // Pass pendingPayments to show ALL matches, not just ones that received payment
    const confirmMessage = buildDistributionConfirmation(distributionResult, pendingPayments);

    try {
      await sendAndLogMessage(formattedPhone, confirmMessage, {
        messageType: 'payment_confirmation',
        matchId: primaryDistribution?.matchId,
        paymentId: primaryDistribution?.paymentId,
        playerName: distributionResult.playerName
      });
    } catch (confirmErr) {
      console.error('⚠️ Failed to send confirmation:', confirmErr.message);
    }

    // Broadcast SSE event for payment updates
    sseManager.broadcast('payments', {
      type: 'payment:screenshot',
      paymentId: primaryDistribution?.paymentId?.toString(),
      matchId: primaryDistribution?.matchId?.toString(),
      playerName: distributionResult.playerName,
      amount: extractedAmount,
      matchesAffected: distributionResult.matchesAffected,
      distributions: distributionResult.distributions.map(d => ({
        matchId: d.matchId?.toString(),
        amount: d.amount
      }))
    });

    console.log('=== END PAYMENT SCREENSHOT PROCESSING ===\n');

  } catch (error) {
    console.error('❌ Error processing payment screenshot:', error);
    console.error('Stack trace:', error.stack);
  }
}

// GET /api/whatsapp/conversations - Get all conversations with last message
router.get('/conversations', auth, async (req, res) => {
  try {
    const Player = require('../models/Player');

    // Get all active players
    const players = await Player.find({ isActive: true })
      .select('_id name phone')
      .sort({ name: 1 });

    // Get last message for each player
    const conversationsPromises = players.map(async (player) => {
      let formattedPhone = player.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
      }

      const lastMessage = await Message.findOne({
        $or: [
          { from: formattedPhone },
          { to: formattedPhone }
        ]
      })
        .sort({ timestamp: -1 })
        .select('text timestamp direction')
        .lean();

      return {
        player: {
          _id: player._id,
          name: player.name,
          phone: player.phone
        },
        lastMessage: lastMessage ? {
          text: lastMessage.text?.substring(0, 50) + (lastMessage.text?.length > 50 ? '...' : ''),
          timestamp: lastMessage.timestamp,
          direction: lastMessage.direction
        } : null,
        unreadCount: 0 // Placeholder for future unread tracking
      };
    });

    const conversations = await Promise.all(conversationsPromises);

    // Sort by last message timestamp (most recent first), then by name
    conversations.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.player.name.localeCompare(b.player.name);
    });

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// GET /api/whatsapp/messages/:phone - Get message history for a phone number (with pagination)
router.get('/messages/:phone', auth, async (req, res) => {
  try {
    const { phone } = req.params;
    const { limit = 10, before } = req.query; // before = timestamp cursor for pagination
    
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    console.log(`Fetching message history for phone: ${phone}, limit: ${limit}, before: ${before || 'none'}`);
    
    // Format phone number to match how it's stored
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    
    // Build query
    const query = {
      $or: [
        { from: formattedPhone },
        { to: formattedPhone }
      ]
    };
    
    // If 'before' timestamp is provided, get messages older than that
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    // Get total count for this phone (without pagination)
    const totalCount = await Message.countDocuments({
      $or: [
        { from: formattedPhone },
        { to: formattedPhone }
      ]
    });

    // Fetch messages - newest first, then reverse for display
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Reverse to show oldest first in the returned batch
    messages.reverse();

    console.log(`Found ${messages.length} messages for ${formattedPhone} (total: ${totalCount})`);

    res.json({
      success: true,
      data: messages,
      pagination: {
        total: totalCount,
        returned: messages.length,
        hasMore: messages.length > 0 && totalCount > messages.length,
        oldestTimestamp: messages.length > 0 ? messages[0].timestamp : null
      }
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

// POST /api/whatsapp/send-image - Send image to players via WhatsApp
router.post('/send-image', auth, async (req, res) => {
  try {
    const { playerIds, imageBase64, caption, matchTitle } = req.body;
    
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Player IDs are required'
      });
    }
    
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }
    
    // Get player details
    const Player = require('../models/Player');
    const players = await Player.find({ '_id': { $in: playerIds } }).select('name phone');
    
    // WhatsApp API configuration
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = 'v19.0';
    
    if (!accessToken || !phoneNumberId) {
      return res.status(500).json({
        success: false,
        error: 'WhatsApp API not properly configured'
      });
    }
    
    // First, upload the image to WhatsApp Media API
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    formData.append('file', imageBuffer, {
      filename: 'squad-image.png',
      contentType: 'image/png'
    });
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', 'image/png');
    
    console.log('Uploading image to WhatsApp Media API...');
    
    const uploadResponse = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const mediaId = uploadResponse.data.id;
    console.log('Image uploaded successfully, media ID:', mediaId);
    
    // Send the image to each player
    const results = [];
    let sentCount = 0;
    
    for (const player of players) {
      try {
        let formattedPhone = player.phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
          formattedPhone = '91' + formattedPhone;
        }
        
        const payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'image',
          image: {
            id: mediaId,
            caption: caption || `Squad availability for ${matchTitle || 'upcoming match'}`
          }
        };
        
        const response = await axios.post(
          `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`Image sent to ${player.name} (${formattedPhone})`);
        sentCount++;
        
        results.push({
          playerId: player._id,
          name: player.name,
          phone: player.phone,
          status: 'sent',
          messageId: response.data.messages?.[0]?.id
        });
        
      } catch (error) {
        console.error(`Failed to send image to ${player.name}:`, error.response?.data || error.message);
        results.push({
          playerId: player._id,
          name: player.name,
          phone: player.phone,
          status: 'failed',
          error: error.response?.data?.error?.message || error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Squad image sent to ${sentCount} of ${players.length} players`,
      data: {
        sent: sentCount,
        total: players.length,
        results
      }
    });
    
  } catch (error) {
    console.error('Error sending WhatsApp image:', error.response?.data || error);
    res.status(500).json({
      success: false,
      error: 'Failed to send image',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// GET /api/whatsapp/media/:mediaId - Serve cached image or fetch from WhatsApp (no auth for img tags)
router.get('/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    
    if (!mediaId) {
      return res.status(400).json({
        success: false,
        error: 'Media ID is required'
      });
    }
    
    // First, try to find cached image in database
    const cachedMessage = await Message.findOne({ imageId: mediaId });
    
    if (cachedMessage && cachedMessage.imageData) {
      console.log(`Serving cached image for mediaId: ${mediaId}`);
      res.set('Content-Type', cachedMessage.imageMimeType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      return res.send(cachedMessage.imageData);
    }
    
    // Fallback: Try to fetch from WhatsApp (for old messages without cached data)
    console.log(`Cache miss for mediaId: ${mediaId}, fetching from WhatsApp...`);
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = 'v19.0';
    
    // Step 1: Get media URL from WhatsApp
    const mediaUrl = `https://graph.facebook.com/${apiVersion}/${mediaId}`;
    const mediaResponse = await axios.get(mediaUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const imageDownloadUrl = mediaResponse.data.url;
    const mimeType = mediaResponse.data.mime_type || 'image/jpeg';
    
    // Step 2: Download the actual image
    const imageResponse = await axios.get(imageDownloadUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      responseType: 'arraybuffer'
    });
    
    const imageBuffer = Buffer.from(imageResponse.data);
    
    // Step 3: Cache the image for future requests (if message exists)
    if (cachedMessage) {
      cachedMessage.imageData = imageBuffer;
      cachedMessage.imageMimeType = mimeType;
      await cachedMessage.save();
      console.log(`Cached image data for mediaId: ${mediaId}`);
    }
    
    // Step 4: Send the image to client
    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Error fetching WhatsApp media:', error.response?.data || error.message);
    
    // Return a placeholder image or error
    res.status(404).json({
      success: false,
      error: 'Image not available',
      details: 'The image may have expired or is no longer accessible'
    });
  }
});

module.exports = router;
