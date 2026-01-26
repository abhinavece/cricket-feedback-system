# Backend Development Skill

## Capability
Develop Node.js Express APIs with MongoDB, following service layer patterns and security best practices.

## Tech Stack
- Node.js with Express 5
- MongoDB with Mongoose ODM
- JWT for authentication
- Meta Cloud APIs for WhatsApp

## File Locations
- Routes: `backend/routes/`
- Models: `backend/models/`
- Services: `backend/services/`
- Middleware: `backend/middleware/`
- Config: `backend/config/`

## Creating a New API Endpoint

### Step 1: Add Route Handler
```javascript
// backend/routes/resource.js

/**
 * @fileoverview Resource Routes
 * @module routes/resource
 */

const express = require('express');
const router = express.Router();
const { auth, requireEditor, requireAdmin } = require('../middleware/auth');
const resourceService = require('../services/resourceService');

/**
 * GET /api/resource
 * List all resources (paginated)
 * 
 * @route GET /api/resource
 * @access Private (requires authentication)
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 10, max: 100)
 * @returns {Object} 200 - Paginated resource list
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const result = await resourceService.getAll({
      page: pageNum,
      limit: limitNum,
      userRole: req.user.role
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/resource
 * Create a new resource (requires editor role)
 * 
 * @route POST /api/resource
 * @access Private (requires editor+)
 */
router.post('/', auth, requireEditor, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const resource = await resourceService.create({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user.email
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### Step 2: Create Service
```javascript
// backend/services/resourceService.js

/**
 * @fileoverview Resource Service
 * @module services/resourceService
 */

const Resource = require('../models/Resource');

/**
 * Get all resources with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} options.userRole - User role for data filtering
 * @returns {Promise<Object>} Paginated results
 */
const getAll = async ({ page, limit, userRole }) => {
  const query = { isDeleted: false };
  
  const data = await Resource.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

  const total = await Resource.countDocuments(query);
  const hasMore = (page * limit) < total;

  // Apply role-based redaction if needed
  const redactedData = userRole === 'viewer' 
    ? redactList(data) 
    : data;

  return {
    data: redactedData,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasMore
    }
  };
};

/**
 * Create a new resource
 * @param {Object} data - Resource data
 * @returns {Promise<Object>} Created resource
 */
const create = async (data) => {
  const resource = new Resource(data);
  await resource.save();
  return resource;
};

/**
 * Redact sensitive data for viewer role
 * @param {Array} list - List of resources
 * @returns {Array} Redacted list
 */
const redactList = (list) => {
  return list.map(item => ({
    ...item,
    sensitiveField: '[REDACTED]'
  }));
};

module.exports = {
  getAll,
  create,
  redactList
};
```

### Step 3: Create Model (if needed)
```javascript
// backend/models/Resource.js

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String }
}, { 
  timestamps: true 
});

// Indexes for performance
resourceSchema.index({ isDeleted: 1, createdAt: -1 });
resourceSchema.index({ name: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
```

### Step 4: Register Route
```javascript
// backend/index.js
const resourceRoutes = require('./routes/resource');
app.use('/api/resource', resourceRoutes);
```

## Query Optimization

```javascript
// Use .lean() for read-only queries (50% faster)
const data = await Model.find(query).lean();

// Use .select() to limit fields
const data = await Model.find(query)
  .select('_id name email -__v')
  .lean();

// Use aggregation for stats
const stats = await Model.aggregate([
  { $match: { isDeleted: false } },
  { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }
]);
```

## Soft Delete Pattern

```javascript
// Soft delete
await Model.findByIdAndUpdate(id, {
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: req.user.email
});

// Restore
await Model.findByIdAndUpdate(id, {
  isDeleted: false,
  deletedAt: null,
  deletedBy: null
});

// Query - always filter deleted
await Model.find({ isDeleted: false, ...otherFilters });
```

## Authentication Middleware Usage

```javascript
// Public endpoint (no auth)
router.get('/public', async (req, res) => { ... });

// Any authenticated user
router.get('/data', auth, async (req, res) => { ... });

// Editor or admin only
router.post('/data', auth, requireEditor, async (req, res) => { ... });

// Admin only
router.delete('/data/:id', auth, requireAdmin, async (req, res) => { ... });
```

## Common Pitfalls

1. **Missing error handling** - Always wrap in try/catch
2. **No input validation** - Validate all user input
3. **Duplicate logic** - Use services, don't duplicate in routes
4. **Missing pagination** - All list endpoints must paginate
5. **No indexes** - Add indexes for frequently queried fields
6. **Returning raw models** - Use .lean() and redact sensitive data
