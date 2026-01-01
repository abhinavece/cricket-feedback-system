#!/bin/bash

echo "🧹 Clean and Redeploy Everything"
echo "==============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop all processes
print_status "Stopping all processes..."
pkill -f "kubectl port-forward" 2>/dev/null || true
pkill -f "minikube tunnel" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true

# Delete Kubernetes namespace
print_status "Deleting Kubernetes namespace..."
kubectl delete namespace cricket-feedback --ignore-not-found=true

# Wait for cleanup
print_status "Waiting for cleanup to complete..."
sleep 10

# Set Docker environment to Minikube
print_status "Setting Docker environment to Minikube..."
eval $(minikube docker-env)

# Remove old Docker images
print_status "Removing old Docker images..."
docker rmi cricket-feedback-backend:latest 2>/dev/null || true
docker rmi cricket-feedback-frontend:latest 2>/dev/null || true

# Get secrets for build
print_status "Getting secrets from Kubernetes..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml

# Wait for secrets
sleep 5

GOOGLE_CLIENT_ID=$(kubectl get secret app-secrets -n cricket-feedback -o jsonpath='{.data.google-client-id}' | base64 -d)
GOOGLE_CLIENT_SECRET=$(kubectl get secret app-secrets -n cricket-feedback -o jsonpath='{.data.google-client-secret}' | base64 -d)
REACT_APP_API_URL="https://cognitional-unbartered-raye.ngrok-free.dev/api"

print_status "Google Client ID: $GOOGLE_CLIENT_ID"
print_status "API URL: $REACT_APP_API_URL"

# Build backend image
print_status "Building backend image..."
docker build -t cricket-feedback-backend:latest ./backend/

# Build frontend image with secrets
print_status "Building frontend image with secrets..."
docker build -t cricket-feedback-frontend:latest \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --build-arg REACT_APP_API_URL="$REACT_APP_API_URL" \
  ./frontend/

# Verify images
print_status "Verifying Docker images..."
docker images | grep cricket-feedback

# Deploy everything
print_status "Deploying Kubernetes resources..."
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for MongoDB
print_status "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n cricket-feedback --timeout=300s

# Deploy backend
print_status "Deploying backend..."
kubectl apply -f k8s/backend-deployment.yaml

# Wait for backend
print_status "Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n cricket-feedback --timeout=300s

# Deploy frontend
print_status "Deploying frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for frontend
print_status "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n cricket-feedback --timeout=300s

# Start port-forwards
print_status "Starting port-forwards..."
kubectl port-forward service/frontend-service 8080:80 -n cricket-feedback &
FRONTEND_PID=$!

kubectl port-forward service/backend-service 5001:5001 -n cricket-feedback &
BACKEND_PID=$!

# Wait for port-forwards
sleep 5

# Test connectivity
print_status "Testing connectivity..."
if curl -s http://localhost:8080 >/dev/null 2>&1; then
    print_status "✅ Frontend accessible at http://localhost:8080"
else
    print_error "❌ Frontend not accessible"
fi

if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
    print_status "✅ Backend accessible at http://localhost:5001"
else
    print_error "❌ Backend not accessible"
fi

# Check if Google Client ID is in JavaScript
print_status "Checking if Google Client ID is baked into JavaScript..."
GOOGLE_ID_IN_JS=$(kubectl exec -n cricket-feedback deployment/frontend -- cat /usr/share/nginx/html/static/js/main.*.js 2>/dev/null | grep -o "$GOOGLE_CLIENT_ID" | head -1)

if [ "$GOOGLE_ID_IN_JS" = "$GOOGLE_CLIENT_ID" ]; then
    print_status "✅ Google Client ID found in built JavaScript"
else
    print_error "❌ Google Client ID NOT found in built JavaScript"
fi

# Show final status
print_status "Final deployment status:"
kubectl get pods -n cricket-feedback
kubectl get services -n cricket-feedback

echo ""
echo "🎉 Clean deployment complete!"
echo "============================"
echo "🌐 Local frontend: http://localhost:8080"
echo "🔧 Local backend: http://localhost:5001"
echo "🌐 Public URL: https://cognitional-unbartered-raye.ngrok-free.dev"
echo "❤️  Health check: http://localhost:5001/api/health"
echo ""
echo "📝 What to do next:"
echo "1. Make sure ngrok is running and forwarding to localhost:8080"
echo "2. Add 'https://cognitional-unbartered-raye.ngrok-free.dev' to Google OAuth"
echo "3. Test Google OAuth at the ngrok URL"
echo ""
echo "🔍 Keep this terminal open - port-forwards are running"
echo "🔍 Frontend PID: $FRONTEND_PID"
echo "🔍 Backend PID: $BACKEND_PID"
echo "🔍 To stop: kill $FRONTEND_PID $BACKEND_PID"
