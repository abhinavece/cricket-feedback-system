const mongoose = require('mongoose');

// Import models to ensure they are registered before migrations run
require('../models/Match');
require('../models/Availability');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-feedback');
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Run startup migrations
    await runStartupMigrations();
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('Continuing without database connection...');
  }
};

const runStartupMigrations = async () => {
  try {
    console.log('[Startup] Running migrations...');
    
    // Sync availability stats to fix any inconsistencies
    const { syncAvailabilityStats } = require('../scripts/sync-availability-stats');
    await syncAvailabilityStats();
    
    console.log('[Startup] Migrations complete');
  } catch (error) {
    console.error('[Startup] Migration error:', error);
    // Don't fail startup on migration errors
  }
};

module.exports = connectDB;
