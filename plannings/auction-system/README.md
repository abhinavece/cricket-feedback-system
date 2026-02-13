# CricSmart Auction System — Planning

This folder contains all planning documents for the CricSmart Auction system.

## Documents

- `001-cricsmart-auctions-design.md` — Complete system design specification with all finalized decisions
- `002-future-enhancements.md` — Future features roadmap (RTM, chat, YouTube API, etc.)
- `003-implementation-architecture.md` — Auth isolation, SEO strategy, Next.js frontend, infra & deployment
- `004-feature-details.md` — Comprehensive feature documentation for all implemented phases

## Overview

The CricSmart Auction system is a world-class online cricket auction platform featuring:

- Real-time WebSocket-based bidding
- Admin undo stack (last 3 player actions)
- Tiered bid increments with preset templates
- Retention system with captain designation
- Post-auction trading window (48 hours)
- Broadcast view for YouTube streaming
- Comprehensive analytics and reporting
- Standalone implementation (extensible for org/tournament linkage)

## Implementation Status

- ✅ **Phase 0**: Design completed (24 design questions answered across 3 rounds)
- ✅ **Phase 1**: Backend foundation — COMPLETED
- ✅ **Phase 2**: Auction frontend scaffold (Next.js 14) — COMPLETED
- ✅ **Phase 3**: Admin auction detail pages — COMPLETED
- ✅ **Phase 4**: Public auction pages (SSR, JSON-LD, sitemap) — COMPLETED
- ✅ **Phase 5**: Real-time bidding engine (Socket.IO) — COMPLETED
- ✅ **Phase 5.5**: UI overhaul — Framer Motion animations, premium design — COMPLETED
- ✅ **Phase 6**: Admin power tools (undo, disqualify) — COMPLETED
- ✅ **Phase 7**: Broadcast view + sold/unsold animations — COMPLETED
- ✅ **Phase 7.5**: Admin should have functinality to do any change in player, team, auction like marking any player ineligible, removing already sold player to some other team at specific amount and purse value should be updated accordingly from to and from team.
- ✅ **Phase 8**: Post-auction features (trading, finalize) — COMPLETED
- ✅ **Phase 9**: Admin extended tools, analytics & export — COMPLETED
- ⏳ **Phase 10**: Testing & edge cases
- ✅ **Phase 11**: Pause/resume request system — COMPLETED


### Phase 2 Deliverables (Completed)

**Auction Frontend Scaffold** — `auction-frontend/`
- Next.js 14 App Router with TypeScript, Tailwind CSS, amber/orange dark theme
- Auth callback (cross-domain handler) with Suspense boundary
- Admin layout with auth guard + admin dashboard (list auctions)
- Create auction wizard (3-step: basics → config → review)
- Explore page (SSR, browse public auctions by status)
- Landing page (SSG, hero with mock auction, features, stats, CTA)
- Shared components: Header, Footer, AuthContext
- API client (`lib/api.ts`) with public + auth endpoints

### Phase 3 Deliverables (Completed)

**Admin Auction Detail Pages** — 4 dynamic routes
- `/admin/[auctionId]` — Overview tab: status card, player breakdown, lifecycle controls (configure → go-live → pause/resume → complete), config summary, admin list
- `/admin/[auctionId]/teams` — Team cards with purse bars, add team modal (color picker + magic link/access code), copy link, regenerate credentials, delete
- `/admin/[auctionId]/players` — Table + mobile cards, search/filter by role/status, pagination. Add player modal. Excel/CSV import wizard (upload → column mapping → bulk import with error report)
- `/admin/[auctionId]/settings` — Edit config (draft only), bid preset selector, retention toggle, scheduled start. Admin management (add/remove co-admins). Danger zone with double-confirm delete
- Tabbed layout with icon navigation
- API additions: pauseAuction, resumeAuction, completeAuction, deleteAuction, addAuctionAdmin, removeAuctionAdmin, updateTeam, deleteTeam, regenerateTeamAccess

### Phase 4 Deliverables (Completed)

**Public Auction Pages (SSR, SEO-Optimized)** — 3 new dynamic routes
- `/[slug]` — Auction detail page: SSR with JSON-LD Event schema, OG metadata, stats grid, team overview cards with purse bars, player pool breakdown, top 5 sold players with medals, live CTA banner, quick link cards
- `/[slug]/teams` — Team squads: full compositions grouped by role, retained player badges (RTN + captain crown), purse utilization bars, sorted by spending
- `/[slug]/analytics` — Post-auction analytics: summary stats, recharts (team spending stacked bar, role breakdown donut, round-wise bars), top 10 table with multiplier column, premium picks, value picks, unsold players grid
- `/[slug]/layout.tsx` — Sticky header with status badge + sub-navigation (Overview | Teams | Analytics | Watch Live)

**SEO Infrastructure**
- `lib/schema.tsx` — JSON-LD generators (Event, BreadcrumbList, WebSite) + SchemaScript component
- `lib/server-api.ts` — Server-side fetch for SSR pages with revalidation
- `next-sitemap.config.js` — Dynamic sitemap pulling auction slugs from API, robots.txt generation
- Per-page `generateMetadata` with OG tags, Twitter cards, canonical URLs

**Dependencies added**: recharts

### Phase 5 Deliverables (Completed)

**Real-time Bidding Engine (Socket.IO)** — Full WebSocket auction system
- **Backend Services**:
  - `services/auctionEngine.js` — Server-authoritative state machine with per-player bidding flow: WAITING → REVEALED → OPEN → [BID ⇄ TIMER_RESET] → GOING_ONCE → GOING_TWICE → SOLD/UNSOLD
  - `services/auctionSocket.js` — Socket.IO event handlers with role-based auth (admin JWT, team JWT, public), room management (auction:{id}, team:{id}, admin:{id}), and real-time broadcasting
  - Socket.IO integration in `index.js` with `/auction` namespace and CORS for all frontend origins
  - Bid validation: purse check, maxBid calculation, bid increment tiers, 200ms bid lock
  - Timer management with configurable durations (reveal, bidding, going-once/twice)
  - ActionEvent logging for sold/unsold (undo stack), BidAuditLog for all bid attempts
  - Team login endpoint at `/api/v1/auctions/team-login` (magic link + access code)

- **Frontend Infrastructure**:
  - `lib/socket.ts` — Socket.IO client setup with connection management
  - `contexts/AuctionSocketContext.tsx` — Combined WebSocket + auction state context with role-based data filtering
  - Shared components: Timer (phase-aware countdown), PlayerCard (status-aware), BidTicker (live history), TeamPanel (purse bars + highest bidder indicator)

- **Live Pages**:
  - `/[slug]/live` — Spectator public live view with real-time player reveals, bidding, team panels, bid history, and auction stats
  - `/admin/[auctionId]/live` — Admin control panel with start/pause/resume/skip/end controls, announcement broadcast, and live auction state
  - `/bid/[token]` — Team bidding interface with magic link login, access code fallback, prominent bid button, and private team data (purse, max bid, squad size)

- **Features**:
  - Automatic player selection from pool with random ordering
  - Round management with unsold player return
  - Real-time bid validation and rejection feedback
  - Team access token JWT for WebSocket auth
  - Admin announcements broadcast to all viewers
  - Connection status indicators and reconnection logic

**Dependencies added**: socket.io (backend), socket.io-client (frontend)

### Phase 5.5 Deliverables (Completed)

**UI Overhaul — Premium Auction Experience**
- **globals.css** — Added sold/unsold glow effects, timer urgency pulse, shimmer gradients, count-up & hammer-slam keyframes, btn-bid class, ambient body gradient
- **PlayerCard** — Framer Motion reveal animation (scale+fade), going-once/twice phase banners with pulse, sold glow with team color ambient, unsold orange glow, Gavel icon for sold, multiplier badge (color-coded 3×/5×+), animated bid progress bar
- **Timer** — Circular SVG ring progress with phase-colored stroke + glow ring, smooth countdown with spring animation on urgent ticks, phase label transitions
- **BidTicker** — AnimatePresence slide-in for new bids, team color badges with #1 indicator, scrollable max-height, gradient-text-gold for highest bid
- **TeamPanel** — Team color ambient glow for highest bidder, animated purse bar with team gradient, Gavel icon animation, subtle scale pulse on bid
- **Spectator Live View** — Glass-card status bar with live/paused/completed/waiting indicators, auction progress bar (% complete), 12-col grid layout, section headers with amber accent bars, rich stat cards with icons
- **Team Bidding Page** — Sticky header with purse progress bar, btn-bid with shimmer animation, CheckCircle2 highest-bidder state, AnimatePresence for bid errors, Wallet icon for insufficient purse
- **Admin Live Page** — Undo toast notification (fixed top center), progress bar, compact stats sidebar, redesigned control bar layout

**Dependencies added**: framer-motion

### Phase 6 Deliverables (Completed)

**Admin Power Tools** — Undo stack + player disqualification
- **Backend Engine** (`services/auctionEngine.js`):
  - `undoLastAction()` — LIFO undo for PLAYER_SOLD (return to pool + purse refund + squad removal), PLAYER_UNSOLD (return to pool), PLAYER_DISQUALIFIED (reinstate). Max 3 consecutive undos. Broadcasts `admin:undo` event + full state rebuild
  - `disqualifyPlayer()` — Remove player from auction. If sold, refunds team purse and removes from squad. Logs ActionEvent with reversalPayload for undo support. Broadcasts `player:disqualified` + state rebuild
- **Socket.IO Handlers** (`services/auctionSocket.js`):
  - `admin:undo` — Calls `undoLastAction` with admin userId, returns result with undone action details
  - `admin:disqualify` — Calls `disqualifyPlayer` with playerId + reason
- **Admin Live UI** (`admin/[auctionId]/live/page.tsx`):
  - Undo button in control bar (visible when live or paused)
  - Animated toast notification showing undone action details (3s auto-dismiss)

### Phase 7 Deliverables (Completed)

**Broadcast View** — `/[slug]/broadcast` OBS-ready streaming overlay
- **Server page** (`[slug]/broadcast/page.tsx`) — SSR with `fetchAuctionBySlug`, passes auction data to client
- **Client component** (`[slug]/broadcast/client.tsx`) — Full-screen immersive layout:
  - Ambient background glows (amber top, team-color bottom for current bidder)
  - Top bar: auction name, live/paused badge, round/pool/sold stats
  - Main area: 12-col grid with 7-col player card + 5-col timer & team strip
  - `BroadcastPlayerCard` — Large 4xl name, 5xl bid amount, role icon + avatar, multiplier badge, sold team badge with team color glow, going-once/twice pulsing banners, bid history strip (last 6 bids with team color chips)
  - `BroadcastTimer` — 136px circular SVG ring with phase-colored stroke + blur glow, 5xl countdown digits, phase label with tracking
  - Team strip: compact cards with purse bar, team color badge, gavel indicator for highest bidder
  - Waiting/paused/completed overlay states
  - Announcement overlay (slides down from top, auto-animated)
  - Fixed bottom bar with CricSmart branding
- Clean dark background (slate-950) optimized for OBS chroma key and streaming

### Phase 8 Deliverables (Completed)

**Post-Auction Trading & Finalization** — Full bilateral trade system frontend integration

- **8A: Backend → Frontend state propagation**
  - `buildAuctionState` now includes `tradeWindowEndsAt` and `tradeConfig` (maxTradesPerTeam, tradeSettlementEnabled, tradeWindowHours)
  - `AuctionSocketContext` updated with `tradeWindowEndsAt` and `tradeConfig` fields
  - `auction:status_change` handler captures `tradeWindowEndsAt` on trade window open

- **8B: Real-time trade events on bid page**
  - Socket listeners for all trade events: `trade:proposed`, `trade:accepted`, `trade:rejected`, `trade:withdrawn`, `trade:cancelled`, `trade:executed`, `trade:admin_rejected`
  - Toast notifications for each trade event type
  - Auto-refresh squad list on `trade:executed`

- **8C: Bid page state differentiation**
  - Distinct banners for `completed` (green), `trade_window` (purple with countdown), `finalized` (slate/locked)
  - `TradeWindowCountdown` component with live countdown timer
  - Trade proposal panel hidden when finalized
  - Passes real `tradeWindowEndsAt` and `tradeConfig` to `TradeProposalPanel`

- **8D: Admin overview enhancements**
  - `TradeWindowBanner` component with countdown timer + trade stats (pending/executed/rejected)
  - Trade stats aggregated from backend (`tradeStats` added to admin auction detail endpoint)
  - "View Trades" quick link to admin trades tab
  - Finalized banner with executed trade count summary

- **8E: Spectator live view trade window**
  - `SpectatorTradeWindowView` component with countdown timer header
  - Real-time trade activity feed via `trade:executed` socket events
  - Team standings panel + auction summary stats
  - Differentiated views for completed, trade_window, and finalized states

- **8F: Public trades page**
  - New route: `/[slug]/trades` — SSR page with SEO metadata
  - Expandable trade cards showing both sides (players, values, settlement)
  - Financial settlement details (purse adjustments, who pays)
  - Trade window countdown for active windows
  - "Trades" nav item added to public auction layout for post-auction states

### Phase 9 Deliverables (Completed)

**Admin Extended Tools & Export** — 12 sub-phases (9A–9L)

- **9A: Player Edit Modal** — Click-to-edit any player from admin players page (name, role, image, custom fields)
- **9B: Admin Player Reassignment** — Assign unsold player to team, reassign sold player between teams, return to pool. All with purse adjustment + Socket.IO broadcast
- **9D: Purse Adjustment** — Admin can increase/decrease team purse with reason (audit logged)
- **9E: Soft Delete + Reinstate + Mark Ineligible** — Soft delete (isDeleted), reinstate (un-delete), mark ineligible with reason
- **9F: Bid History Viewer + Void Bids** — `/admin/[auctionId]/bids` with search, filters (player/team/type), void bid with reason
- **9G: Export Results to Excel** — `GET /export` returns multi-sheet XLSX (Summary, Teams, Sold/Unsold/All Players). Button on admin overview
- **9H: Admin-Initiated Trade** — `POST /trades/admin-initiate` bypasses bilateral flow. Modal with team selectors, player checkboxes, settlement preview
- **9I: Audit Log Viewer** — `/admin/[auctionId]/audit` timeline view of all ActionEvents with type filter
- **9J: Bulk Player Operations** — Multi-select checkboxes + floating action bar (bulk delete, mark ineligible, return to pool) with ConfirmModal
- **9K: Reorder Auction Pool** — `GET/PUT /players/pool-order` + `/admin/[auctionId]/pool-order` page with move/shuffle/save
- **9L: Clone Auction** — `POST /clone` deep copies config, teams, players into new draft. Button on admin overview with name prompt

**Admin Layout Tabs Added**: Player Fields, Trades, Bid History, Audit Log, Pool Order

**API Additions**: updatePlayer, assignPlayer, reassignPlayer, returnPlayerToPool, reinstatePlayer, markPlayerIneligible, bulkPlayerAction, getAuditLog, getBidHistory, voidBid, exportAuctionResults, adjustTeamPurse, getPoolOrder, reorderPool, cloneAuction, adminInitiateTrade, getDisplayConfig, updateDisplayConfig

**Dynamic Column Import Enhancement**: Auto-detect columns from Excel/CSV, toggleable skip chips, inferFieldType(), playerFields config with showOnCard/showInList/sortable, live card and broadcast card show custom fields

### Phase 11 Deliverables (Completed)

**Pause/Resume Request System** — Teams can request admin to pause the auction during live bidding

- **Backend** (`services/auctionSocket.js`):
  - `team:request_pause` socket event — Team sends pause request with optional reason, forwarded to admin room as `pause:request`
  - `admin:dismiss_pause_request` socket event — Admin dismisses a request, team notified via `pause:request_dismissed`
  - Only allowed during `live` auction status
  - Rate-limiting by UI (one active request per team)

- **Team Bid Page** (`bid/[token]/page.tsx`):
  - Pause icon button in sticky header (visible during live/paused states)
  - Request Pause modal with optional reason input
  - Toast notifications for request sent / request dismissed feedback
  - Auto-resets when auction is paused (request honored)
  - Socket listener for `pause:request_dismissed` event

- **Admin Live Page** (`admin/[auctionId]/live/page.tsx`):
  - Real-time pause request notifications via `pause:request` socket event
  - Floating notification banners with team name + reason
  - ✅ Approve button — triggers `admin:pause` with reason citing requesting team
  - ✕ Dismiss button — notifies team their request was dismissed
  - Multiple concurrent requests supported (stacked notifications)

### Phase 1 Deliverables (Completed)

**6 Mongoose Models** — `backend/models/`
- `Auction.js` — 7-state lifecycle, bid tier presets, resource-level admins[], currentBiddingState
- `AuctionTeam.js` — Purse tracking, retained players + captain, access code/token auth, maxBid calc
- `AuctionPlayer.js` — Dynamic customFields Map, round history, validation tokens, disqualification
- `ActionEvent.js` — LIFO undo stack, reversal payloads, sequence numbered
- `BidAuditLog.js` — Public bid audit trail (accepted/rejected/voided)
- `AuctionTrade.js` — Player-for-player swaps, team-initiated, admin-approved

**Middleware** — `backend/middleware/auctionAuth.js`
- `resolveAuctionAdmin` — resource-level auth via auction.admins[]
- `requireAuctionOwner` — owner-only actions
- `resolveAuctionTeam` — team access token JWT validation
- `loadPublicAuction` — public routes (no auth, exclude drafts)

**4 Route Files (32+ endpoints)** — `backend/routes/`
- `auction.js` — CRUD + lifecycle (draft→configured→live→paused→completed), admin management
- `auctionTeam.js` — Teams, access codes, magic links, retained players, team login (code→JWT)
- `auctionPlayer.js` — XLSX/CSV import with 2-step column mapping, manual add, disqualify
- `auctionPublic.js` — SEO endpoints: list, detail by slug, teams, analytics, sitemap

**Dependencies**: bcryptjs added

## Local Development

| Service | Port | Command |
|---------|------|---------|
| Backend API | 5000 | `cd backend && npm run dev` |
| Team Management App | 3000 | `cd frontend && npm start` |
| SEO Site | 3001 | `cd seo-site && npm run dev` |
| Tournament Hub | 3002 | `cd tournament-frontend && npm run dev` |
| **Auction Frontend** | **3003** | `cd auction-frontend && npm run dev` |

## Future TODOs

- RTM (Right to Match) feature
- Unsold player base price reduction
- Built-in spectator chat
- YouTube Live API integration
- PDF player import
- Organization & tournament linkage
- Retention cost configuration
- Multiple concurrent auctions

---

*All planning files are version controlled and should always be checked in.*
