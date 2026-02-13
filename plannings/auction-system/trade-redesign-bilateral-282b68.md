# Trade System Redesign — Bilateral Negotiation + Financial Settlement

Redesign the post-auction trade system with bilateral team consent, smart player locking, configurable financial settlement, clickable player details everywhere, and full trade visibility for all teams.

---

## Problems with Current Implementation

| Issue | Current | Proposed |
|---|---|---|
| Consent | Team A proposes unilaterally; Team B has no say | Both teams must agree before admin reviews |
| Player locking | No locking — any player can be in multiple proposals | Smart asymmetric locking (initiator locks, counterparty free) |
| Financials | Pure player swap, no price consideration | Show purchase prices, auto-calculate settlement |
| Purse adjustment | None | Configurable per-auction; admin has final say |
| Player details | Only clickable on public `/players` page | Clickable everywhere (trades, teams, live, public) |
| Trade visibility | Teams see only their own trades | Own trades first + all other teams' trades visible |
| Public trades | Basic: player names only | Rich: prices, settlement info, clickable players |

---

## New Trade Flow

```
Team A proposes → Team B accepts/rejects → Both agree → Admin approves+executes
                                                      → Admin rejects (with reason)
```

### Statuses

| Status | Meaning |
|---|---|
| `pending_counterparty` | Team A proposed, waiting for Team B |
| `both_agreed` | Both teams accepted — ready for admin |
| `executed` | Admin approved & swap completed |
| `rejected` | Rejected by counterparty OR admin |
| `withdrawn` | Initiator cancelled before counterparty responded |
| `cancelled` | Auto-cancelled due to player conflict (see locking rules) |
| `expired` | Trade window closed before completion |

> **v1 simplification:** No in-place counter-offers. If Team B doesn't like the terms, they reject and either team can propose a new trade with different terms. Counter-offers can be v2.

---

## Smart Player Locking Mechanism

The key design challenge: prevent one team from "blocking" another team's players by spamming proposals.

### Locking Rules

| Player's role in trade | Trade status | Player locked? |
|---|---|---|
| **Initiator's player** (player you're offering) | `pending_counterparty` | **YES** — locked immediately |
| **Initiator's player** | `both_agreed` | **YES** |
| **Counterparty's player** (player you're requesting) | `pending_counterparty` | **NO** — counterparty hasn't consented |
| **Counterparty's player** | `both_agreed` | **YES** — counterparty accepted |
| Any player | `executed/rejected/withdrawn/cancelled/expired` | **NO** |

### Why This Works
- **Fair**: Team A can't lock Team B's players by proposing trades — only Team A's own players get locked.
- **Committed**: Once you offer your player, it's committed until the trade resolves (no double-offering).
- **Free market**: Team B's requested players remain free until Team B explicitly accepts.

### Auto-Cancellation Rules

When a counterparty player becomes **committed** (locked), all pending trades that *request* that same player get auto-cancelled:

**Trigger 1 — Counterparty initiates their own trade offering Player B:**
```
Pending: Team A → Team B (requesting Player B)
Team B initiates: Team B → Team D (offering Player B)
→ Player B is now locked as Team B's initiator player
→ Team A's trade auto-cancelled (Player B no longer available)
→ Team A's players unlocked, Team A notified
```

**Trigger 2 — Counterparty accepts a different trade involving Player B:**
```
Pending: Team A → Team B (requesting Player B)
Pending: Team C → Team B (requesting Player B)
Team B accepts Team C's trade
→ Player B locked as counterparty-accepted player
→ Team A's trade auto-cancelled
→ Team A's players unlocked, Team A notified
```

### Validation on Each Action

**On Propose:**
1. Initiator's players must NOT be locked (not in any `pending_counterparty` or `both_agreed` trade as initiator player, or `both_agreed` trade as counterparty player)
2. Counterparty's players: no lock check needed (they're free until accepted)

**On Counterparty Accept:**
1. Re-validate counterparty's players are still not locked elsewhere
2. If any counterparty player is now locked → reject with "Player X is no longer available"
3. On successful accept → lock counterparty players → trigger auto-cancel of conflicting pending trades

**On Admin Approve+Execute:**
1. Re-validate ALL players still belong to their respective teams
2. Re-validate player statuses (not disqualified)
3. Check purse if settlement enabled (warn admin, don't block)

---

## Financial Settlement Model

When Player X (bought at ₹5L) is traded for Player Y (bought at ₹8L):

- **Initiator total value** = sum of `soldAmount` for players they're sending
- **Counterparty total value** = sum of `soldAmount` for players counterparty is sending
- **Settlement amount** = |difference|
- **Settlement direction** = team receiving higher-value players pays the difference

Example:
- Team A sends Player X (₹5L), receives Player Y (₹8L) → Team A pays ₹3L from purse
- Team B sends Player Y (₹8L), receives Player X (₹5L) → Team B gets ₹3L back to purse

### Config

Add `tradeSettlementEnabled: Boolean` (default: `true`) to `Auction.config`. When `false`, it's a pure swap — no purse adjustment. The settlement summary is always **shown** in the UI for transparency, but only **applied** when enabled.

### Admin Discretion (No Hard Block)

If the paying team can't afford the settlement:
- **Flag it** prominently in admin panel (red warning with purse details)
- **Don't block** the trade — admin has full discretion
- Admin can approve (swap happens without financial settlement if purse insufficient) or reject

---

## Max Trades Counting

Only **`executed`** trades count toward the `maxTradesPerTeam` limit. Rejected, withdrawn, cancelled, and expired trades do NOT count. This lets teams retry after failed negotiations.

---

## Phase A: Data Model Changes

### AuctionTrade model — replace current schema

```javascript
{
  auctionId: ObjectId,

  // Teams (renamed from from/to to initiator/counterparty for clarity)
  initiatorTeamId: ObjectId,       // Team that started the trade
  counterpartyTeamId: ObjectId,    // Team that must accept/reject

  // Players WITH financial info
  initiatorPlayers: [{
    playerId: ObjectId,
    name: String,
    role: String,
    soldAmount: Number,            // purchase price at auction
  }],
  counterpartyPlayers: [{
    playerId: ObjectId,
    name: String,
    role: String,
    soldAmount: Number,            // purchase price at auction
  }],

  // Financial summary (auto-calculated on creation)
  initiatorTotalValue: Number,     // sum of initiator player soldAmounts
  counterpartyTotalValue: Number,  // sum of counterparty player soldAmounts
  settlementAmount: Number,        // |difference|
  settlementDirection: String,     // 'initiator_pays' | 'counterparty_pays' | 'even'
  purseSettlementEnabled: Boolean, // snapshot from auction config at trade time

  // Status
  status: enum ['pending_counterparty', 'both_agreed', 'executed', 'rejected', 'withdrawn', 'cancelled', 'expired'],

  // Messages
  initiatorMessage: String,        // Note from proposer
  counterpartyMessage: String,     // Note from Team B on accept/reject
  adminNote: String,               // Admin note on approve/reject

  // Tracking
  rejectedBy: String,              // 'counterparty' | 'admin' | null
  rejectionReason: String,
  cancellationReason: String,      // NEW: reason for auto-cancellation
  counterpartyAcceptedAt: Date,    // when Team B accepted
  approvedBy: ObjectId,            // Admin user
  executedAt: Date,
  publicAnnouncement: String,
}
```

### Auction.config — add field

```javascript
tradeSettlementEnabled: {
  type: Boolean,
  default: true,
}
```

---

## Phase B: Backend API Changes

### Team endpoints (Team JWT via `resolveAuctionTeam`)

| Method | Path | Description |
|---|---|---|
| `POST /trades` | Propose trade | Create with `pending_counterparty`, lock initiator's players, calculate settlement |
| `GET /trades/my-trades` | My trades | Trades where team is initiator OR counterparty |
| `GET /trades/all-trades` | **NEW**: All trades in auction | For "other teams' trades" view (excludes messages/notes) |
| `GET /trades/team-players/:teamId` | Other team's players | Keep as-is, add `soldAmount` + ALL custom fields |
| `PATCH /trades/:tradeId/accept` | **NEW**: Counterparty accepts | Validate + lock counterparty players + auto-cancel conflicts |
| `PATCH /trades/:tradeId/reject` | **NEW**: Counterparty rejects | Body: `{ reason? }`, unlock initiator players |
| `PATCH /trades/:tradeId/withdraw` | **NEW**: Initiator withdraws | Only from `pending_counterparty`, unlock initiator players |

### Admin endpoints (Admin JWT)

| Method | Path | Description |
|---|---|---|
| `GET /trades` | List all trades | Full detail with messages/notes |
| `PATCH /trades/:tradeId/admin-approve` | **NEW**: Approve & execute | Validates players, swaps ownership, adjusts purse (if enabled + affordable), flags warnings |
| `PATCH /trades/:tradeId/admin-reject` | **NEW**: Reject | Body: `{ reason? }`, unlock all players |

> Remove old `/approve`, `/reject`, `/execute` endpoints.

### Auto-cancel helper function

```javascript
async function autoCancelConflictingTrades(auctionId, lockedPlayerIds, excludeTradeId) {
  // Find all pending_counterparty trades that REQUEST any of the locked players
  // Set them to 'cancelled' with reason
  // Unlock initiator players from those trades
  // Notify affected teams via Socket.IO
}
```

### Lifecycle: Auto-expire on finalize

`POST /finalize` → bulk-update all non-executed trades to `expired`.

### Socket.IO notifications

| Event | Recipients | Trigger |
|---|---|---|
| `trade:proposed` | Counterparty team + admin | Team proposes |
| `trade:accepted` | Initiator team + admin | Counterparty accepts |
| `trade:rejected` | Initiator team + admin | Counterparty rejects |
| `trade:withdrawn` | Counterparty team + admin | Initiator withdraws |
| `trade:cancelled` | Affected initiator team | Auto-cancel due to player conflict |
| `trade:executed` | Both teams + all spectators | Admin approves & executes |
| `trade:admin_rejected` | Both teams | Admin rejects |

### Public endpoint update

`GET /api/seo/auctions/:slug/trades` — Include settlement info, player roles, `soldAmount`, all custom fields per player.

---

## Phase C: Shared PlayerDetailModal Component

**New file:** `auction-frontend/src/components/auction/PlayerDetailModal.tsx`

Extract and enhance the existing `PlayerModal` from `[slug]/players/client.tsx` into a shared, reusable component.

### Features
- Player name, number, role, image
- **ALL custom fields** (from auction's `displayConfig`)
- Sold info: amount, team (with color badge), round
- Base price multiplier
- Trade history (if player was involved in any executed trades)
- Works with both full player objects (public pages) and minimal player data (trade cards — loads full data on open)

### Integration points
- **Public players page** (`[slug]/players/client.tsx`) — replace local `PlayerModal`
- **Public teams page** (`[slug]/teams/`) — make player names clickable
- **Trade cards** — player names in trade UI and trade history
- **Public auction page** (`[slug]/page.tsx`) — top picks section
- **Spectator live view** — NOT here (live PlayerCard serves a different purpose)

### API support
`GET /api/seo/auctions/:slug/players/:playerId` — returns full player detail including all custom fields.

---

## Phase D: Frontend — Team Trade UI Redesign

**File:** `auction-frontend/src/components/auction/TradeProposalPanel.tsx`

### Layout — Two views

**View 1: My Trades (primary, own modal/tab)**
```
┌──────────────────────────────────────┐
│ Trade Window Banner (status + timer)  │
├──────────────────────────────────────┤
│ 📥 INCOMING (badge count)             │
│   Trade from Team X → Accept/Reject   │
│   Settlement summary + player details │
├──────────────────────────────────────┤
│ 📤 OUTGOING                           │
│   Trade to Team Y → Pending/Withdraw  │
├──────────────────────────────────────┤
│ [+ Propose a Trade] button            │
│   → Form with all fields + settlement │
├──────────────────────────────────────┤
│ 📜 HISTORY (executed/rejected/etc)    │
└──────────────────────────────────────┘
```

**View 2: All Trades (secondary modal/tab)**
```
┌──────────────────────────────────────┐
│ 🌐 League Trade Activity              │
│   All executed + in-progress trades   │
│   (no private messages shown)         │
│   Clean, non-clumsy card layout       │
│   Filterable by team/status           │
└──────────────────────────────────────┘
```

### Key UI changes

1. **Incoming trades** — trades where `counterpartyTeamId === myTeamId` and `status === pending_counterparty`
   - Show players offered + players requested from your team with ALL custom fields
   - Show `soldAmount` for every player
   - Settlement summary: "You receive ₹X value, send ₹Y value. Settlement: ₹Z"
   - Accept / Reject buttons (reject opens reason input)
   - Player names clickable → opens PlayerDetailModal

2. **Outgoing trades** — trades where `initiatorTeamId === myTeamId` and `status === pending_counterparty`
   - Trade details + "Waiting for response" pulse indicator
   - Withdraw button

3. **Proposal form**
   - Show `soldAmount` + ALL custom fields next to each player name
   - Auto-calculate totals on each side as players are selected
   - Live settlement summary box
   - Warning if your player is already locked in another trade (disabled in selection)
   - Player names clickable → opens PlayerDetailModal

4. **All trades view** — separate tab/modal showing all auction trades (executed, in-progress)
   - Clean card layout, filterable by team
   - No private messages (initiatorMessage, counterpartyMessage, adminNote hidden)
   - Status badges, team colors, player details

---

## Phase E: Frontend — Admin Trades Tab Update

**File:** `auction-frontend/src/app/admin/[auctionId]/trades/page.tsx`

### Changes

1. **Priority view**: `both_agreed` trades at top with "⚡ Ready for Review" badge
2. **Status filters**: `pending_counterparty`, `both_agreed`, `executed`, `rejected`, `withdrawn`, `cancelled`, `expired`
3. **Settlement info**: Full value breakdown + purse impact for each trade
4. **Purse warning**: If paying team can't afford settlement → red banner: "Team X purse: ₹2L, settlement requires ₹3L" — but approve button still enabled (admin discretion)
5. **Single action**: "Approve & Execute" button (combines old approve + execute)
6. **Reject with reason**: Text input for admin rejection reason
7. **All custom fields** visible for each player in trade

---

## Phase F: Frontend — Public Trade Visibility

### Public auction page (`[slug]/page.tsx`)

1. Show `soldAmount` for each traded player
2. Show settlement info: "Settlement: ₹3L from Team A to Team B" (if purse settlement was enabled)
3. Player names clickable → opens PlayerDetailModal
4. During `trade_window`: show "X trades in progress" without details

### Team trade view — All Trades tab

1. `GET /trades/all-trades` endpoint (team JWT) returns all auction trades with limited info
2. Separate tab/modal from "My Trades"
3. Smart, beautiful, non-clumsy card layout
4. Filterable by team/status

---

## Phase G: Settings UI for Trade Config

**File:** `auction-frontend/src/app/admin/[auctionId]/settings/page.tsx`

Add to auction config form (only editable in draft):
- `tradeSettlementEnabled` toggle — "Enable purse settlement on trades"
- `maxTradesPerTeam` number input (already exists in config, just needs UI)
- `tradeWindowHours` number input (already exists in config, just needs UI)

---

## Implementation Order

| # | Phase | Priority | Depends on |
|---|---|---|---|
| 1 | A: Data model changes | High | — |
| 2 | B: Backend API + player locking + auto-cancel | High | A |
| 3 | G: Settings UI for trade config | Medium | A |
| 4 | C: Shared PlayerDetailModal | Medium | — |
| 5 | D: Team Trade UI redesign (my trades + all trades) | High | B, C |
| 6 | E: Admin Trades Tab update | High | B |
| 7 | F: Public trade visibility | Medium | B, C |

---

## Edge Cases Handled

- **Initiator's player already locked**: Block at propose time with "Player X is already in an active trade"
- **Counterparty's player committed elsewhere before accept**: Re-validate on accept; reject with "Player X is no longer available"
- **Player committed triggers auto-cancel**: All pending trades requesting that player get auto-cancelled; initiator's players unlocked; teams notified
- **Player disqualified after trade proposed**: Re-validate player ownership + status before execution
- **Purse insufficient for settlement**: Flag to admin (red warning) but don't block — admin has discretion
- **Trade window expires / auction finalized**: Bulk-expire all non-executed trades
- **Team proposes to itself**: Blocked
- **Both teams propose to each other simultaneously**: Each creates separate trade record — no conflict if players don't overlap; if players overlap, auto-cancel resolves it
- **Rejected/withdrawn/cancelled trades**: Do NOT count toward maxTradesPerTeam — only `executed` trades count
