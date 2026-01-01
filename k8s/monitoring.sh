#!/bin/bash

echo "📊 Minikube Monitoring Script"
echo "============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if Minikube is running
if ! minikube status | grep -q "Running"; then
    print_warning "Minikube is not running. Please start it first:"
    echo "minikube start"
    exit 1
fi

print_header "🔍 Cluster Status"
echo "=================="
minikube status
echo ""

print_header "📦 Pods Status"
echo "==============="
kubectl get pods -n cricket-feedback -o wide
echo ""

print_header "🌐 Services"
echo "==========="
kubectl get services -n cricket-feedback
echo ""

print_header "🚪 Ingress"
echo "========="
kubectl get ingress -n cricket-feedback
echo ""

print_header "📈 Resource Usage"
echo "================"
kubectl top pods -n cricket-feedback 2>/dev/null || print_warning "Metrics server not available"
echo ""

print_header "🔧 Recent Events"
echo "==============="
kubectl get events -n cricket-feedback --sort-by='.lastTimestamp' | tail -10
echo ""

print_header "📋 Logs Summary"
echo "==============="
echo "Backend logs:"
kubectl logs -n cricket-feedback -l app=backend --tail=5
echo ""
echo "Frontend logs:"
kubectl logs -n cricket-feedback -l app=frontend --tail=5
echo ""

print_header "🌐 Access URLs"
echo "=============="
MINIKUBE_IP=$(minikube ip)
echo "Frontend: http://cricket-feedback.local"
echo "Backend API: http://cricket-feedback.local/api"
echo "Minikube Dashboard: minikube dashboard"
echo ""

print_header "🔍 Debug Commands"
echo "=================="
echo "# Backend logs:"
echo "kubectl logs -f deployment/backend -n cricket-feedback"
echo ""
echo "# Frontend logs:"
echo "kubectl logs -f deployment/frontend -n cricket-feedback"
echo ""
echo "# MongoDB logs:"
echo "kubectl logs -f deployment/mongodb -n cricket-feedback"
echo ""
echo "# Access MongoDB shell:"
echo "kubectl exec -it deployment/mongodb -n cricket-feedback -- mongo"
echo ""
echo "# Port forward to local:"
echo "kubectl port-forward service/frontend-service 8080:80 -n cricket-feedback"
echo ""
echo "# Scale deployments:"
echo "kubectl scale deployment backend --replicas=2 -n cricket-feedback"
echo ""
echo "# Restart deployments:"
echo "kubectl rollout restart deployment/backend -n cricket-feedback"
