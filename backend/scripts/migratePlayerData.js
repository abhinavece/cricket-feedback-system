/**
 * Migration Script: Clean up duplicate players and fix references
 * 
 * This script:
 * 1. Finds all duplicate players by phone number
 * 2. Keeps the oldest player record as the canonical one
 * 3. Updates all MatchPayment references to use the canonical player
 * 4. Deletes duplicate player records
 * 5. Ensures all MatchPayment squadMembers have valid playerId references
 * 
 * Usage: node scripts/migratePlayerData.js
 * 
 * IMPORTANT: Run this script AFTER deploying the updated code with unique phone constraint
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Player = require('../models/Player');
const MatchPayment = require('../models/MatchPayment');
const { formatPhoneNumber } = require('../services/playerService');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-feedback';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Step 1: Find and merge duplicate players (including those that will become duplicates after normalization)
const mergeDuplicatePlayers = async () => {
  console.log('\n📋 Step 1: Finding duplicate players by phone number...');
  
  // First, get all players and normalize their phones to find potential duplicates
  const allPlayers = await Player.find({});
  const phoneMap = new Map(); // normalized phone -> array of player records
  
  for (const player of allPlayers) {
    const normalizedPhone = formatPhoneNumber(player.phone);
    if (!phoneMap.has(normalizedPhone)) {
      phoneMap.set(normalizedPhone, []);
    }
    phoneMap.get(normalizedPhone).push({
      id: player._id,
      name: player.name,
      phone: player.phone,
      createdAt: player.createdAt,
      isActive: player.isActive
    });
  }
  
  // Find duplicates (normalized phone has multiple records)
  const duplicates = Array.from(phoneMap.entries())
    .filter(([phone, players]) => players.length > 1)
    .map(([phone, players]) => ({ _id: phone, players, count: players.length }));
  
  console.log(`   Found ${duplicates.length} phone numbers with duplicates (after normalization)`);
  
  const mergeMap = new Map(); // Map of duplicate playerId -> canonical playerId
  
  for (const dup of duplicates) {
    // Sort by createdAt to keep the oldest one (or the active one)
    const sorted = dup.players.sort((a, b) => {
      // Prefer active players
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      // Then prefer older records
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    const canonical = sorted[0];
    const duplicatesToMerge = sorted.slice(1);
    
    console.log(`   Phone ${dup._id}: Keeping "${canonical.name}" (${canonical.id}), merging ${duplicatesToMerge.length} duplicates`);
    
    for (const duplicate of duplicatesToMerge) {
      mergeMap.set(duplicate.id.toString(), canonical.id.toString());
      console.log(`      - Merging "${duplicate.name}" (${duplicate.phone}) -> ${canonical.id}`);
    }
  }
  
  return mergeMap;
};

// Step 2: Update MatchPayment references
const updatePaymentReferences = async (mergeMap) => {
  console.log('\n📋 Step 2: Updating MatchPayment references...');
  
  const payments = await MatchPayment.find({});
  let updatedCount = 0;
  let memberUpdatedCount = 0;
  
  for (const payment of payments) {
    let paymentModified = false;
    
    for (const member of payment.squadMembers) {
      // Check if playerId needs to be updated (was a duplicate)
      if (member.playerId && mergeMap.has(member.playerId.toString())) {
        const canonicalId = mergeMap.get(member.playerId.toString());
        console.log(`   Payment ${payment._id}: Updating member ${member.playerName} playerId from ${member.playerId} to ${canonicalId}`);
        member.playerId = new mongoose.Types.ObjectId(canonicalId);
        paymentModified = true;
        memberUpdatedCount++;
      }
      
      // If playerId is null, try to find the player by phone
      if (!member.playerId && member.playerPhone) {
        const formattedPhone = formatPhoneNumber(member.playerPhone);
        const player = await Player.findOne({ phone: formattedPhone, isActive: true });
        
        if (player) {
          console.log(`   Payment ${payment._id}: Setting missing playerId for ${member.playerName} to ${player._id}`);
          member.playerId = player._id;
          member.playerName = player.name; // Update name to match player record
          member.playerPhone = player.phone; // Update phone to formatted version
          paymentModified = true;
          memberUpdatedCount++;
        } else {
          // Create new player if doesn't exist
          try {
            const newPlayer = await Player.create({
              name: member.playerName,
              phone: formattedPhone,
              role: 'player',
              team: 'Mavericks XI',
              isActive: true
            });
            console.log(`   Payment ${payment._id}: Created new player ${member.playerName} (${newPlayer._id})`);
            member.playerId = newPlayer._id;
            member.playerPhone = formattedPhone;
            paymentModified = true;
            memberUpdatedCount++;
          } catch (err) {
            // Player might already exist (race condition), try to find again
            const existingPlayer = await Player.findOne({ phone: formattedPhone });
            if (existingPlayer) {
              member.playerId = existingPlayer._id;
              member.playerName = existingPlayer.name;
              member.playerPhone = existingPlayer.phone;
              paymentModified = true;
              memberUpdatedCount++;
            } else {
              console.error(`   ⚠️ Failed to create/find player for ${member.playerName}: ${err.message}`);
            }
          }
        }
      }
    }
    
    if (paymentModified) {
      await payment.save();
      updatedCount++;
    }
  }
  
  console.log(`   Updated ${updatedCount} payments with ${memberUpdatedCount} member references`);
};

// Step 3: Delete duplicate players
const deleteDuplicatePlayers = async (mergeMap) => {
  console.log('\n📋 Step 3: Deleting duplicate player records...');
  
  const duplicateIds = Array.from(mergeMap.keys()).map(id => new mongoose.Types.ObjectId(id));
  
  if (duplicateIds.length === 0) {
    console.log('   No duplicates to delete');
    return;
  }
  
  const result = await Player.deleteMany({ _id: { $in: duplicateIds } });
  console.log(`   Deleted ${result.deletedCount} duplicate player records`);
};

// Step 4: Normalize all phone numbers
const normalizePhoneNumbers = async (mergeMap) => {
  console.log('\n📋 Step 4: Normalizing phone numbers...');
  
  const players = await Player.find({});
  let normalizedCount = 0;
  const duplicateIds = new Set(Array.from(mergeMap.keys()));
  
  for (const player of players) {
    // Skip players that were marked as duplicates (already deleted)
    if (duplicateIds.has(player._id.toString())) {
      continue;
    }
    
    const formattedPhone = formatPhoneNumber(player.phone);
    if (player.phone !== formattedPhone) {
      console.log(`   Normalizing ${player.name}: ${player.phone} -> ${formattedPhone}`);
      player.phone = formattedPhone;
      await player.save();
      normalizedCount++;
    }
  }
  
  console.log(`   Normalized ${normalizedCount} phone numbers`);
};

// Step 5: Verify data integrity
const verifyDataIntegrity = async () => {
  console.log('\n📋 Step 5: Verifying data integrity...');
  
  // Check for remaining duplicates
  const duplicates = await Player.aggregate([
    { $group: { _id: '$phone', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  if (duplicates.length > 0) {
    console.log(`   ⚠️ WARNING: ${duplicates.length} phone numbers still have duplicates!`);
    duplicates.forEach(d => console.log(`      ${d._id}: ${d.count} records`));
  } else {
    console.log('   ✅ No duplicate phone numbers found');
  }
  
  // Check for payments with null playerId
  const paymentsWithNullPlayerId = await MatchPayment.aggregate([
    { $unwind: '$squadMembers' },
    { $match: { 'squadMembers.playerId': null } },
    { $count: 'count' }
  ]);
  
  const nullCount = paymentsWithNullPlayerId[0]?.count || 0;
  if (nullCount > 0) {
    console.log(`   ⚠️ WARNING: ${nullCount} squad members still have null playerId`);
  } else {
    console.log('   ✅ All squad members have valid playerId references');
  }
  
  // Summary
  const totalPlayers = await Player.countDocuments({ isActive: true });
  const totalPayments = await MatchPayment.countDocuments({});
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total active players: ${totalPlayers}`);
  console.log(`   Total payments: ${totalPayments}`);
};

// Main migration function
const runMigration = async () => {
  console.log('🚀 Starting Player Data Migration...\n');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  try {
    // Step 1: Find duplicates and create merge map
    const mergeMap = await mergeDuplicatePlayers();
    
    // Step 2: Update payment references
    await updatePaymentReferences(mergeMap);
    
    // Step 3: Delete duplicates
    await deleteDuplicatePlayers(mergeMap);
    
    // Step 4: Normalize phone numbers
    await normalizePhoneNumbers(mergeMap);
    
    // Step 5: Verify integrity
    await verifyDataIntegrity();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run the migration
runMigration();
