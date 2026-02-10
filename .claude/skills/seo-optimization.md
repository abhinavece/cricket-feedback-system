# SEO Optimization Skill

## Capability
Enforce SEO-first thinking in every UI feature discussion, design, and implementation. Every public-facing page and feature must be optimized for search engine discoverability, structured data, and organic traffic growth.

## ⚠️ MANDATORY ENFORCEMENT
**This skill MUST be activated whenever discussing or implementing UI changes, new features, or public pages.** Before any UI work, ask:
- "Will this page be crawlable and indexable by Google?"
- "What are the target keywords for this feature?"
- "Should this use a subdomain or path-based URL structure?"

## Core Principle
CricSmart aims to be the **#1 search result** for cricket team management, tournament organization, and auction tools. Every feature should contribute to SEO ranking and organic discovery.

## URL Architecture Strategy

### Recommended: Path-Based Partitioning (Primary)
Path-based URLs are **strongly preferred** for SEO because they consolidate domain authority.

```
cricsmart.in/                          → Landing page (SSR/SSG)
cricsmart.in/teams/                    → Team management hub
cricsmart.in/tournaments/              → Tournament directory
cricsmart.in/auctions/                 → Auction platform
cricsmart.in/blog/                     → Content marketing
cricsmart.in/tools/                    → Free cricket tools (calculator, scorer)

cricsmart.in/teams/{team-slug}/        → Individual team page
cricsmart.in/tournaments/{slug}/       → Tournament landing page
cricsmart.in/auctions/{slug}/          → Auction event page
```

### When to Use Subdomains
Only use subdomains when the app is a **completely different product** or requires **separate infrastructure**:

```
app.cricsmart.in          → Authenticated app (SPA, not crawled)
tournament.cricsmart.in   → Tournament Hub app (authenticated)
api.cricsmart.in          → Backend API (not crawled)
```

### URL Design Rules
```
✅ cricsmart.in/tournaments/ipl-2025-auction          → SEO-friendly, path-based
✅ cricsmart.in/teams/mavericks-cricket-club           → Descriptive slug
✅ cricsmart.in/blog/how-to-organize-cricket-tournament → Long-tail keyword URL

❌ cricsmart.in/t/abc123                                → Non-descriptive
❌ tournament.cricsmart.in/event/12345                   → Subdomain splits authority
❌ cricsmart.in/page?id=123&type=tournament              → Query params, not crawlable
```

## SEO Implementation Patterns

### 1. Server-Side Rendering (SSR) for Public Pages
Public-facing pages MUST be server-rendered for SEO:

```typescript
// seo-site/app/tournaments/[slug]/page.tsx (Next.js)
import { Metadata } from 'next';

// Dynamic metadata generation
export async function generateMetadata({ params }): Promise<Metadata> {
  const tournament = await getTournament(params.slug);
  return {
    title: `${tournament.name} - Live Scores & Schedule | CricSmart`,
    description: `Follow ${tournament.name} live scores, schedule, points table, and player stats. ${tournament.teams} teams competing.`,
    keywords: [tournament.name, 'cricket tournament', 'live scores', tournament.location],
    openGraph: {
      title: `${tournament.name} | CricSmart`,
      description: tournament.description,
      images: [{ url: tournament.ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
    alternates: {
      canonical: `https://cricsmart.in/tournaments/${params.slug}`,
    },
  };
}

export default async function TournamentPage({ params }) {
  const tournament = await getTournament(params.slug);
  return (
    <>
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateTournamentSchema(tournament))
      }} />
      {/* Page content */}
      <TournamentContent tournament={tournament} />
    </>
  );
}
```

### 2. Structured Data (JSON-LD) — Required for All Public Pages

```typescript
// Sports Event schema for matches
const matchSchema = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "Mavericks vs Thunder - T20 Match",
  "startDate": "2025-03-15T14:00:00+05:30",
  "location": {
    "@type": "Place",
    "name": "DY Patil Stadium",
    "address": "Navi Mumbai, Maharashtra"
  },
  "homeTeam": { "@type": "SportsTeam", "name": "Mavericks" },
  "awayTeam": { "@type": "SportsTeam", "name": "Thunder" },
  "organizer": {
    "@type": "Organization",
    "name": "CricSmart",
    "url": "https://cricsmart.in"
  }
};

// Organization schema for team pages
const teamSchema = {
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  "name": "Mavericks Cricket Club",
  "sport": "Cricket",
  "url": "https://cricsmart.in/teams/mavericks-cricket-club",
  "logo": "https://cricsmart.in/teams/mavericks/logo.png",
  "member": players.map(p => ({
    "@type": "Person",
    "name": p.name,
    "url": `https://cricsmart.in/players/${p.slug}`
  }))
};

// FAQ schema for feature pages
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};
```

### 3. Meta Tags — Required for Every Page

```tsx
// Minimum meta tags for every public page
<head>
  <title>{pageTitle} | CricSmart - Cricket Team Management</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords.join(', ')} />
  <link rel="canonical" href={canonicalUrl} />
  
  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:site_name" content="CricSmart" />
  <meta property="og:locale" content="en_IN" />
  
  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
  
  {/* Mobile */}
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#10b981" />
</head>
```

### 4. Sitemap & Robots

```xml
<!-- public/sitemap.xml — Auto-generated -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cricsmart.in/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cricsmart.in/tournaments/</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- Dynamic entries for each public tournament, team, etc. -->
</urlset>
```

```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://cricsmart.in/sitemap.xml
```

## Feature-Specific SEO Strategy

### Auctions Feature
```
Target Keywords:
- "cricket auction platform"
- "IPL style auction app"
- "cricket player auction online"
- "organize cricket auction"

URL Structure:
/auctions/                              → Auction landing page (SSG)
/auctions/{auction-slug}/               → Individual auction page (SSR)
/auctions/{slug}/players/               → Player pool page
/auctions/{slug}/results/               → Auction results (public)
/blog/how-to-organize-cricket-auction/  → Content marketing
/tools/auction-calculator/              → Free tool (lead magnet)
```

### Tournament Feature
```
Target Keywords:
- "cricket tournament management"
- "online cricket tournament organizer"
- "cricket tournament scoring app"
- "create cricket tournament"

URL Structure:
/tournaments/                           → Tournament directory (SSG)
/tournaments/{slug}/                    → Tournament page (SSR)
/tournaments/{slug}/schedule/           → Match schedule
/tournaments/{slug}/points-table/       → Points table (high SEO value)
/tournaments/{slug}/stats/              → Player stats
```

### Team Management Feature
```
Target Keywords:
- "cricket team management app"
- "cricket squad management"
- "cricket team availability tracker"
- "cricket team WhatsApp bot"

URL Structure:
/teams/                                 → Team directory
/teams/{slug}/                          → Team page
/teams/{slug}/matches/                  → Match history
/teams/{slug}/players/                  → Player roster
```

## Content Strategy for SEO

### Blog/Content Pages
Every major feature should have supporting content:
```
/blog/how-to-manage-cricket-team/
/blog/best-cricket-auction-strategies/
/blog/tournament-formats-explained/
/blog/cricket-team-communication-tips/
```

### Free Tools (Lead Magnets)
```
/tools/cricket-scorer/          → Free scoring tool
/tools/auction-calculator/      → Budget calculator
/tools/team-generator/          → Random team generator
/tools/net-run-rate-calculator/ → NRR calculator
```

## Performance & Core Web Vitals

### Requirements (Google Ranking Signals)
| Metric | Target | How |
|--------|--------|-----|
| LCP (Largest Contentful Paint) | < 2.5s | SSR, optimized images, CDN |
| FID (First Input Delay) | < 100ms | Minimize JS, code splitting |
| CLS (Cumulative Layout Shift) | < 0.1 | Fixed dimensions, font loading |
| TTFB (Time to First Byte) | < 200ms | Edge caching, CDN |

### Image Optimization
```tsx
// ✅ Always use Next.js Image or optimized loading
import Image from 'next/image';
<Image src={src} alt={descriptiveAlt} width={800} height={600} loading="lazy" />

// ❌ Never use unoptimized images
<img src={src} />
```

## SEO Checklist — Every Public Page

Before deploying any public-facing page:
- [ ] Page has unique, keyword-rich `<title>` tag (50-60 chars)
- [ ] Page has unique `<meta description>` (150-160 chars)
- [ ] Canonical URL is set
- [ ] Open Graph tags are present and correct
- [ ] Structured data (JSON-LD) is valid (test with Google's Rich Results Test)
- [ ] Images have descriptive `alt` text
- [ ] URL is clean, descriptive, and uses hyphens (not underscores)
- [ ] Page is SSR/SSG (not client-side only)
- [ ] Page loads under 2.5s (LCP)
- [ ] Sitemap is updated to include new pages
- [ ] Internal links point to the new page from relevant pages
- [ ] Mobile-friendly (Google's mobile-first indexing)
- [ ] H1 tag contains primary keyword
- [ ] Content is at least 300+ words for informational pages

## Common Pitfalls

1. **SPA without SSR** — Google can crawl JS but prefers SSR/SSG
2. **Missing canonical URLs** — Causes duplicate content penalties
3. **No structured data** — Misses rich snippet opportunities
4. **Subdomain overuse** — Splits domain authority unnecessarily
5. **Dynamic URLs with IDs** — Use human-readable slugs
6. **Missing alt text** — Hurts image SEO and accessibility
7. **No internal linking** — Pages need to be discoverable via links
8. **Ignoring Core Web Vitals** — Direct ranking signal since 2021
