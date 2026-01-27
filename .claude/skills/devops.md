# DevOps Skill

## Capability
Deploy and manage the application using Docker, Kubernetes, and Helm on OCI infrastructure.

## Tech Stack
- Docker for containerization
- Kubernetes for orchestration
- Helm for package management
- OCI Container Registry

## Deployment Workflow

### Step 1: Local Testing
```bash
# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Start backend
cd backend && npm start

# Start frontend (in another terminal)
cd frontend && npm start
```

### Step 2: Update Image Versions
Update both values files:
- `infra/helm/cricket-feedback/values.yaml`
- `infra/helm/cricket-feedback/values-development.yaml`

```yaml
frontend:
  image:
    tag: "vXX"  # Increment version

backend:
  image:
    tag: "vXX"  # Increment version
```

### Step 3: Build Docker Images

#### Frontend (with build args)
```bash
cd /Users/abhinav/Documents/FUN_PROJECTS/survey-project

docker buildx build --platform linux/amd64 \
  --build-arg REACT_APP_API_URL=https://mavericks11.duckdns.org/api \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com \
  -t phx.ocir.io/axkw6whnjncs/cricket-feedback-frontend:vXX \
  --push frontend
```

#### Backend
```bash
docker buildx build --platform linux/amd64 \
  --push -t phx.ocir.io/axkw6whnjncs/cricket-feedback-backend:vXX \
  -f backend/Dockerfile ./backend
```

#### AI Service
```bash
docker buildx build --platform linux/amd64 \
  --push -t phx.ocir.io/axkw6whnjncs/cricket-feedback-ai-service:vXX \
  -f ai-service/Dockerfile ./ai-service
```

### Step 4: Deploy with Helm
```bash
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  --namespace cricket-feedback \
  --values ./infra/helm/cricket-feedback/values.yaml \
  --values ./infra/helm/cricket-feedback/values-development.yaml
```

### Step 5: Verify Deployment
```bash
# Check pod status
kubectl get pods -n cricket-feedback

# Check logs
kubectl logs -n cricket-feedback -l app=frontend
kubectl logs -n cricket-feedback -l app=backend

# Check services
kubectl get svc -n cricket-feedback
```

## Docker Desktop Kubernetes

For local development with Docker Desktop:
```bash
# Apply manifests
kubectl apply -f k8s/

# Access the app
open http://localhost/
```

## Image Registry

| Component | Registry Path |
|-----------|---------------|
| Frontend | `phx.ocir.io/axkw6whnjncs/cricket-feedback-frontend` |
| Backend | `phx.ocir.io/axkw6whnjncs/cricket-feedback-backend` |
| AI Service | `phx.ocir.io/axkw6whnjncs/cricket-feedback-ai-service` |

## Version Management Rules

1. **ALWAYS** increment version numbers (v66 → v67)
2. **ALWAYS** update both values.yaml files
3. **NEVER** use `latest` tag
4. **ALWAYS** use semantic versioning

## Deployment Rules

1. **ALWAYS** use Helm for deployments
2. **NEVER** use `kubectl apply` directly for services
3. **ALWAYS** test locally first
4. **ALWAYS** include all required build args for frontend

## Troubleshooting

### Pod Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n cricket-feedback

# Check logs
kubectl logs <pod-name> -n cricket-feedback
```

### Image Pull Errors
```bash
# Verify image exists
docker pull phx.ocir.io/axkw6whnjncs/cricket-feedback-frontend:vXX

# Check imagePullSecrets
kubectl get secrets -n cricket-feedback
```

### Service Not Accessible
```bash
# Check ingress
kubectl get ingress -n cricket-feedback

# Check service endpoints
kubectl get endpoints -n cricket-feedback
```

## Health Checks

Ensure containers have proper health checks:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 5
```
