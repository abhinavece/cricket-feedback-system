#!/bin/bash

# Build and push AI Service Docker image to OCI Registry
# Usage: ./build-and-push-oci.sh [version-tag]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# OCI Registry configuration
OCI_REGISTRY="phx.ocir.io"
OCI_NAMESPACE="axkw6whnjncs"
OCI_REPOSITORY="cricket-feedback-ai-service"
OCI_REGION="phx"

# Get version tag from argument or use default
VERSION_TAG=${1:-"v1"}
IMAGE_TAG="${OCI_REGISTRY}/${OCI_NAMESPACE}/${OCI_REPOSITORY}:${VERSION_TAG}"
LATEST_TAG="${OCI_REGISTRY}/${OCI_NAMESPACE}/${OCI_REPOSITORY}:latest"

echo -e "${BLUE}🐳 Building and pushing AI Service to OCI Registry${NC}"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "   Registry: ${OCI_REGISTRY}"
echo -e "   Namespace: ${OCI_NAMESPACE}"
echo -e "   Repository: ${OCI_REPOSITORY}"
echo -e "   Version Tag: ${VERSION_TAG}"
echo -e "   Image: ${IMAGE_TAG}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if logged into OCI
echo -e "${BLUE}🔐 Checking OCI registry login...${NC}"
if ! docker info | grep -q "${OCI_REGISTRY}"; then
    echo -e "${YELLOW}⚠️  Not logged into OCI registry${NC}"
    echo -e "${BLUE}   Logging in...${NC}"
    echo -e "${YELLOW}   Please enter your OCI credentials:${NC}"
    docker login ${OCI_REGISTRY}
fi

# Build the Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build -t ${IMAGE_TAG} -t ${LATEST_TAG} .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Push version tag
echo -e "${BLUE}📤 Pushing image with tag: ${VERSION_TAG}${NC}"
docker push ${IMAGE_TAG}

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to push ${IMAGE_TAG}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pushed ${IMAGE_TAG}${NC}"

# Push latest tag
echo -e "${BLUE}📤 Pushing image with tag: latest${NC}"
docker push ${LATEST_TAG}

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Failed to push latest tag (non-critical)${NC}"
else
    echo -e "${GREEN}✅ Pushed ${LATEST_TAG}${NC}"
fi

echo ""
echo -e "${GREEN}✅ Successfully pushed AI Service to OCI Registry!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Update Helm values with new tag: ${VERSION_TAG}"
echo -e "   2. Deploy using Helm:"
echo -e "      ${GREEN}helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \\${NC}"
echo -e "      ${GREEN}  -f values-production.yaml \\${NC}"
echo -e "      ${GREEN}  --set aiService.image.tag=${VERSION_TAG} \\${NC}"
echo -e "      ${GREEN}  -n cricket-feedback${NC}"
echo ""
echo -e "${BLUE}🔗 Image URL:${NC}"
echo -e "   ${IMAGE_TAG}"
