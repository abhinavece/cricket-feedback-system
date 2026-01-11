# Helm Init Container for MongoDB Index Creation

## Overview

The backend deployment now includes an init container that ensures MongoDB indexes are created before the main backend application starts. This provides a safety guarantee that indexes exist in production.

## How It Works

### Init Container Flow

```
Pod Creation
    ↓
Init Container Starts (init-indexes)
    ↓
Connects to MongoDB
    ↓
Creates/Verifies Indexes
    ↓
Exits Successfully
    ↓
Main Container Starts (backend)
    ↓
Backend Ready
```

### Key Features

- **Automatic Retry**: Retries up to 5 times if MongoDB is not ready
- **Idempotent**: Safe to run multiple times (won't recreate existing indexes)
- **Fast**: Only creates indexes if they don't exist
- **Logging**: Detailed output for debugging
- **Resource Efficient**: Minimal CPU/memory requirements

## Configuration

### Init Container Script

**File**: `backend/scripts/init-indexes.js`

```javascript
// Runs before backend starts
// Ensures all MongoDB indexes exist
// Retries 5 times with 5-second delays
```

### Helm Deployment Update

**File**: `infra/helm/cricket-feedback/templates/backend-deployment.yaml`

```yaml
initContainers:
  - name: init-indexes
    image: "{{ .Values.backend.image.registry }}/{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
    imagePullPolicy: {{ .Values.backend.image.pullPolicy }}
    command:
      - node
      - scripts/init-indexes.js
    env:
      - name: NODE_ENV
        value: "production"
      - name: MONGODB_URI
        valueFrom:
          secretKeyRef:
            name: cricket-secrets
            key: mongodb-uri
    resources:
      limits:
        cpu: 200m
        memory: 256Mi
      requests:
        cpu: 100m
        memory: 128Mi
```

## Deployment Steps

### 1. Build New Backend Image

Include the init script in your Docker image:

```dockerfile
# In Dockerfile
COPY backend/scripts /app/scripts
```

### 2. Push Image to Registry

```bash
docker build -t phx.ocir.io/axkw6whnjncs/cricket-feedback-backend:v86 .
docker push phx.ocir.io/axkw6whnjncs/cricket-feedback-backend:v86
```

### 3. Update Helm Values

```bash
# Update values.yaml
backend:
  image:
    tag: "v86"  # New version with init script
```

### 4. Deploy with Helm

```bash
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  -n cricket-feedback \
  -f infra/helm/cricket-feedback/values.yaml
```

## Monitoring Init Container

### Check Init Container Logs

```bash
# Watch init container run
kubectl logs -n cricket-feedback -l app=cricket-feedback-backend \
  -c init-indexes -f

# Check if init container completed
kubectl describe pod -n cricket-feedback \
  -l app=cricket-feedback-backend
```

### Expected Output

```
[Init Container] Connecting to MongoDB (attempt 1/5)...
✓ Connected to MongoDB
✓ Creating indexes...
✓ All indexes created successfully
✓ Verified: 5 indexes exist on feedbacks collection

Indexes:
  1. _id_
  2. isDeleted_1_createdAt_-1
  3. isDeleted_1_deletedAt_-1
  4. isDeleted_1_batting_1_bowling_1_fielding_1_teamSpirit_1
  5. playerName_text

✓ MongoDB connection closed
✓ Init container completed successfully
```

### Verify Indexes in MongoDB

```bash
# Port-forward to MongoDB
kubectl port-forward -n cricket-feedback svc/cricket-feedback-mongodb 27017:27017

# Connect and check indexes
mongosh mongodb://admin:password123@localhost:27017/cricket-feedback
db.feedbacks.getIndexes()
```

## Troubleshooting

### Init Container Fails to Connect

**Symptom**: Init container keeps retrying

**Solution**:
1. Check MongoDB is running: `kubectl get pods -n cricket-feedback | grep mongodb`
2. Check MongoDB logs: `kubectl logs -n cricket-feedback cricket-feedback-mongodb-0`
3. Verify MONGODB_URI secret: `kubectl get secret -n cricket-feedback cricket-secrets -o yaml`

### Init Container Timeout

**Symptom**: Pod stuck in `Init:0/1` state

**Solution**:
1. Increase retry count in `init-indexes.js`
2. Increase timeout values in MongoDB connection
3. Check network connectivity between pods

### Indexes Not Created

**Symptom**: Indexes don't appear after deployment

**Solution**:
1. Check init container logs: `kubectl logs -n cricket-feedback <pod-name> -c init-indexes`
2. Verify Feedback model is loaded correctly
3. Check MongoDB permissions for index creation

## Performance Impact

### Init Container Overhead

- **Startup Time**: +5-10 seconds (first deployment)
- **Subsequent Deployments**: +2-3 seconds (indexes already exist)
- **Resource Usage**: Minimal (100m CPU, 128Mi memory requested)

### Benefits

- ✅ Guaranteed indexes exist before queries run
- ✅ No race conditions between app startup and index creation
- ✅ Clear visibility into index creation process
- ✅ Automatic retry on MongoDB connection failures

## Rollback

If you need to remove the init container:

```bash
# Edit deployment
kubectl edit deployment -n cricket-feedback cricket-feedback-backend

# Remove initContainers section and save
```

Or revert Helm values:

```bash
helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
  --revert
```

## Best Practices

1. **Always include init container** in production deployments
2. **Monitor init container logs** during first deployment
3. **Test in staging** before production deployment
4. **Keep init script updated** when adding new indexes
5. **Document index changes** in CHANGELOG

## Related Files

- `backend/scripts/init-indexes.js` - Init container script
- `backend/scripts/verify-indexes.js` - Manual verification script
- `infra/helm/cricket-feedback/templates/backend-deployment.yaml` - Helm deployment
- `backend/models/Feedback.js` - Index definitions
