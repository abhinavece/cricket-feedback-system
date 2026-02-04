# Local Kubernetes Manifests

Kubernetes manifests for local development using Docker Desktop Kubernetes.

## Overview

These manifests deploy the complete CricSmart application stack locally:
- **Frontend**: React application
- **Backend**: Node.js API server
- **AI Service**: Python FastAPI for payment parsing
- **MongoDB**: Local database with persistent storage

## Prerequisites

- Docker Desktop with Kubernetes enabled
- kubectl configured for Docker Desktop cluster

### Enable Kubernetes in Docker Desktop

1. Open Docker Desktop → Settings
2. Go to Kubernetes tab
3. Check "Enable Kubernetes"
4. Click "Apply & Restart"
5. Wait for Kubernetes to start (green indicator)

### Verify Setup

```bash
kubectl cluster-info
# Should show: Kubernetes control plane is running at https://kubernetes.docker.internal:6443
```

## Quick Start

### Deploy All Services

```bash
kubectl apply -f k8s/
```

### Verify Deployment

```bash
kubectl get pods -n cricket-feedback
kubectl get services -n cricket-feedback
kubectl get ingress -n cricket-feedback
```

### Access the Application

- **Frontend**: http://app.localhost
- **Backend API**: http://api.localhost
- **Health Check**: http://api.localhost/api/health

### Teardown

```bash
kubectl delete -f k8s/
```

## Manifest Files

| File | Purpose |
|------|---------|
| `namespace.yaml` | Creates `cricket-feedback` namespace |
| `secrets.yaml` | Development secrets (JWT, OAuth, etc.) |
| `mongodb-configmap.yaml` | MongoDB initialization script |
| `mongodb-pvc.yaml` | Persistent volume for MongoDB data |
| `mongodb-deployment.yaml` | MongoDB deployment & service |
| `backend-deployment.yaml` | Backend deployment & service |
| `frontend-deployment.yaml` | Frontend deployment & service |
| `ai-service-deployment.yaml` | AI service deployment & service |
| `ingress-localhost.yaml` | Local ingress routing |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Desktop K8s                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Ingress Controller                   │   │
│  │  app.localhost → frontend    api.localhost → backend  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                ▼                 │
│  ┌──────────┐    ┌──────────┐    ┌─────────────┐          │
│  │ Frontend │    │ Backend  │    │  AI Service │          │
│  │  :80     │    │  :5001   │    │    :8010    │          │
│  └──────────┘    └────┬─────┘    └─────────────┘          │
│                       │                                     │
│                       ▼                                     │
│               ┌──────────────┐                              │
│               │   MongoDB    │                              │
│               │   :27017     │                              │
│               │   (PVC 1Gi)  │                              │
│               └──────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Details

### Namespace

All resources are deployed to `cricket-feedback` namespace:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: cricket-feedback
```

### Secrets

Development secrets are pre-configured in `secrets.yaml`:

```yaml
# These are development-only values
# NEVER use in production
jwt-secret: dev-jwt-secret-key
google-client-id: your-dev-client-id
google-client-secret: your-dev-client-secret
admin-password: dev-admin-password
```

### MongoDB

- **Image**: `mongo:6.0`
- **Storage**: 1Gi hostpath volume
- **Auth**: admin/password123 (dev only)
- **App User**: cricket-app/cricket-app-password
- **Database**: cricket-feedback

Initialization script creates indexes:

```javascript
db.feedbacks.createIndex({ "createdAt": -1 });
db.feedbacks.createIndex({ "isDeleted": 1 });
db.users.createIndex({ "email": 1 }, { unique: true });
```

### Backend

- **Port**: 5001
- **Image Pull Policy**: `Never` (uses local images)
- **Health Check**: GET /api/health
- **Connects to**: MongoDB (internal), AI Service (internal)

Environment variables:
- `NODE_ENV=production`
- `MONGODB_URI=mongodb://cricket-app:password@mongodb-service:27017/cricket-feedback`
- `AI_SERVICE_URL=http://ai-service:8010`

### Frontend

- **Port**: 80
- **Image Pull Policy**: `Never` (uses local images)
- **Serves**: Static React build

Environment variables:
- `REACT_APP_API_URL=/api` (proxied through ingress)

### AI Service

- **Port**: 8010
- **Image Pull Policy**: `Never` (uses local images)
- **Health Check**: GET /health

Environment variables:
- `AI_SERVICE_ENABLED=true`
- `AI_PROVIDER=google_ai_studio`

### Ingress

Local development ingress uses `*.localhost` domains:

```yaml
# Frontend
host: app.localhost
path: /
backend: frontend-service:80

# Backend
host: api.localhost
path: /
backend: backend-service:5001
annotations:
  nginx.ingress.kubernetes.io/proxy-body-size: "50m"  # For file uploads
```

## Building Local Images

Images must be built locally before deployment:

```bash
# Build frontend
cd frontend
docker build -t cricket-feedback-frontend:local .

# Build backend
cd ../backend
docker build -t cricket-feedback-backend:local .

# Build AI service
cd ../ai-service
docker build -t cricket-feedback-ai-service:local .
```

Update deployments to use local tags:

```yaml
spec:
  containers:
  - name: frontend
    image: cricket-feedback-frontend:local
    imagePullPolicy: Never  # Use local image
```

## Persistent Data

MongoDB data persists in a hostpath volume:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: hostpath
```

Data survives pod restarts but is lost if the PVC is deleted.

### Clear Data

```bash
# Delete MongoDB PVC to reset database
kubectl delete pvc mongodb-pvc -n cricket-feedback
kubectl apply -f k8s/mongodb-pvc.yaml
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n cricket-feedback

# Describe failed pod
kubectl describe pod <pod-name> -n cricket-feedback

# Check logs
kubectl logs <pod-name> -n cricket-feedback
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ImagePullBackOff` | Image not found locally | Build images with `docker build` |
| `CrashLoopBackOff` | Application error | Check logs with `kubectl logs` |
| `Pending` status | No resources available | Check Docker Desktop resource limits |
| Ingress not working | Ingress controller not installed | Install NGINX Ingress Controller |

### Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

### Access Pod Shell

```bash
# Backend shell
kubectl exec -it deployment/backend -n cricket-feedback -- /bin/sh

# MongoDB shell
kubectl exec -it deployment/mongodb -n cricket-feedback -- mongosh
```

### Port Forwarding (Alternative to Ingress)

```bash
# Forward backend to localhost:5001
kubectl port-forward svc/backend-service 5001:5001 -n cricket-feedback

# Forward frontend to localhost:3000
kubectl port-forward svc/frontend-service 3000:80 -n cricket-feedback
```

## Comparison with Production

| Aspect | Local (k8s/) | Production (Helm) |
|--------|--------------|-------------------|
| Image Pull Policy | Never | IfNotPresent |
| Images | Local Docker | OCI Registry |
| MongoDB | In-cluster | MongoDB Atlas |
| Storage | hostpath (1Gi) | Cloud PV (50Gi) |
| TLS | None | Let's Encrypt |
| Replicas | 1 | 2+ with autoscaling |
| Secrets | Hardcoded | External secrets |
| Ingress | localhost | Production domains |

## Related Documentation

- [Helm Charts](../infra/helm/cricket-feedback/README.md) - Production Helm deployment
- [Cloud Run](../infra/cloudrun/README.md) - GCP Cloud Run deployment
- [Backend](../backend/README.md) - Backend service
- [Frontend](../frontend/README.md) - Frontend service
