#!/usr/bin/env node

/**
 * Migration: Fix matchId Index
 * 
 * Drops the old global unique index on matchId and ensures
 * the correct compound index (organizationId + matchId) exists.
 * 
 * This migration runs automatically on application startup.
 */

const mongoose = require('mongoose');

async function runMigration() {
  const migrationName = '001-fix-matchid-index';
  console.log(`[Migration] Running: ${migrationName}`);
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('matches');
    
    // Get current indexes
    const indexes = await collection.indexes();
    const indexNames = indexes.map(idx => idx.name);
    
    console.log(`[Migration] Current indexes: ${indexNames.join(', ')}`);
    
    // Check if old global unique index exists
    const oldIndexExists = indexNames.includes('matchId_1');
    
    if (oldIndexExists) {
      console.log(`[Migration] Dropping old global unique index: matchId_1`);
      await collection.dropIndex('matchId_1');
      console.log(`[Migration] ✓ Dropped old index`);
    } else {
      console.log(`[Migration] ✓ Old index 'matchId_1' does not exist (already dropped)`);
    }
    
    // Check if compound index exists
    const compoundIndexExists = indexNames.includes('organizationId_1_matchId_1');
    
    if (!compoundIndexExists) {
      console.log(`[Migration] Creating compound index: organizationId_1_matchId_1`);
      await collection.createIndex(
        { organizationId: 1, matchId: 1 },
        { unique: true, sparse: true, name: 'organizationId_1_matchId_1' }
      );
      console.log(`[Migration] ✓ Created compound index`);
    } else {
      console.log(`[Migration] ✓ Compound index already exists`);
    }
    
    console.log(`[Migration] ✓ ${migrationName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`[Migration] ✗ ${migrationName} failed:`, error.message);
    // Don't throw - allow app to start even if migration fails
    // This prevents deployment failures due to migration issues
    return false;
  }
}

module.exports = { runMigration };
