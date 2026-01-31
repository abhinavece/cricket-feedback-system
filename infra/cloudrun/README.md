# CricSmart Cloud Run Deployment

This directory contains configuration and scripts for deploying CricSmart to Google Cloud Run on GCP.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Current Service Status](#current-service-status)
- [How Traffic Flows](#how-traffic-flows)
- [Testing Before DNS Cutover](#testing-before-dns-cutover)
- [DNS Cutover Steps](#dns-cutover-steps)
- [Cloud Run Services](#cloud-run-services)
- [Load Balancer Configuration](#load-balancer-configuration)
- [Secrets Management](#secrets-management)
- [Deployment Scripts](#deployment-scripts)
- [Troubleshooting](#troubleshooting)
- [Keeping Kubernetes Configuration](#keeping-kubernetes-configuration)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                             │
│                            │                                                 │
│                            ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │            Google Cloud Load Balancer                                │    │
│  │            Static IP: 136.110.208.131                               │    │
│  │                                                                      │    │
│  │   ┌──────────────┐              ┌──────────────┐                    │    │
│  │   │ HTTP (80)    │              │ HTTPS (443)  │                    │    │
│  │   │ Redirects    │──────────────│ URL Routing  │                    │    │
│  │   │ to HTTPS     │              │              │                    │    │
│  │   └──────────────┘              └──────┬───────┘                    │    │
│  │                                        │                             │    │
│  │                    ┌───────────────────┴───────────────────┐        │    │
│  │                    │           URL Map                      │        │    │
│  │                    │  ┌─────────────────────────────────┐  │        │    │
│  │                    │  │  /api/*  → Backend Service      │  │        │    │
│  │                    │  │  /*      → Frontend Service     │  │        │    │
│  │                    │  └─────────────────────────────────┘  │        │    │
│  │                    └───────────────────────────────────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│                    ┌──────────────────┬──────────────────┐                  │
│                    │                  │                  │                  │
│                    ▼                  ▼                  ▼                  │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │  cricsmart-frontend │  │  cricsmart-backend  │  │ cricsmart-ai-service│ │
│  │  (Cloud Run)        │  │  (Cloud Run)        │  │ (Cloud Run-internal)│ │
│  │                     │  │                     │  │                     │ │
│  │  - React App        │  │  - Node.js API      │  │  - Python/FastAPI   │ │
│  │  - Nginx (8080)     │  │  - Express (5001)   │  │  - Payment Parser   │ │
│  │  - Static files     │  │  - REST endpoints   │  │  - AI/ML (8010)     │ │
│  └─────────────────────┘  └──────────┬──────────┘  └─────────────────────┘ │
│                                      │                         ▲            │
│                                      │    (ID Token Auth)      │            │
│                                      └─────────────────────────┘            │
│                                      │                                      │
│                                      ▼                                      │
│                           ┌─────────────────────┐                           │
│                           │   MongoDB Atlas     │                           │
│                           │   (Cloud Database)  │                           │
│                           └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Service Status

### Cloud Run Services

| Service | Direct URL | Port | Status |
|---------|-----------|------|--------|
| **cricsmart-frontend** | https://cricsmart-frontend-795359678717.asia-south1.run.app | 8080 | ✅ Running |
| **cricsmart-backend** | https://cricsmart-backend-795359678717.asia-south1.run.app | 5001 | ✅ Running |
| **cricsmart-ai-service** | https://cricsmart-ai-service-795359678717.asia-south1.run.app | 8010 | ✅ Running (internal) |

### Load Balancer

| Component | Value |
|-----------|-------|
| **Static IP** | `136.110.208.131` |
| **HTTP Forwarding (80)** | Redirects to HTTPS |
| **HTTPS Forwarding (443)** | Routes to Cloud Run services |
| **SSL Certificate** | Google-managed (auto-renewing) |

### DNS (Google Cloud DNS)

| Record | Type | Value |
|--------|------|-------|
| `cricsmart.in` | A | 136.110.208.131 |
| `app.cricsmart.in` | A | 136.110.208.131 |
| `www.cricsmart.in` | CNAME | cricsmart.in |

### Nameservers (configure at domain registrar)

```
ns-cloud-a1.googledomains.com
ns-cloud-a2.googledomains.com
ns-cloud-a3.googledomains.com
ns-cloud-a4.googledomains.com
```

---

## How Traffic Flows

### Before DNS Cutover (Current)

```
User → cricsmart.in → [OLD DNS] → OCI K8s Cluster → K8s Pods
```

### After DNS Cutover (Target)

```
User → cricsmart.in → [GCP DNS] → Load Balancer (136.110.208.131)
                                        │
                                        ├── /api/* → cricsmart-backend
                                        └── /*     → cricsmart-frontend
```

---

## Testing Before DNS Cutover

### 1. Test Cloud Run Services Directly

These tests work immediately without any DNS changes:

```bash
# Test Backend Health
curl https://cricsmart-backend-795359678717.asia-south1.run.app/api/health

# Expected: {"status":"OK","timestamp":"...","uptime":...}

# Test Frontend
curl -I https://cricsmart-frontend-795359678717.asia-south1.run.app/

# Expected: HTTP/2 200, Content-Type: text/html

# Test Backend API endpoints
curl https://cricsmart-backend-795359678717.asia-south1.run.app/api/matches
```

### 2. Test Load Balancer with Host Header

Simulate domain requests to the Load Balancer IP:

```bash
# Test frontend via Load Balancer (after SSL provisions)
curl -k --resolve "app.cricsmart.in:443:136.110.208.131" https://app.cricsmart.in/

# Test API via Load Balancer
curl -k --resolve "app.cricsmart.in:443:136.110.208.131" https://app.cricsmart.in/api/health

# Test HTTP to HTTPS redirect
curl -I --resolve "app.cricsmart.in:80:136.110.208.131" http://app.cricsmart.in/
# Expected: 301 Moved Permanently, Location: https://...
```

### 3. Test using /etc/hosts (Full Browser Testing)

Add to `/etc/hosts` for browser testing:

```bash
# Add to /etc/hosts (requires sudo)
sudo echo "136.110.208.131 app.cricsmart.in cricsmart.in www.cricsmart.in" >> /etc/hosts
```

Then open `https://app.cricsmart.in` in browser (accept SSL warning until cert provisions).

**Remember to remove the /etc/hosts entry after testing!**

### 4. Check SSL Certificate Status

```bash
gcloud compute ssl-certificates describe cricsmart-ssl --global \
  --format="yaml(managed.status,managed.domainStatus)"
```

Certificate status will change from `PROVISIONING` to `ACTIVE` after DNS points to the Load Balancer.

---

## DNS Cutover Steps

### Step 1: Update Nameservers at Domain Registrar

Go to your domain registrar (where you purchased cricsmart.in) and update nameservers to:

```
ns-cloud-a1.googledomains.com
ns-cloud-a2.googledomains.com
ns-cloud-a3.googledomains.com
ns-cloud-a4.googledomains.com
```

### Step 2: Wait for DNS Propagation

DNS changes can take up to 48 hours to propagate globally, but often complete within 1-4 hours.

Check propagation status:
```bash
# Check if DNS is pointing to new IP
dig app.cricsmart.in +short
# Should return: 136.110.208.131

# Or use online tools
# https://www.whatsmydns.net/#A/app.cricsmart.in
```

### Step 3: Verify SSL Certificate Provisioned

```bash
gcloud compute ssl-certificates describe cricsmart-ssl --global \
  --format="yaml(managed.status,managed.domainStatus)"

# Status should be: ACTIVE
# domainStatus for all domains should be: ACTIVE
```

### Step 4: Test Production URLs

```bash
curl https://app.cricsmart.in/api/health
curl https://cricsmart.in/
```

### Step 5: Monitor and Verify

- Check Cloud Run logs for errors
- Test login flow with Google OAuth
- Test WhatsApp integration
- Test payment screenshot upload

---

## Cloud Run Services

### Frontend Service (cricsmart-frontend)

| Property | Value |
|----------|-------|
| Image | `asia-south1-docker.pkg.dev/cricsmart/cricsmart/frontend:v2` |
| Port | 8080 |
| Memory | 256Mi |
| CPU | 1 |
| Min Instances | 0 (scales to zero) |
| Max Instances | 5 |
| Authentication | Public (allow unauthenticated) |

**Dockerfile:** `frontend/Dockerfile.cloudrun`
**Nginx Config:** `frontend/nginx.cloudrun.conf`

### Backend Service (cricsmart-backend)

| Property | Value |
|----------|-------|
| Image | `asia-south1-docker.pkg.dev/cricsmart/cricsmart/backend:v2` |
| Port | 5001 |
| Memory | 512Mi |
| CPU | 1 |
| Min Instances | 0 |
| Max Instances | 10 |
| Authentication | Public |

**Environment Variables:**
- `NODE_ENV=production`
- `AI_SERVICE_ENABLED=true`
- `FRONTEND_URL=https://app.cricsmart.in`
- `AI_SERVICE_URL=https://cricsmart-ai-service-...`

**Secrets (from Secret Manager):**
- MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- ADMIN_PASSWORD, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_VERIFY_TOKEN

### AI Service (cricsmart-ai-service)

| Property | Value |
|----------|-------|
| Image | `asia-south1-docker.pkg.dev/cricsmart/cricsmart/ai-service:v1` |
| Port | 8010 |
| Memory | 512Mi |
| CPU | 1 |
| Min Instances | 0 |
| Max Instances | 5 |
| Authentication | Internal only (requires IAM) |
| Ingress | Internal |

**Environment Variables:**
- `AI_SERVICE_ENABLED=true`
- `AI_PROVIDER=google_ai_studio`
- `DAILY_REQUEST_LIMIT=500`
- `MIN_CONFIDENCE_THRESHOLD=0.7`
- `LOG_LEVEL=INFO`

**Secrets:** GOOGLE_AI_STUDIO_API_KEY

**Service-to-Service Auth:** Backend uses ID token from metadata server to call AI service.

---

## Load Balancer Configuration

### Components

| Component | Name | Purpose |
|-----------|------|---------|
| Static IP | `cricsmart-ip` | 136.110.208.131 |
| SSL Certificate | `cricsmart-ssl-v2` | Google-managed for all domains |
| HTTPS Proxy | `cricsmart-https-proxy` | Routes HTTPS traffic |
| HTTP Proxy | `cricsmart-http-proxy` | Redirects HTTP to HTTPS |
| URL Map | `cricsmart-url-map` | Path-based routing |
| Backend Service (API) | `cricsmart-backend-api` | Routes /api/* (no CDN) |
| Backend Service (Frontend) | `cricsmart-backend-frontend` | Routes /* (CDN enabled) |
| NEG (Backend) | `cricsmart-backend-neg` | Serverless NEG for backend |
| NEG (Frontend) | `cricsmart-frontend-neg` | Serverless NEG for frontend |

### Cloud CDN

CDN is enabled on the frontend backend service for faster content delivery.

**Configuration:**

| Setting | Value | Description |
|---------|-------|-------------|
| CDN Enabled | `true` | Frontend only |
| Cache Mode | `USE_ORIGIN_HEADERS` | Respects Cache-Control headers from nginx |
| Serve While Stale | `86400` (24h) | Serve stale content if origin is down |
| Request Coalescing | `true` | Combines multiple requests for same content |

**Cache TTLs (set in nginx):**

| Content Type | Cache Duration | Notes |
|--------------|----------------|-------|
| JS, CSS | 1 year | Immutable (hashed filenames) |
| Images, fonts | 7 days | Static media |
| manifest.json | 1 hour | PWA manifest |
| HTML | 5 minutes | SPA routes, must-revalidate |

**Invalidating Cache:**

```bash
# Invalidate all cached content
gcloud compute url-maps invalidate-cdn-cache cricsmart-url-map \
  --path="/*" --global

# Invalidate specific path
gcloud compute url-maps invalidate-cdn-cache cricsmart-url-map \
  --path="/static/*" --global
```

**Why API is NOT cached:**
- API responses are user-specific (authentication, user data)
- Real-time data (matches, payments, messages)
- Security-sensitive endpoints

### URL Routing Rules

```yaml
Hosts: app.cricsmart.in
  /api/*  → cricsmart-backend (Cloud Run)
  /api    → cricsmart-backend (Cloud Run)
  /*      → cricsmart-frontend (Cloud Run)

Hosts: cricsmart.in, www.cricsmart.in
  /*      → cricsmart-frontend (Cloud Run)
```

### Modifying URL Map

Edit `infra/cloudrun/url-map.yaml` and import:

```bash
gcloud compute url-maps import cricsmart-url-map \
  --source=infra/cloudrun/url-map.yaml \
  --global --quiet
```

---

## Secrets Management

All secrets are stored in **Google Secret Manager**.

### Listing Secrets

```bash
gcloud secrets list
```

### Viewing a Secret

```bash
gcloud secrets versions access latest --secret=mongodb-uri
```

### Updating a Secret

```bash
echo -n "new-secret-value" | gcloud secrets versions add mongodb-uri --data-file=-
```

### Secrets Used

| Secret Name | Used By | Description |
|-------------|---------|-------------|
| `mongodb-uri` | Backend | MongoDB Atlas connection string |
| `jwt-secret` | Backend | JWT signing secret |
| `google-client-id` | Backend, Frontend | Google OAuth client ID |
| `google-client-secret` | Backend | Google OAuth client secret |
| `admin-password` | Backend | Admin password |
| `whatsapp-access-token` | Backend | WhatsApp Cloud API token |
| `whatsapp-phone-number-id` | Backend | WhatsApp phone number ID |
| `whatsapp-verify-token` | Backend | WhatsApp webhook verify token |
| `google-ai-studio-api-key` | AI Service | Google AI Studio API key |

---

## Deployment Scripts

### Deploy Backend

```bash
./infra/cloudrun/deploy-backend.sh [version]

# Example:
./infra/cloudrun/deploy-backend.sh v3
```

### Deploy Frontend

```bash
./infra/cloudrun/deploy-frontend.sh [version]

# Example:
./infra/cloudrun/deploy-frontend.sh v3
```

### Deploy AI Service

```bash
./infra/cloudrun/deploy-ai-service.sh [version]

# Example:
./infra/cloudrun/deploy-ai-service.sh v2
```

### Manual Deployment

```bash
# Build
docker buildx build --platform linux/amd64 \
  -t asia-south1-docker.pkg.dev/cricsmart/cricsmart/backend:v3 \
  -f backend/Dockerfile ./backend

# Push
docker push asia-south1-docker.pkg.dev/cricsmart/cricsmart/backend:v3

# Deploy
gcloud run services update cricsmart-backend \
  --region=asia-south1 \
  --image=asia-south1-docker.pkg.dev/cricsmart/cricsmart/backend:v3
```

---

## Troubleshooting

### View Cloud Run Logs

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cricsmart-backend" --limit=50

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cricsmart-frontend" --limit=50

# Or use Cloud Console:
# https://console.cloud.google.com/run?project=cricsmart
```

### Check Service Health

```bash
# Backend
curl https://cricsmart-backend-795359678717.asia-south1.run.app/api/health

# AI Service (requires authentication)
gcloud run services describe cricsmart-ai-service --region=asia-south1
```

### SSL Certificate Issues

```bash
# Check status
gcloud compute ssl-certificates describe cricsmart-ssl --global

# If stuck in PROVISIONING:
# 1. Verify DNS points to 136.110.208.131
# 2. Wait up to 24 hours for propagation
# 3. Check domain ownership verification
```

### Load Balancer Issues

```bash
# List all components
gcloud compute forwarding-rules list --global
gcloud compute backend-services list --global
gcloud compute url-maps list --global

# Check backend health
gcloud compute backend-services get-health cricsmart-backend-api --global
```

### Service-to-Service Auth Issues

If backend can't call AI service:
1. Verify IAM binding:
   ```bash
   gcloud run services get-iam-policy cricsmart-ai-service --region=asia-south1
   ```
2. Check backend logs for auth errors
3. Verify `AI_SERVICE_URL` environment variable

---

## Keeping Kubernetes Configuration

All Helm charts and Kubernetes configurations remain in `infra/helm/` for future use.

### Redeploy to Kubernetes

```bash
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --values ./infra/helm/cricket-feedback/values.yaml \
  --values ./infra/helm/cricket-feedback/values-production.yaml
```

### Switch Back to Kubernetes

1. Update DNS to point to OCI Load Balancer IP
2. Ensure K8s pods are running
3. Verify all secrets are in K8s cluster

---

## GCP Project Details

| Property | Value |
|----------|-------|
| Project ID | `cricsmart` |
| Region | `asia-south1` (Mumbai) |
| Artifact Registry | `asia-south1-docker.pkg.dev/cricsmart/cricsmart` |
| Service Account | `cricsmart-cloudrun@cricsmart.iam.gserviceaccount.com` |

---

## Cost Considerations

### Cloud Run (Free Tier)
- 2 million requests/month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

### Secret Manager (Free Tier)
- 6 active secret versions
- 10,000 access operations/month

### Cloud DNS
- First 25 managed zones free
- Queries: $0.40/million after 1 billion

### Load Balancer
- Forwarding rules: ~$0.025/hour (~$18/month)
- Data processing: $0.008/GB

### Artifact Registry
- Storage: $0.10/GB/month
