#!/bin/bash

echo "🌩️ Deploy Cricket Feedback to GCP Kubernetes"
echo "=========================================="

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

# Check prerequisites
print_status "Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first:"
    echo "macOS: brew install google-cloud-sdk"
    echo "Linux: curl https://sdk.cloud.google.com | bash"
    echo "Windows: Download from https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_error "Not logged in to gcloud. Please run:"
    echo "gcloud auth login"
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    print_error "No project set. Please run:"
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

print_status "Using GCP project: $PROJECT_ID"

# Check if billing is enabled
if ! gcloud beta billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null; then
    print_error "Billing is not enabled for project $PROJECT_ID"
    print_warning "Please enable billing at: https://console.cloud.google.com/billing/linkedaccount"
    exit 1
fi

print_status "✅ Prerequisites check passed"

# Get user input for configuration
echo ""
print_status "📝 Configuration:"
read -p "Enter your domain (e.g., cricket-feedback.example.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    print_error "Domain and email are required"
    exit 1
fi

# Enable required APIs
print_status "Enabling required GCP APIs..."
gcloud services enable container.googleapis.com --project="$PROJECT_ID"
gcloud services enable cloudbuild.googleapis.com --project="$PROJECT_ID"
gcloud services enable containerregistry.googleapis.com --project="$PROJECT_ID"

# Create GKE cluster
print_status "Creating GKE cluster..."
gcloud container clusters create cricket-feedback \
    --project="$PROJECT_ID" \
    --zone=us-central1-a \
    --num-nodes=2 \
    --machine-type=e2-medium \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=3 \
    --enable-autorepair \
    --enable-autoupgrade \
    --enable-ip-alias

# Get cluster credentials
print_status "Getting cluster credentials..."
gcloud container clusters get-credentials cricket-feedback \
    --zone=us-central1-a \
    --project="$PROJECT_ID"

# Build and push Docker images
print_status "Building and pushing Docker images..."

# Get secrets from current cluster
GOOGLE_CLIENT_ID=$(kubectl get secret app-secrets -n cricket-feedback -o jsonpath='{.data.google-client-id}' 2>/dev/null | base64 -d)
GOOGLE_CLIENT_SECRET=$(kubectl get secret app-secrets -n cricket-feedback -o jsonpath='{.data.google-client-secret}' 2>/dev/null | base64 -d)
JWT_SECRET=$(kubectl get secret app-secrets -n cricket-feedback -o jsonpath='{.data.jwt-secret}' 2>/dev/null | base64 -d)
SUPER_ADMIN_KEY=$(kubectl get secret app-secrets -n cricket-feedback -o jsonpath='{.data.super-admin-key}' 2>/dev/null | base64 -d)

if [ -z "$GOOGLE_CLIENT_ID" ]; then
    print_error "Could not get secrets from Minikube. Please ensure Minikube is running and secrets exist."
    exit 1
fi

# Configure Docker for GCP
print_status "Configuring Docker for GCP..."
gcloud auth configure-docker us-central1-docker.pkg.dev

# Create repository
REPO_NAME="cricket-feedback"
gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location=us-central1 \
    --description="Cricket Feedback Docker repository"

# Build and push backend
print_status "Building and pushing backend image..."
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cricket-feedback-backend:latest ./backend/
docker push us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cricket-feedback-backend:latest

# Build and push frontend
print_status "Building and pushing frontend image..."
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cricket-feedback-frontend:latest \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --build-arg REACT_APP_API_URL="https://$DOMAIN/api" \
  ./frontend/
docker push us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cricket-feedback-frontend:latest

# Create GCP-specific manifests
print_status "Creating GCP Kubernetes manifests..."

# Create namespace
kubectl create namespace cricket-feedback --dry-run=client -o yaml | kubectl apply -f -

# Create secrets
cat > gcp-secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: cricket-feedback
type: Opaque
data:
  jwt-secret: $(echo -n "$JWT_SECRET" | base64)
  google-client-id: $(echo -n "$GOOGLE_CLIENT_ID" | base64)
  google-client-secret: $(echo -n "$GOOGLE_CLIENT_SECRET" | base64)
  super-admin-key: $(echo -n "$SUPER_ADMIN_KEY" | base64)
EOF

kubectl apply -f gcp-secrets.yaml

# Update deployment manifests for GCP
sed "s|cricket-feedback-backend:latest|us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cricket-feedback-backend:latest|g" k8s/backend-deployment.yaml > gcp-backend-deployment.yaml
sed "s|cricket-feedback-frontend:latest|us-central1-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cricket-feedback-frontend:latest|g" k8s/frontend-deployment.yaml > gcp-frontend-deployment.yaml

# Deploy to GCP
print_status "Deploying to GCP Kubernetes..."
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for MongoDB
print_status "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n cricket-feedback --timeout=300s

# Deploy backend
kubectl apply -f gcp-backend-deployment.yaml
kubectl wait --for=condition=ready pod -l app=backend -n cricket-feedback --timeout=300s

# Deploy frontend
kubectl apply -f gcp-frontend-deployment.yaml
kubectl wait --for=condition=ready pod -l app=frontend -n cricket-feedback --timeout=300s

# Create LoadBalancer services
print_status "Creating LoadBalancer services..."
cat > gcp-services.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: cricket-feedback
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: cricket-feedback
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 5001
    targetPort: 5001
EOF

kubectl apply -f gcp-services.yaml

# Wait for external IPs
print_status "Waiting for external IPs..."
sleep 30

FRONTEND_IP=""
BACKEND_IP=""

for i in {1..30}; do
    FRONTEND_IP=$(kubectl get service frontend-service -n cricket-feedback -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    BACKEND_IP=$(kubectl get service backend-service -n cricket-feedback -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    
    if [ -n "$FRONTEND_IP" ] && [ -n "$BACKEND_IP" ]; then
        break
    fi
    echo "Waiting for external IPs... ($i/30)"
    sleep 10
done

if [ -z "$FRONTEND_IP" ] || [ -z "$BACKEND_IP" ]; then
    print_error "Failed to get external IPs"
    print_status "Current services:"
    kubectl get services -n cricket-feedback
    exit 1
fi

print_status "✅ External IPs assigned:"
echo "Frontend: $FRONTEND_IP"
echo "Backend: $BACKEND_IP"

# Create DNS configuration
print_status "📋 DNS Configuration:"
echo "======================"
echo "Please add the following DNS records:"
echo ""
echo "A Record: $DOMAIN → $FRONTEND_IP"
echo "A Record: api.$DOMAIN → $BACKEND_IP"
echo ""
echo "Or if using a subdomain:"
echo "CNAME: cricket-feedback → $DOMAIN"
echo "CNAME: api → $DOMAIN"

# Update Google OAuth
print_status "🔐 Google OAuth Configuration:"
echo "================================="
echo "Please update your Google OAuth client with:"
echo "Authorized JavaScript origins:"
echo "  - https://$DOMAIN"
echo "  - https://api.$DOMAIN"
echo ""
echo "Authorized redirect URIs:"
echo "  - https://$DOMAIN"
echo "  - https://api.$DOMAIN"

# Show final status
print_status "🎉 Deployment Complete!"
echo "=========================="
echo "🌐 Frontend: https://$DOMAIN (after DNS setup)"
echo "🔧 Backend API: https://api.$DOMAIN (after DNS setup)"
echo "🗄️ MongoDB: Internal cluster access"
echo ""
echo "📊 Current status:"
kubectl get pods -n cricket-feedback
kubectl get services -n cricket-feedback

# Cleanup
rm -f gcp-secrets.yaml gcp-backend-deployment.yaml gcp-frontend-deployment.yaml gcp-services.yaml

echo ""
print_status "📝 Next Steps:"
echo "1. Set up DNS records as shown above"
echo "2. Update Google OAuth with new domains"
echo "3. Test your application at https://$DOMAIN"
echo "4. Consider setting up SSL certificates with Let's Encrypt"
echo ""
echo "🔍 Monitor deployment:"
echo "kubectl get pods -n cricket-feedback"
echo "kubectl logs -f deployment/frontend -n cricket-feedback"
echo "kubectl logs -f deployment/backend -n cricket-feedback"
