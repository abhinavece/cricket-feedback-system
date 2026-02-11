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
- 🔄 **Phase 2**: Auction frontend scaffold (Next.js 14) — IN PROGRESS
- ⏳ **Phase 3**: Admin dashboard (create auction wizard, team/player setup)
- ⏳ **Phase 4**: Public auction pages (SSR, JSON-LD, explore)
- ⏳ **Phase 5**: Real-time bidding engine (Socket.IO)
- ⏳ **Phase 6**: Admin power tools (undo, disqualify, overrides)
- ⏳ **Phase 7**: Animations & broadcast view
- ⏳ **Phase 8**: Post-auction features (trading, finalize)
- ⏳ **Phase 9**: Analytics & export
- ⏳ **Phase 10**: Testing & edge cases

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
