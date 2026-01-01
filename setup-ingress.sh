#!/bin/bash

echo "🌐 Setup Ingress for Cricket Feedback"
echo "==================================="

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

# Stop existing port-forwards
print_status "Stopping existing port-forwards..."
pkill -f "kubectl port-forward" 2>/dev/null || true

# Delete NodePort service
print_status "Deleting NodePort service..."
kubectl delete service frontend-service -n cricket-feedback --ignore-not-found=true

# Create ClusterIP service for frontend
print_status "Creating ClusterIP service for frontend..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: cricket-feedback
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
EOF

# Apply ingress
print_status "Applying ingress configuration..."
kubectl apply -f k8s/ingress-fixed.yaml

# Update frontend deployment
print_status "Updating frontend deployment..."
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for frontend to be ready
print_status "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n cricket-feedback --timeout=300s

# Start Minikube tunnel
print_status "Starting Minikube tunnel..."
print_warning "Please enter your sudo password when prompted..."
echo ""
echo "🚀 Starting tunnel (this will ask for sudo password)..."
minikube tunnel --cleanup &
TUNNEL_PID=$!

# Wait for tunnel to start
sleep 10

# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Update /etc/hosts
print_status "Updating /etc/hosts..."
sudo sed -i '' '/cricket-feedback.local/d' /etc/hosts 2>/dev/null || true
echo "$MINIKUBE_IP cricket-feedback.local" | sudo tee -a /etc/hosts

# Show status
print_status "Ingress setup complete!"
echo ""
echo "🌐 Access your app at: http://cricket-feedback.local"
echo "🔧 Backend API at: http://cricket-feedback.local/api"
echo "❤️  Health check: http://cricket-feedback.local/api/health"
echo ""
echo "📊 Service status:"
kubectl get services -n cricket-feedback
echo ""
echo "📊 Ingress status:"
kubectl get ingress -n cricket-feedback
echo ""
echo "📊 Pod status:"
kubectl get pods -n cricket-feedback
echo ""
echo "🔍 Keep this terminal open - tunnel is running (PID: $TUNNEL_PID)"
echo "🔍 To stop: kill $TUNNEL_PID"
