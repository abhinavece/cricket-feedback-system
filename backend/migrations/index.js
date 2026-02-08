/**
 * Migration Runner
 * 
 * Automatically runs all pending migrations on application startup.
 * Migrations are run in order based on their filename prefix.
 */

const mongoose = require('mongoose');

// Import all migrations
const migrations = [
  require('./001-fix-matchid-index'),
  // Add more migrations here as needed
];

/**
 * Run all migrations
 * This should be called after MongoDB connection is established
 */
async function runMigrations() {
  console.log('[Migrations] Starting migration runner...');
  
  if (mongoose.connection.readyState !== 1) {
    console.log('[Migrations] ⚠️  MongoDB not connected, skipping migrations');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of migrations) {
    try {
      const success = await migration.runMigration();
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error('[Migrations] Unexpected error:', error);
      failCount++;
    }
  }
  
  console.log(`[Migrations] Completed: ${successCount} successful, ${failCount} failed`);
  
  // Don't throw errors - allow app to start even if migrations fail
  // This prevents deployment failures
}

module.exports = { runMigrations };
