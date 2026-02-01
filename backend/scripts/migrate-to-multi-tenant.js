#!/usr/bin/env node

/**
 * @fileoverview Multi-Tenant Migration Script
 * 
 * Migrates existing single-tenant data to multi-tenant architecture:
 * 1. Creates a default organization for existing data
 * 2. Adds organizationId to all existing documents
 * 3. Updates users with organization membership
 * 
 * Run: node backend/scripts/migrate-to-multi-tenant.js
 * 
 * Environment variables:
 * - MONGODB_URI: MongoDB connection string
 * - DEFAULT_ORG_NAME: Name for the default organization (default: "Mavericks XI")
 * - DEFAULT_ORG_SLUG: Slug for the default organization (default: "mavericks-xi")
 * - DRY_RUN: Set to "true" to preview changes without applying (default: false)
 * 
 * @module scripts/migrate-to-multi-tenant
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Import models
const Organization = require('../models/Organization');
const User = require('../models/User');
const Player = require('../models/Player');
const Match = require('../models/Match');
const Feedback = require('../models/Feedback');
const FeedbackLink = require('../models/FeedbackLink');
const Availability = require('../models/Availability');
const Message = require('../models/Message');
const MatchPayment = require('../models/MatchPayment');
const PaymentScreenshot = require('../models/PaymentScreenshot');
const Ground = require('../models/Ground');
const GroundReview = require('../models/GroundReview');
const PublicLink = require('../models/PublicLink');
const TemplateRateLimit = require('../models/TemplateRateLimit');
const WhatsAppSession = require('../models/WhatsAppSession');

const DRY_RUN = process.env.DRY_RUN === 'true';
const DEFAULT_ORG_NAME = process.env.DEFAULT_ORG_NAME || 'Mavericks XI';
const DEFAULT_ORG_SLUG = process.env.DEFAULT_ORG_SLUG || 'mavericks-xi';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    log.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  log.info(`Connecting to MongoDB...`);
  await mongoose.connect(uri);
  log.success('Connected to MongoDB');
}

async function getStats() {
  log.header('Current Database Statistics');

  const stats = {
    organizations: await Organization.countDocuments(),
    users: await User.countDocuments(),
    players: await Player.countDocuments(),
    matches: await Match.countDocuments(),
    feedback: await Feedback.countDocuments(),
    feedbackLinks: await FeedbackLink.countDocuments(),
    availability: await Availability.countDocuments(),
    messages: await Message.countDocuments(),
    matchPayments: await MatchPayment.countDocuments(),
    paymentScreenshots: await PaymentScreenshot.countDocuments(),
    grounds: await Ground.countDocuments(),
    groundReviews: await GroundReview.countDocuments(),
    publicLinks: await PublicLink.countDocuments(),
    templateRateLimits: await TemplateRateLimit.countDocuments(),
    whatsAppSessions: await WhatsAppSession.countDocuments(),
  };

  console.log('Collection counts:');
  Object.entries(stats).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`);
  });

  // Check how many already have organizationId
  const withOrgId = {
    players: await Player.countDocuments({ organizationId: { $exists: true, $ne: null } }),
    matches: await Match.countDocuments({ organizationId: { $exists: true, $ne: null } }),
    feedback: await Feedback.countDocuments({ organizationId: { $exists: true, $ne: null } }),
    messages: await Message.countDocuments({ organizationId: { $exists: true, $ne: null } }),
  };

  console.log('\nDocuments with organizationId:');
  Object.entries(withOrgId).forEach(([key, count]) => {
    const total = stats[key];
    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    console.log(`  ${key}: ${count}/${total} (${percent}%)`);
  });

  return stats;
}

async function createDefaultOrganization(adminUser) {
  log.header('Step 1: Create Default Organization');

  // Check if organization already exists
  let org = await Organization.findOne({ slug: DEFAULT_ORG_SLUG });
  
  if (org) {
    log.warn(`Organization "${org.name}" (${org.slug}) already exists`);
    return org;
  }

  if (DRY_RUN) {
    log.info(`[DRY RUN] Would create organization: ${DEFAULT_ORG_NAME} (${DEFAULT_ORG_SLUG})`);
    return { _id: new mongoose.Types.ObjectId(), name: DEFAULT_ORG_NAME, slug: DEFAULT_ORG_SLUG };
  }

  org = new Organization({
    name: DEFAULT_ORG_NAME,
    slug: DEFAULT_ORG_SLUG,
    description: 'Default organization created during multi-tenant migration',
    ownerId: adminUser._id,
    plan: 'pro', // Give existing data full access
    limits: {
      maxPlayers: 999,
      maxMatches: 9999,
      maxAdmins: 99,
      maxEditors: 99,
    },
    // Copy WhatsApp config from environment if available
    whatsapp: {
      enabled: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || null,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || null,
      connectionStatus: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'connected' : 'pending',
    },
  });

  await org.save();
  log.success(`Created organization: ${org.name} (${org.slug})`);
  
  return org;
}

async function migrateUsers(organization) {
  log.header('Step 2: Migrate Users');

  const users = await User.find({});
  log.info(`Found ${users.length} users to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    // Check if user already has this organization
    const hasMembership = user.organizations?.some(
      m => m.organizationId?.equals(organization._id)
    );

    if (hasMembership) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      log.info(`[DRY RUN] Would add ${user.email} to organization as ${user.role}`);
      migrated++;
      continue;
    }

    // Determine role based on existing role
    let orgRole = 'viewer';
    if (user.role === 'admin') {
      orgRole = organization.ownerId.equals(user._id) ? 'owner' : 'admin';
    } else if (user.role === 'editor') {
      orgRole = 'editor';
    }

    // Add organization membership
    if (!user.organizations) {
      user.organizations = [];
    }
    
    user.organizations.push({
      organizationId: organization._id,
      role: orgRole,
      playerId: user.playerId, // Migrate existing playerId link
      joinedAt: user.createdAt || new Date(),
      status: 'active',
    });

    user.activeOrganizationId = organization._id;
    
    await user.save();
    migrated++;
  }

  log.success(`Migrated ${migrated} users, skipped ${skipped} (already migrated)`);
  
  // Update organization member count
  if (!DRY_RUN) {
    organization.stats.memberCount = users.length;
    await organization.save();
  }
}

async function migrateCollection(Model, modelName, organization, options = {}) {
  const { skipExisting = true } = options;
  
  const query = skipExisting 
    ? { organizationId: { $exists: false } }
    : {};
  
  const count = await Model.countDocuments(query);
  
  if (count === 0) {
    log.info(`${modelName}: No documents to migrate`);
    return 0;
  }

  if (DRY_RUN) {
    log.info(`[DRY RUN] Would migrate ${count} ${modelName} documents`);
    return count;
  }

  const result = await Model.updateMany(
    query,
    { $set: { organizationId: organization._id } }
  );

  log.success(`${modelName}: Migrated ${result.modifiedCount} documents`);
  return result.modifiedCount;
}

async function migrateAllCollections(organization) {
  log.header('Step 3: Migrate All Collections');

  const collections = [
    { model: Player, name: 'Players' },
    { model: Match, name: 'Matches' },
    { model: Feedback, name: 'Feedback' },
    { model: FeedbackLink, name: 'FeedbackLinks' },
    { model: Availability, name: 'Availability' },
    { model: Message, name: 'Messages' },
    { model: MatchPayment, name: 'MatchPayments' },
    { model: PaymentScreenshot, name: 'PaymentScreenshots' },
    { model: GroundReview, name: 'GroundReviews' },
    { model: PublicLink, name: 'PublicLinks' },
    { model: TemplateRateLimit, name: 'TemplateRateLimits' },
    { model: WhatsAppSession, name: 'WhatsAppSessions' },
  ];

  let totalMigrated = 0;

  for (const { model, name } of collections) {
    try {
      const migrated = await migrateCollection(model, name, organization);
      totalMigrated += migrated;
    } catch (error) {
      log.error(`Error migrating ${name}: ${error.message}`);
    }
  }

  // Handle Grounds separately (they can be global or per-org)
  log.info('Grounds: Keeping as global (shared across organizations)');

  log.success(`Total documents migrated: ${totalMigrated}`);
  
  // Update organization stats
  if (!DRY_RUN) {
    organization.stats.playerCount = await Player.countDocuments({ organizationId: organization._id });
    organization.stats.matchCount = await Match.countDocuments({ organizationId: organization._id });
    await organization.save();
  }
}

async function updateIndexes() {
  log.header('Step 4: Update Database Indexes');

  if (DRY_RUN) {
    log.info('[DRY RUN] Would update database indexes');
    return;
  }

  try {
    // Drop the old unique phone index on Player if it exists
    const playerCollection = mongoose.connection.collection('players');
    const playerIndexes = await playerCollection.indexes();
    
    const hasOldPhoneIndex = playerIndexes.some(
      idx => idx.key && idx.key.phone === 1 && idx.unique === true && !idx.key.organizationId
    );

    if (hasOldPhoneIndex) {
      log.info('Dropping old unique phone index on players collection...');
      await playerCollection.dropIndex('phone_1');
      log.success('Dropped old phone_1 index');
    }

    // Create new compound index
    log.info('Creating new compound indexes...');
    
    // Let Mongoose sync indexes based on schema definitions
    await Player.syncIndexes();
    log.success('Player indexes synced');

  } catch (error) {
    if (error.code === 27) {
      log.info('Index not found (already removed or never existed)');
    } else {
      log.warn(`Index update warning: ${error.message}`);
    }
  }
}

async function verifyMigration(organization) {
  log.header('Step 5: Verify Migration');

  const checks = [
    {
      name: 'Organization exists',
      check: async () => {
        const org = await Organization.findById(organization._id);
        return !!org;
      },
    },
    {
      name: 'Users have organization membership',
      check: async () => {
        const usersWithoutOrg = await User.countDocuments({
          $or: [
            { organizations: { $exists: false } },
            { organizations: { $size: 0 } },
          ],
        });
        return usersWithoutOrg === 0;
      },
    },
    {
      name: 'Players have organizationId',
      check: async () => {
        const playersWithoutOrg = await Player.countDocuments({
          organizationId: { $exists: false },
        });
        return playersWithoutOrg === 0;
      },
    },
    {
      name: 'Matches have organizationId',
      check: async () => {
        const matchesWithoutOrg = await Match.countDocuments({
          organizationId: { $exists: false },
        });
        return matchesWithoutOrg === 0;
      },
    },
  ];

  let allPassed = true;

  for (const { name, check } of checks) {
    try {
      const passed = await check();
      if (passed) {
        log.success(`${name}: PASSED`);
      } else {
        log.error(`${name}: FAILED`);
        allPassed = false;
      }
    } catch (error) {
      log.error(`${name}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Multi-Tenant Migration Script                      ║
║                                                              ║
║  This script migrates existing data to multi-tenant model    ║
╚══════════════════════════════════════════════════════════════╝
  `);

  if (DRY_RUN) {
    log.warn('DRY RUN MODE - No changes will be made to the database');
  }

  try {
    await connectDB();
    await getStats();

    // Find an admin user to be the organization owner
    const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    
    if (!adminUser) {
      log.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    log.info(`Using ${adminUser.email} as organization owner`);

    if (!DRY_RUN) {
      const answer = await prompt('\nProceed with migration? (yes/no): ');
      if (answer.toLowerCase() !== 'yes') {
        log.info('Migration cancelled');
        process.exit(0);
      }
    }

    // Run migration steps
    const organization = await createDefaultOrganization(adminUser);
    await migrateUsers(organization);
    await migrateAllCollections(organization);
    await updateIndexes();
    
    if (!DRY_RUN) {
      const verified = await verifyMigration(organization);
      
      if (verified) {
        log.header('Migration Complete!');
        log.success(`Organization: ${organization.name} (${organization.slug})`);
        log.success(`Organization ID: ${organization._id}`);
        log.info('\nNext steps:');
        log.info('1. Restart the backend server');
        log.info('2. Test the application');
        log.info('3. Update frontend to use organization context');
      } else {
        log.error('Migration verification failed. Please check the errors above.');
      }
    } else {
      log.header('Dry Run Complete');
      log.info('Run without DRY_RUN=true to apply changes');
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
