# Unified Roles Architecture & User.role Deprecation

## Overview

This document covers three interrelated improvements to the CricSmart auth system:

1. **Decouple Tournament from Team Management org roles** — Tournament gets its own `admins[]` (like Auction)
2. **Deprecate legacy `User.role` field** — Replace all usages with org-scoped or resource-scoped roles
3. **Unified product-scoped roles pattern** — Consistent authorization across all three products

---

## Current State

### Three Products, Three Auth Patterns

| Product | Domain | Auth Middleware Chain | Role Storage |
|---------|--------|---------------------|--------------|
| Team Management | app.cricsmart.in | `auth → resolveTenant → requireOrgAdmin` | `User.organizations[].role` |
| Tournament | tournament.cricsmart.in | `auth → resolveTenant → requireOrgAdmin` | `User.organizations[].role` (SAME!) |
| Auction | auction.cricsmart.in | `auth → resolveAuctionAdmin` | `Auction.admins[]` |

### Problem: Tournament ↔ Team Management Coupling
- If you're admin of org "Mavericks XI" in team management, you're **automatically** admin for all tournaments under that org
- There is NO separate "tournament admin" — it piggybacks on org roles
- Tournament teams (Franchise model) have `owner: { name, email, phone }` but NO userId linkage — team owners can't log in and manage their teams

### Problem: Legacy `User.role` Still Active
- `User.role` (`viewer`/`editor`/`admin`) is marked DEPRECATED in schema comments
- But it's still actively used in **17 backend files** and **21 frontend files**
- Creates confusion: is the check org-scoped or global?

---

## Target Architecture

### Consistent Pattern: Resource-Level Admins

```
Team Management  →  User.organizations[].role  (org-scoped, KEEP AS-IS)
Tournament       →  Tournament.admins[]         (resource-level, NEW)
Auction          →  Auction.admins[]            (resource-level, EXISTS)
```

**Why keep Team Management org-scoped?** Because team management IS inherently about managing an organization (players, matches, payments). The org IS the resource.

**Why resource-level for Tournament + Auction?** Because:
- A user can create multiple tournaments without needing an org
- Each tournament is an independent resource with its own admins
- Tournament teams (franchises) need their own admins too
- Mirrors the already-working Auction pattern

### Tournament Auth Flow (New)

```
Tournament Creator → Tournament.admins[{ userId, role: 'owner' }]
Co-admin invited  → Tournament.admins[{ userId, role: 'admin', email }]
Franchise team    → Franchise.admins[{ userId, role: 'team_owner' }]
                    OR Franchise.accessToken (like auction team tokens)
```

### Platform Admin Operations (New)

```
GET /auth/users          →  Check User.platformRole === 'platform_admin'
PUT /auth/users/:id/role →  Check User.platformRole === 'platform_admin'
POST /auth/make-admin    →  Check User.platformRole === 'platform_admin'
```

---

## Phase 1: Deprecate `User.role` (Safe, No Feature Changes)

### Goal
Replace all `user.role` references with the correct scoped role. Zero user-facing changes.

### Backend Changes

#### 1A. `middleware/auth.js` — Remove `requireAdmin` and `requireEditor`

These check `req.user.role` (global). Replace callers with:
- `requireOrgAdmin` (for org-scoped routes) — ALREADY EXISTS
- `requirePlatformAdmin` (new, for platform-level routes)

```js
// NEW middleware
const requirePlatformAdmin = (req, res, next) => {
  if (req.user.platformRole !== 'platform_admin') {
    return res.status(403).json({ error: 'Platform admin privileges required' });
  }
  next();
};
```

**Files using `requireAdmin`**: Check and replace with appropriate middleware.

#### 1B. `routes/auth.js` — Platform admin checks

| Line | Current | Replace With |
|------|---------|-------------|
| 70 | `role: 'viewer'` (new user default) | Keep for backward compat, but don't rely on it |
| 93 | `role: user.role` in JWT | Remove from JWT payload (not needed — full User loaded on every request) |
| 108, 291, 344 | `role: user.role` in API response | Replace with `organizationRole` (from active org) |
| 376, 413 | `requestingUser.role !== 'admin'` | `requestingUser.platformRole !== 'platform_admin'` |
| 435 | `user.role = role` (update role) | This entire endpoint becomes org-scoped role management |
| 469 | `user.role = 'admin'` (make-admin) | Set `user.platformRole = 'platform_admin'` |

#### 1C. `routes/feedback.js` — Redaction logic (Lines 262-361)

Currently: `redactFeedbackList(feedback, req.user.role)`
Replace with: `redactFeedbackList(feedback, req.organizationRole)`

This is correct because feedback is org-scoped (goes through `resolveTenant`).

#### 1D. `routes/matches.js` — Line 389

Currently: `const userRole = req.user.role`
Replace with: `const userRole = req.organizationRole`

#### 1E. `routes/grounds.js` — Line 540

Currently: `const isAdmin = req.user.role === 'admin'`
Replace with: `const isAdmin = ['owner', 'admin'].includes(req.organizationRole)`

#### 1F. `routes/players.js` — Line 294

Currently: `const userRole = req.organizationRole || req.user.role`
Replace with: `const userRole = req.organizationRole` (remove fallback)

#### 1G. `routes/organizations.js` — Line 71

Currently: `req.user.role = 'admin'` (when creating org)
Remove: This was for backward compat. No longer needed.

#### 1H. `routes/profile.js` — Lines 22, 56, 109

Returns `role` in profile response. Change to return `organizationRole` from active org.

#### 1I. `routes/developer.js` — Line 145

Returns `role: user.role` in response. Change to `role: user.platformRole || 'user'`.

#### 1J. JWT Payload Change

**Before**: `{ userId, email, role }`
**After**: `{ userId, email }` (role not needed in JWT — loaded from DB on every request anyway)

### Frontend Changes

#### 1K. `AuthContext.tsx` — Return org-scoped role

The auth verify/login response should include `organizationRole` (the user's role in their active org). The frontend `user` object should expose this instead of legacy `role`.

```typescript
// AuthContext user object
interface User {
  // ... existing fields
  organizationRole?: 'owner' | 'admin' | 'editor' | 'viewer'; // NEW
  role?: string; // DEPRECATED — keep for transition
}
```

#### 1L. Frontend files to update (replace `user?.role` → `user?.organizationRole`)

| File | Current Check | New Check |
|------|---------------|-----------|
| `AdminDashboard.tsx` | `user?.role === 'admin'` (4 places) | `['owner','admin'].includes(user?.organizationRole)` |
| `SettingsPage.tsx` | `user?.role === 'admin'` (2 places) | `['owner','admin'].includes(user?.organizationRole)` |
| `PlayerProfilePage.tsx` | `user?.role === 'admin'` | `['owner','admin'].includes(user?.organizationRole)` |
| `MobileAdminDashboard.tsx` | `user?.role === 'viewer'` | `user?.organizationRole === 'viewer'` |
| `MobileGroundsTab.tsx` | `user?.role === 'admin'` | `['owner','admin'].includes(user?.organizationRole)` |
| `GroundProfileModal.tsx` | `user?.role === 'admin'` | `['owner','admin'].includes(user?.organizationRole)` |
| `MobileGroundProfile.tsx` | `user?.role === 'admin'` | `['owner','admin'].includes(user?.organizationRole)` |
| `Navigation.tsx` | `currentOrg?.userRole \|\| user.role` | `user?.organizationRole` |
| `MobileNavigation.tsx` | `currentOrg?.userRole \|\| user.role` | `user?.organizationRole` |
| `UserManagement.tsx` | `u.role === 'admin'` etc. | This component manages org members — should use member's org role |

### Breakage Risk Assessment

| Change | Risk | Mitigation |
|--------|------|-----------|
| JWT no longer includes `role` | LOW — No consumer reads role from JWT directly | Auth middleware loads full User from DB |
| API responses use `organizationRole` | MEDIUM — 4 frontend consumers | Add `organizationRole` to response AND keep legacy `role` during transition |
| Feedback redaction | LOW — Same logic, different field | `req.organizationRole` is already available from `resolveTenant` |
| Platform admin checks | LOW — Only used for user management | `platformRole` already exists on User model |
| Frontend role checks | MEDIUM — Many components | Dual-field approach: return both `role` and `organizationRole`, deprecate `role` |

### Safe Migration Strategy

1. **Add `organizationRole` to ALL auth API responses** (alongside existing `role`)
2. **Frontend: read `organizationRole` with fallback to `role`** — `const effectiveRole = user?.organizationRole || user?.role`
3. **Backend: switch checks one file at a time** (each is independently testable)
4. **After all consumers migrated**: Remove `role` from API responses
5. **Final**: Remove `role` field from User model

---

## Phase 2: Tournament Admin Decoupling

### Goal
Tournament uses its own `admins[]` array (like Auction), decoupled from org roles.

### 2A. Model Changes

#### `Tournament.js` — Add `admins[]`

```js
const tournamentAdminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin'],
    default: 'admin',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// Add to tournamentSchema:
admins: {
  type: [tournamentAdminSchema],
  default: [],
},
// Make organizationId OPTIONAL (was required)
organizationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
  default: null,  // Was: required: true
  index: true,
},
```

#### `Franchise.js` — Add team admin support

```js
// Add to franchiseSchema:
admins: [{
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  role: {
    type: String,
    enum: ['team_owner', 'team_admin'],
    default: 'team_admin',
  },
  email: String,
  addedAt: { type: Date, default: Date.now },
}],
// Also add access token for team-level operations (like auction team tokens)
accessToken: {
  type: String,
  unique: true,
  sparse: true,
},
```

### 2B. New Middleware: `tournamentAuth.js`

Mirror `auctionAuth.js` pattern:

```js
// resolveTournamentAdmin — checks Tournament.admins[] for user
// requireTournamentOwner — checks role === 'owner'
// resolveFranchiseAdmin — checks Franchise.admins[] for user
// loadPublicTournament — loads tournament by ID/slug for public routes
```

### 2C. Route Migration

**Before**: `auth, resolveTenant, requireOrgAdmin`
**After**: `auth, resolveTournamentAdmin`

| Route | Current | New |
|-------|---------|-----|
| `POST /api/tournaments` | `auth, resolveTenant, requireOrgAdmin` | `auth` (anyone can create) |
| `PUT /api/tournaments/:id` | `auth, resolveTenant, requireOrgAdmin` | `auth, resolveTournamentAdmin` |
| `POST /:id/publish` | `auth, resolveTenant, requireOrgAdmin` | `auth, resolveTournamentAdmin` |
| `DELETE /api/tournaments/:id` | `auth, resolveTenant, requireOrgAdmin` | `auth, resolveTournamentAdmin, requireTournamentOwner` |
| `GET /api/tournaments` | `auth, resolveTenant` | `auth` (list user's tournaments from admins[]) |
| `GET /api/tournaments/:id` | `auth, resolveTenant` | `auth, resolveTournamentAdmin` |
| `POST /:id/entries` | `auth, resolveTenant, requireOrgAdmin` | `auth, resolveTournamentAdmin` |
| `POST /:id/franchises` | `auth, resolveTenant, requireOrgAdmin` | `auth, resolveTournamentAdmin` |

### 2D. Tournament Frontend Changes

- **Remove organization dependency** — No more `needsOnboarding` for org creation
- **Remove `TournamentOnboarding.tsx`** — No org needed to use tournaments
- **Dashboard** — List tournaments from `GET /api/tournaments` (returns where user is admin)
- **Tournament detail** — Show admin management (invite/remove admins)
- **Franchise management** — Team admin can manage their roster

### 2E. Data Migration

For existing tournaments that have `organizationId`:
- Find all users who are admin/owner of that org
- Add them to `tournament.admins[]` with corresponding roles
- Keep `organizationId` on the document for reference but stop using it for auth

### 2F. Public Routes

Keep the existing public tournament view (by token). No auth changes needed for public access.

---

## Phase 3: Tournament Landing Page (tournament.cricsmart.in)

### Goal
Beautiful, modern landing page for tournament.cricsmart.in that showcases the platform's capabilities.

### Design Direction
- **Color theme**: Violet/purple (matches existing tournament branding across the platform)
- **Style**: Glass-morphism, gradients, modern animations
- **Mobile-first**: Responsive at all breakpoints
- **SEO**: SSR with meta tags, structured data

### Page Structure

#### Hero Section
- Large heading: "Run Your Cricket Tournament Like a Pro"
- Subheading: "Create tournaments, manage teams, track players — all in one place"
- CTA buttons: "Create Tournament" (primary), "View Demo" (secondary)
- Background: Animated gradient with cricket-themed SVG illustrations
- Stats bar: "500+ Tournaments | 10,000+ Players | 50+ Cities"

#### Features Section (3-column grid)
1. **Easy Setup** — Create tournament in minutes, customize branding
2. **Team Management** — Franchise system with team admins, player rosters
3. **Player Registration** — Bulk import via Excel/CSV, public registration links
4. **Live Scoring** (coming soon) — Real-time match updates
5. **Analytics & Reports** — Player stats, team performance dashboards
6. **Auction Integration** — Seamlessly connect with CricSmart Auctions

#### How It Works (3-step)
1. Create your tournament → 2. Add teams & players → 3. Go live & share

#### Social Proof
- Testimonials from tournament organizers
- Logos of organizations using the platform

#### Pricing Section (Simple)
- Free tier: Up to 2 tournaments, 8 teams
- Pro tier: Unlimited tournaments, custom branding, priority support

#### Footer
- Links to CricSmart main site, auction, team management
- Contact info, social media

### Technical Implementation
- **File**: `tournament-frontend/src/pages/LandingPage.tsx`
- **Route**: `/` (when not authenticated)
- **When authenticated**: Redirect to `/dashboard`
- **Framework**: React + Tailwind CSS + Lucide icons (existing stack)
- **Animations**: CSS animations (no extra deps — tournament-frontend doesn't have framer-motion)

---

## Implementation Phases & Priority

### Phase 1: `User.role` Deprecation (Safe, incremental)
**Priority**: HIGH — reduces technical debt, prevents auth confusion
**Effort**: ~2-3 days
**Risk**: LOW (dual-field transition strategy)

Steps:
1. Add `organizationRole` to all auth API responses
2. Add `requirePlatformAdmin` middleware
3. Replace backend `req.user.role` checks one file at a time
4. Update frontend to use `organizationRole` with fallback
5. Remove legacy `role` from responses after all consumers migrated

### Phase 2: Tournament Admin Decoupling
**Priority**: HIGH — needed for tournament independence
**Effort**: ~3-4 days
**Risk**: MEDIUM (requires data migration for existing tournaments)

Steps:
1. Add `admins[]` to Tournament model + `admins[]` to Franchise model
2. Create `tournamentAuth.js` middleware
3. Migrate tournament routes from `resolveTenant` to `resolveTournamentAdmin`
4. Run data migration for existing tournaments
5. Update tournament-frontend to remove org dependency
6. Update onboarding flow — no org creation needed

### Phase 3: Tournament Landing Page
**Priority**: MEDIUM — improves user acquisition
**Effort**: ~1-2 days
**Risk**: LOW (new code, no existing functionality affected)

Steps:
1. Design and build `LandingPage.tsx`
2. Update routing: show landing when not authenticated
3. Add SEO meta tags

---

## Files Affected (Complete List)

### Backend (Phase 1 — User.role deprecation)
- `middleware/auth.js` — Add `requirePlatformAdmin`, deprecate `requireAdmin`/`requireEditor`
- `routes/auth.js` — Platform admin checks, remove `role` from JWT, add `organizationRole` to responses
- `routes/feedback.js` — Replace `req.user.role` → `req.organizationRole`
- `routes/matches.js` — Replace `req.user.role` → `req.organizationRole`
- `routes/grounds.js` — Replace `req.user.role` → `req.organizationRole`
- `routes/players.js` — Remove fallback to `req.user.role`
- `routes/organizations.js` — Remove `req.user.role = 'admin'` line
- `routes/profile.js` — Return `organizationRole` instead of `role`
- `routes/developer.js` — Use `platformRole`

### Backend (Phase 2 — Tournament decoupling)
- `models/Tournament.js` — Add `admins[]`, make `organizationId` optional
- `models/Franchise.js` — Add `admins[]`, `accessToken`
- `middleware/tournamentAuth.js` — NEW: `resolveTournamentAdmin`, `requireTournamentOwner`, `resolveFranchiseAdmin`
- `routes/tournaments.js` — Replace `resolveTenant, requireOrgAdmin` → `resolveTournamentAdmin`
- `middleware/tenantResolver.js` — Remove `ensureTournamentOrg` (now unused)

### Frontend (Phase 1 — User.role deprecation)
- `contexts/AuthContext.tsx` — Add `organizationRole` to user state
- `components/AdminDashboard.tsx` — 5 places
- `pages/SettingsPage.tsx` — 2 places
- `pages/PlayerProfilePage.tsx` — 1 place
- `components/mobile/MobileAdminDashboard.tsx` — 1 place
- `components/mobile/MobileGroundsTab.tsx` — 1 place
- `components/GroundProfileModal.tsx` — 1 place
- `components/mobile/MobileGroundProfile.tsx` — 1 place
- `components/Navigation.tsx` — 2 places
- `components/mobile/MobileNavigation.tsx` — 1 place
- `components/UserManagement.tsx` — 6+ places (entire component uses `user.role`)

### Tournament Frontend (Phase 2 + 3)
- `contexts/AuthContext.tsx` — Remove org dependency
- `components/TournamentOnboarding.tsx` — Remove (no longer needed)
- `pages/DashboardPage.tsx` — List user's tournaments via `admins[]` query
- `pages/LandingPage.tsx` — NEW: Beautiful landing page
- `App.tsx` — Update routing, remove org onboarding gate
- `services/api.ts` — Update API calls (remove org header)

---

## Testing Strategy

### Phase 1 Tests
- [ ] Login returns `organizationRole` field in response
- [ ] `organizationRole` matches user's role in their active org
- [ ] Frontend admin tabs still visible for org admins
- [ ] Frontend admin tabs hidden for org viewers
- [ ] Feedback redaction works with org role
- [ ] Platform admin can still manage users
- [ ] JWT works without `role` field
- [ ] All 4 frontend consumers still work (main app, tournament, mobile, SEO site)

### Phase 2 Tests
- [ ] Create tournament without org → works
- [ ] Tournament creator is auto-added as owner in admins[]
- [ ] Invite co-admin to tournament → works
- [ ] Co-admin can manage tournament
- [ ] Non-admin cannot modify tournament → 403
- [ ] Existing tournaments migrated correctly (org admins → tournament admins)
- [ ] Franchise team admin can manage their roster
- [ ] Public tournament view still works
- [ ] Tournament dashboard lists correct tournaments per user

### Phase 3 Tests
- [ ] Landing page renders correctly on mobile and desktop
- [ ] Unauthenticated users see landing page
- [ ] Authenticated users redirected to dashboard
- [ ] SEO meta tags present
- [ ] All links work (CTA, navigation)
