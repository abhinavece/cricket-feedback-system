# CricSmart Auctions — Final System Design Spec

Production-ready design for a world-class online cricket auction system with real-time bidding, admin undo stack, tiered bid increments, retention system, post-auction trading, broadcast view for YouTube streaming, and analytics — standalone initially, extensible for org/tournament linkage.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTS                               │
│  Admin UI  │  Team Bidding UI  │  Spectator/Stream View  │
└─────┬──────┴────────┬──────────┴──────────┬──────────────┘
      │               │                     │
      ▼               ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│              WebSocket Gateway (Socket.IO)               │
│  Rooms: auction:{id}, team:{id}, admin:{auctionId}       │
└─────┬───────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│              Auction Engine (Server-Side)                 │
│  State Machine │ Timer │ Bid Validator │ Undo Stack       │
└─────┬───────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│              MongoDB (Persistent State)                   │
│  Auction │ AuctionTeam │ AuctionPlayer │ ActionEvent     │
│  BidAuditLog │ AuctionTrade                              │
└─────────────────────────────────────────────────────────┘
```

### Key Principles
- **Server-Authoritative**: ALL bid validation, timer management, and state transitions happen server-side. Clients are dumb renderers.
- **Standalone First**: Auction system has its own admin/auth layer. Extensible for org/tournament linkage later.
- **Resource-Level Roles**: Roles stored on the auction itself (admin of Auction X ≠ admin of Auction Y).
- **One Active Auction**: Per creator/org — only one auction can be LIVE at a time.

---

## 2. Auction Lifecycle (State Machine)

```
DRAFT ──→ CONFIGURED ──→ LIVE ──⇄── PAUSED ──→ COMPLETED ──→ TRADE_WINDOW (48h) ──→ FINALIZED
                           │                        ▲
                           └────────────────────────┘
                              (admin force-end)
```

| State | Description |
|-------|-------------|
| **DRAFT** | Auction created. Teams, players, config being set up. |
| **CONFIGURED** | All settings locked. Ready to go live. |
| **LIVE** | Bidding in progress. Players being auctioned. |
| **PAUSED** | Admin paused. **If mid-bidding: current player's bids voided, player returns to pool.** On resume, fresh random player picked. |
| **COMPLETED** | All rounds done, all squads full, no team can afford base price, or admin ended it. |
| **TRADE_WINDOW** | 48-hour window after completion. Teams can propose player-for-player swaps (max 2 per team). Admin approves. |
| **FINALIZED** | No more changes. Read-only archive accessible to all viewers. |

### Completion Triggers
- All players from pool auctioned across all rounds
- All teams reached maxSquadSize
- **Auto-warning**: No team can afford base price → admin notified, can force-end
- Admin manually ends the auction

### Per-Player Bidding Flow (Sub-State Machine)

```
SERVER_PICKS_RANDOM → PLAYER_REVEALED (3s) → BIDDING_OPEN → [BID_PLACED ⇄ TIMER_RESET]
    → GOING_ONCE (5s) → GOING_TWICE (5s) → SOLD / UNSOLD
```

- **Next player is picked randomly on-the-fly** from remaining pool (no pre-shuffled queue — nobody knows who's next)
- Timer starts at `BIDDING_OPEN` (configurable, default 30s)
- Each new bid resets timer to configurable duration (default 15s)
- When timer expires: `GOING_ONCE` (5s) → `GOING_TWICE` (5s) → final
- If bid during GOING_ONCE/TWICE → back to `BIDDING_OPEN` with reset timer
- **If admin pauses mid-bidding**: all bids for current player voided, player returns to pool

---

## 3. Data Models

### 3.1 Auction (Core)

```javascript
Auction {
  _id,
  // Extensible: organizationId and tournamentId added later
  organizationId: ObjectId (optional, for future org linkage),
  tournamentId: ObjectId (optional, for future tournament linkage),

  name, slug, description,
  status: enum['draft','configured','live','paused','completed','trade_window','finalized'],

  config: {
    basePrice: Number,              // UNIFORM for all players, e.g., 100000 (1 lac)
    purseValue: Number,             // SAME for all teams, e.g., 2000000 (20 lac)
    bidIncrementTiers: [{           // TIERED, admin-configurable
      upTo: Number,                 // e.g., 100000
      increment: Number             // e.g., 10000
    }],                             // last tier has upTo: null (applies to everything above)
    bidIncrementPreset: String,     // 'standard' | 'premium' | 'custom'
    timerDuration: Number,          // seconds for initial bidding window (default 30)
    bidResetTimer: Number,          // seconds after each bid (default 15)
    goingOnceTimer: Number,         // seconds for going-once phase (default 5)
    goingTwiceTimer: Number,        // seconds for going-twice phase (default 5)
    minSquadSize: Number,           // e.g., 15
    maxSquadSize: Number,           // e.g., 20
    maxRounds: Number,              // rounds for unsold players (default 3)
    playerRevealDelay: Number,      // seconds to show player before bidding (default 3)
    retentionEnabled: Boolean,      // pre-auction retention
    maxRetentions: Number,          // max retentions per team (configurable)
    retentionCost: Number,          // 0 initially (configurable later for base price deduction)
    maxTradesPerTeam: Number,       // default 2
    tradeWindowHours: Number,       // default 48
    maxUndoActions: Number,         // default 3 (max consecutive player undos)
  },

  currentRound: Number,
  remainingPlayerIds: [ObjectId],   // players still in pool (random pick from this)
  currentBiddingState: {
    playerId: ObjectId,
    status: enum['waiting','revealed','open','going_once','going_twice','sold','unsold'],
    currentBid: Number,
    currentBidTeamId: ObjectId,
    bidHistory: [{ teamId, amount, timestamp }],
    timerExpiresAt: Date,
    timerStartedAt: Date,
  },

  // Resource-level roles (standalone, not org-dependent)
  admins: [{ userId: ObjectId, role: enum['owner','admin'], email: String, addedAt: Date }],
  createdBy: ObjectId,

  completedAt: Date,
  tradeWindowEndsAt: Date,         // completedAt + 48h
  finalizedAt: Date,
  analytics: {},                    // populated at completion

  // Display config for player pool table
  displayConfig: {
    visibleColumns: [String],
    sortableColumns: [String],
    filterableColumns: [String],
  },

  isActive: Boolean,
  isDeleted: Boolean,
}
```

### 3.2 AuctionTeam

```javascript
AuctionTeam {
  _id, auctionId,

  name, shortName (max 5 chars, uppercase), logo,
  primaryColor, secondaryColor,

  owner: { name: String, email: String, phone: String },

  // Auth: unique access code for team bidding login
  accessCode: String (hashed),
  accessToken: String (unique URL token),

  // Financials (uniform initial purse from auction config)
  purseValue: Number,           // = auction.config.purseValue (same for all)
  purseRemaining: Number,       // updated on buy/undo/disqualify refund
  // maxBid = COMPUTED per bid validation (not stored, calculated real-time)

  // Squad — bought players
  players: [{ playerId: ObjectId, boughtAt: Number, round: Number, boughtTimestamp: Date }],

  // Retained players (added separately, not from pool)
  retainedPlayers: [{
    name: String, role: String, imageUrl: String,
    stats: Mixed,               // same fields as pool players
    isCaptain: Boolean,         // one per team
    retentionCost: Number,      // 0 initially, configurable later
  }],

  // Computed (virtual)
  // squadSize = players.length + retainedPlayers.length
  // maxBid = purseRemaining - (minSquadSize - squadSize - 1) * basePrice
  //          clamped: max(basePrice, maxBid); if squadSize >= minSquadSize → maxBid = purseRemaining

  // Trading
  tradesUsed: Number,           // max = auction.config.maxTradesPerTeam (default 2)

  isActive: Boolean,
}
```

### 3.3 AuctionPlayer (Pool Players)

```javascript
AuctionPlayer {
  _id, auctionId,
  playerNumber: Number,        // assigned sequential number
  name, imageUrl, role,        // batsman, bowler, all-rounder, wk

  // Custom/dynamic fields from XLSX/CSV import
  customFields: Map<String, Mixed>,  // age, company, batting_style, etc.

  // ALL players have same base price (= auction.config.basePrice)
  status: enum['pool','in_auction','sold','unsold','disqualified'],

  // Sale info
  soldTo: ObjectId (AuctionTeam),
  soldAmount: Number,
  soldInRound: Number,

  // Rounds tracking (base price stays same across rounds — no reduction)
  roundHistory: [{
    round: Number,
    result: enum['sold','unsold','skipped','voided'],  // voided = admin paused mid-bid
    highestBid: Number,
    highestBidTeam: ObjectId,
  }],

  // Player self-validation
  validationToken: String,
  validationStatus: enum['pending','verified','flagged'],
  flaggedIssues: [{ field: String, message: String, flaggedAt: Date }],

  // Import metadata
  importSource: enum['excel','manual'],
  importRow: Number,

  isDisqualified: Boolean,
  disqualifiedAt: Date,
  disqualifiedBy: ObjectId,
  disqualificationReason: String,
}
```

### 3.4 ActionEvent (Undo Stack)

```javascript
ActionEvent {
  _id, auctionId,
  sequenceNumber: Number,      // monotonically increasing
  type: enum[
    'BID_PLACED', 'PLAYER_SOLD', 'PLAYER_UNSOLD',
    'PLAYER_DISQUALIFIED', 'PLAYER_REINSTATED',
    'TRADE_EXECUTED', 'MANUAL_OVERRIDE',
    'PURSE_ADJUSTED', 'PLAYER_DATA_UPDATED',
    'RETENTION_ADDED', 'AUCTION_PAUSED', 'AUCTION_RESUMED',
  ],

  // Forward state (what happened)
  payload: {
    playerId, teamId, amount, previousTeamId, etc.
  },

  // Reverse state (how to undo)
  reversalPayload: {
    playerId, teamId, amount, previousStatus, etc.
  },

  performedBy: ObjectId,       // admin userId
  isUndone: Boolean,
  undoneAt: Date,
  undoneBy: ObjectId,

  // Public visibility flag
  isPublic: Boolean,           // shown to all viewers
  publicMessage: String,       // e.g., "Admin reversed sale of Player X"

  timestamp: Date,
}
```

### 3.5 AuctionTrade (Post-Auction, Player-for-Player Swap Only)

```javascript
AuctionTrade {
  _id, auctionId,
  fromTeamId, toTeamId,

  // Player-for-player swap only (no money)
  fromPlayers: [{ playerId: ObjectId, name: String }],
  toPlayers: [{ playerId: ObjectId, name: String }],

  proposedBy: ObjectId,        // team userId who proposed
  status: enum['proposed','approved','rejected','executed'],
  approvedBy: ObjectId,        // admin who approved
  executedAt: Date,
  publicAnnouncement: String,  // auto-generated, broadcast to all viewers
}
```

### 3.6 BidAuditLog (Rejection & Activity Tracking)

```javascript
BidAuditLog {
  _id, auctionId,
  teamId: ObjectId,
  playerId: ObjectId,
  type: enum['bid_accepted','bid_rejected','bid_voided'],
  attemptedAmount: Number,
  reason: String,              // e.g., "Purse insufficient", "Max bid exceeded", "Bid lock active"
  purseAtTime: Number,
  maxBidAtTime: Number,
  isPublic: Boolean,           // true — everyone sees rejection reasons
  timestamp: Date,
}
```

---

## 4. Max Bid Constraint — Deep Dive

### The Formula

```
squadSize = boughtPlayers.length + retainedPlayers.length
maxBid = purseRemaining - (minSquadSize - squadSize - 1) * basePrice
```

- **`-1`** accounts for the player currently being bid on (buying them fills one slot)
- **`basePrice`** = auction-level `config.basePrice` (UNIFORM for all players)
- Clamped: `maxBid = max(basePrice, maxBid)` — can always bid at least base price if affordable
- If `squadSize >= minSquadSize` → `maxBid = purseRemaining` (no constraint, min squad already met)
- If `purseRemaining < basePrice` → team **locked out** of bidding entirely

### Walk-Through Example (purse=20L, base=1L, minSquad=15)

| Scenario | Purse | Squad | Max Bid | Notes |
|----------|-------|-------|---------|-------|
| Start (0 bought, 0 retained) | 20L | 0 | 20-(15-0-1)*1 = **6L** | |
| 2 retained players, 0 bought | 20L | 2 | 20-(15-2-1)*1 = **8L** | Retentions help |
| After buying P1 at 6L | 14L | 1 | 14-(15-1-1)*1 = **1L** | Base price only |
| After buying P1 at 3L | 17L | 1 | 17-13 = **4L** | |
| Squad = 15 (min met) | 2L | 15 | **2L** | Full purse available |
| Purse = 50k | 50k | 5 | 50k < 1L | **Locked out** |

### Edge Cases (Finalized)

1. **Uniform base price** — no variable pricing per player (confirmed)
2. **Retained players count toward squadSize** — retention cost is 0 initially (configurable later)
3. **Team locked out** → grayed out in UI, public message: "Team X: insufficient purse"
4. **maxBid < currentBid** → "Bid" button disabled, tooltip: "Cannot maintain minimum squad"
5. **Undo refunds purse** → maxBid recalculated immediately after undo

---

## 5. Undo Stack Design

### Rules
- Undo stack operates on **ActionEvents** in LIFO order
- Admin can undo up to last **3 player-level actions** (configurable)
- Non-player actions (pause/resume) are NOT undoable
- Each undo triggers a **public notification** to all connected clients

### Undo Cascade Logic

| Action Type | Undo Effect |
|-------------|-------------|
| PLAYER_SOLD | Return player to pool/unsold, refund amount to team's purse, decrement squad |
| PLAYER_UNSOLD | Return player to in_auction state, restart bidding |
| PLAYER_DISQUALIFIED (unsold) | Reinstate to pool |
| PLAYER_DISQUALIFIED (sold) | Reinstate + return to team + deduct from purse |
| TRADE_EXECUTED | Reverse player transfers, reverse purse adjustments |
| MANUAL_OVERRIDE | Restore previous values from reversalPayload |

### Implementation
```javascript
// Server-side undo handler
async function undoLastAction(auctionId, adminUserId) {
  const lastAction = await ActionEvent.findOne({
    auctionId, isUndone: false
  }).sort({ sequenceNumber: -1 });

  if (!lastAction) throw new Error('Nothing to undo');

  // Apply reversalPayload
  await applyReversal(lastAction);

  // Mark as undone
  lastAction.isUndone = true;
  lastAction.undoneBy = adminUserId;
  lastAction.undoneAt = new Date();
  await lastAction.save();

  // Broadcast to all clients
  io.to(`auction:${auctionId}`).emit('admin:undo', {
    action: lastAction.type,
    message: lastAction.publicMessage,
  });
}
```

---

## 6. Real-Time WebSocket Architecture

### Socket.IO Rooms
- `auction:{auctionId}` — all viewers (spectators + teams + admins)
- `team:{teamId}` — private channel for team-specific data (purse, maxBid)
- `admin:{auctionId}` — admin-only channel (undo controls, internal messages)

### Event Catalog

| Event | Direction | Description |
|-------|-----------|-------------|
| `auction:state` | Server→All | Full auction state sync (on connect) |
| `auction:status_change` | Server→All | LIVE/PAUSED/COMPLETED |
| `player:revealed` | Server→All | New player up for auction (with 3s reveal) |
| `bid:placed` | Server→All | New bid {teamName, amount, timestamp} |
| `bid:rejected` | Server→Team | Bid rejected with reason |
| `timer:sync` | Server→All | Timer countdown sync (every 1s) |
| `player:sold` | Server→All | Player sold {player, team, amount} + animation trigger |
| `player:unsold` | Server→All | Player unsold + animation trigger |
| `player:disqualified` | Server→All | Player disqualified with reason |
| `admin:undo` | Server→All | Action reversed with public message |
| `admin:announcement` | Server→All | Admin broadcast message |
| `trade:executed` | Server→All | Trade completed notification |
| `round:started` | Server→All | New round beginning |
| `auction:analytics` | Server→All | Final analytics on completion |
| `team:bid` | Team→Server | Team places a bid |
| `admin:action` | Admin→Server | Admin performs an action |

### Bid Processing Flow
```
Team clicks "Bid" → client emits team:bid
  → Server validates:
    1. Auction is LIVE, bidding is OPEN
    2. Team is authenticated
    3. Bid amount = currentBid + increment (no custom amounts)
    4. Team purse allows this bid (maxBid check)
    5. Team is not already the highest bidder
    6. Server timestamp assigned (high-precision)
  → If valid: update state, broadcast bid:placed, reset timer
  → If invalid: emit bid:rejected to team only
```

---

## 7. Tie-Breaker Logic

### Scenario: Two bids arrive "simultaneously"
- **Server timestamps** every bid with `Date.now()` (ms precision)
- If two bids have the **same millisecond timestamp**: 
  - Option A: First-processed wins (network advantage)
  - Option B: Admin decides (auction pauses for admin input)
  - **Recommended**: Option A with a **bid lock window** — once a bid is received, a 200ms lock prevents other bids, ensuring clean sequencing

### Implementation
```javascript
let bidLock = false;

async function processBid(teamId, auctionId) {
  if (bidLock) return { rejected: true, reason: 'Bid processing in progress' };
  bidLock = true;
  try {
    // validate and process
  } finally {
    setTimeout(() => { bidLock = false; }, 200); // 200ms lock window
  }
}
```

---

## 8. Authentication & Roles

### Access Model (Resource-Level Roles)
| Role | Auth Method | Capabilities |
|------|-------------|-------------|
| **Auction Owner** | Google OAuth (creator) | Full control, invite co-admins |
| **Auction Admin** | Google OAuth (invited by email) | Full control except delete auction |
| **Team Owner** | Unique access code + magic link | Bid, view own purse/squad, propose trades |
| **Spectator** | No auth (public link) | View-only: sold/unsold/upcoming players, real-time updates |

### Standalone Auth (Decoupled from Org)
- Auction creator becomes `owner` (Google OAuth, existing auth system)
- Creator invites co-admins by email → they login via Google OAuth → added to `auction.admins[]`
- Roles are per-auction, not global. Same user can be admin on Auction X, spectator on Auction Y.
- **Extensible**: When org linkage is added later, org admins auto-inherit auction admin role.

### Team Login Flow
1. Admin creates auction → adds teams → system generates unique **access code** (6-char alphanumeric) and **magic link** per team
2. Team owner receives link via WhatsApp/email
3. Opens link → enters access code → authenticated via JWT with `teamId` claim
4. JWT valid only for that auction session

### Spectator Access
- Public URL: `/auction/{slug}/live` — no auth required
- Can see: current bidding, all sold/unsold players, upcoming pool (full details), team squads
- Cannot see: admin controls, team purse details (only public purse remaining)

---

## 9. Player Pool Import (XLSX/CSV Only)

### Import Flow
```
Upload XLSX/CSV → Detect columns → Column mapping UI → Preview data → Confirm import
```

1. **Upload**: Admin uploads XLSX or CSV file
2. **Detection**: System reads headers, detects column types
3. **Mapping**: UI shows detected columns → admin maps to standard fields:
   - Required: `name`, `role`
   - Optional: `age`, `batting_style`, `bowling_style`, `company`, `imageUrl`, etc.
   - Any unmapped columns → stored in `customFields`
4. **Preview**: Show first 10 rows for validation
5. **Import**: Create AuctionPlayer records, assign sequential numbers

### Dynamic Columns & Sorting
- `customFields` stored as a Map — fully dynamic
- Admin configures which columns are **sortable/filterable** via `auction.displayConfig`:
```javascript
displayConfig: {
  visibleColumns: ['name', 'role', 'age', 'batting_style', 'company'],
  sortableColumns: ['name', 'role', 'age'],  // admin chooses — e.g., NOT on DOB
  filterableColumns: ['role', 'batting_style'],
}
```

### Player Self-Validation
- Each player gets a unique `validationToken` URL
- URL shows their data in read-only form with a "Flag Issue" button per field
- Flagged issues appear in admin dashboard for review
- For 200+ players: bulk-send validation links via WhatsApp (existing integration)

---

## 10. Broadcast View (YouTube Streaming — V1)

### Approach: Dedicated URL + OBS Studio
- System provides a **clean broadcast URL**: `/auction/{slug}/broadcast`
- No admin controls, optimized for screen capture, dark theme
- Admin captures browser tab with **OBS Studio** → streams to YouTube via RTMP
- Simple, reliable solution for V1

### Broadcast View Features
- Full-screen player card with photo, stats, base price
- Large timer countdown with going-once/going-twice phases
- Live bid ticker (team name, amount, animation)
- Team logos with purse bars
- Sold animation: confetti + team color overlay + hammer
- Unsold animation: gray stamp + "Will return in Round N"
- `LIVE` / `BREAK` / `COMPLETED` status indicator
- Auction round & player count progress bar
- Retained players shown with "RETAINED" + "CAPTAIN" badges

### Future (Phase 2+): YouTube Live API Integration
- Auto-create live broadcast, embed chat

---

## 11. Animations & UX

### Player Sold Animation
- Confetti explosion + team color overlay
- Player card flies to winning team's panel
- "SOLD!" text with hammer animation
- Team logo pulse effect
- Amount counter animation (counting up to final bid)

### Player Unsold Animation
- Card grays out with "UNSOLD" stamp
- Subtle shake animation
- Card slides to "unsold pool" section
- Round badge: "Will return in Round 2"

### Status Bar
- Persistent top bar: `🔴 LIVE` / `⏸️ BREAK` / `✅ COMPLETED`
- Admin can toggle between LIVE and BREAK at any time
- During BREAK: show "Auction will resume shortly" with optional custom message

---

## 12. Admin Capabilities Summary

| Capability | Description |
|------------|-------------|
| **Undo** | Revert last N player actions (LIFO stack) |
| **Pause/Resume** | Stop/start auction at any time, state preserved |
| **Disqualify** | Remove player (sold → refund purse, unsold → remove from pool) |
| **Search** | Find any player by name/number/status, edit details |
| **Override** | Update sold amount, reassign team, change player data |
| **Trade** | Execute inter-team trades with public notification |
| **Force End** | Complete auction regardless of remaining players |
| **Announcement** | Broadcast public message to all viewers |
| **Timer Control** | Pause timer, extend timer, skip player |
| **Import/Export** | Import player pool, export results |

---

## 13. Analytics (Post-Auction)

### Auto-Generated Stats
- **Top N highest-bid players** (with rank, amount, team)
- **Most competitive player** (most bid rounds before sold)
- **Team spending breakdown** (pie chart: amount per team)
- **Category-wise analysis** (avg price by role: batsman, bowler, etc.)
- **Round-wise analysis** (players sold per round, avg price per round)
- **Unsold players list** with highest rejected bid
- **Purse utilization** per team (spent vs remaining)
- **Bid frequency** (which team bid most aggressively)
- **Time analysis** (avg time per player, longest bidding war)
- **Squad composition** per team (role distribution)
- **Value picks** (players bought at base price who had high stats)
- **Premium picks** (highest multiplier over base price)

### Export
- PDF report with charts
- Excel export of all auction data
- Shareable analytics link (public URL)

---

## 14. Multi-Tenant & Extensibility

### V1: Fully Standalone (Confirmed)
- **No organization required** — `organizationId` stays `null` in V1
- Auction has its own admin system (creator + invited admins via `auction.admins[]`)
- Auth via Google OAuth for admins, access codes for teams
- **Product isolation**: logging into auction does NOT grant team management or tournament access (and vice versa)
- One active (LIVE) auction per creator at a time
- Hosted on **auction.cricsmart.in** (Next.js, SSR for SEO)

### Future: Org & Tournament Linkage
- Set `organizationId` to link auction to an org → org admins auto-inherit auction admin role
- Set `tournamentId` to link auction to a tournament → tournament teams/players can be imported
- Uses existing `resolveTenant` middleware when org linkage is active
- Structure designed to support this without schema changes

> See `003-implementation-architecture.md` for full auth isolation design, URL structure, and deployment details.

---

## 15. API Routes (High-Level)

```
# Auction CRUD & Lifecycle
POST   /api/v1/auctions                         - Create auction
GET    /api/v1/auctions/:id                      - Get auction details
PATCH  /api/v1/auctions/:id/config               - Update config (draft only)
POST   /api/v1/auctions/:id/go-live              - Start auction
POST   /api/v1/auctions/:id/pause                - Pause (voids current bid if mid-bidding)
POST   /api/v1/auctions/:id/resume               - Resume (picks fresh random player)
POST   /api/v1/auctions/:id/complete             - End auction → TRADE_WINDOW

# Admin Management
POST   /api/v1/auctions/:id/admins               - Invite co-admin by email
DELETE /api/v1/auctions/:id/admins/:userId        - Remove co-admin

# Teams
POST   /api/v1/auctions/:id/teams                - Add team
PATCH  /api/v1/auctions/:id/teams/:tid            - Update team
POST   /api/v1/auctions/:id/teams/:tid/retain     - Add retained player (with captain flag)
GET    /api/v1/auctions/:id/teams                 - List teams with squads

# Player Pool
POST   /api/v1/auctions/:id/players/import        - Import from XLSX/CSV
GET    /api/v1/auctions/:id/players               - List players (filters: status, role, search)
PATCH  /api/v1/auctions/:id/players/:pid          - Update player data
POST   /api/v1/auctions/:id/players/:pid/disqualify - Disqualify player

# Bidding (team auth via JWT)
POST   /api/v1/auctions/:id/bid                   - Place bid
GET    /api/v1/auctions/:id/bid-audit              - Bid audit log (admin)

# Admin Actions
POST   /api/v1/auctions/:id/undo                  - Undo last player action (max 3)
POST   /api/v1/auctions/:id/announce               - Broadcast public announcement
POST   /api/v1/auctions/:id/skip-player            - Skip current player (back to pool)

# Trading (post-auction, TRADE_WINDOW state)
POST   /api/v1/auctions/:id/trades                 - Propose trade (team auth)
PATCH  /api/v1/auctions/:id/trades/:tradeId        - Approve/reject trade (admin)
GET    /api/v1/auctions/:id/trades                 - List trades

# Analytics & Views
GET    /api/v1/auctions/:id/analytics              - Post-auction analytics
GET    /api/v1/auctions/:id/broadcast              - Broadcast-ready view data

# Player Self-Validation
GET    /api/v1/auctions/:id/validate/:token        - View own data
POST   /api/v1/auctions/:id/validate/:token/flag   - Flag an issue

# Auth
POST   /api/v1/auctions/team-login                 - Team auth (access code → JWT)
```

---

## 16. Tech Stack

| Component | Technology |
|-----------|------------|
| **Auction Frontend** | Next.js 14 (App Router, SSR/SSG) — `auction-frontend/` |
| **Hosting** | auction.cricsmart.in (Cloud Run) |
| **Styling** | Tailwind CSS (dark slate, amber/orange accents) |
| **Icons** | Lucide React |
| **WebSocket** | Socket.IO on existing backend (Cloud Run session affinity) |
| **Excel parsing** | `xlsx` (SheetJS) npm package |
| **Animations** | Framer Motion + CSS animations |
| **Timer sync** | Server-authoritative with NTP-style offset |
| **Charts** | recharts (analytics) |
| **Sitemap** | next-sitemap |
| **YouTube API** | `googleapis` npm (optional Phase 2) |
| **PDF export** | `puppeteer` or `pdfkit` for analytics report |

---

## All Confirmed Decisions (24 Questions — 3 Rounds)

| # | Topic | Decision |
|---|-------|----------|
| Q1 | Base Prices | **Uniform** — all players same base price |
| Q2 | Retention | **Yes** — configurable N retentions per team |
| Q3 | RTM | **No** for V1 — **future TODO** |
| Q4 | Bid Increment | **Tiered, admin-configurable** with preset templates |
| Q5 | Import Format | **XLSX/CSV only** |
| Q6 | Concurrent | **One active auction** per creator; standalone initially |
| Q7 | Tournament Link | **Standalone** — extensible for future |
| Q8 | Trading | **Post-auction only** |
| Q9 | Unsold Base Price | **No reduction** — **future TODO** |
| Q10 | Spectator Chat | **Skip for V1** — extensible |
| Q11 | Retention Source | Added **separately** (not from pool), **zero cost** initially |
| Q12 | Auth/Roles | Google OAuth, **resource-level roles** |
| Q13 | Queue Visibility | Full details visible, **order random on-the-fly** |
| Q14 | Purse | **Uniform** for all teams |
| Q15 | YouTube | **Broadcast View URL + OBS** for V1 |
| Q16 | Auto-End | **Warning** when no team can afford; admin decides |
| Q17 | Increment Tiers | **Preset templates** + custom builder |
| Q18 | Bid Rejection | **Public** — everyone sees reason + audit log |
| Q19 | Undo | LIFO, **up to 3** player results, undone player → pool |
| Q20 | Role System | **Resource-level** — per auction/tournament |
| Q21 | Retained Players | **Full details** + captain designation, shown in UI |
| Q22 | Trading Details | **Team-initiated**, admin-approved, max 2, 48h window, swap only |
| Q23 | Post-Completion | **Read-only archive**, trades during 48h window only |
| Q24 | Pause Mid-Bid | **Void current bids**, player → pool, fresh pick on resume |

---

## Future TODOs (Documented for Later)

- **RTM (Right to Match)** — previous team can match winning bid (IPL-style)
- **Unsold base price reduction** — admin can lower base price in Round 2+
- **Spectator chat** — built-in chat on auction page
- **YouTube Live API** — auto-create broadcasts, embed chat
- **PDF player import** — parse structured data from PDFs
- **Org/Tournament linkage** — connect auctions to organizations and tournaments
- **Retention cost** — deduct configurable amount from purse for each retention
- **Multiple concurrent auctions** per org

---

## Implementation Phases

### Phase 1: Foundation (Backend Models + Core Engine)
- Mongoose models: Auction, AuctionTeam, AuctionPlayer, ActionEvent, BidAuditLog, AuctionTrade
- Auction CRUD + config (with bid increment tier presets)
- Team management + retained players with captain
- Player pool XLSX/CSV import with column mapping
- Resource-level admin auth (Google OAuth + invite)
- Team auth (access code + magic link → JWT)

### Phase 2: Real-Time Bidding Engine
- Socket.IO WebSocket gateway with rooms
- Server-authoritative state machine (all 7 states)
- Random on-the-fly player selection
- Timer management (bidding → going-once → going-twice → sold/unsold)
- Bid validation (purse, maxBid, bid lock, tiered increment)
- BidAuditLog for rejections (public)
- Pause mid-bidding (void bids, return player to pool)

### Phase 3: Admin Power Tools
- Undo stack (last 3 player results, LIFO)
- Player disqualification with purse refund
- Manual overrides (amount, team, player data)
- Player search & edit
- Public announcements
- Skip player (return to pool)
- Auto-warning: no team can afford base price

### Phase 4: Frontend — Spectator, Team & Admin UIs
- Spectator view: live bidding, sold/unsold/upcoming players, team squads
- Team bidding UI: bid button, purse display, squad, maxBid indicator
- Admin dashboard: all controls, undo, pause, announce, manage teams/players
- Mobile-responsive for all views
- Retained player badges (RETAINED + CAPTAIN)

### Phase 5: Animations & Broadcast View
- Sold animation (confetti, team color, hammer, amount counter)
- Unsold animation (gray stamp, shake, "Round 2" badge)
- Status bar (LIVE / BREAK / COMPLETED)
- Broadcast view URL (`/auction/{slug}/broadcast`) — OBS-ready

### Phase 6: Post-Auction Features
- TRADE_WINDOW state (48h after completion)
- Team-initiated player-for-player swaps (max 2 per team)
- Admin approval flow for trades
- Auto-transition to FINALIZED after 48h
- Read-only archive view

### Phase 7: Analytics & Export
- Post-auction analytics dashboard (12+ stat categories)
- PDF/Excel export
- Shareable public analytics link
- Player self-validation links

### Phase 8: Testing & Edge Cases
- Unit tests for bid validation, maxBid formula, undo stack
- Integration tests for WebSocket event flow
- Edge case tests: simultaneous bids, pause mid-bid, purse exhaustion
- Load testing for concurrent WebSocket connections

---

## Plan of Action (Next Steps)

1. ✅ Design finalized — all 24 questions answered
2. ✅ Planning docs created — `plannings/auction-system/`
3. ✅ Implementation architecture confirmed — auth isolation, Next.js, SEO, infra
4. **Implement** — Phase 1: Backend models + CRUD + public SEO endpoints
5. **Scaffold** — `auction-frontend/` Next.js app
6. **Iterate** — Phase by phase, with tests at each stage

> Full implementation details in `003-implementation-architecture.md`
