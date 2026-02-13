# Phase 8: Post-Auction Completion — Trading, Trade Window & Finalization

Comprehensive plan for completing the post-auction experience. The bilateral trading backend and core frontend components are already built. This phase focuses on the **glue** — real-time event handling, state differentiation, countdown timers, and dedicated views that make the trade window a polished, production-ready experience.

---

## Audit: What's Already Built

### Backend (100% complete)
- `AuctionTrade` model — bilateral schema with all fields
- All trade endpoints — propose, accept, reject, withdraw, admin-approve, admin-reject
- Smart player locking + auto-cancel conflicting trades
- Financial settlement calculation + purse adjustment on execution
- Socket.IO notifications for all trade events
- Trade window lifecycle — `POST /open-trade-window`, `POST /finalize`
- `GET /my-trades`, `GET /all-trades`, admin `GET /` with enrichment
- Public trades endpoint (`GET /api/seo/auctions/:slug/trades`)
- Team players endpoint with lock status

### Frontend (75% complete)
- `TradeProposalPanel.tsx` — bilateral flow (incoming/outgoing/propose/all trades)
- Admin trades page — approve+execute, reject, status filters
- Admin settings — tradeWindowHours, maxTradesPerTeam, tradeSettlementEnabled
- `PlayerDetailModal.tsx` — shared reusable modal with fieldLabelMap
- Public pages updated for new trade field names
- Bid page PostAuctionView with clickable players + PlayerDetailModal

---

## Gaps Identified

### GAP 1: `buildAuctionState` missing `tradeWindowEndsAt`
**Problem:** The socket state object doesn't include `tradeWindowEndsAt`. The bid page hardcodes `tradeWindowEndsAt={undefined}` when passing to `TradeProposalPanel`.
**Impact:** No countdown timer possible. Teams don't know when the trade window closes.
**Fix:** Add `tradeWindowEndsAt` and `maxTradesPerTeam` to `buildAuctionState` return object + update `AuctionState` interface.

### GAP 2: No real-time trade event handling on frontend
**Problem:** `TradeProposalPanel` fetches trades on mount via API but doesn't listen for Socket.IO trade events. When a trade is proposed/accepted/rejected, the team must manually refresh.
**Impact:** Critical UX gap — teams are blind to incoming trades until they reload.
**Fix:** Subscribe to socket trade events in the bid page and trigger trade list refresh + toast notifications.

### GAP 3: Squad not refreshed after trade execution
**Problem:** When a trade involving the team is executed, `myPlayers` in `PostAuctionView` becomes stale. The swap has happened server-side but the UI still shows old players.
**Impact:** Team sees wrong squad composition after a trade.
**Fix:** Re-fetch squad on `trade:executed` event when the team is involved.

### GAP 4: Bid page doesn't differentiate completed vs trade_window vs finalized
**Problem:** Line 218: `const isCompleted = ['completed', 'trade_window', 'finalized'].includes(state.status)` — all three show identical `PostAuctionView` with trade panel visible.
**Impact:**
- `completed`: Trade panel shows but trading is blocked (server rejects)
- `trade_window`: Trade panel works but no countdown or visual indicator
- `finalized`: Trade panel still shows even though trading is permanently closed
**Fix:** Show different banners, hide trade panel when finalized, show countdown during trade_window.

### GAP 5: Admin overview page lacks trade window status
**Problem:** When auction is in `trade_window`, the admin overview page shows no trade-specific information — no countdown, no trade stats, no quick actions.
**Impact:** Admin has to navigate to the separate trades tab to see activity.
**Fix:** Add trade window banner with countdown + trade summary card + quick link to trades tab.

### GAP 6: Spectator live view is thin during trade_window
**Problem:** Shows a single card with "Trade Window Open" and a link to analytics. No trade activity feed.
**Impact:** Spectators are disconnected from the trade window action.
**Fix:** Show executed trades feed, trade window countdown, and team stats.

### GAP 7: No dedicated public trades page
**Problem:** Public endpoint `/api/seo/auctions/:slug/trades` exists but no frontend page renders it. Trade data is only shown inline on the auction overview page.
**Impact:** No SEO-crawlable, shareable page for trade history.
**Fix:** Create `/[slug]/trades` page with SSR, JSON-LD, and rich trade cards.

---

## Implementation Plan

### Sub-phase 8A: Socket State Foundation
**Files:** `backend/services/auctionEngine.js`, `auction-frontend/src/contexts/AuctionSocketContext.tsx`

1. Add to `buildAuctionState` return object:
   ```javascript
   tradeWindowEndsAt: auction.tradeWindowEndsAt || null,
   tradeConfig: {
     maxTradesPerTeam: auction.config.maxTradesPerTeam || 2,
     tradeSettlementEnabled: auction.config.tradeSettlementEnabled !== false,
     tradeWindowHours: auction.config.tradeWindowHours || 48,
   },
   ```

2. Update `AuctionState` interface in `AuctionSocketContext.tsx`:
   ```typescript
   tradeWindowEndsAt?: string;
   tradeConfig?: {
     maxTradesPerTeam: number;
     tradeSettlementEnabled: boolean;
     tradeWindowHours: number;
   };
   ```

**Edge cases:**
- `tradeWindowEndsAt` may be null (auction hasn't entered trade window yet)
- Must handle `status_change` event updating `tradeWindowEndsAt` when trade window opens

### Sub-phase 8B: Real-time Trade Events in Bid Page
**Files:** `auction-frontend/src/app/bid/[token]/page.tsx`

1. In `PostAuctionView`, get socket from `useAuctionSocket()` — but `PostAuctionView` is inside `TeamBiddingContent` which already has access. Pass the socket down or use the context.
   
   Actually, `PostAuctionView` is rendered inside `TeamBiddingContent` which uses `useAuctionSocket()`. We need to either:
   - (a) Access socket in `TeamBiddingContent` and pass event callbacks to `PostAuctionView` 
   - (b) Listen to socket directly in `PostAuctionView` via the context

   **Decision:** Option (a) — listen in `TeamBiddingContent` which already has socket access, and pass callbacks/state down.

2. Listen for these socket events in `TeamBiddingContent`:
   - `trade:proposed` — if counterpartyTeamId matches myTeam, show toast "New trade proposal from {team}"
   - `trade:accepted` — if initiatorTeamId matches myTeam, show toast + re-fetch trades
   - `trade:rejected` — show toast "Trade rejected by {team}"
   - `trade:withdrawn` — show toast
   - `trade:cancelled` — show toast "Trade cancelled: {reason}"
   - `trade:executed` — show toast + re-fetch squad (myPlayers) + re-fetch trades
   - `trade:admin_rejected` — show toast "Trade rejected by admin: {reason}"

3. Add a `tradeRefreshKey` counter state in `TeamBiddingContent`, increment on any trade event, pass to `PostAuctionView` → `TradeProposalPanel` as a key or trigger.

4. Add toast notification component (simple, auto-dismiss).

**Edge cases:**
- Multiple rapid trade events (batch re-fetch with debounce)
- Trade events arriving before PostAuctionView mounts (buffer in parent)
- Socket reconnection — need to re-fetch all trades on reconnect

### Sub-phase 8C: Bid Page State Differentiation
**Files:** `auction-frontend/src/app/bid/[token]/page.tsx`

1. Replace `isCompleted` boolean with granular state checks:
   ```typescript
   const isAuctionCompleted = state.status === 'completed';
   const isTradeWindow = state.status === 'trade_window';
   const isFinalized = state.status === 'finalized';
   const isPostAuction = isAuctionCompleted || isTradeWindow || isFinalized;
   ```

2. `PostAuctionView` banner changes:
   - **completed**: "Auction Completed — Waiting for admin to open trade window"
   - **trade_window**: "Trade Window Open — {countdown}" with purple theme
   - **finalized**: "Auction Finalized — Results are permanent" with locked theme

3. Countdown timer component for trade window:
   - Show `tradeWindowEndsAt` from socket state
   - Update every second
   - Show "Expired" when time runs out

4. Hide `TradeProposalPanel` when `finalized`
5. Show `TradeProposalPanel` in read-only/view-only mode when `completed` (can see past trades but not propose)
6. Show full `TradeProposalPanel` when `trade_window`

**Edge cases:**
- `tradeWindowEndsAt` passes while page is open → show "Trade window expired" message
- Socket status changes live (admin opens trade window → page auto-transitions)
- Admin finalizes while team has the page open → auto-transition to finalized state

### Sub-phase 8D: Admin Overview Trade Window Banner
**Files:** `auction-frontend/src/app/admin/[auctionId]/page.tsx`

1. When `auction.status === 'trade_window'`:
   - Add purple trade window banner (similar to live/paused banner) with:
     - "Trade Window Active" title
     - Countdown to `tradeWindowEndsAt`
     - Quick link to Trades tab
   - Add trade summary stats card:
     - Pending (pending_counterparty + both_agreed)
     - Executed
     - Rejected/Cancelled

2. Need to fetch trade stats from admin API. Options:
   - (a) Add `tradeStats` to the admin auction detail endpoint
   - (b) Fetch trades separately client-side
   
   **Decision:** Option (a) — enrich the admin auction detail response with trade counts when status is trade_window/finalized. This keeps the admin overview fast (single request).

3. Backend change: In `GET /api/v1/auctions/:auctionId` (admin detail), add trade stats:
   ```javascript
   if (['trade_window', 'finalized', 'completed'].includes(auction.status)) {
     const tradeCounts = await AuctionTrade.aggregate([...]);
     // Include in response
   }
   ```

**Edge cases:**
- `tradeWindowEndsAt` is in the past but admin hasn't finalized yet → show "Expired — finalize to close"
- No trades exist → show "No trades yet"

### Sub-phase 8E: Spectator Live View During Trade Window
**Files:** `auction-frontend/src/app/[slug]/live/client.tsx`

1. Replace the generic completed card for `trade_window` status with a richer view:
   - Trade window countdown
   - Executed trades feed (via socket events — `trade:executed` events are broadcast to the entire auction room)
   - Team standings (same team panel showing updated purse/squad)

2. For `finalized`:
   - Show final results card
   - Link to analytics and teams pages

**Edge cases:**
- Spectators don't have team JWTs so can't call team APIs — they rely on socket broadcasts
- Need to accumulate executed trade announcements from socket events
- On initial load, need to fetch executed trades from public API

### Sub-phase 8F: Public Trades Page
**Files:** New `auction-frontend/src/app/[slug]/trades/page.tsx` + `client.tsx`

1. Server component fetches executed trades from `fetchAuctionTrades(slug)`
2. Client component renders:
   - Trade cards with team colors, player lists, settlement info
   - Each player clickable → PlayerDetailModal
   - SEO metadata + JSON-LD

3. Add to server-api.ts: `fetchAuctionTrades(slug)`
4. Add "Trades" link to the auction sub-navigation in layout.tsx

**Edge cases:**
- No executed trades → show "No trades have been executed yet"
- During trade_window, don't show pending trades (only executed are public)
- Ensure the page handles zero playerFields gracefully

### Sub-phase 8G: Update README
Update `plannings/auction-system/README.md` Phase 8 status and add deliverables section.

---

## Edge Cases Summary (Cross-cutting)

| Scenario | Handling |
|----------|----------|
| Trade window expires while team has page open | Countdown shows "Expired", proposal form disabled, existing trades still visible |
| Admin finalizes mid-trade | Socket broadcasts status change, all pending trades auto-expired server-side, client transitions to finalized state |
| Socket reconnection during trade_window | Re-fetch all trades + squad on reconnect |
| Legacy trades (old schema) in DB | `enrichTradesWithTeams` already filters them out (fixed in previous session) |
| Team at max executed trades | Proposal form shows limit reached, submit button disabled |
| Player disqualified after trade proposed | Server re-validates on accept/approve; auto-rejects if invalid |
| Both teams propose to each other | Each creates separate trade — no conflict unless same players |
| Purse insufficient for settlement | Admin sees red warning but can still approve (discretion) |
| Trade window not yet opened (status=completed) | Trade panel shows but all actions disabled with "Waiting for admin" message |
| Multiple rapid trade events | Debounced re-fetch to avoid flooding |

---

## Implementation Order

| # | Sub-phase | Files | Priority |
|---|-----------|-------|----------|
| 1 | 8A: Socket state foundation | auctionEngine.js, AuctionSocketContext.tsx | HIGH |
| 2 | 8B: Real-time trade events | bid/[token]/page.tsx | HIGH |
| 3 | 8C: Bid page state differentiation | bid/[token]/page.tsx | HIGH |
| 4 | 8D: Admin overview trade banner | admin/[auctionId]/page.tsx, auction.js | HIGH |
| 5 | 8E: Spectator trade_window view | [slug]/live/client.tsx | MEDIUM |
| 6 | 8F: Public trades page | [slug]/trades/* (new), server-api.ts, layout.tsx | MEDIUM |
| 7 | 8G: README update | README.md | LOW |

Dependencies: 8A must go first (all others depend on socket state). 8B before 8C (events before UI). Rest are independent.
