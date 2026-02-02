# CricSmart SEO Site

Next.js SEO-optimized marketing site for CricSmart (cricsmart.in).

## Architecture

This is a separate Next.js application that serves as the SEO-optimized public-facing site:

- **cricsmart.in** - This Next.js site (SEO, marketing, tools, glossary)
- **app.cricsmart.in** - Existing React CRA app (authenticated features, PWA)
- **api.cricsmart.in** - Backend API

## Features

### SEO Content Pages
- **Glossary** (`/glossary`) - 100+ cricket terms with DefinedTerm schema
- **FAQ** (`/faq`) - Cricket questions with FAQPage schema
- **Tools** (`/tools`) - Free calculators with SoftwareApplication schema
- **Grounds** (`/grounds`) - Ground directory with SportsActivityLocation schema

### Free Cricket Tools
- Run Rate Calculator
- DLS Calculator
- Team Picker
- Virtual Toss
- Net Run Rate Calculator
- Strike Rate Calculator
- Overs Converter

### Google Schema (JSON-LD)
- Organization + SportsOrganization
- WebSite with SearchAction
- BreadcrumbList
- DefinedTerm (glossary)
- FAQPage
- HowTo
- SoftwareApplication
- SportsActivityLocation
- Review + AggregateRating

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Generate sitemap (runs after build)
npm run postbuild
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# Site URLs
NEXT_PUBLIC_SITE_URL=https://cricsmart.in
NEXT_PUBLIC_API_URL=https://api.cricsmart.in
NEXT_PUBLIC_APP_URL=https://app.cricsmart.in

# For sitemap generation
SITE_URL=https://cricsmart.in

# Google Search Console (optional)
GOOGLE_SITE_VERIFICATION=
```

## Deployment

### Option A: Vercel (Recommended)

1. Connect repository to Vercel
2. Set environment variables
3. Deploy

```bash
# Or deploy via CLI
npx vercel --prod
```

### Option B: Cloud Run

```bash
# Build Docker image
docker build -t cricsmart-seo .

# Push to registry
docker tag cricsmart-seo gcr.io/YOUR_PROJECT/cricsmart-seo
docker push gcr.io/YOUR_PROJECT/cricsmart-seo

# Deploy to Cloud Run
gcloud run deploy cricsmart-seo \
  --image gcr.io/YOUR_PROJECT/cricsmart-seo \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### DNS Configuration

1. Point `cricsmart.in` to Vercel/Cloud Run
2. Keep `app.cricsmart.in` pointing to existing CRA deployment
3. Keep `api.cricsmart.in` pointing to backend

## Sitemap

Sitemap is auto-generated on build via `next-sitemap`:

- `/sitemap.xml` - Main sitemap
- `/robots.txt` - Robots file

Dynamic routes (grounds, blog posts) are included via API fetch during build.

## Project Structure

```
seo-site/
├── app/
│   ├── layout.tsx          # Root layout with global SEO
│   ├── page.tsx            # Homepage
│   ├── about/
│   ├── privacy/
│   ├── glossary/
│   │   ├── page.tsx        # Glossary index
│   │   └── [term]/
│   ├── faq/
│   │   ├── page.tsx        # FAQ index
│   │   └── [category]/
│   ├── tools/
│   │   ├── page.tsx        # Tools index
│   │   ├── run-rate/
│   │   ├── toss/
│   │   └── team-picker/
│   └── grounds/
│       ├── page.tsx        # Grounds directory
│       └── [slug]/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Breadcrumbs.tsx
│   └── SchemaScript.tsx    # JSON-LD injector
├── lib/
│   ├── api.ts              # API client
│   ├── schema.ts           # JSON-LD generators
│   ├── glossary-data.ts    # Cricket terms
│   └── faq-data.ts         # FAQ content
└── public/
    └── manifest.json
```

## SEO Checklist

- [x] Meta tags (title, description, keywords)
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] JSON-LD structured data
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Canonical URLs
- [x] Mobile responsive
- [ ] Google Search Console setup
- [ ] Analytics integration
- [ ] Core Web Vitals optimization

## Backend API Endpoints

The SEO site uses these public endpoints (no auth required):

- `GET /api/seo/grounds` - Public grounds list
- `GET /api/seo/grounds/slug/:slug` - Ground by slug
- `GET /api/seo/grounds/:id/reviews` - Ground reviews
- `GET /api/seo/players` - Public player profiles
- `GET /api/seo/sitemap/grounds` - Sitemap data
- `GET /api/seo/stats` - Site statistics

## License

Private - CricSmart
