# Security & Multi-Tenant Data Isolation Skill

## Capability
Enforce strict data isolation between tenants, prevent cross-tenant data leaks, and apply defense-in-depth security patterns across the entire stack.

## Why This Matters
In a multi-tenant SaaS like CricSmart, a **single missing `organizationId` filter** can expose one team's private data to another team. Security must be baked into every layer.

## Data Isolation Layers

### Layer 1: Middleware (First Line of Defense)
```javascript
// backend/middleware/tenantResolver.js
// EVERY authenticated request goes through tenant resolution
// req.organizationId is set BEFORE any route handler executes

// ✅ Middleware stack for protected routes
app.use('/api/matches', auth, resolveTenant, matchRoutes);
app.use('/api/players', auth, resolveTenant, playerRoutes);
app.use('/api/feedback', auth, resolveTenant, feedbackRoutes);
```

### Layer 2: Query Scoping (Second Line of Defense)
```javascript
// ✅ ALWAYS use a scoped query helper
const scopedQuery = (req, additionalFilters = {}) => ({
  organizationId: req.organizationId,
  isDeleted: false,
  ...additionalFilters,
});

// Usage in routes
router.get('/', auth, resolveTenant, async (req, res) => {
  const matches = await Match.find(scopedQuery(req)).lean();
  res.json({ success: true, data: matches });
});
```

### Layer 3: Resource Ownership Validation (Third Line of Defense)
```javascript
// ✅ Before ANY mutation, validate resource belongs to tenant
const validateOwnership = async (Model, resourceId, organizationId) => {
  const resource = await Model.findOne({
    _id: resourceId,
    organizationId: organizationId,
    isDeleted: false,
  });
  if (!resource) {
    throw new Error('Resource not found or access denied');
  }
  return resource;
};

// Usage
router.put('/:id', auth, resolveTenant, requireOrgEditor, async (req, res) => {
  try {
    const match = await validateOwnership(Match, req.params.id, req.organizationId);
    // Safe to update — ownership confirmed
    Object.assign(match, req.body);
    await match.save();
    res.json({ success: true, data: match });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});
```

### Layer 4: Mongoose Middleware (Automatic Scoping)
```javascript
// ✅ Consider adding pre-find hooks for critical models
matchSchema.pre('find', function() {
  // Warn if organizationId is not in the query
  if (!this.getQuery().organizationId) {
    console.warn('⚠️ Match query without organizationId filter!');
    // In production, you could throw an error instead
  }
});
```

## Role-Based Access Control (RBAC)

### Organization-Level Roles
```
owner   → Full control (delete org, transfer ownership, billing)
admin   → Manage everything except org deletion and ownership
editor  → Create/edit content (matches, players, feedback)
viewer  → Read-only access (may see redacted data)
```

### Implementation Pattern
```javascript
// Middleware chain for different access levels
// Read operations
router.get('/', auth, resolveTenant, handler);

// Write operations
router.post('/', auth, resolveTenant, requireOrgEditor, handler);

// Admin operations
router.delete('/:id', auth, resolveTenant, requireOrgAdmin, handler);

// Owner-only operations
router.delete('/organization', auth, resolveTenant, requireOrgOwner, handler);
```

### Data Redaction by Role
```javascript
// ✅ Redact sensitive data for lower roles
const redactForRole = (data, role) => {
  if (role === 'viewer') {
    return {
      ...data,
      playerPhone: undefined,
      playerEmail: undefined,
      paymentDetails: undefined,
      // Show aggregated stats but not individual details
    };
  }
  return data;
};
```

## Public & Shared Data Patterns

### Public Links (No Auth Required)
```javascript
// Public pages use token-based access, NOT org context
router.get('/share/match/:token', skipTenant, async (req, res) => {
  const match = await Match.findOne({ shareToken: req.params.token });
  if (!match) return res.status(404).json({ error: 'Not found' });
  
  // Return ONLY public-safe fields
  res.json({
    success: true,
    data: {
      opponent: match.opponent,
      date: match.date,
      ground: match.ground,
      // NO: adminNotes, paymentDetails, playerPhones
    }
  });
});
```

### Cross-Org References
```javascript
// When tournaments reference teams from different orgs
// Use READ-ONLY references — never allow cross-org mutations
const tournamentTeamSchema = new mongoose.Schema({
  tournamentId: { type: ObjectId, ref: 'Tournament', required: true },
  teamOrganizationId: { type: ObjectId, ref: 'Organization', required: true },
  status: { type: String, enum: ['invited', 'accepted', 'declined'] },
  // Team data is COPIED (denormalized), not referenced
  teamName: String,
  teamLogo: String,
});
```

## Input Validation & Sanitization

### Request Validation
```javascript
// ✅ Validate ALL user input
const validateMatchInput = (body) => {
  const errors = [];
  
  if (!body.opponent?.trim()) errors.push({ field: 'opponent', message: 'Required' });
  if (!body.date) errors.push({ field: 'date', message: 'Required' });
  if (body.opponent?.length > 200) errors.push({ field: 'opponent', message: 'Too long' });
  
  // Sanitize
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      opponent: body.opponent?.trim().substring(0, 200),
      date: new Date(body.date),
      ground: body.ground?.trim().substring(0, 200),
    }
  };
};
```

### Prevent NoSQL Injection
```javascript
// ✅ ALWAYS validate ObjectId parameters
const mongoose = require('mongoose');

router.get('/:id', auth, resolveTenant, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  // Safe to query
});
```

## Security Headers
```javascript
// backend/index.js — Already using helmet()
const helmet = require('helmet');
app.use(helmet());

// Additional headers for multi-tenant
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

## Audit Logging (Recommended)
```javascript
// Log sensitive operations for compliance
const auditLog = async (action, userId, organizationId, details) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action,          // 'match.create', 'player.delete', 'org.settings.update'
    userId,
    organizationId,
    details,
    ip: req.ip,
  }));
};

// Usage
router.delete('/:id', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  await auditLog('match.delete', req.user._id, req.organizationId, { matchId: req.params.id });
  // ... delete logic
});
```

## Security Checklist — Every Feature

- [ ] All queries filter by `organizationId` (no cross-tenant leaks)
- [ ] All mutations validate resource ownership before modifying
- [ ] Public endpoints use `skipTenant` and return only safe fields
- [ ] Input validation on all user-supplied data
- [ ] ObjectId parameters validated before querying
- [ ] Role-based access enforced (viewer/editor/admin/owner)
- [ ] Sensitive data redacted for lower roles
- [ ] No secrets in client-side code or responses
- [ ] Rate limiting on sensitive endpoints (login, password reset)
- [ ] Audit logging for destructive operations

## Common Pitfalls

1. **Missing organizationId in aggregations** — `$match` must include it
2. **findById without org check** — Always use `findOne({ _id, organizationId })`
3. **Exposing internal errors** — Return generic messages, log details server-side
4. **Trusting client-supplied organizationId** — Validate membership in middleware
5. **Forgetting to redact in new endpoints** — Apply redaction consistently
6. **Public endpoints leaking private data** — Whitelist fields explicitly
