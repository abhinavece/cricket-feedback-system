#!/usr/bin/env node

/**
 * Complete Migration Script: Migrate all data to Mavericks XI organization
 * 
 * Run: node backend/scripts/migrate-users-to-mavericks.js
 * 
 * Environment variables:
 * - MONGODB_URI: MongoDB connection string (use cricket-feedback database, NOT admin)
 * - DRY_RUN: Set to "true" to preview changes without applying
 * 
 * This script:
 * 1. Migrates users - Adds organizations[] array and activeOrganizationId
 * 2. Migrates data collections - Adds organizationId to:
 *    - players, matches, feedbacks, feedbacklinks, availabilities
 *    - messages, matchpayments, paymentscreenshots
 *    - publiclinks, templateratelimits, whatsappsessions
 *    - joinrequests, organizationinvites
 * 3. Updates organization stats (memberCount, playerCount, matchCount)
 * 4. Verifies migration completeness
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Mavericks XI Organization ID (from production database)
const MAVERICKS_ORG_ID = '697edef86754947859d3a018';

// Check for dry run mode
const DRY_RUN = process.env.DRY_RUN === 'true';

// Collections that need organizationId added (exact names from database)
const COLLECTIONS_TO_MIGRATE = [
  'players',
  'matches',
  'feedbacks',             // plural in DB
  'feedbacklinks',
  'availabilities',        // plural in DB
  'messages',
  'matchpayments',
  'paymentscreenshots',
  'publiclinks',
  'templateratelimits',
  'whatsappsessions',
  'joinrequests',          // already has orgId but include for safety
  'organizationinvites',   // already has orgId but include for safety
];

// Collections to skip (global/shared or use different structure)
const COLLECTIONS_TO_SKIP = [
  'organizations',  // The organization model itself
  'users',          // Uses organizations[] array instead
  'grounds',        // Global/shared across organizations
  'groundreviews',  // Linked to grounds (global)
  'systemsettings', // System-wide singleton
  'webhookproxyconfigs', // System-wide singleton
  'whatsappcostconfigs', // System-wide singleton
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
  dim: (msg) => console.log(`${colors.dim}  ${msg}${colors.reset}`),
};

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Complete Multi-Tenant Migration Script                   ║
║     Target: Mavericks XI Organization                        ║
╚══════════════════════════════════════════════════════════════╝
  `);

  if (DRY_RUN) {
    log.warn('DRY RUN MODE - No changes will be made to the database');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    log.error('MONGODB_URI environment variable is not set');
    log.info('Usage: export MONGODB_URI="mongodb+srv://...@.../cricket-feedback?..."');
    process.exit(1);
  }

  // Verify database name is not 'admin'
  if (uri.includes('/admin?') || uri.endsWith('/admin')) {
    log.error('MONGODB_URI points to "admin" database. Use your app database (e.g., cricket-feedback)');
    process.exit(1);
  }

  try {
    log.info('Connecting to MongoDB...');
    await mongoose.connect(uri);
    log.success(`Connected to MongoDB: ${mongoose.connection.name}`);

    const db = mongoose.connection.db;
    const orgId = new mongoose.Types.ObjectId(MAVERICKS_ORG_ID);

    // ═══════════════════════════════════════════════════════════════
    // Step 1: Verify organization exists
    // ═══════════════════════════════════════════════════════════════
    log.header('Step 1: Verify Organization');

    const orgsCollection = db.collection('organizations');
    const org = await orgsCollection.findOne({ _id: orgId });
    
    if (!org) {
      log.error(`Organization ${MAVERICKS_ORG_ID} not found!`);
      log.info('Please create the organization first');
      process.exit(1);
    }
    log.success(`Found organization: ${org.name} (${org.slug})`);
    log.dim(`Owner: ${org.ownerId}`);

    // ═══════════════════════════════════════════════════════════════
    // Step 2: Show current database stats
    // ═══════════════════════════════════════════════════════════════
    log.header('Step 2: Current Database Stats');

    const stats = {};
    const needsMigration = {};

    for (const collName of COLLECTIONS_TO_MIGRATE) {
      try {
        const coll = db.collection(collName);
        const total = await coll.countDocuments();
        const withOrgId = await coll.countDocuments({ organizationId: { $exists: true, $ne: null } });
        const withoutOrgId = await coll.countDocuments({ 
          $or: [
            { organizationId: { $exists: false } },
            { organizationId: null }
          ]
        });
        
        stats[collName] = { total, withOrgId, withoutOrgId };
        needsMigration[collName] = withoutOrgId;

        const status = withoutOrgId === 0 ? colors.green + '✓' : colors.yellow + '⚠';
        console.log(`  ${status}${colors.reset} ${collName}: ${total} total, ${withOrgId} with orgId, ${withoutOrgId} need migration`);
      } catch (err) {
        log.dim(`  ${collName}: Collection may not exist (${err.message})`);
        stats[collName] = { total: 0, withOrgId: 0, withoutOrgId: 0 };
        needsMigration[collName] = 0;
      }
    }

    const totalToMigrate = Object.values(needsMigration).reduce((a, b) => a + b, 0);
    console.log(`\n  ${colors.bright}Total documents to migrate: ${totalToMigrate}${colors.reset}`);

    if (totalToMigrate === 0) {
      log.success('All data collections are already migrated!');
    }

    // ═══════════════════════════════════════════════════════════════
    // Step 3: Migrate Users
    // ═══════════════════════════════════════════════════════════════
    log.header('Step 3: Migrate Users');

    const usersCollection = db.collection('users');
    const usersWithoutOrg = await usersCollection.find({
      $or: [
        { organizations: { $exists: false } },
        { organizations: { $size: 0 } },
        { organizations: null },
      ]
    }).toArray();

    log.info(`Found ${usersWithoutOrg.length} users without organizations`);

    let usersMigrated = 0;
    let usersErrors = 0;

    for (const user of usersWithoutOrg) {
      try {
        // Determine role based on existing role
        let orgRole = 'viewer';
        if (user.role === 'admin') {
          orgRole = org.ownerId?.equals(user._id) ? 'owner' : 'admin';
        } else if (user.role === 'editor') {
          orgRole = 'editor';
        }

        if (DRY_RUN) {
          log.dim(`[DRY RUN] Would migrate: ${user.email} as ${orgRole}`);
          usersMigrated++;
          continue;
        }

        // Create membership
        const membership = {
          organizationId: orgId,
          role: orgRole,
          playerId: user.playerId || null,
          joinedAt: user.createdAt || new Date(),
          invitedBy: null,
          status: 'active',
        };

        // Update user
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              organizations: [membership],
              activeOrganizationId: orgId,
            }
          }
        );

        log.success(`Migrated user: ${user.email} (${user.role} → ${orgRole})`);
        usersMigrated++;
      } catch (err) {
        log.error(`Failed to migrate user ${user.email}: ${err.message}`);
        usersErrors++;
      }
    }

    log.info(`Users migrated: ${usersMigrated}, Errors: ${usersErrors}`);

    // ═══════════════════════════════════════════════════════════════
    // Step 4: Migrate Data Collections
    // ═══════════════════════════════════════════════════════════════
    log.header('Step 4: Migrate Data Collections');

    let totalMigrated = 0;
    let totalErrors = 0;

    for (const collName of COLLECTIONS_TO_MIGRATE) {
      const toMigrate = needsMigration[collName] || 0;
      
      if (toMigrate === 0) {
        log.dim(`${collName}: No documents to migrate`);
        continue;
      }

      try {
        const coll = db.collection(collName);

        if (DRY_RUN) {
          log.info(`[DRY RUN] Would migrate ${toMigrate} documents in ${collName}`);
          totalMigrated += toMigrate;
          continue;
        }

        const result = await coll.updateMany(
          { 
            $or: [
              { organizationId: { $exists: false } },
              { organizationId: null }
            ]
          },
          { $set: { organizationId: orgId } }
        );

        log.success(`${collName}: Migrated ${result.modifiedCount} documents`);
        totalMigrated += result.modifiedCount;
      } catch (err) {
        log.error(`${collName}: Migration failed - ${err.message}`);
        totalErrors++;
      }
    }

    log.info(`Total documents migrated: ${totalMigrated}`);

    // ═══════════════════════════════════════════════════════════════
    // Step 5: Update Organization Stats
    // ═══════════════════════════════════════════════════════════════
    log.header('Step 5: Update Organization Stats');

    const memberCount = await usersCollection.countDocuments({
      'organizations.organizationId': orgId,
      'organizations.status': 'active',
    });

    const playerCount = await db.collection('players').countDocuments({ organizationId: orgId });
    const matchCount = await db.collection('matches').countDocuments({ organizationId: orgId });

    log.info(`Member count: ${memberCount}`);
    log.info(`Player count: ${playerCount}`);
    log.info(`Match count: ${matchCount}`);

    if (!DRY_RUN) {
      await orgsCollection.updateOne(
        { _id: orgId },
        { 
          $set: { 
            'stats.memberCount': memberCount,
            'stats.playerCount': playerCount,
            'stats.matchCount': matchCount,
          } 
        }
      );
      log.success('Organization stats updated');
    } else {
      log.dim('[DRY RUN] Would update organization stats');
    }

    // ═══════════════════════════════════════════════════════════════
    // Step 6: Verify Migration
    // ═══════════════════════════════════════════════════════════════
    log.header('Step 6: Verify Migration');

    let allVerified = true;

    // Verify users
    const usersWithoutOrgAfter = await usersCollection.countDocuments({
      $or: [
        { organizations: { $exists: false } },
        { organizations: { $size: 0 } },
        { organizations: null },
      ]
    });
    if (usersWithoutOrgAfter === 0) {
      log.success('Users: All migrated ✓');
    } else {
      log.warn(`Users: ${usersWithoutOrgAfter} still without organizations`);
      allVerified = false;
    }

    // Verify collections
    for (const collName of COLLECTIONS_TO_MIGRATE) {
      try {
        const coll = db.collection(collName);
        const remaining = await coll.countDocuments({ 
          $or: [
            { organizationId: { $exists: false } },
            { organizationId: null }
          ]
        });
        
        if (remaining === 0) {
          log.success(`${collName}: All migrated ✓`);
        } else {
          log.warn(`${collName}: ${remaining} documents still without organizationId`);
          allVerified = false;
        }
      } catch (err) {
        log.dim(`${collName}: Collection may not exist`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════════════
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Migration Summary                         ║
╚══════════════════════════════════════════════════════════════╝
`);
    
    if (DRY_RUN) {
      log.warn('DRY RUN - No changes were made');
      log.info('Run without DRY_RUN=true to apply changes');
    } else {
      log.success(`Organization: ${org.name} (${org.slug})`);
      log.info(`Users migrated: ${usersMigrated}`);
      log.info(`Documents migrated: ${totalMigrated}`);
      log.info(`Stats: ${memberCount} members, ${playerCount} players, ${matchCount} matches`);
      
      if (allVerified) {
        log.success('All verifications passed! Migration complete.');
      } else {
        log.warn('Some verifications failed. Check the output above.');
      }
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

main();
