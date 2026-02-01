/**
 * @fileoverview Mongoose Tenant Plugin for Multi-Tenant Data Isolation
 * 
 * This plugin provides automatic enforcement of organizationId in tenant-scoped models.
 * It adds pre-save validation and query warnings to prevent data leaks between tenants.
 * 
 * Features:
 * - Pre-save hook: Validates organizationId is present on new documents
 * - Pre-find/update hooks: Warns when queries don't include organizationId filter
 * - Configurable: Can skip checks for specific operations via options
 * 
 * Usage:
 *   const { tenantPlugin } = require('../plugins/tenantPlugin');
 *   schema.plugin(tenantPlugin);
 * 
 * @module plugins/tenantPlugin
 */

const mongoose = require('mongoose');

/**
 * List of collections that are tenant-scoped (require organizationId)
 * Used for validation and logging purposes
 */
const TENANT_SCOPED_COLLECTIONS = [
  'players',
  'matches',
  'feedbacks',
  'availabilities',
  'messages',
  'matchpayments',
  'organizationinvites',
  'joinrequests',
  'feedbacklinks',
  'publiclinks',
  'templateratelimits',
  'whatsappsessions',
  'paymentscreenshots',
];

/**
 * Collections that are intentionally NOT tenant-scoped
 * These are shared resources or system-level data
 */
const SHARED_COLLECTIONS = [
  'organizations',
  'users',
  'grounds',
  'groundreviews',
  'systemsettings',
  'webhookproxyconfigs',
  'whatsappcostconfigs',
];

/**
 * Mongoose plugin for tenant isolation enforcement
 * 
 * @param {mongoose.Schema} schema - Mongoose schema to apply plugin to
 * @param {Object} options - Plugin options
 * @param {boolean} options.strict - If true, throw errors instead of warnings (default: false)
 * @param {boolean} options.skipQueryWarnings - If true, skip query warnings (default: false)
 */
const tenantPlugin = (schema, options = {}) => {
  const { strict = false, skipQueryWarnings = false } = options;

  // Pre-save hook: Validate organizationId on new documents
  schema.pre('save', function(next) {
    // Only validate on new documents
    if (!this.isNew) {
      return next();
    }

    // Skip if this schema doesn't have organizationId field
    if (!this.schema.paths.organizationId) {
      return next();
    }

    // Check if organizationId is set
    if (!this.organizationId) {
      const collectionName = this.constructor.collection?.name || 'unknown';
      const errorMessage = `TENANT VIOLATION: Attempted to save new document to ${collectionName} without organizationId`;
      
      if (strict) {
        return next(new Error(errorMessage));
      } else {
        console.error(`⚠️ ${errorMessage}`);
        console.error('   Document:', JSON.stringify(this.toObject(), null, 2).substring(0, 500));
        // In non-strict mode, we still allow the save but log the error
        // This prevents breaking existing code while transitioning
      }
    }

    next();
  });

  // Pre-validate hook: Double-check organizationId before validation
  schema.pre('validate', function(next) {
    if (this.isNew && this.schema.paths.organizationId && !this.organizationId) {
      const collectionName = this.constructor.collection?.name || 'unknown';
      console.warn(`⚠️ TENANT WARNING: Document in ${collectionName} missing organizationId during validation`);
    }
    next();
  });

  // Skip query warnings if disabled
  if (skipQueryWarnings) {
    return;
  }

  // Query methods to add warnings
  const queryMethods = ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'countDocuments'];

  queryMethods.forEach(method => {
    schema.pre(method, function() {
      // Skip if explicitly marked to skip tenant check
      if (this.options?._skipTenantCheck) {
        return;
      }

      // Get the query filter
      const filter = this.getFilter ? this.getFilter() : this.getQuery?.() || {};

      // Check if organizationId is in the filter
      if (!filter.organizationId) {
        const collectionName = this.model?.collection?.name || this.mongooseCollection?.name || 'unknown';
        
        // Only warn for tenant-scoped collections
        if (TENANT_SCOPED_COLLECTIONS.includes(collectionName.toLowerCase())) {
          console.warn(`⚠️ TENANT WARNING: ${method} on ${collectionName} without organizationId filter`);
          console.warn(`   Query: ${JSON.stringify(filter)}`);
          
          if (strict) {
            throw new Error(`TENANT VIOLATION: ${method} on ${collectionName} requires organizationId filter`);
          }
        }
      }
    });
  });

  // Aggregation hook
  schema.pre('aggregate', function() {
    if (this.options?._skipTenantCheck) {
      return;
    }

    const pipeline = this.pipeline();
    const hasOrgFilter = pipeline.some(stage => 
      stage.$match && stage.$match.organizationId
    );

    if (!hasOrgFilter) {
      const collectionName = this._model?.collection?.name || 'unknown';
      
      if (TENANT_SCOPED_COLLECTIONS.includes(collectionName.toLowerCase())) {
        console.warn(`⚠️ TENANT WARNING: Aggregation on ${collectionName} without organizationId in $match`);
        
        if (strict) {
          throw new Error(`TENANT VIOLATION: Aggregation on ${collectionName} requires organizationId in first $match stage`);
        }
      }
    }
  });
};

/**
 * Check if a collection is tenant-scoped
 * @param {string} collectionName - Collection name
 * @returns {boolean}
 */
const isTenantScoped = (collectionName) => {
  return TENANT_SCOPED_COLLECTIONS.includes(collectionName.toLowerCase());
};

/**
 * Check if a collection is shared (not tenant-scoped)
 * @param {string} collectionName - Collection name
 * @returns {boolean}
 */
const isSharedCollection = (collectionName) => {
  return SHARED_COLLECTIONS.includes(collectionName.toLowerCase());
};

module.exports = {
  tenantPlugin,
  TENANT_SCOPED_COLLECTIONS,
  SHARED_COLLECTIONS,
  isTenantScoped,
  isSharedCollection,
};
