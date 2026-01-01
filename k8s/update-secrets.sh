#!/bin/bash

echo "🔐 Update Kubernetes Secrets"
echo "==========================="

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

# Get user input
read -p "Enter your JWT Secret: " JWT_SECRET
read -p "Enter your Google Client ID: " GOOGLE_CLIENT_ID
read -p "Enter your Google Client Secret: " GOOGLE_CLIENT_SECRET
read -p "Enter your Super Admin Key (default: super-admin-setup-key-2024): " SUPER_ADMIN_KEY

# Use default if empty
SUPER_ADMIN_KEY=${SUPER_ADMIN_KEY:-super-admin-setup-key-2024}

# Encode to base64
JWT_SECRET_B64=$(echo -n "$JWT_SECRET" | base64)
GOOGLE_CLIENT_ID_B64=$(echo -n "$GOOGLE_CLIENT_ID" | base64)
GOOGLE_CLIENT_SECRET_B64=$(echo -n "$GOOGLE_CLIENT_SECRET" | base64)
SUPER_ADMIN_KEY_B64=$(echo -n "$SUPER_ADMIN_KEY" | base64)

# Create secrets.yaml
cat > k8s/secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: cricket-feedback
type: Opaque
data:
  jwt-secret: $JWT_SECRET_B64
  google-client-id: $GOOGLE_CLIENT_ID_B64
  google-client-secret: $GOOGLE_CLIENT_SECRET_B64
  super-admin-key: $SUPER_ADMIN_KEY_B64
EOF

print_status "Secrets updated in k8s/secrets.yaml"
print_status "Apply with: kubectl apply -f k8s/secrets.yaml"

# Show encoded values (for verification)
echo ""
echo "🔍 Encoded values:"
echo "JWT Secret: $JWT_SECRET_B64"
echo "Google Client ID: $GOOGLE_CLIENT_ID_B64"
echo "Google Client Secret: $GOOGLE_CLIENT_SECRET_B64"
echo "Super Admin Key: $SUPER_ADMIN_KEY_B64"
