const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Player = require('../models/Player');
const Match = require('../models/Match');
const Availability = require('../models/Availability');
const Feedback = require('../models/Feedback');
const Message = require('../models/Message');
const MatchPayment = require('../models/MatchPayment');

// Test data marker - all test data will have this in notes/text
const TEST_DATA_MARKER = '[TEST_DATA]';

// Sample Indian cricket player names
const samplePlayers = [
  { name: 'Rahul Sharma', phone: '+919876543210', role: 'batsman' },
  { name: 'Vikas Patel', phone: '+919876543211', role: 'bowler' },
  { name: 'Amit Kumar', phone: '+919876543212', role: 'all-rounder' },
  { name: 'Suresh Reddy', phone: '+919876543213', role: 'wicket-keeper' },
  { name: 'Pradeep Singh', phone: '+919876543214', role: 'batsman' },
  { name: 'Rajesh Verma', phone: '+919876543215', role: 'bowler' },
  { name: 'Deepak Gupta', phone: '+919876543216', role: 'all-rounder' },
  { name: 'Manoj Yadav', phone: '+919876543217', role: 'batsman' },
  { name: 'Sanjay Joshi', phone: '+919876543218', role: 'bowler' },
  { name: 'Arun Nair', phone: '+919876543219', role: 'all-rounder' },
  { name: 'Kiran Desai', phone: '+919876543220', role: 'batsman' },
  { name: 'Nitin Chopra', phone: '+919876543221', role: 'bowler' },
  { name: 'Vivek Malhotra', phone: '+919876543222', role: 'wicket-keeper' },
  { name: 'Ashish Bansal', phone: '+919876543223', role: 'all-rounder' },
  { name: 'Gaurav Mehta', phone: '+919876543224', role: 'batsman' },
];

// Sample opponents
const opponents = [
  'Chennai Super Kings XI',
  'Mumbai Indians CC',
  'Royal Challengers',
  'Delhi Daredevils CC',
  'Kolkata Knights',
  'Sunrisers CC',
  'Punjab Warriors',
  'Rajasthan Royals XI'
];

// Sample grounds
const grounds = [
  'MCA Stadium, Pune',
  'Shivaji Park, Mumbai',
  'DY Patil Stadium',
  'Nehru Stadium, Pune',
  'Balewadi Sports Complex',
  'ICC Academy Ground'
];

// Sample feedback texts
const feedbackTexts = [
  'Great match! Team coordination was excellent.',
  'Need to work on fielding positions. Bowling was good.',
  'Batting order needs reconsideration for next match.',
  'Excellent performance by the bowlers today!',
  'We need more practice sessions before big matches.',
  'The team spirit was amazing, everyone gave their best.',
  'Ground conditions were challenging but we adapted well.',
  'Need better communication between batsmen while running.',
];

// Sample WhatsApp conversation templates
const conversationTemplates = [
  { outgoing: 'Hi {name}! We have a match on {date} at {ground}. Can you confirm your availability?', incoming: 'Yes, I will be there!' },
  { outgoing: 'Hi {name}! Match reminder for {date}. Please confirm.', incoming: 'Sorry, I cannot make it this time.' },
  { outgoing: 'Hi {name}! Are you available for the match against {opponent}?', incoming: 'I am tentative, will confirm by tomorrow.' },
  { outgoing: 'Hi {name}! Final squad confirmation needed for {date}.', incoming: 'Count me in! Looking forward to it.' },
  { outgoing: 'Hi {name}! Payment of ₹{amount} is pending for the match. Please pay.', incoming: 'Payment done, sending screenshot.' },
];

// Helper function to get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get random number in range
const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate unique match ID
const generateMatchId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TST-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * POST /api/seed/generate
 * Generate comprehensive test data
 */
router.post('/generate', async (req, res) => {
  try {
    const results = {
      players: 0,
      matches: 0,
      availabilities: 0,
      feedbacks: 0,
      messages: 0,
      payments: 0
    };

    console.log('🌱 Starting test data generation...');

    // 1. Create Players
    console.log('Creating players...');
    const createdPlayers = [];
    for (const playerData of samplePlayers) {
      const existingPlayer = await Player.findOne({ phone: playerData.phone });
      if (!existingPlayer) {
        const player = await Player.create({
          ...playerData,
          team: 'Mavericks CC',
          notes: TEST_DATA_MARKER,
          isActive: true
        });
        createdPlayers.push(player);
        results.players++;
      } else {
        createdPlayers.push(existingPlayer);
      }
    }
    console.log(`✓ Created ${results.players} players`);

    // 2. Create Matches (past, current, future)
    console.log('Creating matches...');
    const now = new Date();
    const createdMatches = [];
    
    // Past matches (completed) - use future dates so they appear at top of list
    for (let i = 0; i < 3; i++) {
      const matchDate = new Date(now);
      matchDate.setMonth(matchDate.getMonth() + 2); // 2 months in future
      matchDate.setDate(matchDate.getDate() - (i + 1)); // stagger by days
      
      const match = await Match.create({
        matchId: generateMatchId(),
        date: matchDate,
        time: randomItem(['09:00', '14:00', '18:00']),
        slot: randomItem(['morning', 'evening']),
        opponent: randomItem(opponents),
        ground: randomItem(grounds),
        status: 'completed',
        createdBy: new mongoose.Types.ObjectId(),
        notes: TEST_DATA_MARKER,
        availabilitySent: true,
        availabilitySentAt: new Date(matchDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        totalPlayersRequested: 15,
        confirmedPlayers: randomInRange(10, 13),
        declinedPlayers: randomInRange(1, 3),
        tentativePlayers: randomInRange(0, 2),
        noResponsePlayers: randomInRange(0, 2),
        squadStatus: 'full'
      });
      createdMatches.push(match);
      results.matches++;
    }

    // Current/upcoming matches (confirmed) - use future dates
    for (let i = 0; i < 2; i++) {
      const matchDate = new Date(now);
      matchDate.setMonth(matchDate.getMonth() + 2); // 2 months in future
      matchDate.setDate(matchDate.getDate() + (i + 5)); // stagger after completed matches
      
      const match = await Match.create({
        matchId: generateMatchId(),
        date: matchDate,
        time: randomItem(['09:00', '14:00', '18:00']),
        slot: randomItem(['morning', 'evening']),
        opponent: randomItem(opponents),
        ground: randomItem(grounds),
        status: 'confirmed',
        createdBy: new mongoose.Types.ObjectId(),
        notes: TEST_DATA_MARKER,
        availabilitySent: true,
        availabilitySentAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        totalPlayersRequested: 15,
        confirmedPlayers: randomInRange(8, 11),
        declinedPlayers: randomInRange(1, 2),
        tentativePlayers: randomInRange(1, 3),
        noResponsePlayers: randomInRange(1, 3),
        squadStatus: 'partial'
      });
      createdMatches.push(match);
      results.matches++;
    }

    // Draft match (future) - furthest in future so appears first
    const draftDate = new Date(now);
    draftDate.setMonth(draftDate.getMonth() + 3); // 3 months in future
    const futureMatch = await Match.create({
      matchId: generateMatchId(),
      date: draftDate,
      time: '16:00',
      slot: 'evening',
      opponent: randomItem(opponents),
      ground: randomItem(grounds),
      status: 'draft',
      createdBy: new mongoose.Types.ObjectId(),
      notes: TEST_DATA_MARKER,
      availabilitySent: false,
      totalPlayersRequested: 0,
      squadStatus: 'pending'
    });
    createdMatches.push(futureMatch);
    results.matches++;

    console.log(`✓ Created ${results.matches} matches`);

    // 3. Create Availability records AND populate Match squad array
    console.log('Creating availability records...');
    
    for (const match of createdMatches) {
      if (match.status === 'draft') continue; // Skip draft matches
      
      // Shuffle players and assign different responses
      const shuffledPlayers = [...createdPlayers].sort(() => Math.random() - 0.5);
      
      // Track counts for this match
      let yesCount = 0, noCount = 0, tentativeCount = 0, pendingCount = 0;
      
      // Build squad array for Match model
      const squadArray = [];
      
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const player = shuffledPlayers[i];
        let response;
        
        // Distribute responses based on match status
        if (match.status === 'completed') {
          // Completed matches: High yes, low no/tentative, no pending
          if (i < 11) response = 'yes';
          else if (i < 13) response = 'no';
          else response = 'tentative';
        } else {
          // Confirmed/upcoming matches: More varied responses
          if (i < 8) response = 'yes';
          else if (i < 10) response = 'no';
          else if (i < 12) response = 'tentative';
          else response = 'pending';
        }
        
        // Track counts
        if (response === 'yes') yesCount++;
        else if (response === 'no') noCount++;
        else if (response === 'tentative') tentativeCount++;
        else if (response === 'pending') pendingCount++;
        
        // Add to squad array for Match model
        squadArray.push({
          player: player._id,
          response: response,
          respondedAt: response !== 'pending' ? new Date() : null,
          notes: ''
        });
        
        // Also create Availability record (for detailed tracking)
        try {
          await Availability.create({
            matchId: match._id,
            playerId: player._id,
            playerName: player.name,
            playerPhone: player.phone,
            response: response,
            respondedAt: response !== 'pending' ? new Date() : null,
            status: response !== 'pending' ? 'responded' : 'sent',
            messageContent: TEST_DATA_MARKER
          });
          results.availabilities++;
        } catch (err) {
          // Skip duplicates
          if (err.code !== 11000) console.error('Availability error:', err.message);
        }
      }
      
      // Update match with squad array and counts
      match.squad = squadArray;
      match.totalPlayersRequested = shuffledPlayers.length;
      match.confirmedPlayers = yesCount;
      match.declinedPlayers = noCount;
      match.tentativePlayers = tentativeCount;
      match.noResponsePlayers = pendingCount;
      match.squadStatus = yesCount >= 11 ? 'full' : yesCount >= 8 ? 'partial' : 'pending';
      match.availabilitySent = true;
      match.availabilitySentAt = new Date(match.date.getTime() - 3 * 24 * 60 * 60 * 1000);
      await match.save();
      
      console.log(`   Match ${match.opponent}: ${yesCount} yes, ${noCount} no, ${tentativeCount} tentative, ${pendingCount} pending`);
    }
    console.log(`✓ Created ${results.availabilities} availability records`);

    // 4. Create Feedback for completed matches
    console.log('Creating feedback records...');
    const completedMatches = createdMatches.filter(m => m.status === 'completed');
    
    for (const match of completedMatches) {
      // Create 3-5 feedback entries per completed match
      const feedbackCount = randomInRange(3, 5);
      const feedbackPlayers = [...createdPlayers].sort(() => Math.random() - 0.5).slice(0, feedbackCount);
      
      for (const player of feedbackPlayers) {
        await Feedback.create({
          playerName: player.name,
          matchDate: match.date,
          batting: randomInRange(2, 5),
          bowling: randomInRange(2, 5),
          fielding: randomInRange(2, 5),
          teamSpirit: randomInRange(3, 5),
          feedbackText: randomItem(feedbackTexts),
          issues: {
            venue: Math.random() < 0.2,
            equipment: Math.random() < 0.15,
            timing: Math.random() < 0.1,
            umpiring: Math.random() < 0.25,
            other: Math.random() < 0.1
          },
          additionalComments: TEST_DATA_MARKER
        });
        results.feedbacks++;
      }
    }
    console.log(`✓ Created ${results.feedbacks} feedback records`);

    // 5. Create WhatsApp Messages (conversations)
    console.log('Creating WhatsApp messages...');
    const systemPhone = process.env.WHATSAPP_PHONE_NUMBER || '+919999999999';
    
    for (const match of createdMatches) {
      if (match.status === 'draft') continue;
      
      const matchAvailabilities = await Availability.find({ matchId: match._id });
      
      for (const avail of matchAvailabilities.slice(0, 10)) { // Limit messages per match
        const template = randomItem(conversationTemplates);
        const player = createdPlayers.find(p => p._id.toString() === avail.playerId.toString());
        if (!player) continue;
        
        // Outgoing message (availability request)
        const outgoingText = template.outgoing
          .replace('{name}', player.name.split(' ')[0])
          .replace('{date}', match.date.toLocaleDateString())
          .replace('{ground}', match.ground)
          .replace('{opponent}', match.opponent)
          .replace('{amount}', '500');
        
        await Message.create({
          organizationId: match.organizationId, // Multi-tenant isolation
          from: systemPhone,
          to: player.phone,
          text: outgoingText + ' ' + TEST_DATA_MARKER,
          direction: 'outgoing',
          messageId: `test_out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'delivered',
          timestamp: new Date(match.date.getTime() - 3 * 24 * 60 * 60 * 1000),
          matchId: match._id,
          matchTitle: `vs ${match.opponent}`,
          messageType: template.outgoing.includes('Payment') ? 'payment_request' : 'availability_request',
          playerId: player._id,
          playerName: player.name
        });
        results.messages++;
        
        // Incoming response (if player responded)
        if (avail.response !== 'pending') {
          let responseText = template.incoming;
          if (avail.response === 'yes') responseText = randomItem(['Yes, I will be there!', 'Count me in!', 'Confirmed!', 'Yes']);
          else if (avail.response === 'no') responseText = randomItem(['Sorry, cannot make it.', 'No', 'Will miss this one.']);
          else if (avail.response === 'tentative') responseText = randomItem(['Maybe, will confirm later.', 'Tentative', 'Not sure yet.']);
          
          await Message.create({
            organizationId: match.organizationId, // Multi-tenant isolation
            from: player.phone,
            to: systemPhone,
            text: responseText + ' ' + TEST_DATA_MARKER,
            direction: 'incoming',
            messageId: `test_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'received',
            timestamp: new Date(match.date.getTime() - 2.5 * 24 * 60 * 60 * 1000),
            matchId: match._id,
            matchTitle: `vs ${match.opponent}`,
            messageType: 'availability_response',
            playerId: player._id,
            playerName: player.name,
            availabilityId: avail._id
          });
          results.messages++;
        }
      }
    }
    console.log(`✓ Created ${results.messages} messages`);

    // 6. Create Payment records for completed matches
    console.log('Creating payment records...');
    for (const match of completedMatches) {
      const matchAvailabilities = await Availability.find({ 
        matchId: match._id, 
        response: 'yes' 
      });
      
      const squadMembers = matchAvailabilities.slice(0, 11).map((avail, idx) => {
        const statuses = ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'due', 'due'];
        return {
          playerId: avail.playerId,
          playerName: avail.playerName,
          playerPhone: avail.playerPhone,
          calculatedAmount: 500,
          adjustedAmount: null,
          paymentStatus: statuses[idx] || 'pending',
          messageSentAt: new Date(),
          paidAt: statuses[idx] === 'paid' ? new Date() : null
        };
      });

      if (squadMembers.length > 0) {
        await MatchPayment.create({
          matchId: match._id,
          totalAmount: 5500,
          squadMembers: squadMembers,
          notes: TEST_DATA_MARKER,
          createdBy: new mongoose.Types.ObjectId()
        });
        results.payments++;

        // Create payment-related messages
        for (const member of squadMembers.slice(0, 5)) {
          // Payment request message
          await Message.create({
            organizationId: match.organizationId, // Multi-tenant isolation
            from: systemPhone,
            to: member.playerPhone,
            text: `Hi ${member.playerName.split(' ')[0]}! Payment of ₹${member.calculatedAmount} is pending for the match vs ${match.opponent}. Please pay via UPI. ${TEST_DATA_MARKER}`,
            direction: 'outgoing',
            messageId: `test_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'delivered',
            timestamp: new Date(),
            matchId: match._id,
            matchTitle: `vs ${match.opponent}`,
            messageType: 'payment_request',
            playerId: member.playerId,
            playerName: member.playerName
          });
          results.messages++;

          // Payment confirmation (for paid members)
          if (member.paymentStatus === 'paid') {
            await Message.create({
              organizationId: match.organizationId, // Multi-tenant isolation
              from: member.playerPhone,
              to: systemPhone,
              text: `Payment done! Here is the screenshot. ${TEST_DATA_MARKER}`,
              direction: 'incoming',
              messageId: `test_pay_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              status: 'received',
              timestamp: new Date(),
              matchId: match._id,
              matchTitle: `vs ${match.opponent}`,
              messageType: 'payment_screenshot',
              playerId: member.playerId,
              playerName: member.playerName
            });
            results.messages++;
          }
        }
      }
    }
    console.log(`✓ Created ${results.payments} payment records`);

    console.log('🎉 Test data generation complete!');
    
    res.json({
      success: true,
      message: 'Test data generated successfully',
      results,
      marker: TEST_DATA_MARKER
    });

  } catch (error) {
    console.error('Error generating test data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/seed/cleanup
 * Remove all test data
 */
router.delete('/cleanup', async (req, res) => {
  try {
    console.log('🧹 Starting test data cleanup...');
    
    const results = {
      players: 0,
      matches: 0,
      availabilities: 0,
      feedbacks: 0,
      messages: 0,
      payments: 0
    };

    // Delete messages with test marker
    const messagesDeleted = await Message.deleteMany({
      text: { $regex: TEST_DATA_MARKER }
    });
    results.messages = messagesDeleted.deletedCount;
    console.log(`✓ Deleted ${results.messages} messages`);

    // Delete availabilities with test marker
    const availabilitiesDeleted = await Availability.deleteMany({
      messageContent: TEST_DATA_MARKER
    });
    results.availabilities = availabilitiesDeleted.deletedCount;
    console.log(`✓ Deleted ${results.availabilities} availabilities`);

    // Delete feedbacks with test marker
    const feedbacksDeleted = await Feedback.deleteMany({
      additionalComments: TEST_DATA_MARKER
    });
    results.feedbacks = feedbacksDeleted.deletedCount;
    console.log(`✓ Deleted ${results.feedbacks} feedbacks`);

    // Delete payments with test marker
    const paymentsDeleted = await MatchPayment.deleteMany({
      notes: TEST_DATA_MARKER
    });
    results.payments = paymentsDeleted.deletedCount;
    console.log(`✓ Deleted ${results.payments} payments`);

    // Delete matches with test marker
    const matchesDeleted = await Match.deleteMany({
      notes: TEST_DATA_MARKER
    });
    results.matches = matchesDeleted.deletedCount;
    console.log(`✓ Deleted ${results.matches} matches`);

    // Delete players with test marker
    const playersDeleted = await Player.deleteMany({
      notes: TEST_DATA_MARKER
    });
    results.players = playersDeleted.deletedCount;
    console.log(`✓ Deleted ${results.players} players`);

    console.log('🎉 Test data cleanup complete!');

    res.json({
      success: true,
      message: 'Test data cleaned up successfully',
      results
    });

  } catch (error) {
    console.error('Error cleaning up test data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/seed/status
 * Check how much test data exists
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      players: await Player.countDocuments({ notes: TEST_DATA_MARKER }),
      matches: await Match.countDocuments({ notes: TEST_DATA_MARKER }),
      availabilities: await Availability.countDocuments({ messageContent: TEST_DATA_MARKER }),
      feedbacks: await Feedback.countDocuments({ additionalComments: TEST_DATA_MARKER }),
      messages: await Message.countDocuments({ text: { $regex: TEST_DATA_MARKER } }),
      payments: await MatchPayment.countDocuments({ notes: TEST_DATA_MARKER })
    };

    const total = Object.values(status).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      hasTestData: total > 0,
      totalRecords: total,
      breakdown: status,
      marker: TEST_DATA_MARKER
    });

  } catch (error) {
    console.error('Error checking test data status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
