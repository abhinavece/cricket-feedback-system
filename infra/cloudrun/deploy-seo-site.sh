#!/bin/bash
# Deploy seo-site to Cloud Run
# Usage: ./deploy-seo-site.sh [version]

set -e

VERSION=${1:-$(date +%Y.%m.%d.%H%M)}
PROJECT_ID="cricsmart"
REGION="asia-south1"
SERVICE_NAME="cricsmart-seo-site"
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/cricsmart/seo-site:${VERSION}"

echo "🚀 Deploying seo-site version: ${VERSION}"

# Get Google Client ID from Secret Manager
GOOGLE_CLIENT_ID=$(gcloud secrets versions access latest --secret=google-client-id)
echo "🔑 Got Google Client ID"

# Build
echo "📦 Building Docker image..."
cd "$(dirname "$0")/../../"
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
  -t ${IMAGE} \
  -f seo-site/Dockerfile \
  ./seo-site

# Push
echo "📤 Pushing to Artifact Registry..."
docker push ${IMAGE}

# Deploy
echo "🌐 Deploying to Cloud Run..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --image=${IMAGE}

echo "✅ SEO site deployed successfully!"
echo "   Service URL: https://${SERVICE_NAME}-795359678717.${REGION}.run.app"
echo "   Live URL: https://cricsmart.in"
