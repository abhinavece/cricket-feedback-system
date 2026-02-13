#!/bin/bash
# Deploy backend to Cloud Run
# Usage: ./deploy-backend.sh [version]
#
# FEATURE FLAGS:
#   By default, feature flags are set to enable all features.
#   To change feature flags after deployment, use:
#
#   # Enable all features (default):
#   gcloud run services update cricsmart-backend --region=asia-south1 \
#     --set-env-vars="FF_MULTI_TENANT=true,FF_TEAM_DISCOVERY=true,FF_WHATSAPP_BYOT=false"
#
#   # EMERGENCY DISABLE team discovery:
#   gcloud run services update cricsmart-backend --region=asia-south1 \
#     --update-env-vars="FF_TEAM_DISCOVERY=false"
#
#   # Enable only for specific users:
#   gcloud run services update cricsmart-backend --region=asia-south1 \
#     --update-env-vars="FF_TEAM_DISCOVERY=false,FF_TEAM_DISCOVERY_USERS=user1@email.com,user2@email.com"

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

# Feature Flags - all enabled by default
FF_MULTI_TENANT=${FF_MULTI_TENANT:-true}
FF_TEAM_DISCOVERY=${FF_TEAM_DISCOVERY:-true}
FF_WHATSAPP_BYOT=${FF_WHATSAPP_BYOT:-false}

echo "🚩 Feature Flags:"
echo "   FF_MULTI_TENANT: ${FF_MULTI_TENANT}"
echo "   FF_TEAM_DISCOVERY: ${FF_TEAM_DISCOVERY}"
echo "   FF_WHATSAPP_BYOT: ${FF_WHATSAPP_BYOT}"

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

# Deploy with feature flags
echo "🌐 Deploying to Cloud Run..."
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --image=${IMAGE} \
  --set-env-vars="AI_SERVICE_URL=${AI_SERVICE_URL},FF_MULTI_TENANT=${FF_MULTI_TENANT},FF_TEAM_DISCOVERY=${FF_TEAM_DISCOVERY},FF_WHATSAPP_BYOT=${FF_WHATSAPP_BYOT},IMAGE_STORAGE=gcs,GCS_BUCKET_NAME=cricsmart-auction-images"

echo "✅ Backend deployed successfully!"
echo "   Service URL: https://${SERVICE_NAME}-795359678717.${REGION}.run.app"
echo ""
echo "📋 To modify feature flags without redeploying:"
echo "   gcloud run services update ${SERVICE_NAME} --region=${REGION} --update-env-vars=\"FF_TEAM_DISCOVERY=false\""
