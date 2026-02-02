#!/usr/bin/env node

/**
 * Migration Script: Add organizationId to New Tenant-Scoped Collections
 * 
 * This script migrates existing documents in 5 collections that previously
 * did not have organizationId to include the proper organization reference.
 * 
 * Collections to migrate:
 * 1. feedbacklinks - derives organizationId from related Match
 * 2. publiclinks - derives organizationId from related Match or MatchPayment
 * 3. templateratelimits - derives organizationId from related Player
 * 4. whatsappsessions - derives organizationId from related Player
 * 5. paymentscreenshots - derives organizationId from related Player
 * 
 * Usage:
 *   DRY_RUN=true node scripts/migrate-orgid-to-new-collections.js    # Preview changes
 *   node scripts/migrate-orgid-to-new-collections.js                  # Apply changes
 * 
 * Environment:
 *   MONGODB_URI - MongoDB connection string
 *   DEFAULT_ORG_ID - Default organization ID for fallback (optional)
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || '697edef86754947859d3a018'; // Mavericks XI

// Logging helpers
const log = {
  info: (msg) => console.log(`ℹ ${msg}`),
  success: (msg) => console.log(`✓ ${msg}`),
  warning: (msg) => console.log(`⚠ ${msg}`),
  error: (msg) => console.log(`✗ ${msg}`),
  section: (msg) => console.log(`\n═══ ${msg} ═══`),
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  // Ensure we're not connecting to admin database
  if (uri.includes('/admin?')) {
    throw new Error('Cannot run migration against admin database. Please use your application database.');
  }

  await mongoose.connect(uri);
  const dbName = mongoose.connection.db.databaseName;
  log.success(`Connected to MongoDB: ${dbName}`);
  return mongoose.connection.db;
}

/**
 * Migrate FeedbackLinks - derive organizationId from Match
 */
async function migrateFeedbackLinks(db) {
  log.section('Migrating FeedbackLinks');
  
  const collection = db.collection('feedbacklinks');
  const matchCollection = db.collection('matches');
  
  // Find documents without organizationId
  const docsToMigrate = await collection.find({
    $or: [
      { organizationId: { $exists: false } },
      { organizationId: null }
    ]
  }).toArray();
  
  log.info(`Found ${docsToMigrate.length} feedbacklinks without organizationId`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const doc of docsToMigrate) {
    try {
      // Get organizationId from related Match
      const match = await matchCollection.findOne({ _id: doc.matchId });
      const organizationId = match?.organizationId || new mongoose.Types.ObjectId(DEFAULT_ORG_ID);
      
      if (DRY_RUN) {
        log.info(`[DRY RUN] Would set organizationId=${organizationId} for feedbacklink ${doc._id}`);
        migrated++;
      } else {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { organizationId } }
        );
        migrated++;
      }
    } catch (err) {
      log.error(`Failed to migrate feedbacklink ${doc._id}: ${err.message}`);
      failed++;
    }
  }
  
  log.success(`FeedbackLinks: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

/**
 * Migrate PublicLinks - derive organizationId from Match or MatchPayment
 */
async function migratePublicLinks(db) {
  log.section('Migrating PublicLinks');
  
  const collection = db.collection('publiclinks');
  const matchCollection = db.collection('matches');
  const paymentCollection = db.collection('matchpayments');
  
  // Find documents without organizationId
  const docsToMigrate = await collection.find({
    $or: [
      { organizationId: { $exists: false } },
      { organizationId: null }
    ]
  }).toArray();
  
  log.info(`Found ${docsToMigrate.length} publiclinks without organizationId`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const doc of docsToMigrate) {
    try {
      let organizationId = null;
      
      if (doc.resourceType === 'match') {
        const match = await matchCollection.findOne({ _id: doc.resourceId });
        organizationId = match?.organizationId;
      } else if (doc.resourceType === 'payment') {
        const payment = await paymentCollection.findOne({ _id: doc.resourceId });
        organizationId = payment?.organizationId;
      }
      
      organizationId = organizationId || new mongoose.Types.ObjectId(DEFAULT_ORG_ID);
      
      if (DRY_RUN) {
        log.info(`[DRY RUN] Would set organizationId=${organizationId} for publiclink ${doc._id}`);
        migrated++;
      } else {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { organizationId } }
        );
        migrated++;
      }
    } catch (err) {
      log.error(`Failed to migrate publiclink ${doc._id}: ${err.message}`);
      failed++;
    }
  }
  
  log.success(`PublicLinks: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

/**
 * Migrate TemplateRateLimits - derive organizationId from Player
 */
async function migrateTemplateRateLimits(db) {
  log.section('Migrating TemplateRateLimits');
  
  const collection = db.collection('templateratelimits');
  const playerCollection = db.collection('players');
  
  // Find documents without organizationId
  const docsToMigrate = await collection.find({
    $or: [
      { organizationId: { $exists: false } },
      { organizationId: null }
    ]
  }).toArray();
  
  log.info(`Found ${docsToMigrate.length} templateratelimits without organizationId`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const doc of docsToMigrate) {
    try {
      let organizationId = null;
      
      // Try to find org from playerId
      if (doc.playerId) {
        const player = await playerCollection.findOne({ _id: doc.playerId });
        organizationId = player?.organizationId;
      }
      
      // Try to find org from phone number
      if (!organizationId && doc.phone) {
        const player = await playerCollection.findOne({ phone: doc.phone });
        organizationId = player?.organizationId;
      }
      
      organizationId = organizationId || new mongoose.Types.ObjectId(DEFAULT_ORG_ID);
      
      if (DRY_RUN) {
        log.info(`[DRY RUN] Would set organizationId=${organizationId} for templateratelimit ${doc._id}`);
        migrated++;
      } else {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { organizationId } }
        );
        migrated++;
      }
    } catch (err) {
      log.error(`Failed to migrate templateratelimit ${doc._id}: ${err.message}`);
      failed++;
    }
  }
  
  log.success(`TemplateRateLimits: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

/**
 * Migrate WhatsAppSessions - derive organizationId from Player
 */
async function migrateWhatsAppSessions(db) {
  log.section('Migrating WhatsAppSessions');
  
  const collection = db.collection('whatsappsessions');
  const playerCollection = db.collection('players');
  
  // Find documents without organizationId
  const docsToMigrate = await collection.find({
    $or: [
      { organizationId: { $exists: false } },
      { organizationId: null }
    ]
  }).toArray();
  
  log.info(`Found ${docsToMigrate.length} whatsappsessions without organizationId`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const doc of docsToMigrate) {
    try {
      let organizationId = null;
      
      // Try to find org from playerId
      if (doc.playerId) {
        const player = await playerCollection.findOne({ _id: doc.playerId });
        organizationId = player?.organizationId;
      }
      
      // Try to find org from phone number
      if (!organizationId && doc.phone) {
        const player = await playerCollection.findOne({ phone: doc.phone });
        organizationId = player?.organizationId;
      }
      
      organizationId = organizationId || new mongoose.Types.ObjectId(DEFAULT_ORG_ID);
      
      if (DRY_RUN) {
        log.info(`[DRY RUN] Would set organizationId=${organizationId} for whatsappsession ${doc._id}`);
        migrated++;
      } else {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { organizationId } }
        );
        migrated++;
      }
    } catch (err) {
      log.error(`Failed to migrate whatsappsession ${doc._id}: ${err.message}`);
      failed++;
    }
  }
  
  log.success(`WhatsAppSessions: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

/**
 * Migrate PaymentScreenshots - derive organizationId from Player
 */
async function migratePaymentScreenshots(db) {
  log.section('Migrating PaymentScreenshots');
  
  const collection = db.collection('paymentscreenshots');
  const playerCollection = db.collection('players');
  
  // Find documents without organizationId
  const docsToMigrate = await collection.find({
    $or: [
      { organizationId: { $exists: false } },
      { organizationId: null }
    ]
  }).toArray();
  
  log.info(`Found ${docsToMigrate.length} paymentscreenshots without organizationId`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const doc of docsToMigrate) {
    try {
      let organizationId = null;
      
      // Try to find org from playerId
      if (doc.playerId) {
        const player = await playerCollection.findOne({ _id: doc.playerId });
        organizationId = player?.organizationId;
      }
      
      // Try to find org from playerPhone
      if (!organizationId && doc.playerPhone) {
        const player = await playerCollection.findOne({ phone: doc.playerPhone });
        organizationId = player?.organizationId;
      }
      
      organizationId = organizationId || new mongoose.Types.ObjectId(DEFAULT_ORG_ID);
      
      if (DRY_RUN) {
        log.info(`[DRY RUN] Would set organizationId=${organizationId} for paymentscreenshot ${doc._id}`);
        migrated++;
      } else {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { organizationId } }
        );
        migrated++;
      }
    } catch (err) {
      log.error(`Failed to migrate paymentscreenshot ${doc._id}: ${err.message}`);
      failed++;
    }
  }
  
  log.success(`PaymentScreenshots: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

/**
 * Verify migration results
 */
async function verifyMigration(db) {
  log.section('Verification');
  
  const collections = [
    'feedbacklinks',
    'publiclinks',
    'templateratelimits',
    'whatsappsessions',
    'paymentscreenshots',
  ];
  
  let allPassed = true;
  
  for (const collName of collections) {
    const coll = db.collection(collName);
    const missingOrgId = await coll.countDocuments({
      $or: [
        { organizationId: { $exists: false } },
        { organizationId: null }
      ]
    });
    
    if (missingOrgId > 0) {
      log.warning(`${collName}: ${missingOrgId} documents still missing organizationId`);
      allPassed = false;
    } else {
      log.success(`${collName}: All documents have organizationId`);
    }
  }
  
  return allPassed;
}

/**
 * Main migration function
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Migrate organizationId to New Tenant-Scoped Collections     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  if (DRY_RUN) {
    log.warning('DRY RUN MODE - No changes will be made');
  }
  
  log.info(`Default Organization ID: ${DEFAULT_ORG_ID}`);
  
  try {
    const db = await connectDB();
    
    // Run migrations
    const results = {
      feedbacklinks: await migrateFeedbackLinks(db),
      publiclinks: await migratePublicLinks(db),
      templateratelimits: await migrateTemplateRateLimits(db),
      whatsappsessions: await migrateWhatsAppSessions(db),
      paymentscreenshots: await migratePaymentScreenshots(db),
    };
    
    // Verify
    const allPassed = await verifyMigration(db);
    
    // Summary
    log.section('Migration Summary');
    
    let totalMigrated = 0;
    let totalFailed = 0;
    
    for (const [collection, result] of Object.entries(results)) {
      console.log(`   ${collection}: ${result.migrated} migrated, ${result.failed} failed`);
      totalMigrated += result.migrated;
      totalFailed += result.failed;
    }
    
    console.log('');
    log.info(`Total documents migrated: ${totalMigrated}`);
    log.info(`Total failures: ${totalFailed}`);
    
    if (DRY_RUN) {
      log.warning('DRY RUN - To apply changes, run without DRY_RUN=true');
    } else if (allPassed) {
      log.success('Migration completed successfully!');
    } else {
      log.warning('Migration completed with some documents still missing organizationId');
    }
    
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.info('Disconnected from MongoDB');
  }
}

// Run migration
main();
