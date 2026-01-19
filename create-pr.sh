#!/bin/bash

# Script to create a new branch, commit changes, and create a PR
# Usage: ./create-pr.sh [branch-name] [commit-message] [pr-title] [pr-description]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get branch name from argument or generate from feature
BRANCH_NAME=${1:-"feature/ai-service-integration"}
COMMIT_MESSAGE=${2:-"Add AI Payment Parser Service with Helm chart support"}
PR_TITLE=${3:-"Add AI Payment Parser Service"}
PR_DESCRIPTION=${4:-"## Summary

This PR adds a new AI-powered payment screenshot parsing service with the following features:

### New Components
- **AI Service Pod** (Python FastAPI): Parses UPI payment screenshots using Google AI Studio
- **Provider Abstraction**: Easy to switch between AI providers (Google, OpenRouter, etc.)
- **Cost Guardrails**: Built-in kill switch and free model whitelist
- **Helm Chart Support**: Full Helm chart integration for easy deployment

### Key Features
- ✅ Payment screenshot parsing with structured JSON output
- ✅ Non-payment screenshot detection
- ✅ Date validation (flags payments older than match date)
- ✅ Static response schema for UI compatibility
- ✅ Automatic fallback to manual admin entry on any failure
- ✅ Strong cost guardrails to prevent unexpected charges

### Changes
- Created new \`ai-service/\` directory with Python FastAPI application
- Added Helm chart templates for AI service deployment
- Updated backend to use AI service instead of old OCR
- Removed old \`ocrService.js\` and \`@google-cloud/vision\` dependency
- Updated deployment scripts and Kubernetes configs

### Testing
- [ ] Tested locally with Docker
- [ ] Verified Helm chart deployment
- [ ] Tested payment screenshot parsing
- [ ] Verified fallback mechanism

### Deployment Notes
- Requires Google AI Studio API key in secret \`ai-service-secrets\`
- Service is disabled by default if API key is not set
- Backend automatically connects when AI service is enabled"}

echo -e "${BLUE}🚀 Creating branch and PR for AI Service Integration${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}❌ Not in a git repository${NC}"
    exit 1
fi

# Check if there are uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}Current branch: ${CURRENT_BRANCH}${NC}"

# Fetch latest changes
echo -e "${BLUE}📥 Fetching latest changes...${NC}"
git fetch origin

# Check if branch already exists
if git show-ref --verify --quiet refs/heads/"${BRANCH_NAME}"; then
    echo -e "${YELLOW}⚠️  Branch ${BRANCH_NAME} already exists${NC}"
    read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git branch -D "${BRANCH_NAME}" 2>/dev/null || true
    else
        echo "Exiting..."
        exit 1
    fi
fi

# Create and checkout new branch
echo -e "${BLUE}🌿 Creating branch: ${BRANCH_NAME}${NC}"
git checkout -b "${BRANCH_NAME}"

# Show what will be committed
echo -e "${BLUE}📋 Changes to be committed:${NC}"
git status --short
echo ""

# Add all changes
echo -e "${BLUE}➕ Staging all changes...${NC}"
git add .

# Commit changes
echo -e "${BLUE}💾 Committing changes...${NC}"
git commit -m "${COMMIT_MESSAGE}"

# Push branch to remote
echo -e "${BLUE}📤 Pushing branch to remote...${NC}"
git push -u origin "${BRANCH_NAME}"

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo -e "${BLUE}🔀 Creating Pull Request...${NC}"
    
    # Create PR using GitHub CLI
    PR_URL=$(gh pr create \
        --title "${PR_TITLE}" \
        --body "${PR_DESCRIPTION}" \
        --base main \
        --head "${BRANCH_NAME}" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Pull Request created successfully!${NC}"
        echo -e "${GREEN}🔗 ${PR_URL}${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to create PR via GitHub CLI${NC}"
        echo -e "${YELLOW}   You can create it manually at:${NC}"
        echo -e "${YELLOW}   https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/compare/main...${BRANCH_NAME}${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not installed${NC}"
    echo -e "${YELLOW}   Install it from: https://cli.github.com/${NC}"
    echo ""
    echo -e "${BLUE}📝 To create PR manually:${NC}"
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')
    echo -e "${GREEN}   ${REPO_URL}/compare/main...${BRANCH_NAME}${NC}"
fi

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo -e "${BLUE}Branch: ${BRANCH_NAME}${NC}"
echo -e "${BLUE}Commit: $(git rev-parse --short HEAD)${NC}"
