#!/bin/bash
# Deploy tournament frontend to Cloud Run
# Usage: ./deploy-tournament-frontend.sh [version]

set -e

PROJECT_ID="cricsmart"
REGION="asia-south1"
SERVICE_NAME="cricsmart-tournament-frontend"
REGISTRY="asia-south1-docker.pkg.dev/${PROJECT_ID}/cricsmart"

# Use provided version or generate one
VERSION=${1:-$(date +%Y.%m.%d).manual}

echo "=== Deploying Tournament Frontend ==="
echo "Version: ${VERSION}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# Get secrets
GOOGLE_CLIENT_ID=$(gcloud secrets versions access latest --secret=google-client-id --project=${PROJECT_ID})

# Build the image
echo "Building Docker image..."
cd "$(dirname "$0")/../../tournament-frontend"

docker buildx build --platform linux/amd64 \
  --build-arg VITE_API_URL=https://app.cricsmart.in/api \
  --build-arg VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
  --build-arg VITE_APP_VERSION=${VERSION} \
  --build-arg VITE_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  -t ${REGISTRY}/tournament-frontend:${VERSION} \
  -f Dockerfile.cloudrun \
  --push \
  .

echo ""
echo "Deploying to Cloud Run..."

# Check if service exists
if gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} &>/dev/null; then
  echo "Updating existing service..."
  gcloud run services update ${SERVICE_NAME} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --image=${REGISTRY}/tournament-frontend:${VERSION}
else
  echo "Creating new service..."
  gcloud run deploy ${SERVICE_NAME} \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --image=${REGISTRY}/tournament-frontend:${VERSION} \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=256Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=80
fi

echo ""
echo "=== Deployment Complete ==="
echo "Service URL: $(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --project=${PROJECT_ID} --format='value(status.url)')"
echo "Production URL: https://tournament.cricsmart.in"
