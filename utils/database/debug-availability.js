// Debug script to check availability tracking
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

const debugAvailability = async () => {
  await connectDB();

  // Check Matches collection
  const Match = require('./backend/models/Match');
  const Availability = require('./backend/models/Availability');
  const Message = require('./backend/models/Message');

  console.log('\n📊 === DEBUGGING AVAILABILITY TRACKING ===\n');

  // 1. Check recent matches
  console.log('1️⃣ Recent Matches:');
  const matches = await Match.find().sort({ createdAt: -1 }).limit(5);
  matches.forEach(match => {
    console.log(`\n  Match: ${match.matchId} - ${match.opponent}`);
    console.log(`  Date: ${match.date}`);
    console.log(`  Availability Sent: ${match.availabilitySent}`);
    console.log(`  Total Players Requested: ${match.totalPlayersRequested}`);
    console.log(`  Confirmed: ${match.confirmedPlayers}`);
    console.log(`  Declined: ${match.declinedPlayers}`);
    console.log(`  Tentative: ${match.tentativePlayers}`);
    console.log(`  No Response: ${match.noResponsePlayers}`);
    console.log(`  Squad Status: ${match.squadStatus}`);
    console.log(`  Last Update: ${match.lastAvailabilityUpdate}`);
  });

  // 2. Check availability records
  console.log('\n\n2️⃣ Availability Records:');
  const availabilities = await Availability.find().sort({ createdAt: -1 }).limit(10);
  console.log(`  Total Records: ${availabilities.length}`);
  availabilities.forEach(avail => {
    console.log(`\n  Player: ${avail.playerName} (${avail.playerPhone})`);
    console.log(`  Match ID: ${avail.matchId}`);
    console.log(`  Response: ${avail.response}`);
    console.log(`  Status: ${avail.status}`);
    console.log(`  Created: ${avail.createdAt}`);
    console.log(`  Responded: ${avail.respondedAt || 'Not yet'}`);
    console.log(`  Message Content: ${avail.messageContent || 'N/A'}`);
  });

  // 3. Check messages
  console.log('\n\n3️⃣ Recent Messages:');
  const messages = await Message.find().sort({ timestamp: -1 }).limit(10);
  console.log(`  Total Messages: ${messages.length}`);
  messages.forEach(msg => {
    console.log(`\n  Direction: ${msg.direction}`);
    console.log(`  From: ${msg.from}`);
    console.log(`  To: ${msg.to}`);
    console.log(`  Text: ${msg.text?.substring(0, 50)}...`);
    console.log(`  Match ID: ${msg.matchId || 'N/A'}`);
    console.log(`  Match Title: ${msg.matchTitle || 'N/A'}`);
    console.log(`  Message Type: ${msg.messageType || 'N/A'}`);
    console.log(`  Availability ID: ${msg.availabilityId || 'N/A'}`);
    console.log(`  Timestamp: ${msg.timestamp}`);
  });

  // 4. Check specific match availability
  if (matches.length > 0) {
    const latestMatch = matches[0];
    console.log(`\n\n4️⃣ Availability for Latest Match (${latestMatch.matchId}):`);
    const matchAvailabilities = await Availability.find({ matchId: latestMatch._id });
    console.log(`  Found ${matchAvailabilities.length} availability records`);
    matchAvailabilities.forEach(avail => {
      console.log(`    - ${avail.playerName}: ${avail.response} (${avail.status})`);
    });
  }

  console.log('\n\n✅ Debug Complete\n');
  process.exit(0);
};

debugAvailability().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
