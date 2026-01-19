#!/bin/bash

# Cricket Feedback System - Docker Desktop Deployment
# This script deploys the enhanced UI to Docker Desktop with Kubernetes

set -e

echo "🏏 Cricket Feedback System - Docker Desktop Deployment"
echo "=================================================="

# Check if Docker Desktop is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if Kubernetes is enabled in Docker Desktop
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "❌ Kubernetes is not enabled in Docker Desktop."
    echo "Please enable Kubernetes in Docker Desktop settings and try again."
    exit 1
fi

echo "✅ Docker Desktop and Kubernetes are running"

# Clean up existing resources
echo ""
echo "🧹 Cleaning up existing resources..."
kubectl delete namespace cricket-feedback --ignore-not-found=true
kubectl delete secret cricket-secrets --ignore-not-found=true -n default

# Wait for namespace to be fully deleted
echo "⏳ Waiting for namespace cleanup..."
kubectl wait --for=delete namespace/cricket-feedback --timeout=60s --ignore-not-found=true

# Create namespace
echo ""
echo "📦 Creating namespace..."
kubectl create namespace cricket-feedback

# Create secrets from environment file
echo ""
echo "🔐 Creating secrets..."
if [ -f ".env" ]; then
    # Read from .env file if it exists
    MONGO_USER=$(grep MONGO_INITDB_ROOT_USERNAME .env | cut -d '=' -f2)
    MONGO_PASS=$(grep MONGO_INITDB_ROOT_PASSWORD .env | cut -d '=' -f2)
    ADMIN_PASS=$(grep ADMIN_PASSWORD .env | cut -d '=' -f2)
    GOOGLE_CLIENT_ID=$(grep GOOGLE_CLIENT_ID .env | cut -d '=' -f2)
    GOOGLE_CLIENT_SECRET=$(grep GOOGLE_CLIENT_SECRET .env | cut -d '=' -f2)
else
    echo "⚠️  .env file not found. Using example values."
    echo "Please update the secrets manually after deployment."
    MONGO_USER="admin"
    MONGO_PASS="password123"
    ADMIN_PASS="admin123"
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"
fi

# Create Kubernetes secret
kubectl create secret generic cricket-secrets \
    --from-literal=mongo-root-username="$MONGO_USER" \
    --from-literal=mongo-root-password="$MONGO_PASS" \
    --from-literal=admin-password="$ADMIN_PASS" \
    --from-literal=google-client-id="$GOOGLE_CLIENT_ID" \
    --from-literal=google-client-secret="$GOOGLE_CLIENT_SECRET" \
    -n cricket-feedback

# Build frontend Docker image with enhanced UI
echo ""
echo "🏗️  Building frontend Docker image with enhanced UI..."
cd frontend

# Check if Google Client ID is available for build
if [ ! -z "$GOOGLE_CLIENT_ID" ]; then
    echo "🔑 Building with Google Client ID..."
    docker build -t cricket-feedback-frontend:latest \
        --build-arg REACT_APP_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
        --build-arg REACT_APP_API_URL="http://localhost:30001/api" \
        .
else
    echo "⚠️  Building without Google Client ID (will need to configure manually)..."
    docker build -t cricket-feedback-frontend:latest \
        --build-arg REACT_APP_API_URL="http://localhost:30001/api" \
        .
fi

cd ..

# Build backend Docker image
echo ""
echo "🏗️  Building backend Docker image..."
cd backend
docker build -t cricket-feedback-backend:latest .
cd ..

# Build AI service Docker image
echo ""
echo "🏗️  Building AI service Docker image..."
cd ai-service
docker build -t cricket-feedback-ai-service:latest .
cd ..

# Load images into Docker Desktop (if needed)
echo ""
echo "📥 Loading images into Docker Desktop..."
docker tag cricket-feedback-frontend:latest localhost:5000/cricket-feedback-frontend:latest
docker tag cricket-feedback-backend:latest localhost:5000/cricket-feedback-backend:latest
docker tag cricket-feedback-ai-service:latest localhost:5000/cricket-feedback-ai-service:latest

# Deploy Kubernetes resources
echo ""
echo "🚀 Deploying to Kubernetes..."
cd k8s

# Apply MongoDB deployment first
echo "📄 Deploying MongoDB..."
kubectl apply -f mongodb-pvc.yaml -n cricket-feedback
kubectl apply -f mongodb-deployment.yaml -n cricket-feedback

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n cricket-feedback --timeout=300s

# Deploy backend
echo "📄 Deploying backend..."
kubectl apply -f backend-deployment.yaml -n cricket-feedback

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n cricket-feedback --timeout=300s

# Deploy AI service
echo "📄 Deploying AI service..."
kubectl apply -f ai-service-deployment.yaml -n cricket-feedback

# Wait for AI service to be ready (optional - may not be critical path)
echo "⏳ Waiting for AI service to be ready..."
kubectl wait --for=condition=ready pod -l app=ai-service -n cricket-feedback --timeout=120s || echo "⚠️ AI service not ready yet (will start in background)"

# Deploy frontend
echo "📄 Deploying frontend..."
kubectl apply -f frontend-deployment.yaml -n cricket-feedback

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n cricket-feedback --timeout=300s

cd ..

# Set up port forwarding
echo ""
echo "🔗 Setting up port forwarding..."
echo "Starting port forwarding in background..."

# Kill existing port forwards if any
pkill -f "kubectl port-forward" || true

# Start port forwarding for backend
kubectl port-forward -n cricket-feedback svc/backend-service 30001:5001 &
BACKEND_PID=$!

# Start port forwarding for frontend
kubectl port-forward -n cricket-feedback svc/frontend-service 30000:3000 &
FRONTEND_PID=$!

# Wait a moment for port forwarding to start
sleep 5

# Verify services are running
echo ""
echo "🔍 Verifying services..."
echo "Backend health check:"
curl -s http://localhost:30001/api/health || echo "Backend not ready yet"

echo ""
echo "Frontend check:"
curl -s -I http://localhost:30000 | head -1 || echo "Frontend not ready yet"

# Display access information
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo "🏏 Cricket Feedback System with Enhanced UI is now running!"
echo ""
echo "📱 Access URLs:"
echo "   Frontend: http://localhost:30000"
echo "   Backend API: http://localhost:30001/api"
echo ""
echo "🔧 Port Forwarding PIDs:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "🛑 To stop port forwarding:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📊 To check deployment status:"
echo "   kubectl get pods -n cricket-feedback"
echo "   kubectl get services -n cricket-feedback"
echo ""
echo "🔍 To view logs:"
echo "   kubectl logs -f deployment/backend -n cricket-feedback"
echo "   kubectl logs -f deployment/frontend -n cricket-feedback"
echo "   kubectl logs -f deployment/ai-service -n cricket-feedback"
echo ""
echo "🎨 Enhanced UI Features:"
echo "   ✅ Modern cricket-themed design"
echo "   ✅ Vibrant color palette"
echo "   ✅ Smooth animations and transitions"
echo "   ✅ Enhanced feedback details modal"
echo "   ✅ Responsive design"
echo "   ✅ Professional admin interface"
echo ""
echo "🤖 AI Service Features:"
echo "   ✅ Payment screenshot parsing with Google AI Studio"
echo "   ✅ Automatic amount extraction from UPI screenshots"
echo "   ✅ Date validation against match dates"
echo "   ✅ Non-payment screenshot detection"
echo "   ✅ Free tier only (no billing)"
echo ""
echo "⚠️  Important Notes:"
echo "   • Make sure Google OAuth is configured in Google Cloud Console"
echo "   • Update secrets if needed: kubectl edit secret cricket-secrets -n cricket-feedback"
echo "   • Frontend may take a minute to fully load"
echo "   • To enable AI payment parsing, set Google AI Studio API key:"
echo "     kubectl create secret generic ai-service-secrets --from-literal=google-ai-studio-api-key=YOUR_KEY -n cricket-feedback"

# Save PIDs to file for easy cleanup
echo "$BACKEND_PID" > .backend_pid
echo "$FRONTEND_PID" > .frontend_pid

echo ""
echo "🎯 Your enhanced Cricket Feedback System is ready!"
