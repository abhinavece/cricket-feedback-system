#!/bin/bash
# Deploy SEO site to Cloud Run
# Usage: ./deploy-seo-site.sh [version]

set -e

VERSION=${1:-$(date +%Y.%m.%d.%H%M)}
PROJECT_ID="cricsmart"
REGION="asia-south1"
SERVICE_NAME="cricsmart-seo-site"
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/cricsmart/seo-site:${VERSION}"

echo "🚀 Deploying SEO site version: ${VERSION}"

# Build
echo "📦 Building Docker image..."
cd "$(dirname "$0")/../../"
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://cricsmart.in \
  --build-arg NEXT_PUBLIC_API_URL=https://api.cricsmart.in \
  --build-arg NEXT_PUBLIC_APP_URL=https://app.cricsmart.in \
  -t ${IMAGE} \
  -f seo-site/Dockerfile.cloudrun \
  ./seo-site

# Push
echo "📤 Pushing to Artifact Registry..."
docker push ${IMAGE}

# Deploy
echo "🌐 Deploying to Cloud Run..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --image=${IMAGE}

# Invalidate CDN cache
echo "🗑️ Invalidating CDN cache..."
gcloud compute url-maps invalidate-cdn-cache cricsmart-url-map \
  --path="/*" --host="cricsmart.in" --global || true

echo "✅ SEO site deployed successfully!"
echo "   Service URL: https://${SERVICE_NAME}-795359678717.${REGION}.run.app"
echo "   Production URL: https://cricsmart.in"
