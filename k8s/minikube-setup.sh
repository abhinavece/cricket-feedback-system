#!/bin/bash

echo "🚀 Minikube Setup for Cricket Feedback System"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Reset Docker context
print_status "Resetting Docker context..."
docker context use default


# Check if Minikube is installed
if ! command -v minikube &> /dev/null; then
    print_error "Minikube is not installed. Please install it first:"
    echo "macOS: brew install minikube"
    echo "Linux: curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64"
    echo "Windows: choco install minikube"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install it first:"
    echo "macOS: brew install kubectl"
    echo "Linux: curl -LO \"https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl\""
    exit 1
fi

# Start Minikube
print_status "Starting Minikube..."
minikube start --driver=docker --cpus=2 --memory=4096 --disk-size=8g

# Enable addons
print_status "Enabling Minikube addons..."
minikube addons enable ingress
minikube addons enable metrics-server

# Set docker environment
print_status "Setting Docker environment..."
eval $(minikube docker-env)

# Build Docker images
print_status "Building Docker images..."

# Build backend image
print_status "Building backend image..."
docker build -t cricket-feedback-backend:latest ../backend/

# Build frontend image
print_status "Building frontend image..."
docker build -t cricket-feedback-frontend:latest ../frontend/

# Apply Kubernetes manifests
print_status "Applying Kubernetes manifests..."

# Create namespace
kubectl apply -f namespace.yaml

# Create secrets (update with your actual values)
print_warning "Please update secrets.yaml with your actual Google OAuth credentials"
print_status "Creating secrets..."
kubectl apply -f secrets.yaml

# Deploy MongoDB
print_status "Deploying MongoDB..."
kubectl apply -f mongodb-configmap.yaml
kubectl apply -f mongodb-pvc.yaml
kubectl apply -f mongodb-deployment.yaml

# Wait for MongoDB to be ready
print_status "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n cricket-feedback --timeout=300s

# Deploy backend
print_status "Deploying backend..."
kubectl apply -f backend-deployment.yaml

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n cricket-feedback --timeout=300s

# Deploy frontend
print_status "Deploying frontend..."
kubectl apply -f frontend-deployment.yaml

# Wait for frontend to be ready
print_status "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n cricket-feedback --timeout=300s

# Create ingress
print_status "Creating ingress..."
kubectl apply -f ingress.yaml

# Get Minikube IP
MINIKUBE_IP=$(minikube ip)
print_status "Minikube IP: $MINIKUBE_IP"

# Add entry to /etc/hosts (requires sudo)
print_warning "Adding cricket-feedback.local to /etc/hosts (requires sudo)"
echo "$MINIKUBE_IP cricket-feedback.local" | sudo tee -a /etc/hosts

# Show status
print_status "Deployment status:"
kubectl get pods -n cricket-feedback
kubectl get services -n cricket-feedback
kubectl get ingress -n cricket-feedback

# Show URLs
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo "🌐 Frontend URL: http://cricket-feedback.local"
echo "🔧 Backend API: http://cricket-feedback.local/api"
echo "📊 Minikube Dashboard: minikube dashboard"
echo ""
echo "🔍 Useful Commands:"
echo "  kubectl logs -f deployment/backend -n cricket-feedback"
echo "  kubectl logs -f deployment/frontend -n cricket-feedback"
echo "  kubectl exec -it deployment/mongodb -n cricket-feedback -- mongo"
echo "  minikube dashboard"
echo "  minikube stop"
echo ""
echo "🧪 Testing:"
echo "  curl http://cricket-feedback.local/api/health"
echo "  open http://cricket-feedback.local"
