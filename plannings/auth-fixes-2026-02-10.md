# Authentication Portal Fixes - 2026-02-10

## Issues Identified

### 1. SEO Site API URL Issue
- **Problem**: `api.cricsmart.in` DNS record doesn't exist
- **Error**: `net::ERR_NAME_NOT_RESOLVED` when auth tries to POST to `https://api.cricsmart.in/api/auth/google`
- **Root Cause**: Load balancer routes `/api/*` on each domain to backend, not a separate subdomain
- **Solution**: Change all `api.cricsmart.in` references to `cricsmart.in`

### 2. Tournament Frontend Localhost Redirect
- **Problem**: Production `tournament.cricsmart.in` redirects to `localhost:3002/auth/login`
- **Root Cause**: Temporary testing override in `LoginPage.tsx` with hardcoded localhost fallback
- **Solution**: Fix default fallback URL and add proper build args

## Changes Made

### SEO Site (cricsmart.in)
| File | Change |
|------|--------|
| `seo-site/Dockerfile` | `NEXT_PUBLIC_API_URL=https://cricsmart.in` |
| `seo-site/next.config.js` | Default fallback + removed non-existent image hostname |
| `seo-site/lib/api.ts` | Default fallback fixed |
| `seo-site/app/auth/login/page.tsx` | Default fallback + `isSameDomain` origin check |
| `seo-site/.env.example` | Corrected example URL |
| `seo-site/app/page.tsx` | Removed LoginModal popup - direct navigation to `/auth/login` |
| `frontend/src/pages/AuthCallbackPage.tsx` | Fix localhost redirect to `/app/feedback` |

### Tournament Frontend
| File | Change |
|------|--------|
| `tournament-frontend/src/pages/LoginPage.tsx` | Default fallback `https://cricsmart.in` instead of localhost |
| `tournament-frontend/Dockerfile.cloudrun` | Added `VITE_SITE_URL` build arg |
| `infra/cloudrun/deploy-tournament-frontend.sh` | Added `VITE_SITE_URL=https://cricsmart.in` |

### New Files
- `infra/cloudrun/deploy-seo-site.sh` - Deploy script for SEO site

## Deployment Process

### SEO Site
1. **Build**: `docker buildx build --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`
2. **Push**: `asia-south1-docker.pkg.dev/cricsmart/cricsmart/seo-site:2026.02.10.2144`
3. **Deploy**: Cloud Run revision `cricsmart-seo-site-00003-zx5` (100% traffic)
4. **Validate**: All endpoints return 200, Google Client ID baked in

### Tournament Frontend
1. **Build**: Added `VITE_SITE_URL=https://cricsmart.in` build arg
2. **Push**: `asia-south1-docker.pkg.dev/cricsmart/cricsmart/tournament-frontend:2026.02.10.2159`
3. **Deploy**: Cloud Run revision `cricsmart-tournament-frontend-00013-rwb` (100% traffic)
4. **Validate**: Homepage returns 200

## Authentication Flow Architecture

### Production Flow
1. User visits `tournament.cricsmart.in`
2. Redirects to `cricsmart.in/auth/login?redirect=tournament.cricsmart.in&service=tournament`
3. Google Sign-In → POST to `cricsmart.in/api/auth/google`
4. Backend validates JWT token
5. Redirect to `tournament.cricsmart.in/auth-callback?token=...&user=...`
6. Store in localStorage → redirect to tournament dashboard

### Local Development Flow
1. User visits `localhost:3002`
2. Redirects to `localhost:3001/auth/login?redirect=localhost:3002&service=tournament`
3. Google Sign-In → POST to `localhost:5002/api/auth/google`
4. Backend validates JWT token
5. Redirect to `localhost:3002/auth-callback?token=...&user=...`
6. Store in localStorage → redirect to `/app/feedback` (localhost routes)

## Environment Variables

### SEO Site
```
NEXT_PUBLIC_SITE_URL=https://cricsmart.in
NEXT_PUBLIC_API_URL=https://cricsmart.in
NEXT_PUBLIC_APP_URL=https://app.cricsmart.in
NEXT_PUBLIC_TOURNAMENT_URL=https://tournament.cricsmart.in
NEXT_PUBLIC_GOOGLE_CLIENT_ID=988776668750-...
```

### Tournament Frontend
```
VITE_API_URL=https://tournament.cricsmart.in/api
VITE_SITE_URL=https://cricsmart.in
VITE_GOOGLE_CLIENT_ID=988776668750-...
```

## Testing Checklist

### Production
- [x] `https://cricsmart.in/auth/login` loads (200 OK)
- [x] `https://cricsmart.in/api/health` responds (200 OK)
- [x] `https://tournament.cricsmart.in` redirects correctly
- [x] No `api.cricsmart.in` references in deployed JS bundles
- [x] Google Client ID baked into JS bundles

### Local Development
- [x] `localhost:3001/auth/login` loads
- [x] `localhost:3002` redirects to `localhost:3001/auth/login`
- [x] Frontend callback redirects to `/app/feedback` on localhost
- [x] All services running on correct ports

## Future Considerations

1. **Domain Detection**: Ensure `getDomainType()` correctly identifies production vs localhost
2. **Load Balancer**: Verify `/api/*` routing works for all domains
3. **Cross-Domain Cookies**: Consider if any cookie policies need adjustment
4. **Monitoring**: Add error tracking for auth failures
5. **Testing**: Implement E2E tests for auth flow across domains

## Git Commits

```
caef072 - fix: unified auth portal - fix API URL and remove login modal popup
```

## Deployment Commands

```bash
# SEO Site
./infra/cloudrun/deploy-seo-site.sh v2-fix-api-url

# Tournament Frontend  
./infra/cloudrun/deploy-tournament-frontend.sh 2026.02.10.2159
```
