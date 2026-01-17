#!/usr/bin/env node

/**
 * Payment Calculation Migration Script
 *
 * One-time migration to ensure all stored payment values match
 * what would be calculated from paymentHistory.
 *
 * This script:
 * 1. Iterates all MatchPayment documents
 * 2. Runs recalculateAmounts() on each
 * 3. Compares stored vs calculated values
 * 4. Saves if different
 * 5. Logs changes for audit trail
 *
 * Usage:
 *   node backend/scripts/migratePaymentCalculations.js
 *
 * Options:
 *   --dry-run    Show what would be changed without saving
 *   --verbose    Show detailed output for each document
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MatchPayment = require('../models/MatchPayment');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-feedback';
  console.log('Connecting to MongoDB...');

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function migratePayments() {
  console.log('\n========================================');
  console.log('Payment Calculation Migration Script');
  console.log('========================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be saved)' : 'LIVE'}`);
  console.log(`Verbose: ${verbose ? 'ON' : 'OFF'}`);
  console.log('');

  const payments = await MatchPayment.find({});
  console.log(`Found ${payments.length} payment records to process\n`);

  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  const changes = [];

  for (const payment of payments) {
    try {
      // Store original values for comparison
      const originalValues = {
        totalCollected: payment.totalCollected,
        totalPending: payment.totalPending,
        totalOwed: payment.totalOwed,
        paidCount: payment.paidCount,
        status: payment.status,
        members: payment.squadMembers.map(m => ({
          id: m._id.toString(),
          name: m.playerName,
          amountPaid: m.amountPaid,
          dueAmount: m.dueAmount,
          owedAmount: m.owedAmount,
          paymentStatus: m.paymentStatus
        }))
      };

      // Recalculate amounts using the centralized service
      payment.recalculateAmounts();

      // Compare values
      const newValues = {
        totalCollected: payment.totalCollected,
        totalPending: payment.totalPending,
        totalOwed: payment.totalOwed,
        paidCount: payment.paidCount,
        status: payment.status,
        members: payment.squadMembers.map(m => ({
          id: m._id.toString(),
          name: m.playerName,
          amountPaid: m.amountPaid,
          dueAmount: m.dueAmount,
          owedAmount: m.owedAmount,
          paymentStatus: m.paymentStatus
        }))
      };

      // Check if anything changed
      const paymentChanged =
        originalValues.totalCollected !== newValues.totalCollected ||
        originalValues.totalPending !== newValues.totalPending ||
        originalValues.totalOwed !== newValues.totalOwed ||
        originalValues.paidCount !== newValues.paidCount ||
        originalValues.status !== newValues.status;

      // Check member changes
      const memberChanges = [];
      for (let i = 0; i < originalValues.members.length; i++) {
        const orig = originalValues.members[i];
        const curr = newValues.members[i];
        if (orig && curr && (
          orig.amountPaid !== curr.amountPaid ||
          orig.dueAmount !== curr.dueAmount ||
          orig.owedAmount !== curr.owedAmount ||
          orig.paymentStatus !== curr.paymentStatus
        )) {
          memberChanges.push({
            name: orig.name,
            before: {
              amountPaid: orig.amountPaid,
              dueAmount: orig.dueAmount,
              owedAmount: orig.owedAmount,
              paymentStatus: orig.paymentStatus
            },
            after: {
              amountPaid: curr.amountPaid,
              dueAmount: curr.dueAmount,
              owedAmount: curr.owedAmount,
              paymentStatus: curr.paymentStatus
            }
          });
        }
      }

      const hasChanges = paymentChanged || memberChanges.length > 0;

      if (hasChanges) {
        const change = {
          paymentId: payment._id.toString(),
          matchId: payment.matchId?.toString(),
          before: {
            totalCollected: originalValues.totalCollected,
            totalPending: originalValues.totalPending,
            totalOwed: originalValues.totalOwed,
            paidCount: originalValues.paidCount,
            status: originalValues.status
          },
          after: {
            totalCollected: newValues.totalCollected,
            totalPending: newValues.totalPending,
            totalOwed: newValues.totalOwed,
            paidCount: newValues.paidCount,
            status: newValues.status
          },
          memberChanges
        };

        changes.push(change);

        if (verbose) {
          console.log(`\n[CHANGE] Payment ${payment._id}`);
          if (paymentChanged) {
            console.log('  Payment level:');
            console.log(`    totalCollected: ${originalValues.totalCollected} -> ${newValues.totalCollected}`);
            console.log(`    totalPending: ${originalValues.totalPending} -> ${newValues.totalPending}`);
            console.log(`    totalOwed: ${originalValues.totalOwed} -> ${newValues.totalOwed}`);
            console.log(`    paidCount: ${originalValues.paidCount} -> ${newValues.paidCount}`);
            console.log(`    status: ${originalValues.status} -> ${newValues.status}`);
          }
          if (memberChanges.length > 0) {
            console.log('  Member level:');
            memberChanges.forEach(mc => {
              console.log(`    ${mc.name}:`);
              console.log(`      amountPaid: ${mc.before.amountPaid} -> ${mc.after.amountPaid}`);
              console.log(`      dueAmount: ${mc.before.dueAmount} -> ${mc.after.dueAmount}`);
              console.log(`      owedAmount: ${mc.before.owedAmount} -> ${mc.after.owedAmount}`);
              console.log(`      paymentStatus: ${mc.before.paymentStatus} -> ${mc.after.paymentStatus}`);
            });
          }
        }

        if (!dryRun) {
          await payment.save();
        }

        updated++;
      } else {
        if (verbose) {
          console.log(`[OK] Payment ${payment._id} - no changes needed`);
        }
        unchanged++;
      }
    } catch (error) {
      console.error(`[ERROR] Payment ${payment._id}: ${error.message}`);
      errors++;
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('Migration Summary');
  console.log('========================================');
  console.log(`Total processed: ${payments.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Errors: ${errors}`);

  if (dryRun && updated > 0) {
    console.log('\n[DRY RUN] No changes were saved. Run without --dry-run to apply changes.');
  }

  // Write changes to log file
  if (changes.length > 0) {
    const logFile = path.join(__dirname, `payment-migration-${Date.now()}.json`);
    const fs = require('fs');
    fs.writeFileSync(logFile, JSON.stringify(changes, null, 2));
    console.log(`\nChanges log written to: ${logFile}`);
  }

  return { updated, unchanged, errors };
}

async function main() {
  try {
    await connectToDatabase();
    const result = await migratePayments();

    console.log('\nMigration completed successfully');
    await mongoose.disconnect();
    process.exit(result.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
