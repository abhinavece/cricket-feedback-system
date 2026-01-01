#!/bin/bash

echo "🧹 Minikube Cleanup Script"
echo "=========================="

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

# Remove /etc/hosts entry
print_warning "Removing cricket-feedback.local from /etc/hosts (requires sudo)"
sudo sed -i '' '/cricket-feedback.local/d' /etc/hosts 2>/dev/null || \
sudo sed -i '/cricket-feedback.local/d' /etc/hosts 2>/dev/null || \
print_warning "Could not remove /etc/hosts entry. Please remove manually."

# Delete Kubernetes resources
print_status "Deleting Kubernetes resources..."
kubectl delete namespace cricket-feedback --ignore-not-found=true

# Stop Minikube
print_status "Stopping Minikube..."
minikube stop

# Optional: Delete Minikube cluster
read -p "Do you want to delete the entire Minikube cluster? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deleting Minikube cluster..."
    minikube delete
fi

print_status "Cleanup complete!"
