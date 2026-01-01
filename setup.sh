#!/bin/bash

echo "🚀 Cricket Feedback System Setup"
echo "================================"

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

print_status "Welcome to Cricket Feedback System Setup!"
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

print_status "✅ Prerequisites check passed"

# Check if Docker Desktop Kubernetes is enabled
print_status "Checking Docker Desktop Kubernetes..."
if ! kubectl cluster-info >/dev/null 2>&1; then
    print_error "Kubernetes is not running. Please enable Kubernetes in Docker Desktop."
    exit 1
fi

print_status "✅ Docker Desktop Kubernetes is running"

# Create namespace
print_status "Creating Kubernetes namespace..."
kubectl create namespace cricket-feedback --dry-run=client -o yaml | kubectl apply -f -

# Prompt for Google OAuth setup
echo ""
print_status "🔐 Google OAuth Setup Required"
echo "=================================="
echo "To enable Google OAuth, you need to:"
echo "1. Create a Google OAuth client at: https://console.developers.google.com/"
echo "2. Add authorized origins: http://localhost"
echo "3. Add redirect URIs: http://localhost"
echo ""
read -p "Do you have Google OAuth credentials? (y/n): " has_oauth

if [ "$has_oauth" = "y" ]; then
    read -p "Enter your Google Client ID: " client_id
    read -p "Enter your Google Client Secret: " client_secret
    
    # Create secrets
    print_status "Creating Kubernetes secrets..."
    JWT_SECRET=$(openssl rand -base64 32)
    SUPER_ADMIN_KEY=$(openssl rand -base64 16)
    
    cat > k8s/secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: cricket-feedback
type: Opaque
data:
  jwt-secret: $(echo -n "$JWT_SECRET" | base64)
  google-client-id: $(echo -n "$client_id" | base64)
  google-client-secret: $(echo -n "$client_secret" | base64)
  super-admin-key: $(echo -n "$SUPER_ADMIN_KEY" | base64)
EOF
    
    print_status "✅ Secrets created"
else
    print_warning "Skipping OAuth setup. You'll need to configure it manually later."
fi

# Build and deploy
print_status "Building Docker images..."
docker build -t cricket-feedback-backend:latest ./backend/
docker build -t cricket-feedback-frontend:latest \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID="${client_id:-}" \
  --build-arg REACT_APP_API_URL="http://localhost/api" \
  ./frontend/

print_status "Deploying to Kubernetes..."
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for MongoDB
print_status "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n cricket-feedback --timeout=300s

if [ "$has_oauth" = "y" ]; then
    kubectl apply -f k8s/secrets.yaml
fi

kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Install ingress controller
print_status "Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller
print_status "Waiting for Ingress Controller..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=ingress-nginx -n ingress-nginx --timeout=300s

# Apply ingress
kubectl apply -f k8s/ingress-localhost.yaml

# Wait for all pods
print_status "Waiting for all pods to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n cricket-feedback --timeout=300s
kubectl wait --for=condition=ready pod -l app=backend -n cricket-feedback --timeout=300s

# Show status
echo ""
print_status "🎉 Setup Complete!"
echo "===================="
echo "🌐 Frontend: http://localhost/"
echo "🔧 Backend API: http://localhost/api"
echo "🗄️ MongoDB: Internal cluster access"
echo ""
echo "📊 Status:"
kubectl get pods -n cricket-feedback
kubectl get ingress -n cricket-feedback

echo ""
print_status "📝 Next Steps:"
echo "1. If you didn't set up OAuth, configure Google OAuth manually"
echo "2. Test the application at http://localhost/"
echo "3. Create your first admin account"
echo ""
print_status "🎉 Happy cricket feedback collecting!"
