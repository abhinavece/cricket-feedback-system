#!/bin/bash

# Safe Deployment Script with Backup and Recovery
# This script ensures data safety during deployments

set -e

NAMESPACE="cricket-feedback"
BACKUP_DIR="/tmp/cricket-feedback-backups"

echo "🛡️  Safe Deployment Script"
echo "=========================="

# Step 1: Create backup
echo "📦 Step 1: Creating safety backup..."
./scripts/disaster-recovery.sh backup

# Step 2: Verify backup was created
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found. Aborting deployment."
    exit 1
fi

echo "✅ Safety backup created successfully."

# Step 3: Ask for confirmation
echo ""
echo "⚠️  Ready to proceed with deployment."
echo "📦 Backup is available at: $BACKUP_DIR"
echo "🔄 If anything goes wrong, run: ./scripts/disaster-recovery.sh recover"
echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled by user."
    exit 1
fi

# Step 4: Perform deployment
echo "🚀 Step 4: Performing deployment..."

# Build and push images if needed
if [ "$1" = "build" ]; then
    echo "🔨 Building and pushing images..."
    
    # Backend
    docker buildx build --platform linux/amd64,linux/arm64 \
        -t phx.ocir.io/axkw6whnjncs/cricket-feedback-backend:v48 \
        --push backend
    
    # Frontend
    docker buildx build --platform linux/amd64 \
        --build-arg REACT_APP_API_URL=https://mavericks11.duckdns.org/api \
        --build-arg REACT_APP_GOOGLE_CLIENT_ID=988776668750-p9nj8drdmeneu0ndhmni6gscf3fcf3qa.apps.googleusercontent.com \
        -t phx.ocir.io/axkw6whnjncs/cricket-feedback-frontend:v63 \
        --push frontend
fi

# Deploy with Helm
echo "📦 Deploying with Helm..."
helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
    --namespace $NAMESPACE \
    --values ./infra/helm/cricket-feedback/values.yaml \
    --values ./infra/helm/cricket-feedback/values-development.yaml \
    --wait --timeout=10m

# Step 5: Verify deployment
echo "🔍 Step 5: Verifying deployment..."
kubectl get pods -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 10
HEALTH_CHECK=$(curl -k -s https://mavericks11.duckdns.org/api/health)

if [[ $HEALTH_CHECK == *"status":"OK"* ]]; then
    echo "✅ Deployment successful and healthy!"
    echo "🌐 Application is available at: https://mavericks11.duckdns.org"
else
    echo "⚠️  Deployment completed but health check failed."
    echo "🔄 You may need to rollback: helm rollback cricket-feedback -n $NAMESPACE"
    echo "📦 Or recover from backup: ./scripts/disaster-recovery.sh recover"
fi

echo ""
echo "🎉 Safe deployment completed!"
echo "📦 Backup retained at: $BACKUP_DIR"
echo "🗑️  Clean up old backups when confident: rm -rf $BACKUP_DIR"
