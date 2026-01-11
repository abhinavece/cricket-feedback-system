#!/usr/bin/env node
/**
 * Init container script for MongoDB index creation
 * Runs before backend starts to ensure all indexes exist
 * Safe to run multiple times (idempotent)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Feedback = require('../models/Feedback');

async function initializeIndexes() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`[Init Container] Connecting to MongoDB (attempt ${retries + 1}/${maxRetries})...`);
      
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-feedback', {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
      });

      console.log('✓ Connected to MongoDB');

      // Ensure indexes are created
      console.log('✓ Creating indexes...');
      await Feedback.syncIndexes();
      console.log('✓ All indexes created successfully');

      // Verify indexes exist
      const collection = mongoose.connection.collection('feedbacks');
      const indexes = await collection.getIndexes();
      const indexCount = Object.keys(indexes).length;
      console.log(`✓ Verified: ${indexCount} indexes exist on feedbacks collection`);

      // List all indexes
      console.log('\nIndexes:');
      Object.keys(indexes).forEach((indexName, idx) => {
        console.log(`  ${idx + 1}. ${indexName}`);
      });

      await mongoose.connection.close();
      console.log('\n✓ MongoDB connection closed');
      console.log('✓ Init container completed successfully\n');
      
      process.exit(0);

    } catch (error) {
      retries++;
      
      if (retries >= maxRetries) {
        console.error(`✗ Failed to initialize indexes after ${maxRetries} attempts`);
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }

      console.warn(`⚠ Connection failed: ${error.message}`);
      console.log(`Retrying in 5 seconds...\n`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

initializeIndexes();
