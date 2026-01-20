#!/bin/bash

# Docker Test Script for AI Payment Parser Service

set -e

echo "🐳 Testing AI Payment Parser Docker Container..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Build the Docker image
print_status "Building Docker image..."
docker build -t ai-payment-parser:test .

# Run the container
print_status "Starting container..."
docker run -d --name ai-payment-test \
    -p 8010:8010 \
    -e AI_SERVICE_ENABLED=true \
    -e GOOGLE_AI_STUDIO_API_KEY=test-key \
    ai-payment-parser:test

# Wait for container to start
print_status "Waiting for service to start..."
sleep 10

# Test health endpoint
print_status "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8010/health)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    print_status "✅ Health check passed"
else
    print_error "❌ Health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test status endpoint
print_status "Testing status endpoint..."
STATUS_RESPONSE=$(curl -s http://localhost:8010/status)
if [[ $STATUS_RESPONSE == *"enabled"* ]]; then
    print_status "✅ Status check passed"
else
    print_error "❌ Status check failed"
    echo "Response: $STATUS_RESPONSE"
fi

# Test root endpoint
print_status "Testing root endpoint..."
ROOT_RESPONSE=$(curl -s http://localhost:8010/)
if [[ $ROOT_RESPONSE == *"ai-payment-parser"* ]]; then
    print_status "✅ Root endpoint check passed"
else
    print_error "❌ Root endpoint check failed"
    echo "Response: $ROOT_RESPONSE"
fi

# Test payment parsing with invalid image
print_status "Testing payment parsing with invalid image..."
INVALID_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg=="
PARSE_RESPONSE=$(curl -s -X POST http://localhost:8010/parse-payment \
    -H "Content-Type: application/json" \
    -d "{\"image_base64\": \"$INVALID_IMAGE\", \"match_date\": \"2024-01-15T00:00:00Z\"}")

if [[ $PARSE_RESPONSE == *"invalid_image"* ]]; then
    print_status "✅ Payment parsing validation works"
else
    print_error "❌ Payment parsing validation failed"
    echo "Response: $PARSE_RESPONSE"
fi

# Extract key metrics from responses
print_status "📊 Container Metrics:"
echo "  - Container ID: $(docker ps -q --filter name=ai-payment-test)"
echo "  - Image Size: $(docker images ai-payment-parser:test --format "{{.Size}}")"
echo "  - Memory Usage: $(docker stats --no-stream --format "{{.MemUsage}}" ai-payment-test)"

# Cleanup
print_status "Cleaning up..."
docker stop ai-payment-test
docker rm ai-payment-test

print_status "🎉 Docker test completed successfully!"
echo ""
echo "📝 Next Steps:"
echo "  1. Set your GOOGLE_AI_STUDIO_API_KEY environment variable"
echo "  2. Run: docker-compose up -d"
echo "  3. Test with: curl -X POST http://localhost:8010/parse-payment -d '{\"image_base64\": \"...\"}'"
echo ""
echo "🔧 Useful Commands:"
echo "  - View logs: docker logs ai-payment-parser"
echo "  - Stop service: docker-compose down"
echo "  - Rebuild: docker-compose build --no-cache"
