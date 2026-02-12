# CricSmart Auction System — Planning

This folder contains all planning documents for the CricSmart Auction system.

## Documents

- `001-cricsmart-auctions-design.md` — Complete system design specification with all finalized decisions
- `002-future-enhancements.md` — Future features roadmap (RTM, chat, YouTube API, etc.)
- `003-implementation-architecture.md` — Auth isolation, SEO strategy, Next.js frontend, infra & deployment

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
- ⏳ **Phase 6**: Admin power tools (undo, disqualify, overrides)
- ⏳ **Phase 7**: Animations & broadcast view
- ⏳ **Phase 8**: Post-auction features (trading, finalize)
- ⏳ **Phase 9**: Analytics & export
- ⏳ **Phase 10**: Testing & edge cases

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
