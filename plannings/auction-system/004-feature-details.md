# CricSmart Auction System — Feature Details

> Comprehensive documentation of every feature implemented across all phases.
> Last updated: Feb 2025

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Models](#2-data-models)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Admin Dashboard & Auction Management](#4-admin-dashboard--auction-management)
5. [Team Management](#5-team-management)
6. [Player Management](#6-player-management)
7. [Dynamic Column Import & Player Fields](#7-dynamic-column-import--player-fields)
8. [Real-Time Bidding Engine](#8-real-time-bidding-engine)
9. [Live Views (Spectator, Team, Admin, Broadcast)](#9-live-views)
10. [Admin Power Tools](#10-admin-power-tools)
11. [Post-Auction Trading](#11-post-auction-trading)
12. [Analytics & Public Pages](#12-analytics--public-pages)
13. [SEO Infrastructure](#13-seo-infrastructure)
14. [Export & Reporting](#14-export--reporting)
15. [Admin Extended Tools (Phase 9)](#15-admin-extended-tools-phase-9)
16. [UI/UX Design System](#16-uiux-design-system)
17. [API Reference](#17-api-reference)
18. [Frontend Route Map](#18-frontend-route-map)
19. [WebSocket Events](#19-websocket-events)
20. [Dependencies](#20-dependencies)

---

## 1. System Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Real-Time**: Socket.IO with `/auction` namespace
- **Hosting**: Google Cloud Run, OCI Container Registry
- **Auth**: Google OAuth (shared identity), resource-level authorization

### Project Structure
```
auction-frontend/          # Next.js 14 App Router
├── src/
│   ├── app/              # Pages (file-based routing)
│   │   ├── [slug]/       # Public auction pages (SSR)
│   │   ├── admin/        # Admin pages (auth-guarded)
│   │   ├── bid/          # Team bidding pages
│   │   └── explore/      # Browse auctions
│   ├── components/       # Shared UI components
│   │   ├── auction/      # Auction-specific (PlayerCard, Timer, etc.)
│   │   └── layout/       # Header, Footer
│   ├── contexts/         # React contexts (AuctionSocketContext)
│   └── lib/              # API client, socket, constants, SEO helpers
backend/
├── models/               # 6 Mongoose models
├── routes/               # 5 route files (60+ endpoints)
├── services/             # auctionEngine.js, auctionSocket.js
├── middleware/            # auctionAuth.js (4 middleware functions)
└── index.js              # Express + Socket.IO server
```

### Auction Lifecycle (7 States)
```
draft → configured → live ⇄ paused → completed → trade_window → finalized
```
- **draft**: Initial state, can edit config
- **configured**: Ready to go live (requires ≥2 teams + ≥1 player)
- **live**: Active bidding in progress
- **paused**: Bidding paused (admin can resume)
- **completed**: All players auctioned, can open trade window
- **trade_window**: Post-auction trading period (configurable hours)
- **finalized**: Results locked permanently

---

## 2. Data Models

### Auction (`backend/models/Auction.js`)
- **Core fields**: name, slug, description, status, organizationId
- **Config**: basePrice, purseValue, minSquadSize, maxSquadSize, bidIncrementPreset, customBidIncrements[], maxRounds, playerRevealDelay, biddingTimerSeconds, goingOnceSeconds, goingTwiceSeconds
- **Retention**: retentionEnabled, maxRetentions, retentionCostMultiplier, captainDesignation
- **Trade**: tradeWindowHours, maxTradesPerTeam, tradeSettlementEnabled, tradeWindowEndsAt
- **Display**: displayConfig.playerFields[] (key, label, type, showOnCard, showInList, sortable, order)
- **State**: currentBiddingState (playerId, phase, currentBid, highestBidder, bidHistory[], timerExpiresAt), remainingPlayerIds[]
- **Admins**: admins[] with userId + role (owner/admin)
- **Analytics**: analytics (totalBids, totalSold, totalUnsold, highestBid, averageBid)

### AuctionTeam (`backend/models/AuctionTeam.js`)
- **Identity**: name, shortName, logo, primaryColor, secondaryColor, owner{name, email}
- **Auth**: accessCode (bcrypt hashed), accessToken (JWT)
- **Finances**: purseRemaining, purseValue (initial)
- **Squad**: players[] (playerId, boughtAt, round, boughtTimestamp), retainedPlayers[] (playerId, retentionCost, isCaptain)
- **Computed**: maxBid virtual (purseRemaining minus slots needed × basePrice)

### AuctionPlayer (`backend/models/AuctionPlayer.js`)
- **Core**: name, role, imageUrl, playerNumber
- **Custom**: customFields (Map<string, any>) — dynamic columns from import
- **Status**: status (pool/sold/unsold/retained), soldTo, soldAmount, soldInRound, soldTimestamp
- **Flags**: isDisqualified, disqualificationReason, isDeleted, isIneligible, ineligibleReason
- **History**: roundHistory[] (round, status, soldTo, soldAmount)

### ActionEvent (`backend/models/ActionEvent.js`)
- LIFO undo stack with sequenceNumber
- Types: PLAYER_SOLD, PLAYER_UNSOLD, PLAYER_DISQUALIFIED, PLAYER_REINSTATED, PLAYER_ASSIGNED, PLAYER_REASSIGNED, PLAYER_RETURNED_TO_POOL, PURSE_ADJUSTED, PLAYER_DELETED, PLAYER_INELIGIBLE, PLAYER_BULK_ACTION, TRADE_EXECUTED
- Each event has payload + reversalPayload for undo
- performedBy tracks admin who performed action
- isPublic flag controls visibility

### BidAuditLog (`backend/models/BidAuditLog.js`)
- Every bid attempt logged: playerId, teamId, amount, type (accepted/rejected/voided)
- rejectionReason for failed bids
- Timestamps for complete audit trail

### AuctionTrade (`backend/models/AuctionTrade.js`)
- Bilateral: initiatorTeamId, counterpartyTeamId
- Players: initiatorPlayers[], counterpartyPlayers[] (playerId, name, role, soldAmount)
- Financial: settlementAmount, settlementDirection, purseSettlementEnabled
- Status: pending_counterparty → both_agreed → executed (or rejected/withdrawn/cancelled/expired)
- Messages: initiatorMessage, counterpartyMessage, adminNote
- Tracking: approvedBy, executedAt, publicAnnouncement

---

## 3. Authentication & Authorization

### Auth Flow
- Google OAuth via `cricsmart.in/auth/login?service=auction&redirect=auction.cricsmart.in`
- Shared User model across all CricSmart products
- JWT stored in localStorage (`AUTH_STORAGE_KEY`)
- Product isolation: auction checks `auction.admins[]`, not `user.organizations[]`

### Middleware (`backend/middleware/auctionAuth.js`)
| Middleware | Purpose |
|---|---|
| `resolveAuctionAdmin` | Verifies user is in auction.admins[] |
| `requireAuctionOwner` | Verifies user is auction owner |
| `resolveAuctionTeam` | Validates team access token JWT (X-Team-Token header) |
| `loadPublicAuction` | Loads auction for public routes (no auth, excludes drafts) |

### Team Authentication
- Teams authenticate via magic link (URL with token) or access code
- Access code hashed with bcrypt, validated at `POST /api/v1/auctions/team-login`
- Team JWT returned with auctionId + teamId, used for Socket.IO and trade endpoints

---

## 4. Admin Dashboard & Auction Management

### Admin Dashboard (`/admin`)
- Lists all auctions where user is admin
- Status badges, creation date, quick actions
- "Create New Auction" CTA

### Create Auction Wizard (`/admin/create`)
- 3-step flow: Basics (name, description) → Config (prices, squad sizes, bid presets) → Review
- Bid increment preset selector (IPL-style, economy, aggressive, custom)
- Optional retention toggle with max retentions + captain designation

### Admin Overview (`/admin/[auctionId]`)
- **Status card**: Current lifecycle state with visual indicator
- **Lifecycle controls**: Configure → Go Live → Pause/Resume → Complete → Open Trade Window → Finalize
- **Player breakdown**: Sold/unsold/pool/retained counts with progress bars
- **Config summary**: All auction settings at a glance
- **Admin list**: Co-admins with add/remove
- **Quick actions**: Export results (Excel), Clone auction
- **Trade window banner**: Countdown timer, trade stats (pending/executed/rejected)
- **Finalized banner**: Shows executed trade count

### Admin Settings (`/admin/[auctionId]/settings`)
- Edit config (draft only): base price, purse value, squad sizes, timer durations
- Bid preset selector with custom tier editor
- Retention toggle with options
- Scheduled start time
- Admin management (add by email, remove)
- Danger zone: Delete auction (double-confirm)

---

## 5. Team Management

### Admin Teams Page (`/admin/[auctionId]/teams`)
- **Team cards**: Name, short name, color swatch, purse utilization bar, squad count
- **Add team modal**: Name, short name, color picker, owner details
- **Magic link**: Auto-generated URL for team login (copy to clipboard)
- **Access code**: Display + copy
- **Regenerate credentials**: New access code + magic link
- **Delete team**: With confirmation
- **Purse adjustment**: Increase/decrease with reason (audit logged)

### Team Features
- Each team gets a unique bid URL: `/bid/[token]`
- Real-time purse tracking during auction
- Max bid calculation (purseRemaining - slotsNeeded × basePrice)
- Squad composition display with player details

---

## 6. Player Management

### Admin Players Page (`/admin/[auctionId]/players`)
- **Table view**: Dynamic columns from playerFields config, sortable headers, search, filters (role, status)
- **Mobile cards**: Responsive card layout showing top 4 fields
- **Pagination**: Server-side with configurable page size
- **Add player modal**: Name, role, image URL, custom fields
- **Import wizard**: Excel/CSV upload → auto-detect columns → toggleable skip chips → preview table → bulk import with error report
- **Player profile modal**: Click any row → full player details with all custom fields
- **Inline actions per player**:
  - Edit (name, role, image, custom fields)
  - Assign to team (with amount)
  - Reassign to different team (purse adjusted)
  - Return to pool (purse refunded)
  - Delete (soft delete)
  - Reinstate (un-delete)
  - Mark ineligible (with reason)
- **Bulk operations**: Multi-select checkboxes → floating action bar:
  - Bulk delete
  - Bulk mark ineligible
  - Bulk return to pool
  - Each with ConfirmModal confirmation

---

## 7. Dynamic Column Import & Player Fields

### Import System
- Upload Excel/CSV → backend auto-detects columns
- Auto-maps: name, role, imageUrl by header matching
- Remaining columns shown as toggleable chips (click to skip)
- Full-width scrollable preview table with all columns
- `inferFieldType()` helper: >80% numeric → number, URL pattern → url, else text
- Imports populate `displayConfig.playerFields[]` on the Auction

### Player Fields Tab (`/admin/[auctionId]/fields`)
- Manage field configuration: edit labels inline, type dropdown (text/number/url)
- Toggle visibility: showInList (table columns), showOnCard (live bidding card)
- Sortable toggle per field
- Drag reorder (up/down buttons)
- Sticky save bar when dirty

### Field Display Across Views
- **Player list table**: Dynamic columns from showInList fields
- **Player card (live)**: 2-column grid of showOnCard fields between name and bid
- **Broadcast card**: 3-column grid of custom fields
- All 3 PlayerCard usages updated: spectator live, team bidding, admin live

---

## 8. Real-Time Bidding Engine

### Backend Engine (`backend/services/auctionEngine.js`)

#### State Machine (Per-Player Flow)
```
WAITING → REVEALED → OPEN → [BID ⇄ TIMER_RESET] → GOING_ONCE → GOING_TWICE → SOLD/UNSOLD
```

#### Key Functions
- `startAuction()` — Initialize pool from all pool-status players, begin first player
- `pickNextPlayer()` — Random selection from remainingPlayerIds
- `placeBid()` — Validate (purse, increment, lock), update state, broadcast
- `timerExpired()` — Advance phases (open → going_once → going_twice → sold/unsold)
- `skipPlayer()` — Mark unsold, move to next
- `undoLastAction()` — LIFO undo for sold/unsold/disqualified (max 3 consecutive)
- `disqualifyPlayer()` — Remove from auction, refund if sold
- `buildAuctionState()` — Compute full state for broadcasting (includes playerFields, tradeConfig)

#### Bid Validation
- Purse check (amount ≤ team.maxBid)
- Increment validation (amount must exceed current bid by valid tier increment)
- 200ms bid lock (prevent spam)
- Team can't bid on own player

#### Timer Management
- Configurable durations per phase (reveal, bidding, going-once, going-twice)
- Server-side timer with `timerExpiresAt` timestamp
- Timer resets on valid bid during OPEN phase
- Phase transitions: OPEN→GOING_ONCE→GOING_TWICE→SOLD/UNSOLD

#### Round Management
- Track rounds; unsold players return to pool for next round
- Configurable maxRounds
- Pool exhaustion detection

### Socket.IO (`backend/services/auctionSocket.js`)
- Namespace: `/auction`
- Room-based: `auction:{id}`, `team:{auctionId}:{teamId}`, `admin:{auctionId}`
- Role-based auth: admin JWT, team JWT, public (no auth)
- Events: `admin:start`, `admin:pause`, `admin:resume`, `admin:skip`, `admin:undo`, `admin:disqualify`, `team:bid`, `admin:announce`

---

## 9. Live Views

### Spectator Live View (`/[slug]/live`)
- **Glass-card status bar**: Live/paused/completed/waiting indicators
- **Auction progress bar**: Percentage of players completed
- **PlayerCard**: Framer Motion reveal animation, phase banners, multiplier badge, team color glow
- **Timer**: Circular SVG ring with phase-colored stroke + glow
- **BidTicker**: AnimatePresence slide-in for new bids, team color badges
- **TeamPanel**: Team color glow for highest bidder, animated purse bars
- **Stat cards**: Round, pool remaining, sold count, highest bid
- **SpectatorTradeWindowView**: Countdown, real-time trade activity feed, team standings

### Team Bidding Page (`/bid/[token]`)
- **Magic link login**: Auto-authenticate from URL token
- **Access code fallback**: Manual code entry
- **Sticky header**: Team name, purse progress bar, squad size
- **Bid button**: `btn-bid` with shimmer animation, disabled when can't bid
- **Highest bidder indicator**: CheckCircle2 + team color highlight
- **Squad display**: Current roster with player details
- **Post-auction view**: Trade window countdown, trade proposal panel, finalized state
- **Real-time trade events**: Toast notifications for all trade status changes
- **TradeProposalPanel**: Select counterparty team, pick players to swap, propose trade

### Admin Live Page (`/admin/[auctionId]/live`)
- **Control bar**: Start/Pause/Resume/Skip/End buttons
- **Undo button**: With animated toast notification (3s auto-dismiss)
- **Progress bar**: Sold/total percentage
- **Stats sidebar**: Round, pool, sold, unsold, highest bid
- **Announcement broadcast**: Text input → broadcast to all viewers
- **PlayerCard + Timer + BidTicker**: Same components as spectator

### Broadcast View (`/[slug]/broadcast`)
- **OBS-ready**: Full-screen, no UI chrome, dark slate-950 background
- **Layout hides parent nav**: `broadcast/layout.tsx` CSS override
- **BroadcastPlayerCard**: 4xl name, 5xl bid amount, role icon + avatar, multiplier badge, sold team badge with glow, bid history strip (last 6 bids with team color chips)
- **BroadcastTimer**: 136px circular SVG ring with phase-colored stroke + blur glow, 5xl countdown
- **Team strip**: Compact cards with purse bar, team color badge, gavel indicator
- **Overlay states**: Waiting, paused, completed
- **Announcement overlay**: Slides down from top, auto-animated
- **Bottom bar**: CricSmart branding
- **Ambient glows**: Amber top, team-color bottom for current bidder

---

## 10. Admin Power Tools

### Undo Stack (Phase 6)
- **LIFO undo**: Last 3 consecutive actions reversible
- **Supported actions**: PLAYER_SOLD (return to pool + purse refund + squad removal), PLAYER_UNSOLD (return to pool), PLAYER_DISQUALIFIED (reinstate)
- **ActionEvent logging**: Every action creates an event with reversalPayload
- **Socket broadcast**: `admin:undo` event + full state rebuild
- **UI**: Undo button in admin live control bar, animated toast with action details

### Disqualify Player (Phase 6)
- Remove player from auction mid-bidding
- If sold: refunds team purse, removes from squad
- Logs ActionEvent with reversalPayload for undo
- Broadcasts `player:disqualified` + state rebuild

---

## 11. Post-Auction Trading

### Trade System Architecture
- **Bilateral negotiation**: Initiator proposes → Counterparty accepts/rejects → Admin approves/rejects
- **Player locking**: Players in active trades can't be included in other trades
- **Auto-cancellation**: Conflicting trades auto-cancelled when a trade executes
- **Financial settlement**: Calculated from player value differential, purse adjusted if enabled and affordable

### Trade Flow
```
Team A proposes trade → pending_counterparty
Team B accepts → both_agreed
Admin approves → executed (players swapped, purse adjusted)

OR: Team B rejects / Team A withdraws / Admin rejects / Trade expires
```

### Admin-Initiated Trade (Phase 9H)
- Admin bypasses bilateral flow: select two teams, pick players, execute immediately
- Works during trade_window, completed, or paused states
- Full validation: player ownership, locks, team existence
- Settlement calculated automatically
- ActionEvent logged with `adminInitiated: true`

### Trade Endpoints
| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /trades` | Team JWT | Propose trade |
| `PATCH /trades/:id/accept` | Team JWT | Accept trade |
| `PATCH /trades/:id/reject` | Team JWT | Reject trade |
| `PATCH /trades/:id/withdraw` | Team JWT | Withdraw trade |
| `GET /trades/my-trades` | Team JWT | List own trades |
| `GET /trades/all-trades` | Team JWT | List all auction trades |
| `GET /trades` | Admin JWT | List all trades (admin) |
| `PATCH /trades/:id/admin-approve` | Admin JWT | Approve & execute |
| `PATCH /trades/:id/admin-reject` | Admin JWT | Reject trade |
| `POST /trades/admin-initiate` | Admin JWT | Create & execute trade |
| `GET /trades/team-players/:teamId` | Team JWT | Get team players for trade UI |

### Trade UI
- **Admin trades page** (`/admin/[auctionId]/trades`): Trade cards with status badges, approve/reject buttons, reject reason input, stats (pending/agreed/executed/other), filter by status, "New Trade" button for admin-initiated trades
- **AdminInitiateTradeModal**: Team selectors, player checkboxes with sold amounts, settlement preview, admin note, execute button
- **Team bid page**: TradeProposalPanel for proposing trades, trade notifications
- **Public trades page** (`/[slug]/trades`): SSR with expandable trade cards

---

## 12. Analytics & Public Pages

### Public Auction Detail (`/[slug]`)
- SSR with JSON-LD Event schema, OG metadata
- Stats grid: total players, sold, unsold, highest bid, average bid
- Team overview cards with purse utilization bars
- Player pool breakdown by role
- Top 5 sold players with medals
- Live CTA banner

### Public Teams (`/[slug]/teams`)
- Full squad compositions grouped by role
- Retained player badges (RTN + captain crown)
- Purse utilization bars
- Sorted by spending

### Public Analytics (`/[slug]/analytics`)
- **Summary stats**: Cards with key metrics
- **Charts** (Recharts):
  - Team spending stacked bar chart
  - Role breakdown donut chart
  - Round-wise spending bar chart
- **Top 10 table**: With multiplier column (sold ÷ base price)
- **Premium picks**: Highest individual buys
- **Value picks**: Best multiplier players
- **Unsold players grid**

### Public Players (`/[slug]/players`)
- Paginated player list with status filters
- Public-facing player information

---

## 13. SEO Infrastructure

### JSON-LD Schema (`lib/schema.tsx`)
- Event schema for auction pages
- BreadcrumbList for navigation
- WebSite schema for main site
- `SchemaScript` component for embedding

### Server-Side Rendering
- `lib/server-api.ts`: Server-side fetch with revalidation
- Per-page `generateMetadata` with OG tags, Twitter cards, canonical URLs
- `next-sitemap.config.js`: Dynamic sitemap from API slugs, robots.txt

### SEO Endpoints (`backend/routes/auctionPublic.js`)
- `GET /api/seo/auctions` — List public auctions (paginated)
- `GET /api/seo/auctions/:slug` — Auction detail by slug
- `GET /api/seo/auctions/:slug/teams` — Team squads
- `GET /api/seo/auctions/:slug/analytics` — Analytics data
- `GET /api/seo/auctions/:slug/players` — Player list
- `GET /api/seo/sitemap/auctions` — Sitemap data

---

## 14. Export & Reporting

### Excel Export (Phase 9G)
- `GET /api/v1/auctions/:auctionId/export` — Downloads XLSX file
- **Sheets**: Summary, Teams, Sold Players, Unsold Players, All Players
- Auto-column widths, headers with formatting
- Triggered from admin overview "Export" button
- Frontend handles blob download with filename from Content-Disposition

### Bid History Viewer (Phase 9F)
- `GET /api/v1/auctions/:auctionId/bid-history` — Paginated bid audit log
- Filters: by player, by team, by type (accepted/rejected/voided)
- **Void bid**: `POST /bid-history/:logId/void` — Mark bid as voided with reason
- Admin UI: `/admin/[auctionId]/bids` — Searchable, filterable bid history table

### Audit Log Viewer (Phase 9I)
- `GET /api/v1/auctions/:auctionId/audit-log` — Paginated action events
- Filter by event type
- Admin UI: `/admin/[auctionId]/audit` — Timeline view with event details, performer, timestamps

---

## 15. Admin Extended Tools (Phase 9)

### 9A: Player Edit Modal
- Click-to-edit any player from the admin players page
- Edit name, role, image URL, and all custom fields
- Saves via `PATCH /players/:playerId`

### 9B: Admin Player Reassignment
- **Assign**: Assign unsold/pool player to a team at a specific amount (purse deducted)
- **Reassign**: Move sold player to a different team (purse refunded to old team, deducted from new)
- **Return to pool**: Remove player from team back to pool (purse refunded)
- All operations broadcast via Socket.IO for live state updates

### 9D: Purse Adjustment
- Admin can increase/decrease any team's purse
- Requires reason (audit logged as PURSE_ADJUSTED ActionEvent)
- UI in admin teams page

### 9E: Soft Delete + Reinstate + Mark Ineligible
- **Soft delete**: Sets isDeleted=true (player hidden from active views)
- **Reinstate**: Un-deletes player, returns to pool
- **Mark ineligible**: Sets isIneligible=true with reason (player stays visible but can't be auctioned)

### 9F: Bid History Viewer + Void Bids
- Full bid audit trail with search/filter
- Admin can void any accepted bid with reason
- Admin UI at `/admin/[auctionId]/bids`

### 9G: Export Results to Excel
- Multi-sheet XLSX export with summary, teams, sold/unsold/all players
- Download triggered from admin overview

### 9H: Admin-Initiated Trade
- Bypass bilateral negotiation: admin picks teams + players, executes immediately
- Settlement auto-calculated
- Full validation + audit logging + Socket broadcast

### 9I: Audit Log Viewer
- Timeline view of all ActionEvents
- Filter by type (sold, unsold, trade, purse adjustment, etc.)
- Admin UI at `/admin/[auctionId]/audit`

### 9J: Bulk Player Operations
- Multi-select players with checkboxes
- Floating action bar appears with count
- Actions: Bulk delete, bulk mark ineligible, bulk return to pool
- Each action confirmed via ConfirmModal

### 9K: Reorder Auction Pool
- `GET /players/pool-order` — Fetch current pool order with player details
- `PUT /players/reorder` — Set new order (validates all IDs match)
- Admin UI at `/admin/[auctionId]/pool-order`:
  - Player list with move up/down/top/bottom buttons
  - Shuffle button for randomization
  - Sticky save bar

### 9L: Clone Auction
- `POST /auctions/:id/clone` — Deep copy auction:
  - Copies config, displayConfig, admins
  - Copies all teams (resets purse to original value, clears squads)
  - Copies all players (resets to pool status, clears sold data)
  - Generates new slug
  - New auction starts in draft status
- Admin UI: "Clone" button on overview page with name prompt

---

## 16. UI/UX Design System

### Theme
- **Dark theme**: Slate-900/950 backgrounds
- **Accent**: Amber/orange primary, emerald for success, red for danger
- **Glass morphism**: `backdrop-blur-xl`, `bg-slate-800/50`, `border-white/10`

### Key CSS Classes (globals.css)
- `btn-primary`: Gradient emerald→teal button
- `btn-ghost`: Transparent with hover effect
- `btn-bid`: Shimmer animation for bid button
- `glass-card`: Glass morphism card component
- `gradient-text-gold`: Gold gradient text
- `sold-glow` / `unsold-glow`: Ambient glow effects
- `timer-urgent`: Pulse animation for urgent timer
- `shimmer-bg`: Shimmer loading animation

### Animations (Framer Motion)
- **PlayerCard**: Scale+fade reveal, sold/unsold glow transitions
- **BidTicker**: AnimatePresence slide-in for new bids
- **Timer**: Spring animation on urgent ticks
- **Phase banners**: Pulse animation for going-once/twice
- **Toast notifications**: Slide-in/out with auto-dismiss

### Responsive Design
- Mobile-first with Tailwind breakpoints (sm, md, lg)
- Compact card layouts on mobile
- Table → card transformation for player list
- Icon-only navigation on mobile, full labels on desktop

### Shared Components
| Component | File | Purpose |
|---|---|---|
| PlayerCard | `components/auction/PlayerCard.tsx` | Live auction player display with custom fields |
| Timer | `components/auction/Timer.tsx` | Circular SVG countdown with phase colors |
| BidTicker | `components/auction/BidTicker.tsx` | Live bid history feed |
| TeamPanel | `components/auction/TeamPanel.tsx` | Team sidebar with purse bars |
| ConfirmModal | `components/auction/ConfirmModal.tsx` | Reusable confirmation dialog |
| PlayerDetailModal | `components/auction/PlayerDetailModal.tsx` | Full player profile popup |
| TradeProposalPanel | `components/auction/TradeProposalPanel.tsx` | Trade proposal form for teams |
| Header | `components/layout/Header.tsx` | Site header with auth |
| Footer | `components/layout/Footer.tsx` | Site footer |

---

## 17. API Reference

### Public Endpoints (No Auth)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/seo/auctions` | List public auctions |
| GET | `/api/seo/auctions/:slug` | Auction detail by slug |
| GET | `/api/seo/auctions/:slug/teams` | Team squads |
| GET | `/api/seo/auctions/:slug/analytics` | Analytics data |
| GET | `/api/seo/auctions/:slug/players` | Player list |
| GET | `/api/seo/sitemap/auctions` | Sitemap data |

### Admin Auction Endpoints (Admin JWT)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/auctions` | List my auctions |
| POST | `/api/v1/auctions` | Create auction |
| GET | `/api/v1/auctions/:id` | Get auction detail |
| PATCH | `/api/v1/auctions/:id/config` | Update config |
| POST | `/api/v1/auctions/:id/configure` | Move to configured |
| POST | `/api/v1/auctions/:id/go-live` | Go live |
| POST | `/api/v1/auctions/:id/pause` | Pause |
| POST | `/api/v1/auctions/:id/resume` | Resume |
| POST | `/api/v1/auctions/:id/complete` | Complete |
| POST | `/api/v1/auctions/:id/open-trade-window` | Open trade window |
| POST | `/api/v1/auctions/:id/finalize` | Finalize |
| DELETE | `/api/v1/auctions/:id` | Delete auction |
| POST | `/api/v1/auctions/:id/admins` | Add admin |
| DELETE | `/api/v1/auctions/:id/admins/:userId` | Remove admin |
| GET | `/api/v1/auctions/:id/export` | Export XLSX |
| POST | `/api/v1/auctions/:id/clone` | Clone auction |
| GET | `/api/v1/auctions/:id/audit-log` | Audit log |
| GET | `/api/v1/auctions/:id/bid-history` | Bid history |
| POST | `/api/v1/auctions/:id/bid-history/:logId/void` | Void bid |
| GET | `/api/v1/auctions/:id/display-config` | Get display config |
| PATCH | `/api/v1/auctions/:id/display-config` | Update display config |
| GET | `/api/v1/auctions/presets/bid-increments` | Get bid presets |

### Team Endpoints (Admin JWT)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/auctions/:id/teams` | List teams |
| POST | `/api/v1/auctions/:id/teams` | Add team |
| PATCH | `/api/v1/auctions/:id/teams/:teamId` | Update team |
| DELETE | `/api/v1/auctions/:id/teams/:teamId` | Delete team |
| POST | `/api/v1/auctions/:id/teams/:teamId/regenerate-access` | Regenerate credentials |
| POST | `/api/v1/auctions/:id/teams/:teamId/adjust-purse` | Adjust purse |

### Player Endpoints (Admin JWT)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/auctions/:id/players` | List players |
| POST | `/api/v1/auctions/:id/players` | Add player |
| PATCH | `/api/v1/auctions/:id/players/:playerId` | Update player |
| DELETE | `/api/v1/auctions/:id/players/:playerId` | Delete player |
| POST | `/api/v1/auctions/:id/players/:playerId/assign` | Assign to team |
| POST | `/api/v1/auctions/:id/players/:playerId/reassign` | Reassign to team |
| POST | `/api/v1/auctions/:id/players/:playerId/return-to-pool` | Return to pool |
| POST | `/api/v1/auctions/:id/players/:playerId/reinstate` | Reinstate |
| POST | `/api/v1/auctions/:id/players/:playerId/mark-ineligible` | Mark ineligible |
| POST | `/api/v1/auctions/:id/players/import` | Import from Excel/CSV |
| POST | `/api/v1/auctions/:id/players/bulk` | Bulk operations |
| GET | `/api/v1/auctions/:id/players/pool-order` | Get pool order |
| PUT | `/api/v1/auctions/:id/players/reorder` | Reorder pool |

### Trade Endpoints
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/trades` | Team JWT | Propose trade |
| PATCH | `/trades/:id/accept` | Team JWT | Accept |
| PATCH | `/trades/:id/reject` | Team JWT | Reject |
| PATCH | `/trades/:id/withdraw` | Team JWT | Withdraw |
| GET | `/trades/my-trades` | Team JWT | My trades |
| GET | `/trades/all-trades` | Team JWT | All trades |
| GET | `/trades` | Admin JWT | All trades (admin) |
| PATCH | `/trades/:id/admin-approve` | Admin JWT | Approve & execute |
| PATCH | `/trades/:id/admin-reject` | Admin JWT | Reject |
| POST | `/trades/admin-initiate` | Admin JWT | Admin trade |
| GET | `/trades/team-players/:teamId` | Team JWT | Team players |

### Auth Endpoint
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auctions/team-login` | Team login (magic link + access code) |

---

## 18. Frontend Route Map

### Public Routes (SSR)
| Route | Purpose |
|---|---|
| `/` | Landing page (SSG, hero, features, CTA) |
| `/explore` | Browse public auctions by status |
| `/auth-callback` | Cross-domain auth handler |
| `/[slug]` | Auction detail (SSR, JSON-LD) |
| `/[slug]/teams` | Team squads |
| `/[slug]/analytics` | Post-auction analytics (Recharts) |
| `/[slug]/players` | Public player list |
| `/[slug]/live` | Spectator live view (Socket.IO) |
| `/[slug]/broadcast` | OBS broadcast view |
| `/[slug]/trades` | Public trades page |

### Admin Routes (Auth-Guarded)
| Route | Purpose |
|---|---|
| `/admin` | Dashboard — list auctions |
| `/admin/create` | Create auction wizard |
| `/admin/[auctionId]` | Overview + lifecycle controls |
| `/admin/[auctionId]/live` | Live auction control panel |
| `/admin/[auctionId]/teams` | Team management |
| `/admin/[auctionId]/players` | Player management + import |
| `/admin/[auctionId]/fields` | Player field configuration |
| `/admin/[auctionId]/trades` | Trade management |
| `/admin/[auctionId]/bids` | Bid history viewer |
| `/admin/[auctionId]/audit` | Audit log viewer |
| `/admin/[auctionId]/pool-order` | Reorder auction pool |
| `/admin/[auctionId]/settings` | Auction settings |

### Team Route
| Route | Purpose |
|---|---|
| `/bid/[token]` | Team bidding + post-auction trades |

### Admin Tab Navigation
```
Overview | Live Control | Teams | Players | Player Fields | Trades | Bid History | Audit Log | Pool Order | Settings
```

---

## 19. WebSocket Events

### Namespace: `/auction`

### Client → Server
| Event | Auth | Purpose |
|---|---|---|
| `admin:start` | Admin | Start auction |
| `admin:pause` | Admin | Pause auction |
| `admin:resume` | Admin | Resume auction |
| `admin:skip` | Admin | Skip current player |
| `admin:end` | Admin | End auction |
| `admin:undo` | Admin | Undo last action |
| `admin:disqualify` | Admin | Disqualify player |
| `admin:announce` | Admin | Broadcast announcement |
| `team:bid` | Team | Place bid |

### Server → Client
| Event | Purpose |
|---|---|
| `auction:state` | Full state broadcast (on connect + changes) |
| `auction:status_change` | Lifecycle state change |
| `player:revealed` | New player revealed |
| `bid:placed` | Valid bid accepted |
| `bid:rejected` | Bid rejected (with reason) |
| `player:sold` | Player sold to team |
| `player:unsold` | Player unsold |
| `player:disqualified` | Player disqualified |
| `admin:undo` | Action undone |
| `admin:announcement` | Admin announcement |
| `trade:proposed` | Trade proposed |
| `trade:accepted` | Trade accepted by counterparty |
| `trade:rejected` | Trade rejected |
| `trade:withdrawn` | Trade withdrawn by initiator |
| `trade:cancelled` | Trade auto-cancelled |
| `trade:executed` | Trade executed (players swapped) |
| `trade:admin_rejected` | Trade rejected by admin |

### Room Structure
- `auction:{auctionId}` — All viewers (public events)
- `team:{auctionId}:{teamId}` — Team-specific events (private data, trade notifications)
- `admin:{auctionId}` — Admin-specific events

---

## 20. Dependencies

### Frontend (`auction-frontend/package.json`)
| Package | Purpose |
|---|---|
| next@14 | React framework (App Router) |
| react@18 | UI library |
| typescript | Type safety |
| tailwindcss | Utility-first CSS |
| framer-motion | Animations |
| socket.io-client | WebSocket client |
| recharts | Charts for analytics |
| lucide-react | Icons |
| next-sitemap | Sitemap generation |

### Backend (relevant packages)
| Package | Purpose |
|---|---|
| express | HTTP server |
| mongoose | MongoDB ODM |
| socket.io | WebSocket server |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hashing |
| xlsx | Excel export |
| multer | File upload handling |

---

## 21. Pause/Resume Request System (Phase 11)

### Overview
Teams can request the admin to pause a live auction. The admin sees real-time notifications and can approve (pause) or dismiss requests.

### Flow
```
Team clicks "Request Pause" → modal with optional reason → team:request_pause socket event
→ Backend validates (must be live) → Emits pause:request to admin room
→ Admin sees floating notification → Approve (triggers admin:pause) OR Dismiss (notifies team)
```

### Backend (`services/auctionSocket.js`)
| Socket Event | Direction | Auth | Purpose |
|---|---|---|---|
| `team:request_pause` | Client→Server | Team JWT | Send pause request with optional reason |
| `pause:request` | Server→Admin | — | Forward request to admin room |
| `admin:dismiss_pause_request` | Client→Server | Admin JWT | Dismiss a pause request |
| `pause:request_dismissed` | Server→Team | — | Notify team their request was dismissed |

### Team UI (`bid/[token]/page.tsx`)
- **Pause button**: Icon button (`Pause` icon) in sticky header, visible during live/paused states
- **Modal**: Optional reason input, Send Request / Cancel buttons
- **Toast feedback**: "Pause request sent to admin" / dismissed message
- **Auto-reset**: `pauseRequested` state resets when `auction:status_change` → paused
- **Rate limiting**: Button disabled while `pauseRequested` is true

### Admin UI (`admin/[auctionId]/live/page.tsx`)
- **Floating notifications**: Stacked banners with team shortName + reason
- **Approve button** (✓): Calls `handleAction('admin:pause')` with reason citing the requesting team
- **Dismiss button** (✕): Emits `admin:dismiss_pause_request`, removes notification
- **Multiple requests**: Supports concurrent requests from different teams (stacked vertically)

---

*This document is auto-maintained. Update after each phase completion.*
