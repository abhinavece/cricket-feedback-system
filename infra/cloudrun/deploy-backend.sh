#!/bin/bash
# Deploy backend to Cloud Run
# Usage: ./deploy-backend.sh [version]

set -e

VERSION=${1:-$(date +%Y.%m.%d.%H%M)}
PROJECT_ID="cricsmart"
REGION="asia-south1"
SERVICE_NAME="cricsmart-backend"
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/cricsmart/backend:${VERSION}"

echo "🚀 Deploying backend version: ${VERSION}"

# Get AI service URL
AI_SERVICE_URL=$(gcloud run services describe cricsmart-ai-service --region=${REGION} --format='value(status.url)')
echo "📡 AI Service URL: ${AI_SERVICE_URL}"

# Build
echo "📦 Building Docker image..."
cd "$(dirname "$0")/../../"
docker buildx build --platform linux/amd64 \
  -t ${IMAGE} \
  -f backend/Dockerfile \
  ./backend

# Push
echo "📤 Pushing to Artifact Registry..."
docker push ${IMAGE}

# Deploy
echo "🌐 Deploying to Cloud Run..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --image=${IMAGE} \
  --set-env-vars="AI_SERVICE_URL=${AI_SERVICE_URL}"

echo "✅ Backend deployed successfully!"
echo "   Service URL: https://${SERVICE_NAME}-795359678717.${REGION}.run.app"
