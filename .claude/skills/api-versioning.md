# API Versioning & Backward Compatibility Skill

## Capability
Maintain API stability across multiple frontend consumers (main app, tournament hub, mobile app, SEO site) while enabling safe evolution of endpoints.

## Why This Matters
CricSmart has **4+ frontend consumers** hitting the same backend:
- `app.cricsmart.in` — Main React SPA
- `tournament.cricsmart.in` — Tournament Hub (Vite React)
- Mobile app (React Native / Expo)
- `cricsmart.in` — SEO site (Next.js, server-side API calls)

Breaking changes in the API can silently break any of these consumers.

## API Evolution Strategy

### URL-Based Versioning (When Needed)
```
/api/v1/matches      → Current stable API
/api/v2/matches      → New version with breaking changes
```

Use versioning only for **breaking changes**. For additive changes, extend the existing API.

### Additive Changes (No Version Bump Needed)
```javascript
// ✅ SAFE: Adding new optional fields to response
// Before
{ id, opponent, date }
// After
{ id, opponent, date, venue, format }  // New fields added, old clients unaffected

// ✅ SAFE: Adding new optional query params
// Before: GET /api/matches?page=1
// After:  GET /api/matches?page=1&format=T20  // New optional filter

// ✅ SAFE: Adding new endpoints
// POST /api/matches/:id/scorecard  // New endpoint, doesn't affect existing
```

### Breaking Changes (Require Version Bump)
```javascript
// ❌ BREAKING: Renaming response fields
{ matchDate } → { date }  // Old clients break

// ❌ BREAKING: Changing response structure
{ data: [...] } → { results: [...] }  // Old clients break

// ❌ BREAKING: Removing fields
{ id, opponent, date, time } → { id, opponent, date }  // 'time' removed

// ❌ BREAKING: Changing field types
{ squad: "player1,player2" } → { squad: ["player1", "player2"] }
```

## Implementation Pattern

### Response Envelope (Standard Format)
```javascript
// ✅ ALL API responses must follow this format
res.json({
  success: true,
  data: result,           // The actual payload
  pagination: {           // Only for list endpoints
    current: page,
    pages: totalPages,
    total: totalCount,
    hasMore: boolean
  },
  meta: {                 // Optional metadata
    version: 'v1',
    deprecation: null     // Or deprecation notice
  }
});

// Error responses
res.status(400).json({
  success: false,
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',  // Machine-readable code
  message: 'Human readable message',
  details: [{ field: 'name', message: 'Required' }]
});
```

### Deprecation Pattern
```javascript
// When deprecating an endpoint, don't remove it — mark it deprecated
router.get('/old-endpoint', auth, async (req, res) => {
  // Add deprecation header
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Sat, 01 Jun 2025 00:00:00 GMT');
  res.set('Link', '</api/v2/new-endpoint>; rel="successor-version"');
  
  // Still serve the old response format
  const data = await service.getData();
  res.json({ success: true, data });
});
```

### Feature Flags for Gradual Rollout
```javascript
// backend/config/featureFlags.js
const featureFlags = {
  USE_V2_MATCH_RESPONSE: process.env.FF_V2_MATCH_RESPONSE === 'true',
  ENABLE_AUCTION_API: process.env.FF_AUCTION_API === 'true',
};

// In route handler
router.get('/matches/:id', auth, async (req, res) => {
  const match = await Match.findById(req.params.id);
  
  if (featureFlags.USE_V2_MATCH_RESPONSE) {
    res.json({ success: true, data: formatV2(match) });
  } else {
    res.json({ success: true, data: formatV1(match) });
  }
});
```

## Multi-Consumer API Design

### Consumer-Aware Responses
```javascript
// Use Accept header or query param for consumer-specific needs
router.get('/matches', auth, async (req, res) => {
  const matches = await Match.find({ organizationId: req.organizationId });
  
  // Lightweight response for mobile
  if (req.headers['x-client'] === 'mobile') {
    return res.json({
      success: true,
      data: matches.map(m => ({
        _id: m._id,
        opponent: m.opponent,
        date: m.date,
        status: m.status
      }))
    });
  }
  
  // Full response for web
  res.json({ success: true, data: matches });
});
```

### Shared API Client Patterns
```typescript
// Frontend API service should handle response format consistently
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'X-Client': 'web',           // Identify consumer
    'X-Client-Version': '2.1.0', // Track client version
  }
});

// Interceptor to handle deprecation warnings
api.interceptors.response.use(response => {
  if (response.headers['deprecation'] === 'true') {
    console.warn(`API endpoint deprecated: ${response.config.url}`);
    console.warn(`Sunset: ${response.headers['sunset']}`);
  }
  return response;
});
```

## Checklist — Before Changing Any API

- [ ] Is this change additive (safe) or breaking?
- [ ] If breaking, is a new version endpoint created?
- [ ] Are all 4+ consumers accounted for?
- [ ] Is the old endpoint deprecated with proper headers (not removed)?
- [ ] Is the response envelope format maintained?
- [ ] Are error codes consistent with existing patterns?
- [ ] Is pagination format unchanged for list endpoints?
- [ ] Are new fields optional (not required) to avoid breaking mobile?

## Common Pitfalls

1. **Removing fields silently** — Always deprecate, never remove
2. **Changing field types** — Add new field instead of changing type
3. **Inconsistent error formats** — Always use the standard envelope
4. **Forgetting mobile consumer** — Mobile apps can't update instantly
5. **No deprecation notice** — Always add headers + sunset date
6. **Breaking pagination format** — Keep `{ current, pages, total, hasMore }` consistent
