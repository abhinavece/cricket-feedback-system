#!/bin/bash
# Deploy frontend to Cloud Run
# Usage: ./deploy-frontend.sh [version]

set -e

VERSION=${1:-$(date +%Y.%m.%d.%H%M)}
PROJECT_ID="cricsmart"
REGION="asia-south1"
SERVICE_NAME="cricsmart-frontend"
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/cricsmart/frontend:${VERSION}"

echo "🚀 Deploying frontend version: ${VERSION}"

# Get Google Client ID from Secret Manager
GOOGLE_CLIENT_ID=$(gcloud secrets versions access latest --secret=google-client-id)
echo "🔑 Got Google Client ID"

# Build
echo "📦 Building Docker image..."
cd "$(dirname "$0")/../../"
docker buildx build --platform linux/amd64 \
  --build-arg REACT_APP_API_URL=https://app.cricsmart.in/api \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
  -t ${IMAGE} \
  -f frontend/Dockerfile.cloudrun \
  ./frontend

# Push
echo "📤 Pushing to Artifact Registry..."
docker push ${IMAGE}

# Deploy
echo "🌐 Deploying to Cloud Run..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --image=${IMAGE}

echo "✅ Frontend deployed successfully!"
echo "   Service URL: https://${SERVICE_NAME}-795359678717.${REGION}.run.app"
