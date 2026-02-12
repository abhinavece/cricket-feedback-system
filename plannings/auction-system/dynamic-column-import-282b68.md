# Dynamic Column Import & Player Card Enhancement

Design plan for extending the player import to support unlimited custom columns (up to 20+), with auto-import, admin-configurable display, modal player profiles, and live auction card rendering.

---

## Decisions (Confirmed)

- **Max card fields:** Up to 20 custom fields on PlayerCard. Compact multi-column grid layout.
- **Field config location:** New **"Player Fields"** tab in admin nav.
- **Player list expansion:** **Modal popup** for full player profile. Key stats shown directly on card/row.
- **Import behavior:** **Auto-import all columns.** Excel/CSV column names become field names in UI. Only `name` and `role` need explicit mapping.

---

## Current State (What Exists Today)

### Backend
- **`AuctionPlayer.customFields`** — `Map<String, Mixed>` already stores all unmapped columns. Working.
- **Import route** (`auctionPlayer.js`) — Two-step (upload → map → import). Maps `name`, `role`, `imageUrl`. Extras go to `customFields`.
- **`Auction.displayConfig`** — Schema exists with `visibleColumns`, `sortableColumns`, `filterableColumns`. **Unused by frontend.**
- **`buildAuctionState`** — Already selects `customFields` from the current player.
- **`BiddingPlayer` interface** — Already has `customFields?: Record<string, any>`.

### Frontend
- **Import wizard** — Only 3 hardcoded mapping dropdowns.
- **Player list** — Static 6-column table. No custom fields.
- **PlayerCard / Broadcast** — Shows avatar, name, role, bid. No custom fields.

---

## Design

### A. Data Model Changes

#### 1. Extend `Auction.displayConfig`

Replace the flat-array schema with richer field metadata:

```js
const playerFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },       // Excel column name (normalized)
  label: { type: String, required: true },      // Display label (auto from column name)
  type: {
    type: String,
    enum: ['text', 'number', 'url', 'date'],
    default: 'text',
  },
  showOnCard: { type: Boolean, default: true },   // Show on live PlayerCard
  showInList: { type: Boolean, default: true },    // Show in admin player list
  sortable: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: false });

displayConfig: {
  playerFields: [playerFieldSchema],
}
```

Backward-compatible — empty array = current behavior (name + role only).

#### 2. No changes to AuctionPlayer model
`customFields: Map<Mixed>` is already flexible. No change needed.

---

### B. Backend API Changes

#### 1. Import: Auto-populate `displayConfig.playerFields`

After successful import, auto-detect all custom field keys and save field config:

```js
// Scan all custom field keys from imported players
const allCustomKeys = new Set();
players.forEach(p => Object.keys(p.customFields || {}).forEach(k => allCustomKeys.add(k)));

// Merge with existing (preserve, don't overwrite)
const existing = auction.displayConfig?.playerFields || [];
const existingKeys = new Set(existing.map(f => f.key));
let order = existing.length;

for (const key of allCustomKeys) {
  if (!existingKeys.has(key)) {
    existing.push({
      key,
      label: key,  // Use Excel column name directly as label
      type: inferType(players, key),
      showOnCard: true,
      showInList: true,
      sortable: isNumericType,
      order: order++,
    });
  }
}
auction.displayConfig = { playerFields: existing };
await auction.save();
```

**Type inference:** Scan sample values. If >80% parse as numbers → `number`. If looks like URL → `url`. Else → `text`.

#### 2. New Endpoint: Update Player Field Config

```
PATCH /api/v1/auctions/:auctionId/display-config
Body: { playerFields: [...] }
```

Admin can reorder, rename labels, toggle visibility, change types.

#### 3. Extend `buildAuctionState`

Include `playerFields` in the auction state sent to all clients:
```js
return { ...state, playerFields: auction.displayConfig?.playerFields || [] };
```

#### 4. Extend player list endpoint

Support sorting by custom fields: `?sort=customFields.batting_avg&sortDir=-1`

---

### C. Frontend Changes

#### Phase C1: Simplified Import Wizard

Replace 3-dropdown mapping with a smarter flow:

```
┌──────────────────────────────────────────────────────┐
│ Map Required Columns                                 │
│                                                      │
│  "Player Name" column  →  [Player Name ▾]  ✓ auto   │
│  "Role" column         →  [Role ▾]         ✓ auto   │
│  "Photo" column        →  [Image URL ▾]    optional  │
│                                                      │
│ ─────────────────────────────────────────────────── │
│ All other columns auto-imported as player stats:     │
│                                                      │
│  Age, Batting Avg, Bowling Avg, Matches,            │
│  Strike Rate, CricHeroes ID, DOB, ...              │
│                                                      │
│  [✓] Import all 12 additional columns               │
│                                                      │
│ Preview (first 5 rows):                             │
│ ┌──────────────────────────────────────────────┐    │
│ │ Name  │ Role │ Age │ Bat Avg │ Bowl Avg │ ...│    │
│ │ Virat │ Bat  │ 36  │ 53.4   │ —        │ ...│    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│           [Back]  [Import 30 Players]                │
└──────────────────────────────────────────────────────┘
```

- Auto-detect `name`/`role`/`imageUrl` columns (existing `suggestColumnMapping`)
- Show ALL remaining columns listed as "auto-imported stats"
- Preview table shows ALL columns (scrollable)
- Optional: let admin uncheck specific columns to skip them

#### Phase C2: "Player Fields" Tab (New Admin Tab)

New tab in admin nav: Overview | **Live Control** | Teams | **Player Fields** | Players | Settings

```
┌──────────────────────────────────────────────────────────┐
│ Player Display Fields                        [Save]      │
│                                                          │
│ Configure which fields appear on player cards and lists  │
│                                                          │
│  ≡  Name          text    [✓] List  [✓] Card            │
│  ≡  Role          text    [✓] List  [✓] Card            │
│  ≡  Age           number  [✓] List  [✓] Card  [↕ Sort]  │
│  ≡  Batting Avg   number  [✓] List  [✓] Card  [↕ Sort]  │
│  ≡  Bowling Avg   number  [✓] List  [✓] Card  [↕ Sort]  │
│  ≡  Strike Rate   number  [✓] List  [ ] Card  [↕ Sort]  │
│  ≡  Matches       number  [✓] List  [ ] Card  [↕ Sort]  │
│  ≡  DOB           date    [ ] List  [ ] Card             │
│  ≡  CricHeroes    url     [ ] List  [ ] Card             │
│  ...                                                     │
│                                                          │
│  ≡ = drag to reorder  |  Click label to rename           │
└──────────────────────────────────────────────────────────┘
```

- Reorder via drag (or up/down arrows for simplicity in v1)
- Toggle: show in List, show on Card, sortable
- Inline-edit display label
- Type dropdown (text/number/url/date)

#### Phase C3: Enhanced Player List with Modal

**Dynamic table columns:**

| # | Player | Role | Age | Bat Avg | Bowl Avg | Status | Sold To | Amount |
|---|--------|------|-----|---------|----------|--------|---------|--------|
| 1 | Virat  | Bat  | 36  | 53.4    | —        | Sold   | CSK     | ₹15L   |

- Columns driven by `playerFields` where `showInList: true`
- **Click row → modal popup** with full player profile (ALL fields)
- **Sortable columns** — click header to sort
- **Horizontal scroll** if many columns (overflow-x-auto)
- **Mobile cards** — show top 3-4 custom fields inline

**Player Profile Modal:**
```
┌──────────────────────────────────────────┐
│  [avatar]  Virat Kohli  #1         [X]   │
│            🏏 Batsman                     │
│  ──────────────────────────────────────  │
│  Age           36                        │
│  DOB           05 Nov 1988               │
│  Batting Avg   53.4                      │
│  Bowling Avg   —                         │
│  Strike Rate   93.2                      │
│  Matches       274                       │
│  CricHeroes    [link]                    │
│  ...all 20 fields...                     │
│  ──────────────────────────────────────  │
│  Status: Sold → CSK for ₹15L            │
│  Round History: R1: Sold ₹15L (CSK)     │
└──────────────────────────────────────────┘
```

#### Phase C4: Live PlayerCard + Broadcast Enhancement

**PlayerCard** renders all `showOnCard: true` fields in a compact grid:

```
┌──────────────────────────────────────┐
│  🏏 Batsman                          │
│  Virat Kohli                  #1     │
│  ┌────────────┬─────────────────┐   │
│  │ Age: 36    │ Avg: 53.4       │   │
│  │ SR: 93.2   │ Matches: 274    │   │
│  │ Econ: —    │ Wkts: 4         │   │
│  └────────────┴─────────────────┘   │
│                                      │
│  Current Bid                         │
│  ₹5L                      5.0×      │
│  ▓▓▓▓▓▓░░░░░░░ Base → 10×          │
└──────────────────────────────────────┘
```

- **2-column grid** for custom fields (compact `key: value` pairs)
- Handles up to 20 fields with scrollable area if needed
- **Broadcast view:** Same fields, larger text, 2-3 column grid
- Empty values rendered as "—"
- Numbers formatted: decimals for averages, integers for counts

---

### D. Implementation Phases (Ordered)

| Phase | Scope | Files Changed | Effort |
|-------|-------|---------------|--------|
| **1** | Backend: extend displayConfig schema, auto-populate on import, PATCH endpoint, extend buildAuctionState | `Auction.js`, `auctionPlayer.js`, `auction.js`, `auctionEngine.js` | Small |
| **2** | Import wizard: show all columns, auto-import, simplified mapping | `players/page.tsx` (ImportPlayersModal), `api.ts` | Medium |
| **3** | Player list: dynamic columns, sorting, click → modal popup | `players/page.tsx` | Medium |
| **4** | Player Fields tab: admin field config UI | New: `fields/page.tsx`, admin layout, `api.ts` | Medium |
| **5** | Live card + broadcast: render custom fields grid | `PlayerCard.tsx`, `broadcast/client.tsx`, `AuctionSocketContext.tsx` | Medium |

**Order:** 1 → 2 → 3 → 4 → 5

---

### E. Challenges with 20+ Custom Fields

| Challenge | Solution |
|-----------|---------|
| **Card layout overflow** | 2-column compact grid with max-height + scroll if >10 fields visible |
| **Table too wide** | `overflow-x-auto` horizontal scroll. Pin #/Name/Status columns. |
| **Mobile space** | Show top 4 fields on mobile card. Full list in modal. |
| **Broadcast readability** | 2-3 column grid, larger text. Admin can limit `showOnCard` fields. |
| **MongoDB Map sorting** | `$getField` aggregation. Fine for <1000 players. |
| **Type inference errors** | Admin fixes in Player Fields tab. Auto-detect is best-effort. |
| **Re-import different columns** | Merge: keep existing config, add new keys, don't remove old. |
| **Empty cells** | Render "—". Skip in card if all empty for a field. |
| **Column name normalization** | Keep original Excel name as-is for label. Use as Map key directly. |
| **Backward compat** | Empty `playerFields[]` = show name/role only (current behavior). |

### F. Out of Scope (Future)

- Per-player base price override
- Conditional formatting (highlight high averages)
- Column-level filter dropdowns
- Image column type (thumbnails in table)
- Bulk edit custom fields after import
- Player comparison view (side-by-side)
- CricHeroes API integration (auto-fetch stats)
