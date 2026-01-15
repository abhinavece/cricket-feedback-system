#!/bin/bash
# Smart Build and Deploy Script for Mavericks XI Cricket Feedback System
#
# Usage: ./scripts/deploy.sh [frontend|backend|both] [options]
#
# Options:
#   --skip-build    Skip Docker build, only update versions and deploy
#   --skip-deploy   Build and push images but don't run helm upgrade
#   --skip-commit   Don't commit version changes to git
#   --dry-run       Show what would be done without executing
#
# Examples:
#   ./scripts/deploy.sh both              # Build and deploy everything
#   ./scripts/deploy.sh backend           # Build and deploy only backend
#   ./scripts/deploy.sh frontend --skip-deploy  # Build frontend only

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VALUES_FILE="$PROJECT_ROOT/infra/helm/cricket-feedback/values.yaml"
VALUES_DEV_FILE="$PROJECT_ROOT/infra/helm/cricket-feedback/values-development.yaml"
REGISTRY="phx.ocir.io/axkw6whnjncs"
FRONTEND_IMAGE="cricket-feedback-frontend"
BACKEND_IMAGE="cricket-feedback-backend"
NAMESPACE="cricket-feedback"

# Build args for frontend
REACT_APP_API_URL="https://mavericks11.duckdns.org/api"
REACT_APP_GOOGLE_CLIENT_ID="988776668750-p9nj8drdmeneu0ndhmni6gscf3fcf3qa.apps.googleusercontent.com"

# Flags
SKIP_BUILD=false
SKIP_DEPLOY=false
SKIP_COMMIT=false
DRY_RUN=false
COMPONENT="both"

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            frontend|backend|both)
                COMPONENT="$1"
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-deploy)
                SKIP_DEPLOY=true
                shift
                ;;
            --skip-commit)
                SKIP_COMMIT=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    echo "Usage: ./scripts/deploy.sh [frontend|backend|both] [options]"
    echo ""
    echo "Components:"
    echo "  frontend    Build and deploy frontend only"
    echo "  backend     Build and deploy backend only"
    echo "  both        Build and deploy both (default)"
    echo ""
    echo "Options:"
    echo "  --skip-build    Skip Docker build, only update versions and deploy"
    echo "  --skip-deploy   Build and push images but don't run helm upgrade"
    echo "  --skip-commit   Don't commit version changes to git"
    echo "  --dry-run       Show what would be done without executing"
    echo "  -h, --help      Show this help message"
}

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"
}

# Get current version from values-development.yaml
get_current_version() {
    local component=$1
    # Use yq if available, otherwise use grep/sed
    if command -v yq &> /dev/null; then
        yq e ".${component}.image.tag" "$VALUES_DEV_FILE" | tr -d '"'
    else
        grep -A2 "^${component}:" "$VALUES_DEV_FILE" | grep "tag:" | head -1 | sed 's/.*tag: *"\?\([^"]*\)"\?/\1/'
    fi
}

# Generate date-based version
generate_version() {
    local current=$1
    local date_tag=$(date +'%Y.%m.%d')
    local build_num=1

    # Check if there's already a build today, increment
    if [[ "$current" == "$date_tag."* ]]; then
        local existing_num=$(echo "$current" | sed "s/${date_tag}\.\([0-9]*\)/\1/")
        build_num=$((existing_num + 1))
    fi

    echo "${date_tag}.${build_num}"
}

# Update version in values files
update_version() {
    local component=$1
    local new_version=$2

    log "Updating $component version to $new_version"

    if $DRY_RUN; then
        log "[DRY-RUN] Would update $component to $new_version in values files"
        return
    fi

    # Update values-development.yaml
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed requires different syntax
        sed -i '' "s/^\(  *tag: *\"\)[^\"]*\"/\1${new_version}\"/" "$VALUES_DEV_FILE"
    else
        sed -i "s/^\(  *tag: *\"\)[^\"]*\"/\1${new_version}\"/" "$VALUES_DEV_FILE"
    fi

    # For a more precise update, use a temporary approach
    # This updates the tag under the specific component section
    local temp_file=$(mktemp)

    if [[ "$component" == "backend" ]]; then
        awk -v new_tag="$new_version" '
            /^backend:/ { in_backend=1 }
            /^frontend:/ { in_backend=0 }
            /^mongodb:/ { in_backend=0 }
            in_backend && /tag:/ && !updated_backend {
                sub(/tag: *"[^"]*"/, "tag: \"" new_tag "\"")
                updated_backend=1
            }
            { print }
        ' "$VALUES_DEV_FILE" > "$temp_file" && mv "$temp_file" "$VALUES_DEV_FILE"

        # Also update values.yaml
        awk -v new_tag="$new_version" '
            /^backend:/ { in_backend=1 }
            /^frontend:/ { in_backend=0 }
            in_backend && /tag:/ && !updated_backend {
                sub(/tag: *"[^"]*"/, "tag: \"" new_tag "\"")
                updated_backend=1
            }
            { print }
        ' "$VALUES_FILE" > "$temp_file" && mv "$temp_file" "$VALUES_FILE"
    elif [[ "$component" == "frontend" ]]; then
        awk -v new_tag="$new_version" '
            /^frontend:/ { in_frontend=1 }
            /^mongodb:/ { in_frontend=0 }
            /^ingress:/ { in_frontend=0 }
            /^autoscaling:/ { in_frontend=0 }
            in_frontend && /tag:/ && !updated_frontend {
                sub(/tag: *"[^"]*"/, "tag: \"" new_tag "\"")
                updated_frontend=1
            }
            { print }
        ' "$VALUES_DEV_FILE" > "$temp_file" && mv "$temp_file" "$VALUES_DEV_FILE"

        # Also update values.yaml
        awk -v new_tag="$new_version" '
            /^frontend:/ { in_frontend=1 }
            /^mongodb:/ { in_frontend=0 }
            in_frontend && /tag:/ && !updated_frontend {
                sub(/tag: *"[^"]*"/, "tag: \"" new_tag "\"")
                updated_frontend=1
            }
            { print }
        ' "$VALUES_FILE" > "$temp_file" && mv "$temp_file" "$VALUES_FILE"
    fi

    success "Updated $component version to $new_version"
}

# Build and push Docker image
build_and_push() {
    local component=$1
    local version=$2

    log "Building $component:$version"

    if $DRY_RUN; then
        log "[DRY-RUN] Would build and push $REGISTRY/$component:$version"
        return
    fi

    cd "$PROJECT_ROOT"

    if [[ "$component" == "backend" ]]; then
        docker buildx build --platform linux/amd64 \
            --push \
            -t "$REGISTRY/$BACKEND_IMAGE:$version" \
            -f backend/Dockerfile \
            ./backend
    elif [[ "$component" == "frontend" ]]; then
        docker buildx build --platform linux/amd64 \
            --build-arg REACT_APP_API_URL="$REACT_APP_API_URL" \
            --build-arg REACT_APP_GOOGLE_CLIENT_ID="$REACT_APP_GOOGLE_CLIENT_ID" \
            --push \
            -t "$REGISTRY/$FRONTEND_IMAGE:$version" \
            frontend
    fi

    success "Built and pushed $component:$version"
}

# Commit version changes
commit_changes() {
    log "Committing version changes"

    if $DRY_RUN; then
        log "[DRY-RUN] Would commit and push version changes"
        return
    fi

    cd "$PROJECT_ROOT"

    git add infra/helm/cricket-feedback/values.yaml
    git add infra/helm/cricket-feedback/values-development.yaml

    if git diff --staged --quiet; then
        warn "No changes to commit"
    else
        git commit -m "chore: bump image versions to $NEW_BACKEND_VERSION / $NEW_FRONTEND_VERSION"
        git push
        success "Committed and pushed version changes"
    fi
}

# Deploy via helm
deploy() {
    log "Deploying to Kubernetes via Helm"

    if $DRY_RUN; then
        log "[DRY-RUN] Would run helm upgrade"
        return
    fi

    cd "$PROJECT_ROOT"

    helm upgrade cricket-feedback ./infra/helm/cricket-feedback \
        --namespace "$NAMESPACE" \
        --values ./infra/helm/cricket-feedback/values.yaml \
        --values ./infra/helm/cricket-feedback/values-development.yaml \
        --wait \
        --timeout 5m

    success "Deployment complete!"
}

# Show deployment summary
show_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}       DEPLOYMENT SUMMARY${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    if [[ "$COMPONENT" == "both" || "$COMPONENT" == "backend" ]]; then
        echo -e "  Backend:  ${BLUE}$CURRENT_BACKEND_VERSION${NC} -> ${GREEN}$NEW_BACKEND_VERSION${NC}"
    fi
    if [[ "$COMPONENT" == "both" || "$COMPONENT" == "frontend" ]]; then
        echo -e "  Frontend: ${BLUE}$CURRENT_FRONTEND_VERSION${NC} -> ${GREEN}$NEW_FRONTEND_VERSION${NC}"
    fi
    echo ""
    echo -e "  Build:    $($SKIP_BUILD && echo "${YELLOW}Skipped${NC}" || echo "${GREEN}Completed${NC}")"
    echo -e "  Commit:   $($SKIP_COMMIT && echo "${YELLOW}Skipped${NC}" || echo "${GREEN}Completed${NC}")"
    echo -e "  Deploy:   $($SKIP_DEPLOY && echo "${YELLOW}Skipped${NC}" || echo "${GREEN}Completed${NC}")"
    echo ""
    echo -e "${GREEN}========================================${NC}"
}

# Main function
main() {
    parse_args "$@"

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Mavericks XI - Build & Deploy${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    log "Component: $COMPONENT"
    log "Skip Build: $SKIP_BUILD"
    log "Skip Deploy: $SKIP_DEPLOY"
    log "Skip Commit: $SKIP_COMMIT"
    log "Dry Run: $DRY_RUN"
    echo ""

    # Get current versions
    CURRENT_BACKEND_VERSION=$(get_current_version "backend")
    CURRENT_FRONTEND_VERSION=$(get_current_version "frontend")

    log "Current backend version: $CURRENT_BACKEND_VERSION"
    log "Current frontend version: $CURRENT_FRONTEND_VERSION"

    # Generate new versions
    NEW_BACKEND_VERSION=$(generate_version "$CURRENT_BACKEND_VERSION")
    NEW_FRONTEND_VERSION=$(generate_version "$CURRENT_FRONTEND_VERSION")

    log "New backend version: $NEW_BACKEND_VERSION"
    log "New frontend version: $NEW_FRONTEND_VERSION"
    echo ""

    # Build phase
    if ! $SKIP_BUILD; then
        if [[ "$COMPONENT" == "both" || "$COMPONENT" == "backend" ]]; then
            build_and_push "backend" "$NEW_BACKEND_VERSION"
        fi
        if [[ "$COMPONENT" == "both" || "$COMPONENT" == "frontend" ]]; then
            build_and_push "frontend" "$NEW_FRONTEND_VERSION"
        fi
    else
        warn "Skipping build phase"
    fi

    # Update versions
    if [[ "$COMPONENT" == "both" || "$COMPONENT" == "backend" ]]; then
        update_version "backend" "$NEW_BACKEND_VERSION"
    fi
    if [[ "$COMPONENT" == "both" || "$COMPONENT" == "frontend" ]]; then
        update_version "frontend" "$NEW_FRONTEND_VERSION"
    fi

    # Commit changes
    if ! $SKIP_COMMIT; then
        commit_changes
    else
        warn "Skipping commit phase"
    fi

    # Deploy phase
    if ! $SKIP_DEPLOY; then
        deploy
    else
        warn "Skipping deploy phase"
    fi

    show_summary
}

main "$@"
