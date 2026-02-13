# Phase 10: Comprehensive Auction System Testing Architecture

Industry-standard, pyramid-shaped testing strategy covering unit → integration → WebSocket → E2E for the entire auction system, ensuring zero regressions on every change.

---

## Current State

- **Backend**: Jest + Supertest already configured (`jest.config.js`, `jest.setup.js`) but only for old cricket feedback routes — **zero auction tests exist**
- **Frontend**: No test infrastructure at all — no Jest, no React Testing Library, no Playwright
- **WebSocket**: No Socket.IO test helpers or integration tests
- **Coverage**: 0% on all auction code

## Tech Stack (Industry Standard)

| Layer | Tool | Why |
|---|---|---|
| Backend Unit | **Jest** | Already installed, fast, great mocking |
| Backend Integration | **Supertest + mongodb-memory-server** | In-memory DB = isolated, no cleanup headaches |
| WebSocket Tests | **socket.io-client** (already a dep) + Jest | Test real socket events, rooms, auth |
| Frontend Unit | **Jest + React Testing Library** | Next.js recommended, tests components as users see them |
| E2E | **Playwright** | Industry leader (used by Vercel, Microsoft), WebSocket support, multi-browser, visual diffs |
| Coverage | **Jest --coverage + Playwright coverage** | Enforced coverage gates in CI |

## Implementation Phases

### Phase 10A: Test Infrastructure Setup
**Files to create/modify:**

1. **`backend/tests/auction/setup.js`** — Auction-specific test DB setup
   - `mongodb-memory-server` for isolated in-memory MongoDB
   - `connectTestDB()` / `disconnectTestDB()` / `clearDB()` helpers
   - Create Express app with all auction routes mounted (no `listen()` — Supertest handles that)
   - Socket.IO test server on random port
   
2. **`backend/tests/auction/helpers/factories.js`** — Test data factories
   - `createTestAuction(overrides?)` → creates auction + returns admin JWT
   - `createTestTeam(auctionId, overrides?)` → creates team + returns team JWT
   - `createTestPlayer(auctionId, overrides?)` → creates player
   - `createTestPlayers(auctionId, count, overrides?)` → bulk create
   - `setupLiveAuction()` → full ready-to-bid auction (configured + teams + players + go-live)
   - `setupCompletedAuction()` → auction with sold players
   - `setupTradeWindowAuction()` → auction in trade_window state

3. **`backend/tests/auction/helpers/socketClient.js`** — Socket.IO test client
   - `createAdminSocket(auctionId, token)` → connected admin socket
   - `createTeamSocket(auctionId, teamToken)` → connected team socket
   - `createSpectatorSocket(auctionId)` → connected spectator socket
   - `waitForEvent(socket, event, timeout?)` → Promise that resolves on event
   - `disconnectAll(sockets[])` → cleanup

4. **New deps** (backend):
   - `mongodb-memory-server` (dev)
   - `socket.io-client` (already in frontend, add to backend devDeps for testing)

5. **`auction-frontend/jest.config.ts`** + React Testing Library setup
   - `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom`

6. **`auction-frontend/playwright.config.ts`** + Playwright setup
   - `@playwright/test`
   - Multi-browser (chromium, webkit)
   - Base URL config, global setup/teardown for dev servers

7. **npm scripts** (backend `package.json`):
   ```
   "test:auction": "jest tests/auction --runInBand --forceExit",
   "test:auction:unit": "jest tests/auction/unit --runInBand --forceExit",
   "test:auction:api": "jest tests/auction/integration --runInBand --forceExit",
   "test:auction:socket": "jest tests/auction/socket --runInBand --forceExit",
   "test:auction:coverage": "jest tests/auction --coverage --runInBand --forceExit"
   ```

8. **npm scripts** (frontend `package.json`):
   ```
   "test": "jest",
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui"
   ```

---

### Phase 10B: Backend Unit Tests
**Target: Models, engine logic, middleware** (~25 test files)

#### `backend/tests/auction/unit/models/`

**`auction.model.test.js`** (~30 tests)
- Schema validation: required fields (name, config.basePrice, config.purseValue)
- Slug generation uniqueness (`Auction.generateSlug`)
- Default values (status=draft, isActive=true)
- Config validation (minSquadSize ≤ maxSquadSize)
- Bid increment tiers validation
- Status enum enforcement
- Virtual fields / computed properties
- Index verification

**`auctionTeam.model.test.js`** (~20 tests)
- Required fields, default purse
- Access code generation + hashing (bcrypt)
- maxBid virtual calculation (purse − reserved slots × basePrice)
- Player array management
- Retained players schema

**`auctionPlayer.model.test.js`** (~15 tests)
- Status enum (pool/sold/unsold/retained)
- Custom fields Map validation
- Round history tracking
- Soft delete + ineligible flags
- playerNumber uniqueness scoped to auction

**`actionEvent.model.test.js`** (~10 tests)
- Event type enum
- Sequence number auto-increment
- Reversal payload structure
- isPublic flag

**`bidAuditLog.model.test.js`** (~8 tests)
- Bid types (accepted/rejected/voided)
- Required fields (playerId, teamId, amount)
- Timestamps

**`auctionTrade.model.test.js`** (~12 tests)
- Status flow validation
- Player sub-documents
- Settlement calculation fields
- Timestamps (proposedAt, executedAt)

#### `backend/tests/auction/unit/engine/`

**`bidIncrement.test.js`** (~10 tests)
- Correct tier selection for various bid amounts
- Edge cases: at tier boundary, above all tiers
- Empty tiers fallback (10000 default)
- Custom tiers

**`maxBid.test.js`** (~12 tests)
- Squad full → maxBid = purseRemaining
- Squad needs N slots → reserve N × basePrice
- Insufficient purse → returns basePrice or 0
- With retained players counted
- Edge: purse exactly equals basePrice

**`bidValidation.test.js`** (~15 tests)
- Valid bid (correct increment, team has purse)
- Reject: team is current highest bidder
- Reject: amount exceeds maxBid
- Reject: wrong increment amount
- Reject: bidding phase not open/going_once/going_twice
- Reject: auction not live
- 200ms bid lock enforcement

**`stateTransitions.test.js`** (~20 tests)
- WAITING → REVEALED on pick
- REVEALED → OPEN after delay
- OPEN → GOING_ONCE on timer expiry (no bids)
- OPEN → timer reset on valid bid
- GOING_ONCE → GOING_TWICE
- GOING_TWICE → SOLD (has bids) / UNSOLD (no bids)
- Round management: all players processed → next round
- Pool exhaustion → auction complete

**`undoStack.test.js`** (~12 tests)
- Undo PLAYER_SOLD: purse refunded, player returned to pool
- Undo PLAYER_UNSOLD: player back to pool
- Undo PLAYER_DISQUALIFIED: player reinstated
- Max 3 consecutive undos
- Cannot undo non-undoable action types
- ActionEvent reversal payload applied correctly

**`disqualify.test.js`** (~8 tests)
- Remove from pool (unsold player)
- Refund purse (sold player)
- Cannot disqualify during WAITING
- ActionEvent created with reversalPayload

#### `backend/tests/auction/unit/middleware/`

**`auctionAuth.test.js`** (~20 tests)
- `resolveAuctionAdmin`: valid admin → passes, non-admin → 403, no JWT → 401, deleted auction → 404
- `requireAuctionOwner`: owner → passes, admin (non-owner) → 403
- `resolveAuctionTeam`: valid team token → passes, expired → 401, wrong auction → 403
- `loadPublicAuction`: by ID → loads, by slug → loads, draft → 404, deleted → 404

---

### Phase 10C: Backend API Integration Tests
**Target: All 60+ REST endpoints via Supertest** (~15 test files)

#### `backend/tests/auction/integration/`

**`auction.crud.test.js`** (~25 tests)
- POST /auctions — create auction, validation errors (missing name, bad config)
- GET /auctions — list my auctions, pagination, status filter
- GET /auctions/:id — get auction detail (admin data included)
- PATCH /auctions/:id/config — update config (draft only, reject if live)
- DELETE /auctions/:id — soft delete, 403 for non-owner
- POST /auctions/:id/admins — add admin by email, duplicate prevention
- DELETE /auctions/:id/admins/:userId — remove admin, can't remove last owner

**`auction.lifecycle.test.js`** (~20 tests)
- POST /configure — draft→configured (requires ≥2 teams + ≥1 player)
- POST /go-live — configured→live (reject if no players/teams)
- POST /pause — live→paused, with reason
- POST /resume — paused→live
- POST /complete — live/paused→completed
- POST /open-trade-window — completed→trade_window, sets tradeWindowEndsAt
- POST /finalize — trade_window→finalized
- Invalid transitions: draft→live, completed→live, finalized→anything

**`team.api.test.js`** (~20 tests)
- POST /teams — create team, validation (name, shortName required)
- GET /teams — list teams with player populations
- PATCH /teams/:id — update team (name, color, owner)
- DELETE /teams/:id — delete team, reject if auction is live
- POST /teams/:id/regenerate-access — new access code + token
- POST /teams/:id/adjust-purse — increase/decrease with reason, audit logged
- POST /team-login — magic link auth, access code auth, invalid token

**`player.api.test.js`** (~25 tests)
- POST /players — add player, custom fields
- GET /players — list with pagination, search, filters (role, status), sort by custom fields
- PATCH /players/:id — update player fields
- DELETE /players/:id — soft delete
- POST /players/:id/assign — assign to team at amount
- POST /players/:id/reassign — change team, purse adjustment
- POST /players/:id/return-to-pool — purse refund
- POST /players/:id/reinstate — un-delete
- POST /players/:id/mark-ineligible — with reason
- POST /players/import — Excel upload, column mapping, auto-detect
- POST /players/bulk — bulk delete, bulk mark-ineligible, bulk return-to-pool

**`player.pool.test.js`** (~10 tests)
- GET /players/pool-order — returns players in order
- PUT /players/reorder — set order, validation (all IDs must match)
- Reorder during live auction → validate remaining pool updated

**`trade.api.test.js`** (~30 tests)
- POST /trades — propose trade (team auth), validate player ownership, locking
- PATCH /trades/:id/accept — counterparty accepts
- PATCH /trades/:id/reject — counterparty rejects
- PATCH /trades/:id/withdraw — initiator withdraws
- GET /trades/my-trades — team's trades
- GET /trades/all-trades — all auction trades (team view)
- GET /trades — admin list with status filter
- PATCH /trades/:id/admin-approve — execute trade (players swapped, purse adjusted)
- PATCH /trades/:id/admin-reject — admin rejects
- POST /trades/admin-initiate — admin-initiated trade
- Auto-cancellation: executing a trade cancels conflicting trades
- Player lock: can't include locked player in new trade
- Reject if trade window expired

**`display-config.test.js`** (~8 tests)
- GET /display-config — returns playerFields
- PATCH /display-config — update field config (works in any auction status)
- Field type validation
- Ordering and visibility flags

**`audit-export.test.js`** (~12 tests)
- GET /audit-log — paginated, type filter
- GET /bid-history — paginated, player/team/type filters
- POST /bid-history/:id/void — void bid with reason
- GET /export — XLSX download, correct Content-Disposition header
- POST /clone — deep copy (config, teams, players reset to draft)

**`public.api.test.js`** (~10 tests)
- GET /api/seo/auctions — list public auctions, excludes drafts
- GET /api/seo/auctions/:slug — auction detail by slug
- GET /api/seo/auctions/:slug/teams — team squads
- GET /api/seo/auctions/:slug/analytics — analytics data
- GET /api/seo/auctions/:slug/players — paginated player list
- GET /api/seo/sitemap/auctions — sitemap data

---

### Phase 10D: WebSocket Integration Tests
**Target: Socket.IO connection, bidding, events** (~6 test files)

#### `backend/tests/auction/socket/`

**`connection.test.js`** (~15 tests)
- Admin connects with valid JWT → joins admin room, receives state
- Team connects with valid teamToken → joins team room, receives state + myTeam
- Spectator connects without auth → joins auction room, receives state (no private data)
- Invalid JWT → connection rejected
- Invalid teamToken → falls back to spectator
- Reconnection: receives fresh state

**`bidding.test.js`** (~25 tests)
- Full bidding flow: start → reveal → open → bid → going_once → going_twice → sold
- Multiple teams bidding: correct timer resets, highest bidder tracking
- Unsold flow: no bids → going_once → going_twice → unsold
- Skip player: admin:skip → player unsold, next player picked
- State broadcast: all connected clients receive updates
- Team:update sent to bidding team with purse/maxBid
- Round transition: all players done → round 2 with unsold players

**`pauseResume.test.js`** (~10 tests)
- admin:pause → status_change broadcast, timer frozen
- admin:resume → status_change broadcast, timer resumed
- team:request_pause → pause:request emitted to admin room only
- admin:dismiss_pause_request → pause:request_dismissed to team only
- Pause request rejected when not live

**`adminControls.test.js`** (~12 tests)
- admin:undo → state broadcast with reversed action
- admin:disqualify → player removed, purse refunded if sold
- admin:complete → auction completed
- admin:announce → announcement to all clients
- Non-admin cannot use admin events

**`tradeEvents.test.js`** (~10 tests)
- trade:proposed → notification to counterparty team room
- trade:accepted → notification to initiator team room
- trade:executed → broadcast to auction room
- trade:cancelled → notification to affected teams

**`edgeCases.test.js`** (~10 tests)
- Simultaneous bids from 2 teams (200ms lock)
- Bid during going_once → resets to open
- Bid that exceeds maxBid → rejected
- Disconnect during bidding → auction continues
- Multiple admin connections → both receive events

---

### Phase 10E: Frontend Component Tests
**Target: Key shared components** (~6 test files)

#### `auction-frontend/src/__tests__/`

**`components/PlayerCard.test.tsx`** (~8 tests)
- Renders player name, role, bid amount
- Shows correct phase banner (open, going_once, going_twice, sold, unsold)
- Multiplier badge displays correctly
- Custom fields rendered from playerFields config

**`components/Timer.test.tsx`** (~6 tests)
- Countdown displays correctly
- Phase color changes (open=amber, going_once=orange, going_twice=red)
- Expired state handling

**`components/BidTicker.test.tsx`** (~5 tests)
- Renders bid history entries
- Team color badges
- Correct amount formatting

**`components/ConfirmModal.test.tsx`** (~4 tests)
- Shows title and message
- Confirm callback fires
- Cancel callback fires
- Renders children

**`components/TeamPanel.test.tsx`** (~5 tests)
- Renders all teams
- Highlights current bidder
- Purse bar width calculation

**`contexts/AuctionSocketContext.test.tsx`** (~8 tests)
- Provides state after socket connects
- Updates state on bid:placed
- Updates state on player:sold
- Updates state on auction:status_change
- myTeam data preserved across broadcasts

---

### Phase 10F: Playwright E2E Tests
**Target: Critical user flows across real browser** (~6 test files)

#### `auction-frontend/e2e/`

**`admin-auction-lifecycle.spec.ts`** (~5 tests)
- Create auction → configure → add teams → import players → go live
- Pause / Resume auction
- Complete auction → open trade window → finalize

**`live-bidding.spec.ts`** (~4 tests)
- Admin starts auction, team places bids, player sold
- Spectator sees real-time updates
- Skip player → unsold
- Undo sold → player returns to pool

**`admin-tools.spec.ts`** (~5 tests)
- Assign/reassign player
- Bulk operations (multi-select + delete)
- Export XLSX (file download)
- Clone auction
- Reorder pool + save

**`trading.spec.ts`** (~3 tests)
- Team proposes trade → counterparty accepts → admin approves
- Admin-initiated trade
- Trade rejected flow

**`public-pages.spec.ts`** (~4 tests)
- Explore page loads auction list
- Slug page renders auction detail with SEO metadata
- Analytics page renders charts
- Teams page shows squads

**`broadcast.spec.ts`** (~2 tests)
- Broadcast view renders full-screen
- Player card + timer + team strip visible

---

## File Structure Summary

```
backend/tests/auction/
├── setup.js
├── helpers/
│   ├── factories.js
│   └── socketClient.js
├── unit/
│   ├── models/
│   │   ├── auction.model.test.js
│   │   ├── auctionTeam.model.test.js
│   │   ├── auctionPlayer.model.test.js
│   │   ├── actionEvent.model.test.js
│   │   ├── bidAuditLog.model.test.js
│   │   └── auctionTrade.model.test.js
│   ├── engine/
│   │   ├── bidIncrement.test.js
│   │   ├── maxBid.test.js
│   │   ├── bidValidation.test.js
│   │   ├── stateTransitions.test.js
│   │   ├── undoStack.test.js
│   │   └── disqualify.test.js
│   └── middleware/
│       └── auctionAuth.test.js
├── integration/
│   ├── auction.crud.test.js
│   ├── auction.lifecycle.test.js
│   ├── team.api.test.js
│   ├── player.api.test.js
│   ├── player.pool.test.js
│   ├── trade.api.test.js
│   ├── display-config.test.js
│   ├── audit-export.test.js
│   └── public.api.test.js
└── socket/
    ├── connection.test.js
    ├── bidding.test.js
    ├── pauseResume.test.js
    ├── adminControls.test.js
    ├── tradeEvents.test.js
    └── edgeCases.test.js

auction-frontend/
├── jest.config.ts
├── playwright.config.ts
├── e2e/
│   ├── admin-auction-lifecycle.spec.ts
│   ├── live-bidding.spec.ts
│   ├── admin-tools.spec.ts
│   ├── trading.spec.ts
│   ├── public-pages.spec.ts
│   └── broadcast.spec.ts
└── src/__tests__/
    ├── components/
    │   ├── PlayerCard.test.tsx
    │   ├── Timer.test.tsx
    │   ├── BidTicker.test.tsx
    │   ├── ConfirmModal.test.tsx
    │   └── TeamPanel.test.tsx
    └── contexts/
        └── AuctionSocketContext.test.tsx
```

## Implementation Order

| Step | Phase | Estimated Tests | Priority |
|---|---|---|---|
| 1 | **10A**: Infrastructure (setup, factories, configs) | 0 (setup only) | 🔴 Must |
| 2 | **10B**: Backend unit tests (models, engine, middleware) | ~195 | 🔴 Must |
| 3 | **10C**: Backend API integration tests | ~160 | 🔴 Must |
| 4 | **10D**: WebSocket integration tests | ~82 | 🔴 Must |
| 5 | **10E**: Frontend component tests | ~36 | 🟡 Should |
| 6 | **10F**: Playwright E2E tests | ~23 | 🟡 Should |
| **Total** | | **~496 tests** | |

## Dependencies to Install

**Backend** (devDependencies):
```
mongodb-memory-server
socket.io-client  (for test socket clients)
```

**Frontend** (devDependencies):
```
jest
@jest/globals
jest-environment-jsdom
@testing-library/react
@testing-library/jest-dom
@testing-library/user-event
ts-jest
@playwright/test
```

## CI Integration Guidelines

- `test:auction:unit` runs on every PR (fast, <30s)
- `test:auction:api` + `test:auction:socket` on every PR (<2min)
- `test:e2e` on merge to main (slower, requires dev server)
- Coverage gate: ≥80% for new auction code
- Playwright screenshots on failure (artifact upload)

## Phase 12: Image Handling Test Cases

### Backend Unit Tests (`imageUpload.test.js`) — ~12 tests
- Validates image type (reject non-image MIME types)
- Validates minimum dimensions (reject < 200x200)
- Validates max file size (reject > 2MB)
- Resizes images > 800px to 800x800 max
- Converts JPEG/PNG to WebP
- Generates 64x64 thumbnail
- Returns correct GCS URLs (imageUrl + thumbnailUrl)
- Deletes old image when replacing
- Handles GCS upload errors gracefully

### Backend API Integration Tests (`imageUpload.api.test.js`) — ~18 tests
- `POST /players/:id/upload-image` — success with valid JPEG
- `POST /players/:id/upload-image` — rejects non-image file
- `POST /players/:id/upload-image` — rejects oversized file
- `POST /players/:id/upload-image` — rejects without auth
- `POST /players/:id/upload-image` — 404 for invalid player
- `PATCH /players/:id` — updates `imageCropPosition` field
- `PATCH /players/:id` — updates `imageThumbnailUrl` field
- `POST /teams/:id/upload-logo` — success with valid PNG
- `POST /teams/:id/upload-logo` — rejects non-image file
- `POST /teams/:id/upload-logo` — sets `logo` and `logoThumbnail`
- `POST /auctions/:id/upload-cover` — success with valid image
- `POST /auctions/:id/upload-cover` — rejects without admin auth
- `POST /auctions/:id/upload-cover` — sets `coverImage` field
- Public API returns `coverImage` in auction detail
- `buildAuctionState` includes `imageCropPosition` for current player
- `buildAuctionState` excludes `logo` from team data (socket optimization)

### Frontend Component Tests — ~10 tests
- `PlayerAvatar` renders initials when no imageUrl
- `PlayerAvatar` renders role-based gradient fallback
- `PlayerAvatar` applies cropPosition via objectPosition style
- `PlayerAvatar` falls back to initials on image error
- `PlayerAvatar` respects size prop (xs through 3xl)
- `TeamLogo` renders shortName when no logo
- `TeamLogo` renders img when logo URL provided
- `TeamLogo` falls back to shortName on image error
- `ImageUploader` switches between upload/URL modes
- `ImageUploader` crop position presets update correctly

### E2E Tests (Playwright) — ~6 tests
- Admin can upload player image via drag-drop
- Admin can set crop position and see avatar preview update
- Admin can upload team logo and see it on team card
- Admin can upload auction cover image
- Cover image appears on public auction detail page
- Player avatar with crop position renders correctly on live view

## Key Design Decisions

1. **mongodb-memory-server** over real MongoDB — isolated, parallel-safe, no cleanup issues
2. **Factory pattern** — single source of truth for test data creation, easy to extend when schema changes
3. **Socket test client helper** — abstracts connection/auth, `waitForEvent()` prevents flaky timer-based tests
4. **Test per feature area** — when adding a feature, you know exactly which test file to update
5. **Supertest without listen()** — pass Express app directly, no port conflicts
6. **Playwright over Cypress** — native WebSocket support, faster, multi-browser, Vercel/Microsoft standard
