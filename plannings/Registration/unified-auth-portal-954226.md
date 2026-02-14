# Unified Auth Portal for CricSmart

Build a centralized login page at `cricsmart.in/auth/login` that all subdomains redirect to, eliminating the current double-login experience.

---

## Current Problem

1. **cricsmart.in**: "Login" / "Create Your Team" → opens beautiful `LoginModal` → clicking Google button just **redirects to `app.cricsmart.in`** (no actual auth)
2. **app.cricsmart.in**: Has its own `LoginPage` with Google OAuth → user sees a **second login page**
3. **tournament.cricsmart.in**: Has its **own separate** Google OAuth login page
4. Each subdomain has independent auth (different localStorage keys, different OAuth setup)

## Recommended Approach: Centralized Auth Portal on `cricsmart.in`

**Why centralized (not per-subdomain)?**
- Single Google OAuth configuration needed
- Consistent, beautiful login experience everywhere
- One place to maintain auth UI, add SSO providers, etc.
- Each new subdomain (auction, etc.) just redirects to the portal — zero auth code needed
- Cross-domain token handoff already exists (`AuthCallbackPage` + `domain.ts` utilities)

**Why NOT shared cookies on `.cricsmart.in`?**
- Requires switching all apps from localStorage to cookies — large migration
- Cookie-based auth adds CSRF complexity
- Current token-passing approach already works and is proven

## Architecture

```
User clicks Login on ANY subdomain
        ↓
Redirect to: cricsmart.in/auth/login?redirect=<target_url>
        ↓
Beautiful login page with Google OAuth (on seo-site / Next.js)
        ↓
Google credential → POST /auth/google → get JWT + user data
        ↓
Redirect to: <target_url>/auth-callback?token=JWT&user=base64(userData)
        ↓
Target subdomain's callback page stores token in localStorage → done
```

## Implementation Steps

### Phase 1: Auth Pages on seo-site (cricsmart.in)

1. **Install `@react-oauth/google`** in seo-site (or use raw GSI script like tournament-frontend)
2. **Create `seo-site/app/auth/login/page.tsx`**
   - Beautiful full-page login (reuse/enhance existing `LoginModal` design)
   - Reads `?redirect=` query param (defaults to `app.cricsmart.in`)
   - Reads `?service=` optional param for branding (e.g., "Tournament Hub", "Team Manager")
   - On Google login success: calls backend `/auth/google`, gets JWT
   - Redirects to `<redirect>/auth-callback?token=...&user=...`
3. **Create `seo-site/app/auth/layout.tsx`**
   - Minimal layout (no Header/Footer) for clean auth experience
4. **Add env var** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to seo-site

### Phase 2: Update seo-site Login Flow

5. **Update `LoginModal`** — change `handleGoogleLogin` to navigate to `/auth/login?redirect=app.cricsmart.in` instead of redirecting to `app.cricsmart.in`
6. **Update `Header`** — `handleLoginClick` navigates to `/auth/login` instead of redirecting
7. **Update `HeroSection`** — "Create Your Team" → `/auth/login?redirect=app.cricsmart.in`
   - Could simplify: remove LoginModal entirely and just link to `/auth/login`

### Phase 3: Update Subdomains to Use Centralized Auth

8. **tournament-frontend**: Update `LoginPage` to redirect to `cricsmart.in/auth/login?redirect=tournament.cricsmart.in&service=tournament`
   - Add `/auth-callback` route that reads token from URL params and stores as `tournament_token`
9. **app.cricsmart.in (frontend)**: `LoginPage` already works standalone but update `RequireAuth` / login redirects to go to centralized portal instead
   - `AuthCallbackPage` already exists and handles token from URL — no changes needed
10. **Future subdomains** (auction.cricsmart.in, etc.): Just redirect to centralized login with appropriate `redirect` param

### Phase 4: Google OAuth Configuration

11. **Add `cricsmart.in` to Google OAuth authorized origins** (if not already)
    - Currently app.cricsmart.in and tournament.cricsmart.in are likely listed
    - Add `cricsmart.in` and `www.cricsmart.in`
12. **Add redirect URIs** in Google Cloud Console if using redirect-based flow

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Where does auth live? | `cricsmart.in/auth/login` (seo-site) | Main domain, single source of truth |
| Token passing | URL params (existing pattern) | Already implemented in `AuthCallbackPage` |
| Google OAuth library | Raw GSI script (not @react-oauth/google) | seo-site is Next.js, no React OAuth provider needed |
| LoginModal on homepage | Replace with direct link to `/auth/login` | Eliminates extra step, cleaner UX |
| Per-subdomain auth pages | Keep as fallback | Graceful degradation if centralized portal is down |

## What Each Subdomain Needs

| Subdomain | Has auth-callback? | Token key | Changes needed |
|-----------|-------------------|-----------|----------------|
| app.cricsmart.in | ✅ Yes (`/auth-callback`) | `authToken` | Minimal — redirect login to portal |
| tournament.cricsmart.in | ❌ No | `tournament_token` | Add `/auth-callback` route |
| auction.cricsmart.in | N/A (future) | TBD | Just add callback route |

## Files to Create/Modify

### New Files
- `seo-site/app/auth/login/page.tsx` — centralized login page
- `seo-site/app/auth/layout.tsx` — minimal auth layout

### Modified Files
- `seo-site/components/home/LoginModal.tsx` — redirect to `/auth/login`
- `seo-site/components/Header.tsx` — update login button
- `seo-site/components/home/HeroSection.tsx` — update CTA
- `seo-site/lib/api.ts` — add Google Client ID config
- `tournament-frontend/src/pages/LoginPage.tsx` — redirect to centralized login
- `tournament-frontend/src/App.tsx` — add auth-callback route

### No Changes Needed
- `frontend/src/pages/AuthCallbackPage.tsx` — already handles cross-domain tokens ✅
- `backend/routes/auth.js` — already has `/auth/google` endpoint ✅
