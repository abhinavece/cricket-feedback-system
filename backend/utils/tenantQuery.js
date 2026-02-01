/**
 * @fileoverview Tenant Query Utilities
 * 
 * Helper functions to ensure all database queries include tenant (organization) filtering.
 * This is critical for data isolation in the multi-tenant architecture.
 * 
 * @module utils/tenantQuery
 */

const mongoose = require('mongoose');

/**
 * Create a query filter that includes organizationId
 * 
 * @param {Object} req - Express request object with organization context
 * @param {Object} additionalFilters - Additional query filters
 * @returns {Object} Query filter with organizationId
 * 
 * @example
 * // In a route handler:
 * const players = await Player.find(tenantQuery(req, { isActive: true }));
 */
const tenantQuery = (req, additionalFilters = {}) => {
  // Skip tenant filtering in development mode if flag is set
  if (req.skipTenantFilter) {
    console.warn('⚠️ SECURITY: Skipping tenant filter (dev mode)');
    return additionalFilters;
  }

  if (!req.organization || !req.organization._id) {
    throw new Error('SECURITY: Attempted query without organization context');
  }

  return {
    organizationId: req.organization._id,
    ...additionalFilters,
  };
};

/**
 * Create a document with organizationId injected
 * 
 * @param {Object} req - Express request object with organization context
 * @param {Object} data - Document data
 * @returns {Object} Document data with organizationId
 * 
 * @example
 * // In a route handler:
 * const player = new Player(tenantCreate(req, req.body));
 */
const tenantCreate = (req, data = {}) => {
  // Skip tenant injection in development mode if flag is set
  if (req.skipTenantFilter) {
    console.warn('⚠️ SECURITY: Skipping tenant injection (dev mode)');
    return data;
  }

  if (!req.organization || !req.organization._id) {
    throw new Error('SECURITY: Attempted create without organization context');
  }

  return {
    ...data,
    organizationId: req.organization._id,
  };
};

/**
 * Validate that a document belongs to the current organization
 * 
 * @param {Object} req - Express request object with organization context
 * @param {Object} document - Mongoose document to validate
 * @returns {boolean} True if document belongs to organization
 */
const validateTenantOwnership = (req, document) => {
  if (req.skipTenantFilter) {
    return true;
  }

  if (!req.organization || !req.organization._id) {
    return false;
  }

  if (!document || !document.organizationId) {
    return false;
  }

  return document.organizationId.equals(req.organization._id);
};

/**
 * Middleware factory: Adds tenant filtering to Mongoose model
 * Apply this plugin to models that need tenant isolation
 * 
 * @param {mongoose.Schema} schema - Mongoose schema
 */
const tenantPlugin = (schema) => {
  // Add organizationId field if not present
  if (!schema.paths.organizationId) {
    schema.add({
      organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        index: true,
      },
    });
  }

  // Pre-find hook to warn about missing tenant filter
  const queryMethods = ['find', 'findOne', 'count', 'countDocuments', 'aggregate'];
  
  queryMethods.forEach(method => {
    if (method === 'aggregate') {
      schema.pre('aggregate', function() {
        const pipeline = this.pipeline();
        const hasOrgFilter = pipeline.some(stage => 
          stage.$match && stage.$match.organizationId
        );
        
        if (!hasOrgFilter && !this.options?._skipTenantCheck) {
          console.warn(`⚠️ SECURITY WARNING: Aggregation without organizationId filter on ${schema.options?.collection || 'unknown'}`);
        }
      });
    } else {
      schema.pre(method, function() {
        const query = this.getQuery ? this.getQuery() : {};
        
        if (!query.organizationId && !this.options?._skipTenantCheck) {
          console.warn(`⚠️ SECURITY WARNING: ${method} query without organizationId on ${schema.options?.collection || 'unknown'}:`, JSON.stringify(query));
        }
      });
    }
  });
};

/**
 * Get organization ID from request, handling various edge cases
 * 
 * @param {Object} req - Express request object
 * @returns {mongoose.Types.ObjectId|null}
 */
const getOrganizationId = (req) => {
  if (req.skipTenantFilter) {
    return null;
  }
  
  if (req.organization?._id) {
    return req.organization._id;
  }
  
  if (req.organizationId) {
    return mongoose.Types.ObjectId.isValid(req.organizationId) 
      ? new mongoose.Types.ObjectId(req.organizationId)
      : null;
  }
  
  return null;
};

/**
 * Build aggregation pipeline with tenant filter as first stage
 * 
 * @param {Object} req - Express request object
 * @param {Array} pipeline - Aggregation pipeline stages
 * @returns {Array} Pipeline with tenant filter prepended
 */
const tenantAggregate = (req, pipeline = []) => {
  if (req.skipTenantFilter) {
    return pipeline;
  }

  const orgId = getOrganizationId(req);
  if (!orgId) {
    throw new Error('SECURITY: Attempted aggregation without organization context');
  }

  return [
    { $match: { organizationId: orgId } },
    ...pipeline,
  ];
};

module.exports = {
  tenantQuery,
  tenantCreate,
  validateTenantOwnership,
  tenantPlugin,
  getOrganizationId,
  tenantAggregate,
};
