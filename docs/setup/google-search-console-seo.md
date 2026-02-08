# Google Search Console & SEO Setup Guide

## Overview
This guide covers the SEO implementation for cricsmart.in and steps to complete Google Search Console verification.

---

## 1. DNS Verification for Google Search Console

### Step 1: Add TXT Record to DNS
From the screenshot, you need to add this TXT record to your domain's DNS:

```
Type: TXT
Host: @ (or leave blank, depends on provider)
Value: google-site-verification=0gE6dKwl-Pt_v1_6OF8clmsHG_UpnsTledb8P... (your full verification code)
TTL: 3600 (or default)
```

### Step 2: DNS Provider Instructions

**If using Cloudflare:**
1. Go to Cloudflare Dashboard → DNS
2. Click "Add Record"
3. Select Type: TXT
4. Name: `@`
5. Content: `google-site-verification=0gE6dKwl-Pt_v1_6OF8clmsHG_UpnsTledb8P...`
6. Click Save

**If using GoDaddy:**
1. Go to DNS Management
2. Add a TXT record
3. Host: `@`
4. TXT Value: Your verification string
5. Save

**If using Namecheap:**
1. Go to Advanced DNS
2. Add new record → TXT
3. Host: `@`
4. Value: Your verification string

### Step 3: Verify in Search Console
1. Wait 5-15 minutes for DNS propagation
2. Go back to Google Search Console
3. Click "Verify"
4. If it fails, wait longer (up to 48 hours for some DNS providers)

---

## 2. Submit Sitemap

After verification:
1. Go to Google Search Console → Sitemaps
2. Enter: `sitemap.xml`
3. Click Submit

The sitemap includes:
- `https://cricsmart.in/` (Homepage)
- `https://cricsmart.in/about` (About page)
- `https://cricsmart.in/privacy` (Privacy policy)
- `https://app.cricsmart.in/` (App entry)
- `https://app.cricsmart.in/login` (Login page)

---

## 3. Request Indexing

For each important page:
1. Use URL Inspection tool
2. Enter the URL
3. Click "Request Indexing"

Priority pages to index:
1. `https://cricsmart.in/`
2. `https://cricsmart.in/about`
3. `https://app.cricsmart.in/`

---

## 4. SEO Files Implemented

### robots.txt (`/frontend/public/robots.txt`)
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth-callback
Disallow: /onboarding

Sitemap: https://cricsmart.in/sitemap.xml
```

### sitemap.xml (`/frontend/public/sitemap.xml`)
Contains all public pages with priorities and change frequencies.

### Structured Data (in `index.html`)
- **Organization** schema - Brand information
- **WebApplication** schema - App details with features
- **WebSite** schema - Site information

---

## 5. Meta Tags Implemented

| Tag | Value |
|-----|-------|
| `title` | CricSmart - AI Cricket Platform |
| `description` | Smart match management, automated availability tracking... |
| `keywords` | cricket, team management, AI, match scheduling... |
| `robots` | index, follow, max-image-preview:large |
| `canonical` | https://cricsmart.in/ |
| `og:image` | https://app.cricsmart.in/cricsmart-og-image.jpg |

---

## 6. External Backlinks Strategy

### Quick Wins
1. **Social Profiles** - Create/update Twitter, LinkedIn pages with website link
2. **Business Directories** - List on:
   - Google Business Profile (if applicable)
   - Crunchbase
   - Product Hunt
   - BetaList

### Cricket-Specific
1. **Cricket Forums** - Share on cricket community forums
2. **Reddit** - r/Cricket, r/CricketShitpost (share genuinely useful content)
3. **Cricket Blogs** - Reach out for guest posts or mentions

### Technical
1. **GitHub** - Add to your repo description
2. **Dev.to / Medium** - Write about the tech stack

---

## 7. Monitoring

### Google Search Console Checks (Weekly)
- [ ] Coverage report - Check for errors
- [ ] Performance - Track impressions and clicks
- [ ] Mobile Usability - Ensure no issues
- [ ] Core Web Vitals - Monitor performance

### SEO Health Checks
- [ ] Test robots.txt: https://cricsmart.in/robots.txt
- [ ] Test sitemap: https://cricsmart.in/sitemap.xml
- [ ] Test structured data: https://search.google.com/test/rich-results

---

## 8. Deployment Checklist

After deploying frontend changes:
- [ ] Verify robots.txt is accessible
- [ ] Verify sitemap.xml is accessible
- [ ] Test structured data with Google's Rich Results Test
- [ ] Request re-indexing in Search Console if major changes

---

## Troubleshooting

### DNS Verification Fails
- Wait up to 48 hours for propagation
- Verify TXT record with: `dig TXT cricsmart.in`
- Try URL prefix verification method instead

### Sitemap Not Found
- Ensure sitemap.xml is in `/public/` folder
- Check nginx/server config allows XML files
- Verify URL: https://cricsmart.in/sitemap.xml

### Pages Not Indexed
- Check robots.txt doesn't block the page
- Ensure no `noindex` meta tag on the page
- Request indexing manually via URL Inspection
