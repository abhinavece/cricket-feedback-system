# CricSmart Auction — Implementation Architecture

Implementation architecture covering hosting, auth isolation, SEO strategy, Next.js frontend structure, backend additions, and infrastructure for `auction.cricsmart.in`.

---

## 1. Hosting & URL Structure

**Domain**: `auction.cricsmart.in`

### Platform Architecture

| Product | Framework | Subdomain | SEO? |
|---------|-----------|-----------|------|
| Team Management | React SPA (Vite) | app.cricsmart.in | No |
| Tournament Hub | React SPA (Vite) | tournament.cricsmart.in | No |
| SEO/Marketing | Next.js | cricsmart.in | Yes |
| **Auction** | **Next.js** | **auction.cricsmart.in** | **Yes** |

### URL Routes

#### Public Pages (SSR/SSG — Crawlable, SEO-Optimized)

| URL | Rendering | Description |
|-----|-----------|-------------|
| `/` | SSG | Landing page — "What is CricSmart Auctions", features, pricing, CTA |
| `/explore` | SSR (revalidate: 60s) | Browse all public auctions — upcoming, live, completed |
| `/[slug]` | SSR (revalidate: 30s) | Individual auction page — details, status, teams, JSON-LD |
| `/[slug]/teams` | SSR | Team squads — compositions, retained players |
| `/[slug]/analytics` | SSR | Post-auction stats — charts, top picks, spending |
| `/[slug]/live` | Client-side (WebSocket) | Live bidding spectator view (SSR shell for SEO) |
| `/[slug]/broadcast` | Client-side | OBS capture view — no SEO needed |

#### Authenticated Pages (Client-Side Only)

| URL | Auth | Description |
|-----|------|-------------|
| `/admin` | Google OAuth (user JWT) | Admin dashboard — list auctions I manage |
| `/admin/create` | Google OAuth | Create new auction wizard |
| `/admin/[slug]` | Google OAuth + auction admin | Manage specific auction |
| `/admin/[slug]/setup` | Google OAuth + auction admin | Teams, players, config setup |
| `/admin/[slug]/live` | Google OAuth + auction admin | Live auction control panel |
| `/bid/[accessToken]` | Team access token | Team bidding interface |
| `/auth-callback` | — | Cross-domain auth handler |

---

## 2. Authentication & Authorization — Product Isolation

### Core Principle: Shared Identity, Isolated Authorization

```
Google OAuth → JWT (userId) → Same for ALL CricSmart products
                                  ↓
                    Each product checks its OWN resource-level roles
```

### How Isolation Works

| Product | Authorization Check | Data Source |
|---------|-------------------|-------------|
| Team Management | `user.organizations[]` → org membership | Organization model |
| Tournament | `user.organizations[]` → org membership | Organization model |
| **Auction** | `auction.admins[]` → auction-level role | **Auction model** |

### Isolation Scenarios

| Scenario | Result |
|----------|--------|
| User registers via auction → visits app.cricsmart.in | `resolveTenant` → no org membership → "No organization" → **blocked** ✅ |
| User is team admin → visits auction.cricsmart.in | Has JWT but not in any `auction.admins[]` → sees only public pages → **no admin access** ✅ |
| User creates auction → visits tournament.cricsmart.in | Not in any org → **no tournament access** ✅ |

### Standalone Auth (No Organization Required)

- **V1 is fully standalone** — `organizationId` stays `null`
- Auction creator becomes `owner` (Google OAuth)
- Creator invites co-admins by email → they login via Google OAuth → added to `auction.admins[]`
- No organization creation, no `resolveTenant` middleware needed for auction routes
- **Future**: When org linkage is added, set `organizationId` → org admins auto-inherit

### Login Flow

```
auction.cricsmart.in/admin → "Login Required" →
  Redirect to cricsmart.in/auth/login?service=auction&redirect=https://auction.cricsmart.in/admin →
    Google OAuth → backend /api/auth/google → JWT token →
      Cross-domain redirect to auction.cricsmart.in/auth-callback?token=...&user=... →
        Store JWT in localStorage → redirect to /admin →
          Frontend: GET /api/v1/auctions?adminOf=me → shows only user's auctions
```

> **Already configured**: `seo-site/app/auth/login/page.tsx` has `service=auction` with `auction.cricsmart.in` in `ALLOWED_DOMAINS` and `SERVICE_CONFIG`.

### Team Bidding Auth (Separate from Google OAuth)

```
Admin creates team → system generates accessCode (6-char) + accessToken (URL token)
  → Share magic link: auction.cricsmart.in/bid/{accessToken}
    → Team owner opens link → validates token → receives team-scoped JWT
      → JWT contains { teamId, auctionId } — cannot access anything else
```

### Backend Middleware

```javascript
// resolveAuctionAdmin — checks auction.admins[] for authenticated user
const resolveAuctionAdmin = async (req, res, next) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ error: 'Auction not found' });
  const adminEntry = auction.admins.find(a => a.userId.equals(req.user._id));
  if (!adminEntry) return res.status(403).json({ error: 'Not an admin of this auction' });
  req.auction = auction;
  req.auctionRole = adminEntry.role; // 'owner' or 'admin'
  next();
};

// resolveAuctionTeam — validates team JWT (separate from user JWT)
const resolveAuctionTeam = async (req, res, next) => {
  const teamToken = req.headers['x-team-token'];
  if (!teamToken) return res.status(401).json({ error: 'Team authentication required' });
  const decoded = jwt.verify(teamToken, process.env.JWT_SECRET);
  if (!decoded.teamId) return res.status(401).json({ error: 'Invalid team token' });
  req.auctionTeam = await AuctionTeam.findById(decoded.teamId);
  if (!req.auctionTeam) return res.status(404).json({ error: 'Team not found' });
  next();
};
```

---

## 3. SEO Strategy

### JSON-LD Structured Data (Per Auction Page)

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Mumbai Premier League 2025 — Player Auction",
  "description": "Live cricket player auction for MPL 2025. 8 teams, 120 players.",
  "url": "https://auction.cricsmart.in/mpl-2025",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
  "startDate": "2025-03-15T10:00:00+05:30",
  "endDate": "2025-03-15T18:00:00+05:30",
  "organizer": {
    "@type": "Organization",
    "name": "CricSmart",
    "url": "https://cricsmart.in"
  },
  "location": {
    "@type": "VirtualLocation",
    "url": "https://auction.cricsmart.in/mpl-2025/live"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock"
  }
}
```

### SEO Pages & Content

- **Every completed auction** remains as a permanent public page with full results
- **Analytics pages** are public and crawlable (top picks, spending charts)
- **`/explore` page** aggregates all auctions → internal linking → SEO juice flows
- **OG tags** per auction for social sharing (Twitter cards, WhatsApp previews)

### Sitemap (`auction.cricsmart.in/sitemap.xml`)

Generated via `next-sitemap`:
- Static: `/`, `/explore`
- Dynamic: `/[slug]`, `/[slug]/teams`, `/[slug]/analytics`
- Server-sitemap for dynamic entries via `/api/seo/sitemap/auctions`

### Meta Tags Per Page

| Page | Title Template | Description |
|------|---------------|-------------|
| Landing | "CricSmart Auctions — IPL-Style Cricket Player Auctions" | Fixed marketing copy |
| Explore | "Browse Cricket Auctions \| CricSmart" | Dynamic count |
| `[slug]` | "{Auction Name} — Player Auction \| CricSmart" | Dynamic from auction data |
| `[slug]/teams` | "Team Squads — {Auction Name} \| CricSmart" | Team compositions |
| `[slug]/analytics` | "Auction Results — {Auction Name} \| CricSmart" | Stats & analytics |

### cricsmart.in/auction Marketing Page

The existing `seo-site/app/auction/page.tsx` stays as a **marketing page**:
- Lists upcoming and recent public auctions (fetched from `/api/seo/auctions?limit=6`)
- CTA buttons link to `auction.cricsmart.in`
- "Coming Soon" modal replaced with live auction links
- Contributes to main site SEO with auction-related keywords

---

## 4. Frontend Structure (`auction-frontend/`)

```
auction-frontend/
├── app/
│   ├── layout.tsx                    # Root layout, auction branding
│   ├── page.tsx                      # Landing page (SSG)
│   ├── explore/
│   │   └── page.tsx                  # Browse auctions (SSR)
│   ├── [slug]/
│   │   ├── layout.tsx                # Auction-scoped layout (name, status)
│   │   ├── page.tsx                  # Auction details (SSR, JSON-LD)
│   │   ├── live/
│   │   │   └── page.tsx              # Live spectator (client, WebSocket)
│   │   ├── teams/
│   │   │   └── page.tsx              # Team squads (SSR)
│   │   ├── analytics/
│   │   │   └── page.tsx              # Post-auction stats (SSR)
│   │   └── broadcast/
│   │       └── page.tsx              # OBS view (client)
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout with auth guard
│   │   ├── page.tsx                  # Dashboard — my auctions
│   │   ├── create/
│   │   │   └── page.tsx              # Create auction wizard
│   │   └── [slug]/
│   │       ├── page.tsx              # Manage auction overview
│   │       ├── setup/
│   │       │   └── page.tsx          # Teams, players, config
│   │       └── live/
│   │           └── page.tsx          # Admin live control panel
│   ├── bid/
│   │   └── [token]/
│   │       └── page.tsx              # Team bidding interface
│   └── auth-callback/
│       └── page.tsx                  # Cross-domain auth handler
├── components/
│   ├── layout/                       # Header, Footer, Navigation
│   ├── auction/                      # AuctionCard, PlayerCard, BidTicker
│   ├── admin/                        # AdminControls, UndoPanel, TeamManager
│   ├── bidding/                      # BidButton, Timer, BidHistory
│   ├── broadcast/                    # BroadcastView, SoldAnimation
│   └── shared/                       # SchemaScript, Breadcrumbs, etc.
├── contexts/
│   ├── AuthContext.tsx                # User auth state (JWT from localStorage)
│   ├── AuctionContext.tsx             # Real-time auction state
│   └── WebSocketContext.tsx           # Socket.IO connection manager
├── lib/
│   ├── api.ts                        # API client (public + auth endpoints)
│   ├── schema.ts                     # JSON-LD generators
│   ├── socket.ts                     # Socket.IO client setup
│   └── constants.ts                  # Site config, URLs
├── public/
│   ├── og/                           # OG images
│   ├── favicon.svg
│   └── robots.txt
├── Dockerfile.cloudrun               # Next.js standalone build
├── next.config.js
├── next-sitemap.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router, SSR/SSG) |
| Styling | Tailwind CSS (dark slate theme, amber/orange accents) |
| Icons | Lucide React |
| Real-time | Socket.IO Client |
| Animations | Framer Motion |
| Sitemap | next-sitemap |
| Charts | recharts (analytics) |

### Branding

- **Color scheme**: Dark slate background, amber/orange accents (distinct from team management's emerald)
- **Primary gradient**: `from-amber-500 to-orange-500`
- **Cards**: `bg-slate-800/50 backdrop-blur-xl border border-white/10`
- **Matches existing seo-site's auction page styling**

---

## 5. Backend Additions

### New Route Files

| File | Purpose | Auth |
|------|---------|------|
| `routes/auction.js` | Auction CRUD, lifecycle, admin management | User JWT + resolveAuctionAdmin |
| `routes/auctionTeam.js` | Team management, retention, access codes | User JWT + resolveAuctionAdmin |
| `routes/auctionPlayer.js` | Player pool import, validation, disqualify | User JWT + resolveAuctionAdmin |
| `routes/auctionBidding.js` | Bid placement, audit log | Team JWT (resolveAuctionTeam) |
| `routes/auctionTrade.js` | Post-auction trading | Team JWT or Admin JWT |
| `routes/auctionPublic.js` | Public/SEO endpoints | **No auth** |

### New Models

| Model | File |
|-------|------|
| Auction | `models/Auction.js` |
| AuctionTeam | `models/AuctionTeam.js` |
| AuctionPlayer | `models/AuctionPlayer.js` |
| ActionEvent | `models/ActionEvent.js` |
| BidAuditLog | `models/BidAuditLog.js` |
| AuctionTrade | `models/AuctionTrade.js` |

### New Middleware

| Middleware | Purpose |
|-----------|---------|
| `resolveAuctionAdmin` | Checks `auction.admins[]` for user JWT |
| `resolveAuctionTeam` | Validates team access token JWT |

### SEO Endpoints (Public, No Auth)

```
GET /api/seo/auctions                    — List public auctions (for explore + cricsmart.in/auction)
GET /api/seo/auctions/:slug              — Individual auction data (for SSR)
GET /api/seo/auctions/:slug/teams        — Team squads (for SSR)
GET /api/seo/auctions/:slug/analytics    — Post-auction analytics (for SSR)
GET /api/seo/sitemap/auctions            — All auction slugs (for sitemap)
```

### WebSocket (Socket.IO on Existing Backend)

- Add Socket.IO namespace: `io.of('/auction')`
- Room structure: `auction:{id}`, `team:{teamId}`, `admin:{auctionId}`
- Cloud Run supports WebSocket with `--session-affinity` flag
- Separate from any existing Socket.IO usage

---

## 6. Infrastructure Changes

### Cloud Run

- **New service**: `cricsmart-auction-frontend`
- **Dockerfile**: `auction-frontend/Dockerfile.cloudrun` (Next.js standalone)
- **Port**: 8080
- **Deploy script**: `infra/cloudrun/deploy-auction-frontend.sh`
- **Backend**: Enable `--session-affinity` for WebSocket support

### URL Map Update (`infra/cloudrun/url-map.yaml`)

```yaml
# Add to hostRules:
- hosts:
    - 'auction.cricsmart.in'
  pathMatcher: auction-paths

# Add to pathMatchers:
- name: auction-paths
  defaultService: projects/cricsmart/global/backendServices/cricsmart-backend-auction-frontend
  routeRules:
    - matchRules:
        - prefixMatch: /api/
      service: projects/cricsmart/global/backendServices/cricsmart-backend-api
      priority: 1
    - matchRules:
        - prefixMatch: /api
      service: projects/cricsmart/global/backendServices/cricsmart-backend-api
      priority: 2
```

### GitHub Actions

Update `deploy-cloudrun.yml`:
- Add `auction-frontend/**` change detection
- Add `deploy-auction-frontend` job
- Add `workflow_dispatch` option for auction-frontend

### NEG & Backend Service (GCP)

```bash
# Create NEG
gcloud compute network-endpoint-groups create cricsmart-auction-frontend-neg \
  --region=asia-south1 --network-endpoint-type=serverless \
  --cloud-run-service=cricsmart-auction-frontend

# Create backend service
gcloud compute backend-services create cricsmart-backend-auction-frontend \
  --global --load-balancing-scheme=EXTERNAL_MANAGED \
  --protocol=HTTPS

# Add NEG to backend service
gcloud compute backend-services add-backend cricsmart-backend-auction-frontend \
  --global --network-endpoint-group=cricsmart-auction-frontend-neg \
  --network-endpoint-group-region=asia-south1

# Enable CDN
gcloud compute backend-services update cricsmart-backend-auction-frontend \
  --global --enable-cdn
```

---

## 7. Implementation Order (Detailed)

### Step 1: Backend Models & CRUD (Week 1)
- Mongoose models (all 6)
- Auction CRUD routes + `resolveAuctionAdmin` middleware
- Team management routes + access code generation
- Player import (XLSX/CSV) with column mapping
- Public SEO endpoints for auctions
- Team login endpoint (access code → JWT)

### Step 2: Auction Frontend Scaffold (Week 1–2)
- Initialize `auction-frontend/` Next.js 14 app
- Root layout with auction branding (amber/orange)
- Auth callback page (cross-domain handler)
- Admin layout with auth guard (redirect to seo-site login)
- Landing page (SSG)
- Explore page (SSR, fetch from /api/seo/auctions)

### Step 3: Admin Dashboard (Week 2)
- Create auction wizard (name, config, timers, bid increments)
- Team setup (add teams, generate access codes, add retained players)
- Player import UI with column mapping + preview
- Auction configuration review & lock

### Step 4: Public Auction Pages (Week 2–3)
- Individual auction page with JSON-LD Event schema (SSR)
- Teams page with squad compositions (SSR)
- Sitemap generation (next-sitemap)
- OG image generation for social sharing
- Update cricsmart.in/auction to list real auctions

### Step 5: Real-Time Bidding Engine (Week 3–4)
- Socket.IO namespace `/auction` + rooms
- Server state machine (all 7 states)
- Bid validation + BidAuditLog
- Timer management (going-once/going-twice)
- Team bidding UI (access token auth)
- Spectator live view (public, real-time)
- Admin live control panel

### Step 6: Advanced Features (Week 4–5)
- Undo stack (LIFO, 3 player results)
- Sold/unsold animations (Framer Motion)
- Broadcast view for OBS
- Post-auction trading (48h window)
- Analytics page with charts

### Step 7: Infrastructure & Deployment (Week 5)
- Dockerfile.cloudrun for auction-frontend
- Cloud Run service setup
- URL map update
- GitHub Actions CI/CD
- SSL/DNS verification
- Backend session affinity for WebSocket

---

## 8. Confirmed Architecture Decisions

| Decision | Answer |
|----------|--------|
| Framework | **Next.js 14** (App Router) for SEO |
| Hosting | **auction.cricsmart.in** (separate Cloud Run service) |
| Auth isolation | **Shared identity, isolated authorization** (resource-level roles on Auction model) |
| Organization | **Fully standalone** — no org creation, `organizationId` = null in V1 |
| cricsmart.in/auction | **Marketing page** with CTA linking to auction.cricsmart.in + list upcoming/past auctions |
| WebSocket | **Socket.IO on existing backend** (Cloud Run session affinity) |
| Team bidding auth | **Separate access token JWT** (not Google OAuth) |
| SEO | SSR for public pages, JSON-LD Event schema, next-sitemap, OG tags |
| Past auctions | **Permanent public pages** with full results (SEO content) |
