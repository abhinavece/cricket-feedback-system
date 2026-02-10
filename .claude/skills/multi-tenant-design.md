# Multi-Tenant Design Skill

## Capability
Enforce multi-tenant architecture in every feature design, discussion, research, and implementation. Every entity in the system belongs to an organization (tenant), and every feature must support multiple independent tenants from day one.

## ⚠️ MANDATORY ENFORCEMENT
**This skill MUST be activated at the START of every feature discussion, planning session, or implementation task.** Before writing any code or discussing any design, ask:
- "Which tenant(s) does this feature belong to?"
- "Can multiple admins manage this independently?"
- "Is data isolated per organization?"

## Core Principle
CricSmart is a **multi-tenant SaaS platform** where:
- **Teams**: Multiple cricket teams, each with their own players, matches, squads, feedback
- **Tournaments**: Multiple tournament organizers managing independent tournaments
- **Auctions**: Multiple admins running separate auction events
- **Each entity supports multiple admins** — no single-admin bottleneck

## Existing Infrastructure

### Tenant Resolution (`backend/middleware/tenantResolver.js`)
```javascript
// Every authenticated request resolves to an organization
req.organization    // The current org object
req.organizationId  // The current org ID
req.organizationRole // User's role in this org (owner/admin/editor/viewer)
```

### Organization Model (`backend/models/Organization.js`)
- Supports: owner, multiple admins, editors, viewers
- Each org has isolated data scope
- Users can belong to multiple organizations

### Resolution Order
1. `X-Organization-Id` header (explicit org switching)
2. User's `activeOrganizationId` (default)
3. User's first organization (fallback)

## Design Checklist — Apply to EVERY Feature

### 1. Data Model
```javascript
// ✅ ALWAYS include organizationId in every model
const featureSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: true,
    index: true 
  },
  // ... other fields
});

// ✅ ALWAYS add compound index with organizationId
featureSchema.index({ organizationId: 1, createdAt: -1 });
featureSchema.index({ organizationId: 1, status: 1 });
```

```javascript
// ❌ NEVER create a model without organizationId
const featureSchema = new mongoose.Schema({
  name: String,
  // Missing organizationId = data leak across tenants!
});
```

### 2. API Routes
```javascript
// ✅ ALWAYS scope queries by organizationId
router.get('/', auth, resolveTenant, async (req, res) => {
  const data = await Feature.find({ 
    organizationId: req.organizationId,  // Tenant isolation
    isDeleted: false 
  }).lean();
  res.json({ success: true, data });
});

// ✅ ALWAYS validate resource belongs to tenant before update/delete
router.put('/:id', auth, resolveTenant, requireOrgEditor, async (req, res) => {
  const item = await Feature.findOne({
    _id: req.params.id,
    organizationId: req.organizationId  // Prevent cross-tenant access
  });
  if (!item) return res.status(404).json({ error: 'Not found' });
  // ... update logic
});
```

```javascript
// ❌ NEVER query without organizationId filter
const data = await Feature.find({ isDeleted: false }); // Returns ALL tenants' data!

// ❌ NEVER use findById alone for mutations
const item = await Feature.findById(req.params.id); // Could belong to another tenant!
```

### 3. Multi-Admin Support
```javascript
// ✅ ALWAYS support multiple admins per entity
// Organization roles: owner, admin, editor, viewer
// Any owner or admin can manage the entity

// ✅ Use org-level roles, not hardcoded single admin
router.delete('/:id', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  // requireOrgAdmin allows both 'owner' and 'admin' roles
});
```

```javascript
// ❌ NEVER check for a single admin
if (req.user.email === 'specific-admin@gmail.com') { ... }

// ❌ NEVER use global roles for tenant-specific operations
if (req.user.role === 'admin') { ... } // Global role, not org-specific!
```

### 4. Frontend — Organization Context
```typescript
// ✅ ALWAYS pass organizationId in API calls
const fetchData = async () => {
  const response = await api.get('/features', {
    headers: { 'X-Organization-Id': activeOrgId }
  });
};

// ✅ ALWAYS show org context in UI
<OrgSwitcher currentOrg={activeOrg} onSwitch={switchOrg} />

// ✅ ALWAYS scope local state to current org
const [data, setData] = useState<Feature[]>([]);
useEffect(() => {
  fetchData(); // Re-fetch when org changes
}, [activeOrgId]);
```

### 5. Feature Planning Questions
Before designing ANY feature, answer these:

| Question | Example Answer |
|----------|---------------|
| Who owns this data? | Organization (team/tournament/auction admin) |
| Can multiple orgs have this? | Yes — each team has its own matches |
| Can multiple admins manage it? | Yes — any org admin can CRUD |
| Is data isolated between orgs? | Yes — queries always filter by organizationId |
| Can a user see data from other orgs? | No — unless explicitly shared via public links |
| How does org switching work? | Header-based or activeOrganizationId |

## Domain-Specific Patterns

### Team Management
```
Organization (Team) → Players, Matches, Squads, Feedback, Payments
- Multiple admins can manage the team
- Players belong to one or more teams
- Matches are scoped to the team's organization
```

### Tournament Management
```
Organization (Tournament Org) → Tournaments, Teams, Fixtures, Scores
- Multiple organizers (admins) per tournament org
- Each tournament is isolated
- Teams can participate across tournaments (cross-org references via invites)
```

### Auction Management
```
Organization (Auction Admin) → Auctions, Player Pools, Bids, Results
- Multiple admins can run the auction
- Each auction is scoped to an organization
- Player data may be shared (read-only references)
```

## Migration Pattern — Making Existing Features Multi-Tenant

If adding multi-tenant support to an existing feature:

```javascript
// Step 1: Add organizationId to schema
featureSchema.add({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
});

// Step 2: Create migration to backfill existing data
// Assign existing records to a default organization

// Step 3: Make organizationId required
// After migration, enforce required: true

// Step 4: Add compound indexes
featureSchema.index({ organizationId: 1, createdAt: -1 });

// Step 5: Update ALL queries to include organizationId filter
```

## Common Pitfalls

1. **Forgetting organizationId in queries** — Always filter by tenant
2. **Using global admin role** — Use org-level roles (`requireOrgAdmin`)
3. **Single admin assumption** — Always support multiple admins
4. **Cross-tenant data leaks** — Validate ownership before every mutation
5. **Missing org context in frontend** — Always show which org is active
6. **Hardcoded org references** — Use dynamic resolution, never hardcode IDs
7. **Forgetting org scope in aggregations** — `$match` must include `organizationId`

## Verification Checklist

Before marking any feature complete:
- [ ] Every new model has `organizationId` field (required, indexed)
- [ ] Every query filters by `organizationId`
- [ ] Every mutation validates resource belongs to current tenant
- [ ] Multiple admins can manage the feature (not single-admin)
- [ ] Frontend shows org context and supports org switching
- [ ] Aggregation pipelines include `organizationId` in `$match`
- [ ] Public/shared links work without org context (if applicable)
- [ ] Data isolation tested — one org cannot see another's data
