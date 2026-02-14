# SEO Site Homepage & Product Page Restructuring Plan

Complete restructuring of cricsmart.in with keyword-rich URLs, elegant auction features showcase, and "Why CricSmart" section linking to all products.

---

## ✅ Decisions Finalized

| Question | Decision |
|----------|----------|
| URL format | **Option A: Keyword-rich** (`/cricket-team-management`, etc.) |
| Redirects | **Keep old URLs** with 301 redirects for backlinks |
| FeatureSpotlight | **Replace with "Why CricSmart"** that smartly links to product features |
| Auction features | **Top 10 features** with elegant graphics, premium animations, no basic icons |

---

## Final URL Structure

```
/                                    → Homepage
/products                            → Products hub (all 3 detailed)
/cricket-team-management             → CricSmart Teams (moved from /features)
/cricket-tournament-management       → CricSmart Tournament (enhanced)
/cricket-player-auction              → CricSmart Auction (major overhaul)
```

**301 Redirects:**
- `/features` → `/cricket-team-management`
- `/tournament` → `/cricket-tournament-management`
- `/auction` → `/cricket-player-auction`

---

## Implementation Phases

### Phase 1: New Pages & Redirects
1. Create `/cricket-team-management/page.tsx` (copy + enhance from `/features`)
2. Create `/cricket-tournament-management/page.tsx` (copy + enhance from `/tournament`)
3. Create `/cricket-player-auction/page.tsx` (complete rewrite with top 10 features)
4. Create `/products/page.tsx` (new products hub)
5. Add 301 redirects in `next.config.js`

### Phase 2: Auction Page Overhaul (Premium Design)
**Top 10 Features (with elegant graphics/animations):**
1. **Real-time Live Bidding** — WebSocket-powered instant updates
2. **Broadcast View** — OBS-ready streaming overlay for YouTube
3. **Post-Auction Trading** — 48-hour bilateral trade window
4. **Admin Undo Stack** — Reverse last 3 actions (sold/unsold)
5. **Team Purse Management** — Auto-calculate max bids, remaining budget
6. **Tiered Bid Increments** — IPL-style preset templates
7. **Player Retention System** — Marquee picks with captain designation
8. **Spectator Mode** — Public live view for fans
9. **Comprehensive Analytics** — Team spending, role breakdown, value picks
10. **Excel Export** — Multi-sheet results with all auction data

**Design Requirements:**
- Premium icon set (Lucide Pro-style or custom SVG)
- Framer Motion animations (reveal on scroll, hover effects)
- Glass-morphism cards with gradient accents
- Feature demo GIFs/videos where applicable
- Elegant pricing cards (not basic boxes)

### Phase 3: Homepage Updates
1. Update `ProductsSection` with new URLs and "CricSmart [Product]" naming
2. Replace `FeatureSpotlight` with new `WhyCricSmart` section
3. Update all internal links and CTAs

### Phase 4: "Why CricSmart" Section (New)
```
┌─────────────────────────────────────────┐
│  "Why Teams Choose CricSmart"           │
├─────────────────────────────────────────┤
│  3 columns (one per product):           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Teams   │ │Tournament│ │ Auction │   │
│  │ • AI    │ │ • Auto  │ │ • Live  │   │
│  │ • WA    │ │ • Track │ │ • Trade │   │
│  │ [Learn] │ │ [Learn] │ │ [Learn] │   │
│  └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────┤
│  "All products work together seamlessly"│
└─────────────────────────────────────────┘
```

### Phase 5: Navigation & SEO
1. Update `Header.tsx` with Products dropdown menu
2. Update `schema.ts` with new page schemas
3. Update `next-sitemap.config.js`
4. Verify canonical URLs on all pages

---

## Files to Create/Modify

### New Files
| File | Description |
|------|-------------|
| `app/products/page.tsx` | Products hub page |
| `app/cricket-team-management/page.tsx` | Teams product page |
| `app/cricket-tournament-management/page.tsx` | Tournament product page |
| `app/cricket-player-auction/page.tsx` | Auction product page (new design) |
| `app/cricket-player-auction/AuctionFeatures.tsx` | Premium features component |
| `components/home/WhyCricSmart.tsx` | New section replacing FeatureSpotlight |

### Modify Files
| File | Changes |
|------|---------|
| `next.config.js` | Add 301 redirects |
| `app/page.tsx` | Replace FeatureSpotlight with WhyCricSmart |
| `components/Header.tsx` | Products dropdown menu |
| `components/home/ProductsSection.tsx` | Update URLs & naming |
| `components/home/index.ts` | Export WhyCricSmart |
| `lib/schema.ts` | Add schemas for new URLs |

### Delete/Redirect Files
| File | Action |
|------|--------|
| `app/features/page.tsx` | Keep as redirect page OR handle in next.config |
| `app/tournament/page.tsx` | Keep as redirect page OR handle in next.config |
| `app/auction/*` | Keep as redirect page OR handle in next.config |
| `components/home/FeatureSpotlight.tsx` | Delete after WhyCricSmart is ready |

---

## Auction Page Design Specs

### Hero Section
- Large gavel icon with animated glow
- "IPL-Style Cricket Auctions" headline
- Animated bid counter demo
- Primary CTA: gradient button with shine effect

### Feature Cards (Top 10)
```tsx
// Each feature card:
- Icon: Custom SVG or Lucide with gradient fill
- Title: Bold, white
- Description: Slate-400, 2 lines max
- Visual: Mini animation or illustration
- Hover: Scale + glow effect
```

### Animations
- **Reveal on scroll**: Staggered fade-up (Framer Motion)
- **Feature cards**: Hover scale(1.02) + shadow increase
- **Icons**: Subtle float animation
- **Numbers**: Count-up animation for stats

### Color Scheme (Auction-specific)
- Primary: Amber/Orange gradient (`from-amber-500 to-orange-500`)
- Accent: Gold highlights for premium feel
- Background: Slate-900 with amber glow blobs

---

## Ready to Implement?

Confirm this plan and I'll begin with Phase 1 (new pages + redirects).
