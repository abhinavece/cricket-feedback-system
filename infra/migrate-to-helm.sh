#!/bin/bash

# Migration script to convert from existing YAML deployments to Helm
# This script will backup existing resources and deploy with Helm

set -e

# Configuration
NAMESPACE="cricket-feedback"
RELEASE_NAME="cricket-feedback"
BACKUP_DIR="./backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Backup existing resources
backup_resources() {
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    log_info "Backing up existing resources..."
    
    # Backup all resources in the namespace
    kubectl get all -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/all-resources.yaml"
    
    # Backup specific resources
    kubectl get deployment -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/deployments.yaml"
    kubectl get service -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/services.yaml"
    kubectl get ingress -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/ingress.yaml"
    kubectl get secret -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/secrets.yaml"
    kubectl get pvc -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/pvc.yaml"
    
    log_info "Backup completed in $BACKUP_DIR"
}

# Remove existing deployments
remove_existing() {
    log_warn "Removing existing deployments..."
    
    # Delete deployments
    kubectl delete deployment backend -n "$NAMESPACE" --ignore-not-found=true
    kubectl delete deployment frontend -n "$NAMESPACE" --ignore-not-found=true
    kubectl delete deployment mongodb -n "$NAMESPACE" --ignore-not-found=true
    
    # Delete services
    kubectl delete service backend-service -n "$NAMESPACE" --ignore-not-found=true
    kubectl delete service frontend-service -n "$NAMESPACE" --ignore-not-found=true
    kubectl delete service mongodb-service -n "$NAMESPACE" --ignore-not-found=true
    
    # Delete ingress
    kubectl delete ingress cricket-ingress -n "$NAMESPACE" --ignore-not-found=true
    
    # Keep secrets and PVCs for data preservation
    
    log_info "Existing deployments removed"
}

# Deploy with Helm
deploy_helm() {
    log_info "Deploying with Helm..."
    
    # Add Bitnami helm repository
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    
    # Deploy with Helm
    ./infra/deploy.sh development deploy
    
    log_info "Helm deployment completed"
}

# Verify migration
verify_migration() {
    log_info "Verifying migration..."
    
    # Check if all pods are running
    kubectl get pods -n "$NAMESPACE"
    
    # Check services
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress
    kubectl get ingress -n "$NAMESPACE"
    
    log_info "Migration verification completed"
}

# Main migration process
main() {
    log_info "Starting migration from YAML to Helm deployment..."
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace $NAMESPACE does not exist. Nothing to migrate."
        exit 1
    fi
    
    # Check if there are existing deployments
    if ! kubectl get deployment -n "$NAMESPACE" &> /dev/null; then
        log_warn "No existing deployments found in namespace $NAMESPACE"
        exit 0
    fi
    
    backup_resources
    
    read -p "Do you want to proceed with removing existing deployments and migrating to Helm? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        remove_existing
        deploy_helm
        verify_migration
        
        log_info "Migration completed successfully!"
        log_info "Backup is available at: $BACKUP_DIR"
        log_warn "Please test the application thoroughly before removing the backup."
    else
        log_info "Migration cancelled."
        log_info "Backup is available at: $BACKUP_DIR"
    fi
}

# Run migration
main
