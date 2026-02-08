# Cricket Feedback Helm Chart

Helm chart for deploying the Cricket Match Feedback & Team Management System to Kubernetes.

## Overview

This Helm chart deploys the complete CricSmart application stack:
- **Frontend**: React application (nginx)
- **Backend**: Node.js API server
- **AI Service**: Python FastAPI for payment screenshot parsing
- **MongoDB**: Optional in-cluster database (or use MongoDB Atlas)

## Prerequisites

- Kubernetes 1.24+
- Helm 3.0+
- kubectl configured for your cluster
- NGINX Ingress Controller
- cert-manager (for TLS certificates)

## Quick Start

### Install

```bash
# Add namespace
kubectl create namespace cricket-feedback

# Install with default values
helm install cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback

# Install with environment-specific values
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --values values.yaml \
  --values values-development.yaml
```

### Upgrade

```bash
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --values values.yaml \
  --values values-production.yaml
```

### Uninstall

```bash
helm uninstall cricket-feedback --namespace cricket-feedback
```

## Chart Structure

```
infra/helm/cricket-feedback/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration
├── values-development.yaml # Development overrides
├── values-production.yaml  # Production overrides
└── templates/
    ├── _helpers.tpl              # Template helpers
    ├── namespace.yaml            # Namespace
    ├── secrets.yaml              # Secret management
    ├── backend-deployment.yaml   # Backend deployment
    ├── backend-service.yaml      # Backend service
    ├── frontend-deployment.yaml  # Frontend deployment
    ├── frontend-service.yaml     # Frontend service
    ├── ai-service-deployment.yaml
    ├── ai-service-service.yaml
    └── ingress.yaml              # Ingress with TLS
```

## Configuration

### Values Overview

| Parameter | Description | Default |
|-----------|-------------|---------|
| `namespace` | Kubernetes namespace | `cricket-feedback` |
| `frontend.replicaCount` | Frontend replicas | `1` |
| `backend.replicaCount` | Backend replicas | `1` |
| `aiService.enabled` | Enable AI service | `true` |
| `mongodb.enabled` | Enable in-cluster MongoDB | `true` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.host` | Primary domain | `app.cricsmart.in` |

### Frontend Configuration

```yaml
frontend:
  replicaCount: 1
  image:
    repository: phx.ocir.io/axkw6whnjncs/cricket-feedback-frontend
    tag: "latest"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 80
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi
  env:
    REACT_APP_API_URL: "https://app.cricsmart.in/api"
```

### Backend Configuration

```yaml
backend:
  replicaCount: 1
  image:
    repository: phx.ocir.io/axkw6whnjncs/cricket-feedback-backend
    tag: "latest"
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    port: 5001
  resources:
    requests:
      cpu: 250m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  env:
    NODE_ENV: production
    PORT: "5001"
  livenessProbe:
    enabled: true
    path: /api/health
    initialDelaySeconds: 30
    periodSeconds: 10
  readinessProbe:
    enabled: true
    path: /api/health
    initialDelaySeconds: 5
    periodSeconds: 5
```

### AI Service Configuration

```yaml
aiService:
  enabled: true
  replicaCount: 1
  image:
    repository: phx.ocir.io/axkw6whnjncs/cricket-feedback-ai-service
    tag: "latest"
  service:
    port: 8010
  env:
    AI_SERVICE_ENABLED: "true"
    AI_PROVIDER: "google_ai_studio"
    DAILY_REQUEST_LIMIT: "500"
    MIN_CONFIDENCE_THRESHOLD: "0.7"
```

### MongoDB Configuration

```yaml
mongodb:
  enabled: true  # Set to false for MongoDB Atlas
  architecture: standalone
  auth:
    rootUser: admin
    rootPassword: ""  # From secret
    username: cricket-app
    password: ""  # From secret
    database: cricket-feedback
  persistence:
    enabled: true
    size: 50Gi
    storageClass: "oci-bv"
```

### Ingress Configuration

```yaml
ingress:
  enabled: true
  className: nginx
  host: app.cricsmart.in
  secondaryHost: mavericks11.duckdns.org
  additionalHosts:
    - cricsmart.in
    - www.cricsmart.in
  tls:
    enabled: true
    secretName: cricket-feedback-tls
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
```

### Autoscaling Configuration

```yaml
autoscaling:
  backend:
    enabled: false
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
  frontend:
    enabled: false
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70
```

## Environment-Specific Deployment

### Development

```bash
helm upgrade --install cricket-feedback . \
  --namespace cricket-feedback \
  --values values.yaml \
  --values values-development.yaml
```

Development configuration:
- 1 replica per service
- Minimal resources
- MongoDB Atlas (external)
- Autoscaling disabled
- Debug logging

### Production

```bash
helm upgrade --install cricket-feedback . \
  --namespace cricket-feedback \
  --values values.yaml \
  --values values-production.yaml
```

Production configuration:
- 2+ replicas with autoscaling
- Higher resource limits
- MongoDB Atlas (external)
- Autoscaling enabled
- Production logging

## Secrets Management

### Required Secrets

Create secrets before deployment:

```bash
# Create main secrets
kubectl create secret generic cricket-secrets \
  --namespace cricket-feedback \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=google-client-id=your-client-id \
  --from-literal=google-client-secret=your-client-secret \
  --from-literal=mongodb-uri=mongodb+srv://... \
  --from-literal=admin-password=your-admin-password

# WhatsApp credentials
kubectl create secret generic whatsapp-credentials \
  --namespace cricket-feedback \
  --from-literal=WHATSAPP_ACCESS_TOKEN=your-token

# AI service secrets
kubectl create secret generic ai-service-secrets \
  --namespace cricket-feedback \
  --from-literal=google-ai-studio-api-key=your-api-key

# Image pull secret (for OCI registry)
kubectl create secret docker-registry ocir-creds \
  --namespace cricket-feedback \
  --docker-server=phx.ocir.io \
  --docker-username=your-username \
  --docker-password=your-auth-token
```

### Secrets in values.yaml

```yaml
secrets:
  enabled: false  # Set to true to create via Helm
  jwtSecret: ""
  googleClientId: ""
  googleClientSecret: ""
  mongodbUri: ""
  adminPassword: ""
  whatsappAccessToken: ""
  whatsappPhoneNumberId: ""
  whatsappVerifyToken: ""
  aiServiceApiKey: ""
```

## URL Routing

The ingress routes traffic as follows:

```
┌─ Host: app.cricsmart.in
│  ├─ /api/* → backend-service:5001
│  └─ /*     → frontend-service:80
│
├─ Host: mavericks11.duckdns.org (legacy)
│  ├─ /api/* → backend-service:5001
│  └─ /*     → frontend-service:80
│
└─ Hosts: cricsmart.in, www.cricsmart.in
   └─ /*     → frontend-service:80
```

## Health Checks

### Backend

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 5001
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### AI Service

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8010
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 8010
  initialDelaySeconds: 5
  periodSeconds: 10
```

## Resource Recommendations

### Development

| Service | CPU Request | Memory Request | CPU Limit | Memory Limit |
|---------|------------|----------------|-----------|--------------|
| Frontend | 100m | 128Mi | 200m | 256Mi |
| Backend | 250m | 256Mi | 500m | 512Mi |
| AI Service | 100m | 128Mi | 300m | 256Mi |
| MongoDB | 250m | 256Mi | 500m | 512Mi |

### Production

| Service | CPU Request | Memory Request | CPU Limit | Memory Limit |
|---------|------------|----------------|-----------|--------------|
| Frontend | 250m | 256Mi | 500m | 512Mi |
| Backend | 500m | 512Mi | 1000m | 1Gi |
| AI Service | 200m | 256Mi | 500m | 512Mi |

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n cricket-feedback
kubectl describe pod <pod-name> -n cricket-feedback
```

### View Logs

```bash
# Backend logs
kubectl logs deployment/cricket-feedback-backend -n cricket-feedback

# Frontend logs
kubectl logs deployment/cricket-feedback-frontend -n cricket-feedback

# AI Service logs
kubectl logs deployment/cricket-feedback-ai-service -n cricket-feedback
```

### Check Services

```bash
kubectl get services -n cricket-feedback
kubectl get ingress -n cricket-feedback
```

### Debug Connectivity

```bash
# Test backend health from within cluster
kubectl run curl --image=curlimages/curl -it --rm -- \
  curl http://cricket-feedback-backend-service:5001/api/health

# Test AI service
kubectl run curl --image=curlimages/curl -it --rm -- \
  curl http://cricket-feedback-ai-service:8010/health
```

### Common Issues

| Issue | Check | Solution |
|-------|-------|----------|
| Pods not starting | `kubectl describe pod` | Check image pull secrets, resource limits |
| MongoDB connection error | Backend logs | Verify `mongodb-uri` secret |
| Ingress not routing | `kubectl get ingress` | Check cert-manager status |
| TLS certificate pending | `kubectl describe certificate` | Verify DNS points to cluster |

## Updating Images

### Update a Single Service

```bash
# Update backend image
helm upgrade cricket-feedback . \
  --namespace cricket-feedback \
  --reuse-values \
  --set backend.image.tag=v2.0.0

# Update frontend image
helm upgrade cricket-feedback . \
  --namespace cricket-feedback \
  --reuse-values \
  --set frontend.image.tag=v2.0.0
```

### Update All Images

Edit `values-development.yaml` or `values-production.yaml`:

```yaml
frontend:
  image:
    tag: "2026.02.01.64"
backend:
  image:
    tag: "2026.02.01.64"
aiService:
  image:
    tag: "2026.01.31.50"
```

Then apply:

```bash
helm upgrade cricket-feedback . \
  --namespace cricket-feedback \
  --values values.yaml \
  --values values-production.yaml
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment cricket-feedback-backend \
  --replicas=5 \
  --namespace cricket-feedback
```

### Enable Autoscaling

In `values-production.yaml`:

```yaml
autoscaling:
  backend:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
  frontend:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70
```

## Related Documentation

- [Backend README](../../../backend/README.md)
- [Frontend README](../../../frontend/README.md)
- [Cloud Run Deployment](../../cloudrun/README.md)
- [Architecture](../../../ARCHITECTURE.md)
