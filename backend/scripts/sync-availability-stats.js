/**
 * Migration script to sync match availability statistics
 * This ensures consistency between Availability collection and Match statistics
 * Runs automatically on backend startup
 */

const mongoose = require('mongoose');

const syncAvailabilityStats = async () => {
  try {
    console.log('[Migration] Starting availability stats sync...');
    
    const Match = mongoose.model('Match');
    const Availability = mongoose.model('Availability');
    
    // Find all matches that have availabilitySent = true
    const matches = await Match.find({ availabilitySent: true });
    
    console.log(`[Migration] Found ${matches.length} matches with availability tracking`);
    
    let updatedCount = 0;
    
    for (const match of matches) {
      // Get actual availability stats from Availability collection
      const availabilities = await Availability.find({ matchId: match._id });
      
      const stats = {
        totalPlayersRequested: availabilities.length,
        confirmedPlayers: availabilities.filter(a => a.response === 'yes').length,
        declinedPlayers: availabilities.filter(a => a.response === 'no').length,
        tentativePlayers: availabilities.filter(a => a.response === 'tentative').length,
        noResponsePlayers: availabilities.filter(a => a.response === 'pending').length
      };
      
      // Check if stats are different
      const needsUpdate = 
        match.totalPlayersRequested !== stats.totalPlayersRequested ||
        match.confirmedPlayers !== stats.confirmedPlayers ||
        match.declinedPlayers !== stats.declinedPlayers ||
        match.tentativePlayers !== stats.tentativePlayers ||
        match.noResponsePlayers !== stats.noResponsePlayers;
      
      if (needsUpdate) {
        await Match.findByIdAndUpdate(match._id, {
          $set: {
            totalPlayersRequested: stats.totalPlayersRequested,
            confirmedPlayers: stats.confirmedPlayers,
            declinedPlayers: stats.declinedPlayers,
            tentativePlayers: stats.tentativePlayers,
            noResponsePlayers: stats.noResponsePlayers,
            lastAvailabilityUpdate: new Date()
          }
        });
        
        console.log(`[Migration] Updated match ${match.matchId}: ${JSON.stringify(stats)}`);
        updatedCount++;
      }
    }
    
    console.log(`[Migration] Availability stats sync complete. Updated ${updatedCount}/${matches.length} matches.`);
    return { success: true, updated: updatedCount, total: matches.length };
  } catch (error) {
    console.error('[Migration] Error syncing availability stats:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { syncAvailabilityStats };
