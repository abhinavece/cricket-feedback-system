# Tournament Frontend - GCP Infrastructure Setup

This document outlines the complete setup for `tournament.cricsmart.in`.

## Current Status (All Complete!)

### Infrastructure:
- [x] DNS record: `tournament.cricsmart.in → 136.110.208.131`
- [x] Cloud Run service: `cricsmart-tournament-frontend` (deployed)
- [x] Serverless NEG: `cricsmart-neg-tournament`
- [x] Backend service: `cricsmart-backend-tournament-frontend`
- [x] URL map updated with tournament routing
- [x] SSL certificate: `cricsmart-ssl-v3` (provisioning)
- [x] HTTPS proxy updated to use new certificate

### Code:
- [x] Dockerfile and nginx config created
- [x] GitHub Actions workflow updated
- [x] TypeScript errors fixed

## SSL Certificate Status

The SSL certificate is currently **PROVISIONING**. This typically takes 15-60 minutes.

Check status:
```bash
gcloud compute ssl-certificates describe cricsmart-ssl-v3 --global --format="value(managed.status)"
```

Once it shows `ACTIVE`, HTTPS will work for tournament.cricsmart.in.

## Manual Commands (Already Completed)

## Step 1: Create Backend Service

```bash
# Create the backend service
gcloud compute backend-services create cricsmart-backend-tournament \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --protocol=HTTPS

# Add the NEG to the backend service
gcloud compute backend-services add-backend cricsmart-backend-tournament \
  --global \
  --network-endpoint-group=cricsmart-neg-tournament \
  --network-endpoint-group-region=asia-south1
```

## Step 2: Update URL Map

```bash
# Import the updated URL map
cd infra/cloudrun
gcloud compute url-maps import cricsmart-url-map --source=url-map.yaml --global --quiet
```

## Step 3: Update SSL Certificate

The current certificate only covers: `app.cricsmart.in`, `cricsmart.in`, `www.cricsmart.in`

Need to add `tournament.cricsmart.in`:

```bash
# Create new SSL certificate with all domains
gcloud compute ssl-certificates create cricsmart-ssl-v3 \
  --domains=app.cricsmart.in,cricsmart.in,www.cricsmart.in,tournament.cricsmart.in \
  --global

# Wait for certificate provisioning (can take up to 15 minutes)
gcloud compute ssl-certificates describe cricsmart-ssl-v3 --global

# Update the HTTPS proxy to use the new certificate
# First, find your current target https proxy name
gcloud compute target-https-proxies list

# Update the proxy (replace TARGET_PROXY_NAME with actual name)
gcloud compute target-https-proxies update TARGET_PROXY_NAME \
  --ssl-certificates=cricsmart-ssl-v3 \
  --global
```

## Step 4: Deploy Tournament Frontend

Option A: Manual deployment:
```bash
cd infra/cloudrun
./deploy-tournament-frontend.sh
```

Option B: Push to main branch - GitHub Actions will auto-deploy when `tournament-frontend/` changes.

## Step 5: Verify Deployment

```bash
# Check Cloud Run service
gcloud run services describe cricsmart-tournament-frontend --region=asia-south1

# Test direct Cloud Run URL
curl -I https://cricsmart-tournament-frontend-795359678717.asia-south1.run.app

# Test through load balancer (after SSL is ready)
curl -I https://tournament.cricsmart.in
```

## Architecture Overview

```
tournament.cricsmart.in
        ↓
   DNS A Record (136.110.208.131)
        ↓
   Global Load Balancer
        ↓
   URL Map (tournament-paths)
        ↓
   Backend Service (cricsmart-backend-tournament)
        ↓
   Serverless NEG (cricsmart-neg-tournament)
        ↓
   Cloud Run Service (cricsmart-tournament-frontend)
```

## Troubleshooting

### DNS not resolving
```bash
dig tournament.cricsmart.in
nslookup tournament.cricsmart.in
```

### SSL certificate not ready
```bash
gcloud compute ssl-certificates describe cricsmart-ssl-v3 --global --format="value(managed.status)"
# Should show "ACTIVE" when ready
```

### 404 errors
- Check URL map configuration
- Verify backend service has the NEG attached
- Verify Cloud Run service is healthy

### 502 errors
- Check Cloud Run logs: `gcloud run services logs read cricsmart-tournament-frontend --region=asia-south1`
- Verify the container is healthy

## Environment Variables

The tournament frontend uses these environment variables (set during Docker build):

| Variable | Description | Value |
|----------|-------------|-------|
| `VITE_API_URL` | Backend API URL | `https://app.cricsmart.in/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Secret Manager |
| `VITE_APP_VERSION` | App version | Auto-generated |
| `VITE_BUILD_DATE` | Build timestamp | Auto-generated |

## Files Created/Modified

- `tournament-frontend/Dockerfile.cloudrun` - Docker build for Cloud Run
- `tournament-frontend/nginx.cloudrun.conf` - Nginx config with API proxy
- `.github/workflows/deploy-cloudrun.yml` - Updated CI/CD workflow
- `infra/cloudrun/url-map.yaml` - Updated URL routing
- `infra/cloudrun/deploy-tournament-frontend.sh` - Manual deploy script
- `infra/cloudrun/setup-tournament-infrastructure.sh` - Infrastructure setup script
