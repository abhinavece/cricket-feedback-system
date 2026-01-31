#!/bin/bash
# Deploy AI service to Cloud Run
# Usage: ./deploy-ai-service.sh [version]

set -e

VERSION=${1:-$(date +%Y.%m.%d.%H%M)}
PROJECT_ID="cricsmart"
REGION="asia-south1"
SERVICE_NAME="cricsmart-ai-service"
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/cricsmart/ai-service:${VERSION}"

echo "🚀 Deploying AI service version: ${VERSION}"

# Build
echo "📦 Building Docker image..."
cd "$(dirname "$0")/../../"
docker buildx build --platform linux/amd64 \
  -t ${IMAGE} \
  -f ai-service/Dockerfile.prod \
  ./ai-service

# Push
echo "📤 Pushing to Artifact Registry..."
docker push ${IMAGE}

# Deploy
echo "🌐 Deploying to Cloud Run..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --image=${IMAGE}

echo "✅ AI Service deployed successfully!"
echo "   Service URL: https://${SERVICE_NAME}-795359678717.${REGION}.run.app"
