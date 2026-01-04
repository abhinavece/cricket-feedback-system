#!/bin/bash

# Mavericks XI Cricket Feedback System - Helm Deployment Script
# Usage: ./deploy.sh [environment] [action]

set -e

# Configuration
CHART_PATH="./infra/helm/cricket-feedback"
NAMESPACE="cricket-feedback"
RELEASE_NAME="cricket-feedback"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm first."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    log_info "Dependencies check passed."
}

# Validate environment
validate_environment() {
    local env=$1
    if [[ "$env" != "development" && "$env" != "production" ]]; then
        log_error "Invalid environment: $env. Use 'development' or 'production'."
        exit 1
    fi
}

# Deploy application
deploy() {
    local env=$1
    log_info "Deploying to $env environment..."
    
    # Add Bitnami helm repository if not already added
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update
    
    # Check if release exists
    if helm status "$RELEASE_NAME" -n "$NAMESPACE" &> /dev/null; then
        log_info "Release exists. Upgrading..."
        helm upgrade "$RELEASE_NAME" "$CHART_PATH" \
            --namespace "$NAMESPACE" \
            --values "$CHART_PATH/values.yaml" \
            --values "$CHART_PATH/values-$env.yaml" \
            --timeout 10m
    else
        log_info "Installing new release..."
        helm install "$RELEASE_NAME" "$CHART_PATH" \
            --namespace "$NAMESPACE" \
            --create-namespace \
            --values "$CHART_PATH/values.yaml" \
            --values "$CHART_PATH/values-$env.yaml" \
            --timeout 10m
    fi
    
    log_info "Deployment completed successfully!"
}

# Uninstall application
uninstall() {
    log_info "Uninstalling release..."
    
    if helm status "$RELEASE_NAME" -n "$NAMESPACE" &> /dev/null; then
        helm uninstall "$RELEASE_NAME" -n "$NAMESPACE"
        log_info "Release uninstalled successfully!"
    else
        log_warn "Release not found. Nothing to uninstall."
    fi
}

# Show status
status() {
    log_info "Showing release status..."
    helm status "$RELEASE_NAME" -n "$NAMESPACE"
    
    log_info "Showing pod status..."
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    log_info "Showing services..."
    kubectl get services -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    log_info "Showing ingress..."
    kubectl get ingress -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
}

# Show logs
logs() {
    local component=$2
    if [[ -z "$component" ]]; then
        log_error "Please specify component: backend, frontend, or mongodb"
        exit 1
    fi
    
    log_info "Showing logs for $component..."
    kubectl logs -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME",app.kubernetes.io/name="$RELEASE_NAME-$component" --tail=100 -f
}

# Main script logic
main() {
    local environment=${1:-development}
    local action=${2:-deploy}
    
    validate_environment "$environment"
    check_dependencies
    
    case "$action" in
        deploy)
            deploy "$environment"
            ;;
        uninstall)
            uninstall
            ;;
        status)
            status
            ;;
        logs)
            logs "$@"
            ;;
        *)
            log_error "Unknown action: $action"
            echo "Usage: $0 [environment] [action]"
            echo "Environments: development, production"
            echo "Actions: deploy, uninstall, status, logs [component]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
